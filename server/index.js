import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI Client
// Note: Provide OPENAI_API_KEY in your .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

// Helper middleware to check for API key
const requireApiKey = (req, res, next) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OpenAI API key is missing. Please add OPENAI_API_KEY to server/.env'
    });
  }
  next();
};

// ==========================================
// AI FEATURE 1: Explain Code
// ==========================================
app.post('/api/ai/explain', requireApiKey, async (req, res) => {
  try {
    const { code, ast } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const prompt = `
You are an expert instructor for a custom programming language called "Eaze".
Eaze features human-readable syntax like "set x to 5", "show x", "repeat 3 times ... end", etc.

Please explain the following Eaze code concisely. Use the provided AST context if helpful, but focus your explanation on the logical flow of the code.

Code:
${code}

AST:
${JSON.stringify(ast, null, 2)}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful and concise programming assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    res.json({ explanation: response.choices[0].message.content });
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

    const prompt = `
You are an expert debugger for a custom programming language called "Eaze".
The language uses simple keywords: "set", "to", "show", "repeat", "times", "while", "if", "end".

A user tried to run this Eaze code but encountered an error.
Explain what went wrong and suggest a fix. Be concise and direct.

Code:
${code}

Error message:
${error}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful and concise debugging assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
    });

    res.json({ suggestion: response.choices[0].message.content });
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

    const prompt = `
You are an expert compiler engineer. Convert the following code written in the "Eaze" programming language to standard, clean JavaScript.

Eaze syntax primer:
- "set x to 5" -> "let x = 5;" or "x = 5;"
- "show x" -> "console.log(x);"
- "repeat 3 times ... end" -> "for (let i = 0; i < 3; i++) { ... }"
- "while x < 5 ... end" -> "while (x < 5) { ... }"
- "if x == 5 ... end" -> "if (x === 5) { ... }"

Return ONLY the JavaScript code without markdown wrappers like \`\`\`javascript. Do not include any other explanations.

Eaze Code:
${code}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a code conversion utility. You output only code.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    });

    let jsCode = response.choices[0].message.content.trim();
    // Strip markdown blocks if the model still includes them
    if (jsCode.startsWith('```')) {
      jsCode = jsCode.replace(/^```(javascript|js)?\n/, '').replace(/\n```$/, '');
    }

    res.json({ javascript: jsCode });
  } catch (error) {
    console.error('Error in /convert:', error.message);
    res.status(500).json({ error: 'Failed to convert code to JavaScript' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Eaze AI Server running on http://localhost:${port}`);
});
