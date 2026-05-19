import React, { useMemo, useState, useEffect } from "react";
import Modal from "./Modal";

const HelpModal = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState("intro");

  useEffect(() => {
    if (isOpen) setActiveSection("intro");
  }, [isOpen]);

  const sections = useMemo(
    () => [
      {
        id: "intro",
        label: "Introduction",
        content: (
          <>
            <h1>Introduction</h1>
            <p>
              Eaze is a beginner-friendly, English-like programming language. By
              replacing cryptic symbols with intuitive keywords, Eaze lets you
              focus on logic rather than syntax.
            </p>
            <h3>Why Eaze?</h3>
            <ul>
              <li>
                <strong>English-like Syntax:</strong> Uses patterns like{" "}
                <code>set</code>, <code>show</code>, <code>ask</code>,{" "}
                <code>repeat</code>.
              </li>
              <li>
                <strong>Unified Assignment:</strong> No more confusion between{" "}
                <code>=</code> and <code>==</code>.
              </li>
              <li>
                <strong>AI Powered:</strong> Built-in support for explanation
                and debugging.
              </li>
            </ul>
            <h3>A Quick Taste</h3>
            <pre>
              <code>{`set name to "Explorer"
show "Hello, " + name

repeat 3 times
  show "Learning Eaze is fun!"
end`}</code>
            </pre>
          </>
        ),
      },
      {
        id: "syntax",
        label: "Variables & Syntax",
        content: (
          <>
            <h1>Variables & Syntax</h1>
            <p>
              Variables are containers for storing data. You don't need to
              declare types.
            </p>
            <h3>Variable Assignment</h3>
            <pre>
              <code>{`set score to 100
set player to "Alice"`}</code>
            </pre>
            <h3>Reassignment</h3>
            <pre>
              <code>{`set x to 5
set x to x + 10`}</code>
            </pre>
          </>
        ),
      },
      {
        id: "types",
        label: "Data Types",
        content: (
          <>
            <h1>Data Types</h1>
            <h3>1. Numbers</h3>
            <pre>
              <code>{`set age to 25
set price to 19.99`}</code>
            </pre>
            <h3>2. Strings</h3>
            <pre>
              <code>{`set name to "Eaze"`}</code>
            </pre>
            <h3>3. Arrays</h3>
            <pre>
              <code>{`set fruits to ["Apple", "Banana"]`}</code>
            </pre>
          </>
        ),
      },
      {
        id: "operators",
        label: "Operators",
        content: (
          <>
            <h1>Operators</h1>
            <h3>Arithmetic</h3>
            <table>
              <thead>
                <tr>
                  <th>Op</th>
                  <th>Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>+</td>
                  <td>Addition</td>
                </tr>
                <tr>
                  <td>-</td>
                  <td>Subtraction</td>
                </tr>
                <tr>
                  <td>*</td>
                  <td>Multiplication</td>
                </tr>
                <tr>
                  <td>/</td>
                  <td>Division</td>
                </tr>
              </tbody>
            </table>
            <h3>Logical</h3>
            <ul>
              <li>
                <code>and</code>, <code>or</code>, <code>not</code>
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "io",
        label: "Input & Output",
        content: (
          <>
            <h1>Input & Output</h1>
            <h3>
              Output: <code>show</code> or <code>say</code>
            </h3>
            <pre>
              <code>{`show "Hello"`}</code>
            </pre>
            <h3>
              Input: <code>ask ... into</code>
            </h3>
            <pre>
              <code>{`ask "Name?" into user_name`}</code>
            </pre>
          </>
        ),
      },
      {
        id: "conditionals",
        label: "Conditionals",
        content: (
          <>
            <h1>Conditionals</h1>
            <h3>If Statement</h3>
            <pre>
              <code>{`if age >= 18
  show "Adult"
end`}</code>
            </pre>
            <h3>If-Else</h3>
            <pre>
              <code>{`if score >= 50
  show "Pass"
else
  show "Fail"
end`}</code>
            </pre>
          </>
        ),
      },
      {
        id: "loops",
        label: "Loops",
        content: (
          <>
            <h1>Loops</h1>
            <h3>Repeat Loop</h3>
            <pre>
              <code>{`repeat 5 times
  show "Hi"
end`}</code>
            </pre>
            <h3>While Loop</h3>
            <pre>
              <code>{`while count <= 5
  show count
  set count to count + 1
end`}</code>
            </pre>
          </>
        ),
      },
      {
        id: "functions",
        label: "Functions",
        content: (
          <>
            <h1>Functions</h1>
            <pre>
              <code>{`define greet(name)
  show "Hello, " + name
end

call greet("Alice")`}</code>
            </pre>
          </>
        ),
      },
      {
        id: "arrays",
        label: "Arrays",
        content: (
          <>
            <h1>Arrays</h1>
            <pre>
              <code>{`set items to ["A", "B", "C"]
show items[1] # Output: B
set items[0] to "Z"`}</code>
            </pre>
          </>
        ),
      },
    ],
    [],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eaze Documentation"
      maxWidth="1000px"
    >
      <div className="help-container">
        <div className="help-sidebar">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`help-nav-item ${
                activeSection === section.id ? "active" : ""
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </div>
          ))}
        </div>
        <div className="help-content">
          {sections.map((section) => (
            <section
              key={section.id}
              className={`help-section ${
                activeSection === section.id ? "active" : ""
              }`}
            >
              {section.content}
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default HelpModal;
