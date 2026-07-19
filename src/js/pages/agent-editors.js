import { state, t } from '../core/state.js';
import { customConfirm } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { api } from '../core/api.js';
import { escapeHtml } from '../core/utils.js';

// ==========================================
// Identity Editor (SOUL.md)
// ==========================================
async function loadAgentIdentity(container, name) {
  container.innerHTML = `<div class="loading">Loading identity for ${escapeHtml(name)}...</div>`;

  try {
    const res = await api(`/api/agent-file/${encodeURIComponent(name)}/SOUL.md`);
    if (!res.ok) {
      container.innerHTML = `<div class="card"><div class="card-title">Identity (SOUL.md)</div><div class="error-msg">${escapeHtml(res.error || 'Failed to load')}</div></div>`;
      return;
    }

    const content = res.content || '';
    container.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="card-title" style="margin:0;">Identity (SOUL.md)</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:11px;color:var(--fg-muted);" id="identity-status">${res.exists ? 'Loaded' : 'File does not exist — will be created on save'}</span>
            <button class="btn btn-ghost btn-sm" id="identity-preview-toggle">👁 Preview</button>
            <button class="btn btn-primary btn-sm" id="identity-save-btn">💾 Save</button>
          </div>
        </div>
        <div id="identity-editor-wrap" style="display:flex;gap:12px;">
          <div style="flex:1;min-width:0;">
            <textarea id="identity-editor" spellcheck="false" style="width:100%;min-height:500px;resize:vertical;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;background:var(--bg-inset);border:1px solid var(--border);border-radius:var(--radius);color:var(--fg);padding:12px;tab-size:2;">${escapeHtml(content)}</textarea>
          </div>
          <div id="identity-preview" style="flex:1;min-width:0;display:none;background:var(--bg-inset);border:1px solid var(--border);border-radius:var(--radius);padding:12px;overflow-y:auto;max-height:540px;">
            <div id="identity-preview-content" style="font-size:13px;line-height:1.6;color:var(--fg);"></div>
          </div>
        </div>
      </div>
    `;

    // Preview toggle
    let previewVisible = false;
    document.getElementById('identity-preview-toggle').addEventListener('click', () => {
      previewVisible = !previewVisible;
      const previewEl = document.getElementById('identity-preview');
      const previewContent = document.getElementById('identity-preview-content');
      previewEl.style.display = previewVisible ? 'block' : 'none';
      if (previewVisible) {
        previewContent.innerHTML = renderMarkdownPreview(document.getElementById('identity-editor').value);
      }
    });

    // Live preview update on input
    document.getElementById('identity-editor').addEventListener('input', () => {
      if (previewVisible) {
        document.getElementById('identity-preview-content').innerHTML = renderMarkdownPreview(document.getElementById('identity-editor').value);
      }
    });

    // Save
    document.getElementById('identity-save-btn').addEventListener('click', async () => {
      const newContent = document.getElementById('identity-editor').value;
      const statusEl = document.getElementById('identity-status');
      statusEl.textContent = 'Saving...';
      try {
        const saveRes = await api(`/api/agent-file/${encodeURIComponent(name)}/SOUL.md`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken || '' },
          body: JSON.stringify({ content: newContent }),
        });
        if (saveRes.ok) {
          statusEl.textContent = `Saved (${saveRes.bytes} bytes)`;
          showToast('SOUL.md saved successfully', 'success');
        } else {
          statusEl.textContent = 'Save failed';
          showToast(saveRes.error || 'Save failed', 'error');
        }
      } catch (e) {
        statusEl.textContent = 'Error';
        showToast(e.message, 'error');
      }
    });
  } catch (e) {
    container.innerHTML = `<div class="card"><div class="card-title">Identity (SOUL.md)</div><div class="error-msg">${escapeHtml(e.message)}</div></div>`;
  }
}

// ==========================================
// User Profile Editor (USER.md)
// ==========================================
async function loadAgentUserProfile(container, name) {
  container.innerHTML = `<div class="loading">Loading user profile for ${escapeHtml(name)}...</div>`;

  try {
    const res = await api(`/api/agent-file/${encodeURIComponent(name)}/USER.md`);
    if (!res.ok) {
      container.innerHTML = `<div class="card"><div class="card-title">User Profile (USER.md)</div><div class="error-msg">${escapeHtml(res.error || 'Failed to load')}</div></div>`;
      return;
    }

    const content = res.content || '';
    container.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="card-title" style="margin:0;">User Profile (USER.md)</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:11px;color:var(--fg-muted);" id="user-profile-status">${res.exists ? 'Loaded' : 'File does not exist — will be created on save'}</span>
            <button class="btn btn-ghost btn-sm" id="user-profile-preview-toggle">👁 Preview</button>
            <button class="btn btn-primary btn-sm" id="user-profile-save-btn">💾 Save</button>
          </div>
        </div>
        <div id="user-profile-editor-wrap" style="display:flex;gap:12px;">
          <div style="flex:1;min-width:0;">
            <textarea id="user-profile-editor" spellcheck="false" style="width:100%;min-height:500px;resize:vertical;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;background:var(--bg-inset);border:1px solid var(--border);border-radius:var(--radius);color:var(--fg);padding:12px;tab-size:2;">${escapeHtml(content)}</textarea>
          </div>
          <div id="user-profile-preview" style="flex:1;min-width:0;display:none;background:var(--bg-inset);border:1px solid var(--border);border-radius:var(--radius);padding:12px;overflow-y:auto;max-height:540px;">
            <div id="user-profile-preview-content" style="font-size:13px;line-height:1.6;color:var(--fg);"></div>
          </div>
        </div>
      </div>
    `;

    // Preview toggle
    let previewVisible = false;
    document.getElementById('user-profile-preview-toggle').addEventListener('click', () => {
      previewVisible = !previewVisible;
      const previewEl = document.getElementById('user-profile-preview');
      const previewContent = document.getElementById('user-profile-preview-content');
      previewEl.style.display = previewVisible ? 'block' : 'none';
      if (previewVisible) {
        previewContent.innerHTML = renderMarkdownPreview(document.getElementById('user-profile-editor').value);
      }
    });

    // Live preview update on input
    document.getElementById('user-profile-editor').addEventListener('input', () => {
      if (previewVisible) {
        document.getElementById('user-profile-preview-content').innerHTML = renderMarkdownPreview(document.getElementById('user-profile-editor').value);
      }
    });

    // Save
    document.getElementById('user-profile-save-btn').addEventListener('click', async () => {
      const newContent = document.getElementById('user-profile-editor').value;
      const statusEl = document.getElementById('user-profile-status');
      statusEl.textContent = 'Saving...';
      try {
        const saveRes = await api(`/api/agent-file/${encodeURIComponent(name)}/USER.md`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken || '' },
          body: JSON.stringify({ content: newContent }),
        });
        if (saveRes.ok) {
          statusEl.textContent = `Saved (${saveRes.bytes} bytes)`;
          showToast('USER.md saved successfully', 'success');
        } else {
          statusEl.textContent = 'Save failed';
          showToast(saveRes.error || 'Save failed', 'error');
        }
      } catch (e) {
        statusEl.textContent = 'Error';
        showToast(e.message, 'error');
      }
    });
  } catch (e) {
    container.innerHTML = `<div class="card"><div class="card-title">User Profile (USER.md)</div><div class="error-msg">${escapeHtml(e.message)}</div></div>`;
  }
}

