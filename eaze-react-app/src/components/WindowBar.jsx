import React from "react";
import Icon from "./Icon";

/**
 * The desktop window bar. It sits where the OS title bar used to be and is
 * painted with the page background, so the native caption buttons (- □ ✕)
 * that Electron draws as an overlay blend straight into the app.
 *
 * Its right side is left empty on purpose: that strip is where the native
 * buttons live (see --window-controls-width in App.css).
 */
const WindowBar = () => (
  <div className="window-bar">
    <span className="window-bar-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="15" height="15">
        <path
          d="M12.4 6.2 5 16l7.4 9.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.6 6.2 27 16l-7.4 9.8"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    <span className="window-bar-title">Eaze Playground</span>
    <span className="window-bar-hint" title="Toggle fullscreen">
      <Icon name="expand" size={13} />
      F11
    </span>
  </div>
);

export default WindowBar;
