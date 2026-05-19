import React, { useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";
import Modal from "./Modal";

const ensureEazeExt = (name) => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith(".eaze") ? trimmed : `${trimmed}.eaze`;
};

const Sidebar = () => {
  const {
    files,
    activeIdx,
    setActiveIdx,
    sidebarCollapsed,
    setSidebarCollapsed,
    addFile,
    deleteFile,
    renameFile,
  } = useAppContext();

  const [fileModal, setFileModal] = useState({
    type: null,
    index: null,
    value: "",
  });

  const openAddModal = () => {
    setFileModal({ type: "add", index: null, value: "my-code.eaze" });
  };

  const openRenameModal = (index) => {
    setFileModal({ type: "rename", index, value: files[index]?.name || "" });
  };

  const openDeleteModal = (index) => {
    setFileModal({ type: "delete", index, value: "" });
  };

  const closeModal = () => {
    setFileModal({ type: null, index: null, value: "" });
  };

  const targetFile =
    fileModal.index !== null ? files[fileModal.index] : undefined;

  const nameValidation = useMemo(() => {
    if (fileModal.type !== "add" && fileModal.type !== "rename") {
      return { name: "", isValid: true, message: "" };
    }

    const safeName = ensureEazeExt(fileModal.value);
    if (!safeName) {
      return { name: safeName, isValid: false, message: "Name is required." };
    }

    const duplicate = files.some((f, i) => {
      if (fileModal.type === "rename" && i === fileModal.index) return false;
      return f.name.toLowerCase() === safeName.toLowerCase();
    });

    if (duplicate) {
      return {
        name: safeName,
        isValid: false,
        message: "A file with this name already exists.",
      };
    }

    return { name: safeName, isValid: true, message: "" };
  }, [fileModal, files]);

  const handleConfirmAdd = () => {
    if (!nameValidation.isValid) return;
    addFile(nameValidation.name, "");
    closeModal();
  };

  const handleConfirmRename = () => {
    if (!nameValidation.isValid || fileModal.index === null) return;
    renameFile(fileModal.index, nameValidation.name);
    closeModal();
  };

  const handleConfirmDelete = () => {
    if (fileModal.index === null) return;
    deleteFile(fileModal.index);
    closeModal();
  };

  const deleteDisabled = files.length <= 1;

  return (
    <>
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <span>Files</span>
          <button
            className="btn"
            style={{
              width: "24px",
              height: "24px",
              padding: 0,
              border: "none",
              background: "var(--bg)",
            }}
            onClick={openAddModal}
          >
            +
          </button>
        </div>
        <div className="file-list">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className={`file-item ${i === activeIdx ? "active" : ""}`}
              onClick={() => setActiveIdx(i)}
              title={file.name}
            >
              <div className="file-main">
                <span className="file-icon">📄</span>
                {!sidebarCollapsed && (
                  <span className="file-name">{file.name}</span>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="file-actions">
                  <button
                    className="file-action"
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameModal(i);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="file-action"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(i);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title="Toggle Sidebar"
        >
          {sidebarCollapsed ? "▶" : "◀"}
        </button>
      </aside>

      <Modal
        isOpen={fileModal.type === "add"}
        onClose={closeModal}
        title="New File"
      >
        <div style={{ padding: "10px 0" }}>
          <p className="modal-message">Enter a name for your new Eaze file:</p>
          <input
            type="text"
            className="template-search"
            value={fileModal.value}
            onChange={(e) =>
              setFileModal((prev) => ({ ...prev, value: e.target.value }))
            }
            placeholder="my-code.eaze"
          />
          {nameValidation.message && (
            <div className="form-hint error">{nameValidation.message}</div>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmAdd}
              disabled={!nameValidation.isValid}
            >
              Create File
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={fileModal.type === "rename"}
        onClose={closeModal}
        title="Rename File"
      >
        <div style={{ padding: "10px 0" }}>
          <p className="modal-message">
            Rename <b>{targetFile?.name}</b> to:
          </p>
          <input
            type="text"
            className="template-search"
            value={fileModal.value}
            onChange={(e) =>
              setFileModal((prev) => ({ ...prev, value: e.target.value }))
            }
            placeholder="new-name.eaze"
          />
          {nameValidation.message && (
            <div className="form-hint error">{nameValidation.message}</div>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmRename}
              disabled={!nameValidation.isValid}
            >
              Rename
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={fileModal.type === "delete"}
        onClose={closeModal}
        title="Delete File?"
      >
        <div style={{ padding: "10px 0" }}>
          <p className="modal-message">
            Are you sure you want to delete <b>{targetFile?.name}</b>? This
            cannot be undone.
          </p>
          {deleteDisabled && (
            <div className="form-hint error">
              You must keep at least one file.
            </div>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmDelete}
              disabled={deleteDisabled}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
