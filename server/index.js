import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { Lexer } from '../engine/lexer.js';
import { Parser } from '../engine/parser.js';
import { Interpreter } from '../engine/interpreter.js';
import { RuntimeError } from '../engine/errors.js';

import { EAZE_SYSTEM_PROMPT, EAZE_DEBUG_PROMPT } from './eazePrompt.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ------------------------------------------------------------------
// Ollama client (OpenAI-compatible endpoint) with model fallbacks
// ------------------------------------------------------------------

const BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1';
const API_KEY = process.env.OLLAMA_API_KEY;
const MODEL_CHAIN = [
  process.env.OLLAMA_MODEL,
  ...(process.env.OLLAMA_MODEL_FALLBACKS || '').split(','),
]
  .filter(Boolean)
  .map((m) => m.trim());

const openai = new OpenAI({
  apiKey: API_KEY || 'missing-key',
  baseURL: BASE_URL,
});

const requireApiKey = (req, res, next) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: 'OLLAMA_API_KEY is missing. Please add it to server/.env',
    });
  }
  next();
};

/**
 * Call the chat model, trying each model in MODEL_CHAIN until one works.
 * Strips reasoning-model artifacts (reasoning/thinking fields) so only the
 * final answer content is returned.
 */
async function chat(messages, { temperature = 0.3, maxTokens = 2048 } = {}) {
  let lastError = null;

  for (const model of MODEL_CHAIN) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      });

      const msg = response.choices?.[0]?.message;
      let content = msg?.content ?? '';

      // Some relays put the answer in content but reasoning elsewhere; others
      // (rarely) leave content empty and only fill reasoning — fall back.
      if (!String(content).trim() && (msg?.reasoning || msg?.thinking)) {
        content = msg.reasoning || msg.thinking;
      }
      return { content: String(content), model };
    } catch (err) {
      lastError = err;
      console.error(`[ai] model "${model}" failed:`, err.message);
    }
  }
  throw lastError || new Error('No models configured');
}

// ------------------------------------------------------------------
// Eaze validation using the REAL engine (lexer + parser)
// ------------------------------------------------------------------

