import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import Icon from "./Icon";

const AI_SERVER =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "";

export const insertCodeInto = (existing, code) => {
  const needsSep = existing.trim().length > 0;
  return needsSep ? `${existing}\n\n${code}\n` : `${code}\n`;
};

const AIPanel = () => {
  const { aiPanelOpen, setAiPanelOpen, activeFile, updateActiveFileContent } =
    useAppContext();

  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm your Eaze coding buddy. Ask me to make anything — a guessing game, a times table, a quiz — and I'll write working Eaze code you can insert.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastCode, setLastCode] = useState(null);

  const send = async (event) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;

    setInput("");
    setLastCode(null);
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setBusy(true);

    try {
      const res = await fetch(`${AI_SERVER}/api/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question,
          code: activeFile?.content ?? "",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text:
              data.error ||
              "Sorry, I couldn't generate code right now. Is the AI server running (npm start in server/)?",
          },
        ]);
      } else {
        setLastCode(data.code);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text:
              data.repaired
                ? "Here's your program (I double-checked it with the Eaze engine):"
                : "Here's your program (verified with the Eaze engine):",
            code: data.code,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Can't reach the AI server. Start it with: npm start (inside the server/ folder).",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const insertCode = () => {
    if (!lastCode) return;
    updateActiveFileContent(insertCodeInto(activeFile?.content ?? "", lastCode));
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: `Added to ${activeFile?.name || "your file"} — hit ▶️ Run!` },
    ]);
    setLastCode(null);
  };

  if (!aiPanelOpen) return null;

  return (
    <aside className="ai-panel open">
      <div className="panel-header">
        <span className="panel-title">
          <Icon name="sparkle" size={15} className="panel-title-icon" />
          Eaze AI Companion
        </span>
        <button
          type="button"
          className="icon-btn"
          title="Close"
          onClick={() => setAiPanelOpen(false)}
        >
          <Icon name="close" size={15} />
        </button>
      </div>
      <div className="ai-chat">
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role === "user" ? "msg-user" : "msg-bot"}`}>
            {msg.text}
            {msg.code && (
              <pre className="msg-code">{msg.code}</pre>
            )}
          </div>
        ))}
        {busy && (
          <div className="msg msg-bot ai-thinking" aria-live="polite">
            <span className="ai-dots">
              <span /><span /><span />
            </span>
            Thinking…
          </div>
        )}
      </div>
      {lastCode && (
        <div className="ai-insert">
          <button type="button" className="btn btn-primary ai-insert-btn" onClick={insertCode}>
            <Icon name="plus" size={15} />
            Insert into {activeFile?.name || "file"}
          </button>
        </div>
      )}
      <form className="ai-footer" onSubmit={send}>
        <input
          type="text"
          className="ai-input"
          placeholder={busy ? "Generating…" : "Ask for anything — a quiz, a game, a drawing..."}
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button
          type="submit"
          className="send-btn"
          title="Send"
          disabled={busy || !input.trim()}
        >
          <Icon name="send" size={17} />
        </button>
      </form>
    </aside>
  );
};

export default AIPanel;
