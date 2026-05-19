import { useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { Lexer } from "../engine/lexer";
import { Parser } from "../engine/parser";
import { Interpreter } from "../engine/interpreter";

export const useInterpreter = () => {
  const { setOutputs, setVariables, setTrace, setActiveTab, settings } =
    useAppContext();

  const runCode = useCallback(
    async (code) => {
      setOutputs([]);
      setVariables(new Map());
      setTrace([]);
      setActiveTab("output");

      try {
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();

        const parser = new Parser(tokens);
        const ast = parser.parse();

        const interpreter = new Interpreter();
        if (interpreter.setTraceLimit) {
          interpreter.setTraceLimit(settings.traceLimit || 1000);
        }

        // Setup output handler
        interpreter.setOutputHandler((value) => {
          setOutputs((prev) => [...prev, value]);
        });

        const results = await interpreter.run(ast);

        setVariables(interpreter.globalEnv.variables);
        setTrace(interpreter.trace);

        return results;
      } catch (error) {
        setOutputs((prev) => [...prev, `Error: ${error.message}`]);
        console.error(error);
        throw error;
      }
    },
    [setOutputs, setVariables, setTrace, setActiveTab, settings.traceLimit],
  );

  return { runCode };
};
