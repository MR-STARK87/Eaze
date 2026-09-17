import React from "react";
import Icon from "./Icon";

/**
 * The block palette. Every chip is tinted with its own language colour so the
 * keyword stays recognisable in the editor, the visualiser and the chips.
 */
const blocks = [
  { label: "say", icon: "say", tone: "red", snippet: 'say "Hello!"' },
  { label: "set", icon: "cube", tone: "blue", snippet: "set score to 10" },
  {
    label: "ask",
    icon: "help",
    tone: "purple",
    snippet: 'ask "What is your name?" into name',
  },
  { label: "show", icon: "image", tone: "green", snippet: "show result" },
  {
    label: "if / else",
    icon: "branch",
    tone: "orange",
    snippet:
      'if score > 5\n    say "Great job!"\nelse\n    say "Try again!"\nend',
  },
  { label: "repeat", icon: "repeat", tone: "amber", snippet: "repeat 5 times\n    \nend" },
  { label: "while", icon: "clock", tone: "indigo", snippet: "while found == 0\n    \nend" },
  {
    label: "define",
    icon: "fx",
    tone: "teal",
    snippet: 'define greet(name)\n    say "Hello, " + name\nend',
  },
  { label: "return", icon: "return", tone: "azure", snippet: "return result" },
];

const BlocksBar = ({ onInsert }) => (
  <div className="blocks-bar">
    {blocks.map((block) => (
      <button
        key={block.label}
        type="button"
        className={`chip chip-${block.tone}`}
        title={`Insert ${block.label}`}
        onMouseDown={(e) => {
          e.preventDefault();
          onInsert(block.snippet);
        }}
      >
        <Icon name={block.icon} size={18} />
        <span className="chip-label">{block.label}</span>
      </button>
    ))}
  </div>
);

export default BlocksBar;