// ==========================================
// Memory Files Browser & Editor
// ==========================================
async function loadAgentMemoryFiles(container, name) {
  container.innerHTML = `<div class="loading">Loading memory files for ${escapeHtml(name)}...</div>`;

  try {
    const res = await api(`/api/agent-memory-files/${encodeURIComponent(name)}`);
    if (!res.ok) {
      container.innerHTML = `<div class="card"><div class="card-title">Memory Files</div><div class="error-msg">${escapeHtml(res.error || 'Failed to load')}</div></div>`;
      return;
    }

    const files = res.files || [];

    container.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="card-title" style="margin:0;">Memory Files (memory/*.md)</div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost btn-sm" id="memory-files-refresh">↻ Refresh</button>
            <button class="btn btn-primary btn-sm" id="memory-files-new">+ New Memory</button>
          </div>
        </div>
        <div id="memory-files-list">
          ${files.length === 0 ? '<div style="color:var(--fg-muted);font-size:12px;padding:12px;">No memory files found. Click "New Memory" to create one.</div>' : `
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Size</th>
                    <th>Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${files.map(f => `
                    <tr>
                      <td class="mono" style="font-size:12px;">${escapeHtml(f.name)}</td>
                      <td style="font-size:11px;color:var(--fg-muted);">${f.size} bytes</td>
                      <td style="font-size:11px;color:var(--fg-muted);">${new Date(f.mtime).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                      <td>
                        <div style="display:flex;gap:4px;">
                          <button class="btn btn-ghost btn-sm memory-file-edit" data-filename="${escapeHtml(f.name)}" title="Edit">✎</button>
                          <button class="btn btn-ghost btn-sm btn-danger memory-file-delete" data-filename="${escapeHtml(f.name)}" title="Delete">×</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
        <div id="memory-file-editor-section" style="display:none;margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:600;font-size:13px;" id="memory-editor-title">Editing: —</div>
            <div style="display:flex;gap:8px;">
              <span style="font-size:11px;color:var(--fg-muted);" id="memory-editor-status"></span>
              <button class="btn btn-ghost btn-sm" id="memory-editor-close">✕ Close</button>
              <button class="btn btn-primary btn-sm" id="memory-editor-save">💾 Save</button>
            </div>
          </div>
          <textarea id="memory-file-editor" spellcheck="false" style="width:100%;min-height:400px;resize:vertical;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;background:var(--bg-inset);border:1px solid var(--border);border-radius:var(--radius);color:var(--fg);padding:12px;tab-size:2;"></textarea>
        </div>
      </div>
    `;

    let currentEditFile = null;

    // Edit button handlers
    container.querySelectorAll('.memory-file-edit').forEach(btn => {
      btn.addEventListener('click', () => openMemoryFile(btn.dataset.filename));
    });

    // Delete button handlers
    container.querySelectorAll('.memory-file-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteMemoryFile(btn.dataset.filename));
    });

    // Refresh
    document.getElementById('memory-files-refresh').addEventListener('click', () => {
      loadAgentMemoryFiles(container, name);
    });

    // New Memory
    document.getElementById('memory-files-new').addEventListener('click', () => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `${today}.md`;
      // Check if file already exists
      const exists = files.some(f => f.name === filename);
      if (exists) {
        openMemoryFile(filename);
      } else {
        // Open editor with new file
        currentEditFile = filename;
        const editorSection = document.getElementById('memory-file-editor-section');
        editorSection.style.display = 'block';
        document.getElementById('memory-editor-title').textContent = `New: ${filename}`;
        document.getElementById('memory-file-editor').value = `# Memory - ${today}\n\n`;
        document.getElementById('memory-editor-status').textContent = 'New file';
        document.getElementById('memory-file-editor').focus();
      }
    });

    // Close editor
    document.getElementById('memory-editor-close').addEventListener('click', () => {
      document.getElementById('memory-file-editor-section').style.display = 'none';
      currentEditFile = null;
    });

    // Save editor
    document.getElementById('memory-editor-save').addEventListener('click', async () => {
      if (!currentEditFile) return;
      const content = document.getElementById('memory-file-editor').value;
      const statusEl = document.getElementById('memory-editor-status');
      statusEl.textContent = 'Saving...';
      try {
        const saveRes = await api(`/api/agent-memory-files/${encodeURIComponent(name)}/${encodeURIComponent(currentEditFile)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken || '' },
          body: JSON.stringify({ content }),
        });
        if (saveRes.ok) {
          statusEl.textContent = `Saved (${saveRes.bytes} bytes)`;
          showToast(`${currentEditFile} saved`, 'success');
          // Refresh file list
          setTimeout(() => loadAgentMemoryFiles(container, name), 500);
        } else {
          statusEl.textContent = 'Save failed';
          showToast(saveRes.error || 'Save failed', 'error');
        }
      } catch (e) {
        statusEl.textContent = 'Error';
        showToast(e.message, 'error');
      }
    });

    async function openMemoryFile(filename) {
      const statusEl = document.getElementById('memory-editor-status');
      const editorSection = document.getElementById('memory-file-editor-section');
      editorSection.style.display = 'block';
      document.getElementById('memory-editor-title').textContent = `Editing: ${filename}`;
      document.getElementById('memory-file-editor').value = 'Loading...';
      statusEl.textContent = 'Loading...';
      currentEditFile = filename;

      try {
        const fileRes = await api(`/api/agent-memory-files/${encodeURIComponent(name)}/${encodeURIComponent(filename)}`);
        if (fileRes.ok) {
          document.getElementById('memory-file-editor').value = fileRes.content || '';
          statusEl.textContent = 'Loaded';
        } else {
          document.getElementById('memory-file-editor').value = '';
          statusEl.textContent = fileRes.error || 'Load failed';
        }
      } catch (e) {
        document.getElementById('memory-file-editor').value = '';
        statusEl.textContent = e.message;
      }
    }

    async function deleteMemoryFile(filename) {
      if (!await customConfirm(`Delete memory file "${filename}"? This cannot be undone.`, 'Delete Memory File')) return;
      try {
        const delRes = await api(`/api/agent-memory-files/${encodeURIComponent(name)}/${encodeURIComponent(filename)}`, {
          method: 'DELETE',
          headers: { 'X-CSRF-Token': state.csrfToken || '' },
        });
        if (delRes.ok) {
          showToast(`${filename} deleted`, 'success');
          loadAgentMemoryFiles(container, name);
        } else {
          showToast(delRes.error || 'Delete failed', 'error');
        }
      } catch (e) {
        showToast(e.message, 'error');
      }
    }

  } catch (e) {
    container.innerHTML = `<div class="card"><div class="card-title">Memory Files</div><div class="error-msg">${escapeHtml(e.message)}</div></div>`;
  }
}

// ==========================================
// Simple Markdown Preview Renderer
// ==========================================
function renderMarkdownPreview(md) {
  if (!md) return '<span style="color:var(--fg-muted);">(empty)</span>';
  // Simple markdown rendering — headings, bold, italic, code, lists, links
  let html = escapeHtml(md);
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:8px;font-size:11px;overflow-x:auto;">$1</pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:var(--bg);padding:2px 4px;border-radius:3px;font-size:11px;">$1</code>');
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:600;margin:12px 0 4px;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:600;margin:16px 0 6px;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:700;margin:20px 0 8px;">$1</h1>');
  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li style="margin-left:16px;list-style:disc;">$1</li>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--accent);">$1</a>');
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  return html;
}

// Window bridge
window.loadAgentIdentity = loadAgentIdentity;
window.loadAgentUserProfile = loadAgentUserProfile;
window.loadAgentMemoryFiles = loadAgentMemoryFiles;

export { loadAgentIdentity, loadAgentUserProfile, loadAgentMemoryFiles };
