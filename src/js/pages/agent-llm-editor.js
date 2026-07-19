import { state, t } from '../core/state.js';
import { showToast } from '../components/toast.js';
import { api } from '../core/api.js';
import { escapeHtml } from '../core/utils.js';

// Known auxiliary task types (suggestions for the dropdown when adding)
const KNOWN_TASKS = [
  'coding', 'compression', 'vision', 'web_extract', 'skills_hub',
  'monitor', 'background_review', 'triage_specifier', 'kanban_decomposer',
  'curator', 'title_generation', 'mcp', 'approval', 'tts_audio_tags',
  'profile_describer', 'moa_reference', 'moa_aggregator'
];

function renderAuxRow(key, config) {
  const baseUrl = config.base_url || '';
  const model = config.model || '';
  const apiKey = config.api_key || '';
  const timeout = config.timeout || 120;

  return `
    <div class="aux-row" data-task="${escapeHtml(key)}" style="margin-bottom:10px;padding:10px;border-radius:8px;background:var(--bg-inset);border:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;font-weight:600;color:var(--gold);">${escapeHtml(key)}</span>
        <button class="btn btn-ghost btn-sm aux-remove-btn" data-task="${escapeHtml(key)}" style="color:var(--red);font-size:11px;">✕ Remove</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--fg-muted);">Base URL</label>
          <input type="text" class="aux-base-url" data-task="${escapeHtml(key)}" value="${escapeHtml(baseUrl)}" placeholder="http://host:port/v1" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;font-family:var(--font-mono, monospace);" />
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--fg-muted);">Model</label>
          <input type="text" class="aux-model" data-task="${escapeHtml(key)}" value="${escapeHtml(model)}" placeholder="model id" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;font-family:var(--font-mono, monospace);" />
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--fg-muted);">API Key</label>
          <input type="password" class="aux-api-key" data-task="${escapeHtml(key)}" value="${escapeHtml(apiKey)}" placeholder="(optional)" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;font-family:var(--font-mono, monospace);" />
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--fg-muted);">Timeout (s)</label>
          <input type="number" class="aux-timeout" data-task="${escapeHtml(key)}" value="${timeout}" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;" />
        </div>
      </div>
    </div>
  `;
}

