import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import Modal from "./Modal";
import Icon from "./Icon";

const ensureEazeExt = (name) => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  return /\.[a-zA-Z0-9]+$/.test(trimmed) ? trimmed : `${trimmed}.eaze`;
};

const fileIcon = (name) =>
  name.endsWith(".eaze") ? "file-code" : "file-text";

const Sidebar = () => {
  const {
    files,
    activeIdx,
    activeFile,
    setActiveIdx,
    sidebarCollapsed,
    setSidebarCollapsed,
    addFile,
    isDesktop,
    workspaceFolder,
    saveStatus,
    openFolder,
    refreshFolder,
    closeFolder,
    tree,
    workspaceError,
    openFileByPath,
    createWorkspaceFile,
    createWorkspaceFolder,
    renameWorkspacePath,
    deleteWorkspacePath,
    renameFile,
    deleteFile,
  } = useAppContext();

  // legacy flat-list modal (browser mode): add | rename | delete
  const [fileModal, setFileModal] = useState({ type: null, index: null, value: "" });
  // explorer modal: { type: 'newFile'|'newFolder'|'rename'|'delete', parentPath, targetPath, value }
  const [wsModal, setWsModal] = useState(null);
  // expanded folders in the tree
  const [expanded, setExpanded] = useState({});
  const [busy, setBusy] = useState(false);

  const inWorkspace = isDesktop && workspaceFolder;

  /* ---------------- legacy browser-mode handlers ---------------- */

  const openAddModal = () => setFileModal({ type: "add", index: null, value: "my-code.eaze" });
  const openRenameModal = (index) => setFileModal({ type: "rename", index, value: files[index]?.name || "" });
  const openDeleteModal = (index) => setFileModal({ type: "delete", index, value: "" });
  const closeFileModal = () => setFileModal({ type: null, index: null, value: "" });

  const nameValidation = (() => {
    if (fileModal.type !== "add" && fileModal.type !== "rename") {
      return { name: "", isValid: true, message: "" };
    }
    const safeName = ensureEazeExt(fileModal.value);
    if (!safeName) return { name: safeName, isValid: false, message: "Name is required." };
    const duplicate = files.some((f, i) => {
      if (fileModal.type === "rename" && i === fileModal.index) return false;
      return f.name.toLowerCase() === safeName.toLowerCase();
    });
    if (duplicate) {
      return { name: safeName, isValid: false, message: "A file with this name already exists." };
    }
    return { name: safeName, isValid: true, message: "" };
  })();

  const handleConfirmAdd = () => {
    if (!nameValidation.isValid) return;
    addFile(nameValidation.name, "");
    closeFileModal();
  };

  const handleConfirmRename = () => {
    if (!nameValidation.isValid || fileModal.index === null) return;
    renameFile(fileModal.index, nameValidation.name);
    closeFileModal();
  };

  const handleConfirmDelete = () => {
    if (fileModal.index === null) return;
    deleteFile(fileModal.index);
    closeFileModal();
  };

  /* ---------------- explorer handlers ---------------- */

  const wsValidate = () => {
    if (!wsModal) return { name: "", isValid: false, message: "" };
    const raw = String(wsModal.value || "").trim();
    if (!raw) return { name: "", isValid: false, message: "Name is required." };
    if (/[\\/]/.test(raw)) return { name: raw, isValid: false, message: "Name cannot contain / or \\" };
    if (wsModal.type === "newFile") {
      const safe = ensureEazeExt(raw);
      const siblings = currentChildren(wsModal.parentPath);
      if (siblings.some((n) => n.name.toLowerCase() === safe.toLowerCase())) {
        return { name: safe, isValid: false, message: "A file with this name already exists here." };
      }
      return { name: safe, isValid: true, message: "" };
    }
    if (wsModal.type === "newFolder") {
      const siblings = currentChildren(wsModal.parentPath);
      if (siblings.some((n) => n.name.toLowerCase() === raw.toLowerCase())) {
        return { name: raw, isValid: false, message: "A folder with this name already exists here." };
      }
      return { name: raw, isValid: true, message: "" };
    }
    return { name: raw, isValid: true, message: "" };
  };

  const currentChildren = (parentPath) => {
    if (!parentPath) return tree;
    const find = (nodes) => {
      for (const n of nodes) {
        if (n.path === parentPath) return n.children || [];
        if (n.children) {
          const hit = find(n.children);
          if (hit) return hit;
        }
      }
      return null;
    };
    return find(tree) || [];
  };

  const openWsModal = (payload) => setWsModal({ value: "", ...payload });
  const closeWsModal = () => setWsModal(null);

  const toggleExpand = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleWsConfirm = async () => {
    const v = wsValidate();
    if (!v.isValid || !wsModal) return;
    setBusy(true);
    try {
      if (wsModal.type === "newFile") {
        await createWorkspaceFile(v.name, wsModal.parentPath);
      } else if (wsModal.type === "newFolder") {
        await createWorkspaceFolder(v.name, wsModal.parentPath);
        // auto-expand the destination so the new folder is visible
        if (wsModal.parentPath) {
          setExpanded((prev) => ({ ...prev, [wsModal.parentPath]: true }));
        }
      } else if (wsModal.type === "rename") {
        await renameWorkspacePath(wsModal.targetPath, v.name);
      } else if (wsModal.type === "delete") {
        await deleteWorkspacePath(wsModal.targetPath);
      }
      closeWsModal();
    } finally {
      setBusy(false);
    }
  };

  const deleteDisabled = files.length <= 1;

  /* ---------------- tree rendering ---------------- */

  const renderNode = (node, depth) => {
    const isOpen = !!expanded[node.path];
    const isActiveFile = node.type === "file" && activeFile?.path === node.path;

    return (
      <div key={node.path}>
        <div
          className={`tree-item ${isActiveFile ? "active" : ""}`}
          style={{ paddingLeft: 10 + depth * 14 }}
          title={node.path}
          onClick={() => {
            if (node.type === "folder") toggleExpand(node.path);
            else openFileByPath(node.path, node.name);
          }}
        >
          {node.type === "folder" ? (
            <>
              <Icon
                name="chevron"
                size={13}
                className={`tree-caret ${isOpen ? "open" : ""}`}
              />
              <Icon name="folder" size={16} className="tree-folder-icon" />
            </>
          ) : (
            <>
              <span className="tree-caret tree-caret-leaf" />
              <Icon
                name={fileIcon(node.name)}
                size={16}
                className="tree-icon"
              />
            </>
          )}
          <span className="tree-name">{node.name}</span>
        </div>
        {node.type === "folder" && isOpen &&
          (node.children || []).map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  /* ---------------- header action buttons ---------------- */

  const HeaderBtn = ({ title, onClick, icon, disabled }) => (
    <button
      className="ws-action"
      title={title}
      onClick={onClick}
      disabled={disabled || busy}
      type="button"
    >
      <Icon name={icon} size={16} />
    </button>
  );

  const rootName = workspaceFolder
    ? workspaceFolder.split(/[\\/]/).pop()
    : "";

  return (
    <>
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-label">My Docs</span>
          {!sidebarCollapsed && inWorkspace && (
            <div className="ws-actions">
              <HeaderBtn
                title="New File (in workspace root)"
                icon="file-plus"
                onClick={() => openWsModal({ type: "newFile", parentPath: "" })}
              />
              <HeaderBtn
                title="New Folder (in workspace root)"
                icon="folder-plus"
                onClick={() => openWsModal({ type: "newFolder", parentPath: "" })}
              />
              <HeaderBtn
                title="Open a different folder"
                icon="folder-open"
                onClick={openFolder}
              />
              <HeaderBtn
                title="Refresh from disk"
                icon="refresh"
                onClick={refreshFolder}
              />
              <HeaderBtn
                title="Close workspace folder"
                icon="close"
                onClick={closeFolder}
              />
            </div>
          )}
          {!inWorkspace && (
            <button
              className="ws-action"
              title="Open Folder to start a workspace"
              onClick={openFolder}
              type="button"
            >
              <Icon name="folder-open" size={16} />
            </button>
          )}
        </div>

        {!sidebarCollapsed && inWorkspace && (
          <div className="sidebar-root" title={workspaceFolder}>
            <Icon name="folder" size={14} />
            <span>{rootName}</span>
          </div>
        )}

        {saveStatus === "error" && !sidebarCollapsed && (
          <div className="form-hint error" style={{ margin: "0 12px 6px" }}>
            ⚠️ Couldn't write to disk.
          </div>
        )}
        {workspaceError && !sidebarCollapsed && (
          <div className="form-hint error" style={{ margin: "0 12px 6px" }}>
            ⚠️ {workspaceError}
          </div>
        )}

        {sidebarCollapsed ? (
          <div className="file-list" />
        ) : inWorkspace ? (
          <div className="file-list explorer">
            {tree.length === 0 && (
              <div className="explorer-empty">
                No files in this folder yet. Use the ＋ button above to create one.
              </div>
            )}
            {tree.map((node) => renderNode(node, 0))}
          </div>
        ) : (
          <div className="file-list">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className={`file-item ${i === activeIdx ? "active" : ""}`}
                onClick={() => setActiveIdx(i)}
                title={file.name}
              >
                <div className="file-main">
                  <Icon
                    name={fileIcon(file.name)}
                    size={16}
                    className="tree-icon"
                  />
                  <span className="file-name">{file.name}</span>
                </div>
                <div className="file-actions">
                  <button
                    className="file-action"
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameModal(i);
                    }}
                  >
                    <Icon name="pencil" size={14} />
                  </button>
                  <button
                    className="file-action"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(i);
                    }}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={sidebarCollapsed ? "chevron-right" : "chevron-left"} size={15} />
          {!sidebarCollapsed && <span>Hide</span>}
        </button>
      </aside>

      {/* ------- legacy modals (browser mode) ------- */}
      <Modal isOpen={fileModal.type === "add"} onClose={closeFileModal} title="New File">
        <div style={{ padding: "10px 0" }}>
          <p className="modal-message">Enter a name for your new Eaze file:</p>
          <input
            type="text"
            className="template-search"
            value={fileModal.value}
            onChange={(e) => setFileModal((prev) => ({ ...prev, value: e.target.value }))}
            placeholder="my-code.eaze"
          />
          {nameValidation.message && <div className="form-hint error">{nameValidation.message}</div>}
          <div className="modal-actions">
            <button className="btn" onClick={closeFileModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConfirmAdd} disabled={!nameValidation.isValid}>
              Create File
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={fileModal.type === "rename"} onClose={closeFileModal} title="Rename File">
        <div style={{ padding: "10px 0" }}>
          <p className="modal-message">
            Rename <b>{fileModal.index !== null ? files[fileModal.index]?.name : ""}</b> to:
          </p>
          <input
            type="text"
            className="template-search"
            value={fileModal.value}
            onChange={(e) => setFileModal((prev) => ({ ...prev, value: e.target.value }))}
            placeholder="new-name.eaze"
          />
          {nameValidation.message && <div className="form-hint error">{nameValidation.message}</div>}
          <div className="modal-actions">
            <button className="btn" onClick={closeFileModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConfirmRename} disabled={!nameValidation.isValid}>
              Rename
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={fileModal.type === "delete"} onClose={closeFileModal} title="Delete File?">
        <div style={{ padding: "10px 0" }}>
          <p className="modal-message">
            Are you sure you want to delete{" "}
            <b>{fileModal.index !== null ? files[fileModal.index]?.name : ""}</b>? This cannot be undone.
          </p>
          {deleteDisabled && (
            <div className="form-hint error">You must keep at least one file.</div>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={closeFileModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConfirmDelete} disabled={deleteDisabled}>
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* ------- workspace explorer modals ------- */}
      <Modal
        isOpen={!!wsModal}
        onClose={closeWsModal}
        title={
          wsModal?.type === "newFile"
            ? "New File"
            : wsModal?.type === "newFolder"
              ? "New Folder"
              : wsModal?.type === "rename"
                ? "Rename"
                : "Delete"
        }
      >
        {wsModal && (
          <div style={{ padding: "10px 0" }}>
            {wsModal.type === "delete" ? (
              <>
                <p className="modal-message">
                  Move <b>{wsModal.targetName}</b> to the Recycle Bin?
                </p>
                <div className="modal-actions">
                  <button className="btn" onClick={closeWsModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleWsConfirm} disabled={busy}>
                    Move to Bin
                  </button>
                </div>
              </>
            ) : wsModal.type === "rename" ? (
              <>
                <p className="modal-message">
                  Rename <b>{wsModal.targetName}</b> to:
                </p>
                <input
                  type="text"
                  className="template-search"
                  value={wsModal.value}
                  autoFocus
                  onChange={(e) => setWsModal((prev) => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleWsConfirm()}
                  placeholder={wsModal.targetName}
                />
                {wsValidate().message && <div className="form-hint error">{wsValidate().message}</div>}
                <div className="modal-actions">
                  <button className="btn" onClick={closeWsModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleWsConfirm} disabled={busy || !wsValidate().isValid}>
                    Rename
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="modal-message">
                  {wsModal.type === "newFile" ? "New file" : "New folder"} in{" "}
                  <b>{wsModal.parentPath ? wsModal.parentPath.split(/[\\/]/).pop() : "workspace root"}:</b>
                </p>
                <input
                  type="text"
                  className="template-search"
                  value={wsModal.value}
                  autoFocus
                  onChange={(e) => setWsModal((prev) => ({ ...prev, value: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleWsConfirm()}
                  placeholder={wsModal.type === "newFile" ? "my-code.eaze" : "my-folder"}
                />
                {wsValidate().message && <div className="form-hint error">{wsValidate().message}</div>}
                <div className="modal-actions">
                  <button className="btn" onClick={closeWsModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleWsConfirm} disabled={busy || !wsValidate().isValid}>
                    {wsModal.type === "newFile" ? "Create File" : "Create Folder"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default Sidebar;
