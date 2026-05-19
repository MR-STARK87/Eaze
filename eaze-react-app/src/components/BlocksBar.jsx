import React from 'react';

const BlocksBar = ({ onInsert }) => {
    const blocks = [
        { label: 'say', snippet: 'say "Hello!"', className: 'say' },
        { label: 'set', snippet: 'set score to 10', className: 'set' },
        { label: 'ask', snippet: 'ask "What is your name?" into name', className: 'ask' },
        { label: 'show', snippet: 'show result', className: 'show' },
        { label: 'if / else', snippet: 'if score > 5\n    say "Great job!"\nelse\n    say "Try again!"\nend', className: 'if' },
        { label: 'repeat', snippet: 'repeat 5 times\n    \nend', className: 'loop' },
        { label: 'while', snippet: 'while found == 0\n    \nend', className: 'loop' },
        { label: 'define', snippet: 'define greet(name)\n    say "Hello, " + name\nend', className: 'fn' },
        { label: 'return', snippet: 'return result', className: 'fn' },
    ];

    return (
        <div className="blocks-bar">
            {blocks.map(block => (
                <div 
                    key={block.label}
                    className={`chip ${block.className}`}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onInsert(block.snippet);
                    }}
                >
                    {block.label}
                </div>
            ))}
        </div>
    );
};

export default BlocksBar;