async function loadAgentLLMEditor(container, name) {
  container.innerHTML = `<div class="loading">Loading LLM config for ${escapeHtml(name)}...</div>`;

  try {
    const res = await api(`/api/config/${encodeURIComponent(name)}`);
    if (!res.ok) {
      container.innerHTML = `<div class="card"><div class="card-title">LLM Models</div><div class="error-msg">${escapeHtml(res.error || 'Failed to load')}</div></div>`;
      return;
    }

    const config = res.config || {};
    const model = config.model || {};
    const auxiliary = config.auxiliary || {};

    // Build existing auxiliary rows
    const auxKeys = Object.keys(auxiliary);
    const auxRows = auxKeys.map(key => renderAuxRow(key, auxiliary[key])).join('');

    // Build "add" dropdown options (exclude already configured)
    const availableToAdd = KNOWN_TASKS.filter(t => !auxKeys.includes(t));

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title">⚡ Main Model</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div style="display:flex;flex-direction:column;gap:2px;">
            <label style="font-size:10px;color:var(--fg-muted);">Model</label>
            <input type="text" id="llm-main-model" value="${escapeHtml(model.default || '')}" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;font-family:var(--font-mono, monospace);" />
          </div>
          <div style="display:flex;flex-direction:column;gap:2px;">
            <label style="font-size:10px;color:var(--fg-muted);">Provider</label>
            <input type="text" id="llm-main-provider" value="${escapeHtml(model.provider || '')}" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;font-family:var(--font-mono, monospace);" />
          </div>
          <div style="display:flex;flex-direction:column;gap:2px;">
            <label style="font-size:10px;color:var(--fg-muted);">Context Length</label>
            <input type="number" id="llm-main-context" value="${model.context_length || 1000000}" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;" />
          </div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="card-title" style="margin:0;">🧠 Auxiliary Models</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <select id="aux-add-select" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:11px;">
              <option value="">+ Add auxiliary...</option>
              ${availableToAdd.map(t => `<option value="${t}">${t}</option>`).join('')}
              <option value="__custom__">— custom name —</option>
            </select>
            <button class="btn btn-ghost btn-sm" id="llm-fill-all-btn" title="Fill all with same base_url and api_key">📋 Fill All</button>
          </div>
        </div>
        ${auxKeys.length === 0 ? '<p style="font-size:12px;color:var(--fg-muted);text-align:center;padding:20px;">No auxiliary models configured. Add one above.</p>' : ''}
        <div id="aux-model-rows">
          ${auxRows}
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;">
          <button class="btn btn-primary" id="llm-save-btn">💾 Save LLM Config</button>
        </div>
      </div>
    `;

    // Add auxiliary handler
    document.getElementById('aux-add-select').addEventListener('change', (e) => {
      let taskName = e.target.value;
      if (!taskName) return;
      if (taskName === '__custom__') {
        taskName = prompt('Enter custom auxiliary task name:');
        if (!taskName || !taskName.trim()) { e.target.value = ''; return; }
        taskName = taskName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      }
      e.target.value = '';
      // Remove from dropdown
      const opt = e.target.querySelector(`option[value="${taskName}"]`);
      if (opt && taskName !== '__custom__') opt.remove();
      // Add row
      const rowsEl = document.getElementById('aux-model-rows');
      const placeholder = rowsEl.querySelector('p');
      if (placeholder) placeholder.remove();
      rowsEl.insertAdjacentHTML('beforeend', renderAuxRow(taskName, {}));
    });

    // Remove handler (delegated)
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('aux-remove-btn')) {
        const task = e.target.dataset.task;
        const row = container.querySelector(`.aux-row[data-task="${task}"]`);
        if (row) row.remove();
        // Re-add to dropdown
        const sel = document.getElementById('aux-add-select');
        if (sel && KNOWN_TASKS.includes(task)) {
          const customOpt = sel.querySelector('option[value="__custom__"]');
          const newOpt = document.createElement('option');
          newOpt.value = task;
          newOpt.textContent = task;
          sel.insertBefore(newOpt, customOpt);
        }
      }
    });

    // Fill all from first
    document.getElementById('llm-fill-all-btn').addEventListener('click', () => {
      const firstUrl = container.querySelector('.aux-base-url')?.value || '';
      const firstKey = container.querySelector('.aux-api-key')?.value || '';
      if (!firstUrl && !firstKey) { showToast('First row has no values to copy', 'warning'); return; }
      container.querySelectorAll('.aux-base-url').forEach(el => { if (!el.value) el.value = firstUrl; });
      container.querySelectorAll('.aux-api-key').forEach(el => { if (!el.value) el.value = firstKey; });
      showToast('Filled empty fields from first row', 'info');
    });

    // Save handler
    document.getElementById('llm-save-btn').addEventListener('click', async () => {
      const newConfig = JSON.parse(JSON.stringify(config));

      // Update main model
      newConfig.model = {
        default: document.getElementById('llm-main-model').value,
        provider: document.getElementById('llm-main-provider').value,
        context_length: parseInt(document.getElementById('llm-main-context').value) || 1000000,
      };

      // Rebuild auxiliary from current rows
      newConfig.auxiliary = {};
      container.querySelectorAll('.aux-row').forEach(row => {
        const task = row.dataset.task;
        const baseUrl = row.querySelector('.aux-base-url')?.value || '';
        const modelId = row.querySelector('.aux-model')?.value || '';
        const apiKey = row.querySelector('.aux-api-key')?.value || '';
        const timeout = parseInt(row.querySelector('.aux-timeout')?.value) || 120;

        if (!modelId) return; // skip empty model
        const entry = { model: modelId, timeout };
        if (baseUrl) entry.base_url = baseUrl;
        if (apiKey) entry.api_key = apiKey;
        newConfig.auxiliary[task] = entry;
      });

      try {
        const csrfToken = state.csrfToken || '';
        const saveRes = await api(`/api/config/${encodeURIComponent(name)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ config: newConfig }),
        });
        if (saveRes.ok) {
          showToast('LLM config saved!', 'success');
        } else {
          showToast(saveRes.error || 'Save failed', 'error');
        }
      } catch (e) {
        showToast('Save failed: ' + e.message, 'error');
      }
    });

  } catch (e) {
    container.innerHTML = `<div class="card"><div class="error-msg">Error: ${escapeHtml(e.message)}</div></div>`;
  }
}

window.loadAgentLLMEditor = loadAgentLLMEditor;
export { loadAgentLLMEditor };