/** Parse Eaze source. Returns { ok: true } or { ok: false, error }. */
function validateEaze(code) {
  try {
    const tokens = new Lexer(code).tokenize();
    new Parser(tokens).parse();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

const SIM_DEFAULTS = { maxOutput: 400, maxInputs: 40, timeoutMs: 2500 };

/**
 * Actually EXECUTE the program in the real engine with simulated user input
 * (1, 2, 3, ... which the engine auto-converts to numbers) to catch runtime
 * errors like calling a function before it is defined, undefined variables,
 * division by zero, or runaway loops.
 */
async function simulateEaze(code, overrides = {}) {
  const { maxOutput, maxInputs, timeoutMs } = { ...SIM_DEFAULTS, ...overrides };
  try {
    const tokens = new Lexer(code).tokenize();
    const ast = new Parser(tokens).parse();
    const interp = new Interpreter();

    let inputs = 0;
    interp.setInputHandler(() => {
      inputs += 1;
      if (inputs > maxInputs) {
        throw new RuntimeError('Simulation gave up after too many inputs');
      }
      return String(inputs);
    });
    interp.setOutputHandler(() => {
      if (interp.output.length > maxOutput) {
        throw new RuntimeError(
          'Simulation stopped: too much output (possible infinite loop)',
        );
      }
    });

    const run = interp.run(ast);
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new RuntimeError('Simulation timed out (possible infinite loop)')),
        timeoutMs,
      );
    });

    try {
      await Promise.race([run, timeout]);
      return { ok: true, inputs };
    } catch (err) {
      const msg = String(err.message || err);
      // Simulation safety nets are not program bugs — flag but accept.
      if (msg.startsWith('Simulation ')) {
        return { ok: true, warning: msg, inputs };
      }
      return { ok: false, error: msg };
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

/** Strip markdown fences / prose the model may add around the code. */
function extractCodeBlock(text) {
  const fenced = text.match(/```(?:eaze|javascript|js)?\s*\n([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  // Drop a possible trailing fence with no opening one
  return raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
}

const MAX_REPAIR_ATTEMPTS = 2;

// ==========================================
// AI FEATURE: Generate Eaze code (validated + self-repairing)
// ==========================================
app.post('/api/ai/generate', requireApiKey, async (req, res) => {
  const { prompt, code } = req.body;

  if (!prompt && !code) {
    return res.status(400).json({ error: 'A prompt or code context is required' });
  }

  const userContent = [
    code
      ? `The user is currently working on this Eaze program:\n---\n${code}\n---`
      : null,
    `The user asks: ${prompt}`,
    'Respond with a complete, runnable Eaze program only. Remember: output ONLY Eaze code, no prose, no markdown fences.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const messages = [
    { role: 'system', content: EAZE_SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ];

  try {
    let lastCode = null;
    let lastError = null;
    let usedModel = null;

    for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
      const { content, model } = await chat(messages, { temperature: attempt === 0 ? 0.2 : 0.1 });
      usedModel = model;
      const candidate = extractCodeBlock(content);
      lastCode = candidate;

      const parse = validateEaze(candidate);
      let result = parse;
      if (parse.ok) {
        // Parse is fine — now run it in the engine with simulated input.
        result = await simulateEaze(candidate);
      }

      if (result.ok) {
        return res.json({
          code: candidate,
          model,
          attempts: attempt + 1,
          repaired: attempt > 0,
          simulated: true,
          runtimeWarning: result.warning || null,
        });
      }

      lastError = result.error;
      console.warn(`[generate] attempt ${attempt + 1} invalid: ${result.error}`);

      // Feed the engine error back for a targeted repair
      messages.push({ role: 'assistant', content: candidate });
      messages.push({
        role: 'user',
        content:
          `Your program failed when actually executed by the Eaze engine:\n${result.error}\n\n` +
          `Common causes: calling a function BEFORE its "define" block has executed (move all define blocks to the TOP of the program); ` +
          `using a variable before assigning it; division by zero; an infinite while loop; wrong number of arguments to a function.\n\n` +
          `Return the FULL corrected program. Output ONLY Eaze code.`,
      });
    }

    return res.status(502).json({
      error: 'The model kept producing invalid Eaze code.',
      lastError,
      lastCode,
      attemptsUsed: MAX_REPAIR_ATTEMPTS + 1,
      model: usedModel,
    });
  } catch (err) {
    console.error('Error in /generate:', err.message);
    res.status(500).json({ error: 'Failed to generate Eaze code', detail: err.message });
  }
});

// ==========================================
// AI FEATURE 1: Explain Code
// ==========================================
app.post('/api/ai/explain', requireApiKey, async (req, res) => {
  try {
    const { code, ast } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const prompt = `Explain the following Eaze code concisely for a beginner. Focus on the logical flow.

Code:
${code}

${ast ? `AST context:\n${JSON.stringify(ast).slice(0, 4000)}` : ''}`;

    const { content, model } = await chat(
      [
        { role: 'system', content: 'You are a helpful and concise programming instructor for the Eaze language.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.5 },
    );

    res.json({ explanation: content, model });
  } catch (error) {
    console.error('Error in /explain:', error.message);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// ==========================================
// AI FEATURE 2: Debug Help
// ==========================================
app.post('/api/ai/debug', requireApiKey, async (req, res) => {
  try {
    const { code, error } = req.body;
    if (!code || !error) {
      return res.status(400).json({ error: 'Both code and error are required' });
    }

    const { content, model } = await chat(
      [
        { role: 'system', content: EAZE_DEBUG_PROMPT },
        {
          role: 'user',
          content: `Eaze code:\n---\n${code}\n---\n\nError message:\n${error}`,
        },
      ],
      { temperature: 0.3 },
    );

    res.json({ suggestion: content, model });
  } catch (err) {
    console.error('Error in /debug:', err.message);
    res.status(500).json({ error: 'Failed to generate debug suggestion' });
  }
});

// ==========================================
// AI FEATURE 3: Convert to JS
// ==========================================
app.post('/api/ai/convert', requireApiKey, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const prompt = `Convert the following Eaze code to standard, clean JavaScript.

Eaze syntax primer:
- "set x to 5" -> "let x = 5;"
- "show x" -> "console.log(x);"
- "repeat 3 times ... end" -> "for (let i = 0; i < 3; i++) { ... }"
- "while x < 5 ... end" -> "while (x < 5) { ... }"
- "if x == 5 ... end" -> "if (x === 5) { ... }"
- "call f(a)" -> "f(a)"

Return ONLY the JavaScript code without markdown wrappers. No explanations.

Eaze Code:
${code}`;

    const { content, model } = await chat(
      [
        { role: 'system', content: 'You are a code conversion utility. You output only code.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.2 },
    );

    let jsCode = extractCodeBlock(content);
    res.json({ javascript: jsCode, model });
  } catch (error) {
    console.error('Error in /convert:', error.message);
    res.status(500).json({ error: 'Failed to convert code to JavaScript' });
  }
});

// Health check (also reports whether AI is configured)
app.get('/api/ai/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: !!API_KEY,
    baseUrl: BASE_URL,
    models: MODEL_CHAIN,
  });
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Eaze AI Server running on http://localhost:${port}`);
  console.log(`   AI: ${API_KEY ? 'configured' : 'NOT configured (missing OLLAMA_API_KEY)'}`);
  console.log(`   Models: ${MODEL_CHAIN.join(' → ')}`);
});
