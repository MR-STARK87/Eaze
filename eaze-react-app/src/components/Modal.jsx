import React from "react";

const Modal = ({ isOpen, onClose, title, children, maxWidth }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{ display: "flex" }}
      onClick={onClose}
    >
      <div
        className="modal"
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div id="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
