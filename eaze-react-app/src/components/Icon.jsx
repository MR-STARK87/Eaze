import React from "react";

/**
 * Line-icon set for the playground UI.
 * All icons share a 24x24 grid, inherit `currentColor` and are stroke based,
 * so they tint with whatever colour the parent sets (chips, buttons, tree).
 */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const solid = {
  fill: "currentColor",
  stroke: "none",
};

const paths = {
  /* ---------- toolbar ---------- */
  save: (
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </>
  ),
  "save-as": (
    <>
      <path d="M12 3v10" />
      <path d="m8 9 4 4 4-4" />
      <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </>
  ),
  undo: (
    <>
      <path d="M4 9h10a6 6 0 0 1 0 12H7" />
      <path d="m8 5-4 4 4 4" />
    </>
  ),
  redo: (
    <>
      <path d="M20 9H10a6 6 0 0 0 0 12h7" />
      <path d="m16 5 4 4-4 4" />
    </>
  ),
  format: (
    <>
      <path d="m3 21 9-9" />
      <path d="M14.5 3.5 16 5l-1.5 1.5L13 5z" />
      <path d="M17 8.5 18.5 10 20 8.5 18.5 7z" />
      <path d="M15.5 1.5 16.5 3l-1 1.5L14.5 3z" />
    </>
  ),
  templates: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.5 14.6a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3.1a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1.1z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.1a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .9-1 1.6v.4" />
      <path d="M12 17h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 3.5 12.7 8.3 17.5 10 12.7 11.7 11 16.5 9.3 11.7 4.5 10 9.3 8.3z" />
      <path d="M18.5 15.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="m7.5 9.5 2.5 2.5-2.5 2.5" />
      <path d="M13 15h4" />
    </>
  ),
  play: (
    <>
      <path d="M6.5 4.6v14.8l12.6-7.4z" {...solid} />
    </>
  ),

  /* ---------- language blocks ---------- */
  say: (
    <>
      <path d="M20.5 11.6a8.1 8.1 0 0 1-8.3 8 8.8 8.8 0 0 1-3.7-.8L4 20.4l1.3-3.7a8 8 0 0 1-1.3-4.5A8.1 8.1 0 0 1 12.4 4a8.1 8.1 0 0 1 8.1 7.6z" />
    </>
  ),
  cube: (
    <>
      <path d="m12 2.6 8.4 4.8v9.2L12 21.4l-8.4-4.8V7.4z" />
      <path d="m3.6 7.4 8.4 4.8 8.4-4.8" />
      <path d="M12 21.4v-9.2" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 18.5 4.6-4.6 3.6 3.6 3.3-3.3 4.5 4.5" />
    </>
  ),
  branch: (
    <>
      <path d="M6.5 3.5v11" />
      <circle cx="18" cy="6.5" r="2.8" />
      <circle cx="6.5" cy="18" r="2.8" />
      <path d="M18 9.3a8.7 8.7 0 0 1-8.5 8.7" />
    </>
  ),
  repeat: (
    <>
      <path d="M20.2 12a8.2 8.2 0 1 1-2.4-5.8" />
      <path d="M20.5 4v4.2h-4.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2V12l3 1.9" />
    </>
  ),
  fx: null, // rendered as italic ƒ(x) text
  return: (
    <>
      <path d="m15 6 5 5-5 5" />
      <path d="M20 11H9.5A5.5 5.5 0 0 0 4 16.5V18" />
    </>
  ),

  /* ---------- console tabs ---------- */
  output: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7 9h5M7 13h9M7 17h6" />
    </>
  ),
  chart: (
    <>
      <path d="M5.5 20V13" />
      <path d="M10.5 20V5" />
      <path d="M15.5 20v-5" />
      <path d="M20 20V9" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9.5 7V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
      <path d="m6.5 7 .9 12.1a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7" />
    </>
  ),

  /* ---------- explorer ---------- */
  chevron: <path d="m9 5.5 6.5 6.5L9 18.5" />,
  folder: (
    <path
      d="M3 6.5A2 2 0 0 1 5 4.5h3.6a2 2 0 0 1 1.5.7l1 1.3H19a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      {...solid}
    />
  ),
  "folder-open": (
    <>
      <path d="M4 20V6.5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.5.7l1 1.3H17a2 2 0 0 1 2 2V10" />
      <path d="M12.5 16v-5" />
      <path d="M10 13.5 12.5 11l2.5 2.5" />
    </>
  ),
  "folder-plus": (
    <>
      <path d="M20 13.5V10a2 2 0 0 0-2-2h-7.9l-1-1.3a2 2 0 0 0-1.5-.7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6" />
      <path d="M17 14v6M14 17h6" />
    </>
  ),
  "file-code": (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="m11 13-1.6 1.7L11 16.4" />
      <path d="m14.4 13 1.6 1.7-1.6 1.7" />
    </>
  ),
  "file-text": (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 16.5h4" />
    </>
  ),
  "file-plus": (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 11.5v6M9 14.5h6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.5 3.8V9h-5.2" />
    </>
  ),
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  pencil: (
    <>
      <path d="M16.5 4.3a2.1 2.1 0 0 1 3 3L8 18.8l-4 1 1-4z" />
      <path d="m14.5 6.3 3 3" />
    </>
  ),
  "chevron-left": <path d="m14 6-6 6 6 6" />,
  "chevron-right": <path d="m10 6 6 6-6 6" />,
  send: (
    <>
      <path d="M21 3.5 3.6 10.4l7.2 2.8 2.8 7.2z" />
      <path d="m10.8 13.2 4.6-4.6" />
    </>
  ),
  expand: (
    <>
      <path d="M9.5 4.5h-5v5" />
      <path d="M14.5 4.5h5v5" />
      <path d="M14.5 19.5h5v-5" />
      <path d="M9.5 19.5h-5v-5" />
    </>
  ),
  collapse: (
    <>
      <path d="M4.5 9.5h5v-5" />
      <path d="M19.5 9.5h-5v-5" />
      <path d="M19.5 14.5h-5v5" />
      <path d="M4.5 14.5h5v5" />
    </>
  ),
};

const Icon = ({ name, size = 20, className = "", style }) => {
  const shape = paths[name] ?? paths.help;

  if (name === "fx") {
    return (
      <span
        className={`icon-fx ${className}`}
        style={{ fontSize: size * 0.95, ...style }}
        aria-hidden="true"
      >
        ƒ(x)
      </span>
    );
  }

  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      aria-hidden="true"
      focusable="false"
      {...stroke}
    >
      {shape}
    </svg>
  );
};

export default Icon;
