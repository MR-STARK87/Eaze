import React, { useMemo, useState, useEffect } from "react";
import Modal from "./Modal";
import { TEMPLATE_PROGRAMS } from "../constants/templates";
import { useAppContext } from "../context/AppContext";

const slugifyFileBase = (text) => {
  return (
    String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "template"
  );
};

const TemplatesModal = ({ isOpen, onClose }) => {
  const { addFile, updateActiveFileContent, activeFile, files } =
    useAppContext();
  const [query, setQuery] = useState("");
  const [confirmTemplate, setConfirmTemplate] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setConfirmTemplate(null);
    }
  }, [isOpen]);

  const makeUniqueFileName = (base) => {
    const safeBase = slugifyFileBase(base);
    const taken = new Set(files.map((f) => f.name.toLowerCase()));
    let name = `${safeBase}.eaze`;
    let n = 2;
    while (taken.has(name.toLowerCase())) {
      name = `${safeBase}-${n}.eaze`;
      n++;
    }
    return name;
  };

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEMPLATE_PROGRAMS;
    return TEMPLATE_PROGRAMS.filter((t) => {
      const hay = [t.title, t.desc, ...(t.tags || [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const handleUse = (template, mode) => {
    if (mode === "new") {
      const filename = makeUniqueFileName(template.fileBase || template.title);
      addFile(filename, template.code);
      onClose();
      return;
    }

    setConfirmTemplate(template);
  };

  const handleConfirmReplace = () => {
    if (!confirmTemplate) return;
    updateActiveFileContent(confirmTemplate.code);
    setConfirmTemplate(null);
    onClose();
  };

  const handleCancelReplace = () => {
    setConfirmTemplate(null);
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !confirmTemplate}
        onClose={onClose}
        title="Templates"
      >
        <input
          className="template-search"
          placeholder="Search templates (loop, if, ask, function...)"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="template-grid" style={{ marginTop: "12px" }}>
          {filteredTemplates.length === 0 ? (
            <div className="template-hint">
              No templates found. Try searching for: loop, if, ask, function…
            </div>
          ) : (
            filteredTemplates.map((t) => (
              <div key={t.id} className="template-card">
                <div className="template-icon">{t.icon}</div>
                <div className="template-main">
                  <div className="template-title">{t.title}</div>
                  <div className="template-desc">{t.desc}</div>
                  <div className="template-tags">
                    {t.tags.map((tag) => (
                      <span key={tag} className="template-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="template-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUse(t, "replace")}
                  >
                    Use
                  </button>
                  <button className="btn" onClick={() => handleUse(t, "new")}>
                    New File
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="template-hint" style={{ marginTop: "10px" }}>
          Tip: Click <b>Use</b> to replace the current file, or <b>New file</b>
          to create a fresh file.
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmTemplate}
        onClose={handleCancelReplace}
        title="Replace Current Code?"
      >
        <div style={{ padding: "10px 0" }}>
          <p className="modal-message">
            Are you sure you want to load <b>{confirmTemplate?.title}</b> into{" "}
            <b>{activeFile?.name}</b>? This will replace your current code. (You
            can still use Undo if you change your mind!)
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={handleCancelReplace}>
              Back
            </button>
            <button className="btn btn-primary" onClick={handleConfirmReplace}>
              Load Template
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TemplatesModal;
