import { state, t } from '../core/state.js';
import { showToast } from '../components/toast.js';
import { api } from '../core/api.js';
import { escapeHtml } from '../core/utils.js';

// Auxiliary task types (enum - fixed list)
const AUXILIARY_TASKS = [
  { key: 'coding', label: 'Coding', desc: 'Code generation and review' },
  { key: 'compression', label: 'Compression', desc: 'Context summarization' },
  { key: 'vision', label: 'Vision', desc: 'Image analysis' },
  { key: 'web_extract', label: 'Web Extract', desc: 'Web page summarization' },
  { key: 'skills_hub', label: 'Skills Hub', desc: 'Skill discovery' },
  { key: 'monitor', label: 'Monitor', desc: 'Urgency classification' },
  { key: 'background_review', label: 'Background Review', desc: 'Post-turn self-improvement' },
  { key: 'triage_specifier', label: 'Triage Specifier', desc: 'Kanban task specification' },
  { key: 'kanban_decomposer', label: 'Kanban Decomposer', desc: 'Task decomposition' },
  { key: 'curator', label: 'Curator', desc: 'Skills usage review' },
  { key: 'title_generation', label: 'Title Generation', desc: 'Session title generation' },
];

function renderAuxRow(task, current) {
  const baseUrl = current.base_url || '';
  const model = current.model || '';
  const apiKey = current.api_key || '';
  const timeout = current.timeout || 120;
  const enabled = !!model;

  return `
    <div class="aux-row" style="margin-bottom:12px;padding:10px;border-radius:8px;background:var(--bg-inset);border:1px solid var(--border);" data-task="${task.key}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <span style="font-size:12px;font-weight:600;color:var(--fg);">${escapeHtml(task.label)}</span>
          <span style="font-size:10px;color:var(--fg-muted);margin-left:8px;">${escapeHtml(task.desc)}</span>
        </div>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" class="aux-enabled" data-task="${task.key}" ${enabled ? 'checked' : ''} style="width:14px;height:14px;accent-color:var(--gold);cursor:pointer;" />
          <span style="font-size:11px;color:var(--fg-muted);">enabled</span>
        </label>
      </div>
      <div class="aux-fields" style="${enabled ? '' : 'opacity:0.4;pointer-events:none;'}display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--fg-muted);">Base URL</label>
          <input type="text" class="aux-base-url" data-task="${task.key}" value="${escapeHtml(baseUrl)}" placeholder="http://host:port/v1" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;font-family:var(--font-mono, monospace);" />
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--fg-muted);">Model Function</label>
          <select class="aux-model" data-task="${task.key}" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;">
            <option value="" ${!model ? 'selected' : ''}>— select —</option>
            <option value="fast" ${model === 'fast' ? 'selected' : ''}>fast (chat, quick responses)</option>
            <option value="think" ${model === 'think' ? 'selected' : ''}>think (reasoning, analysis)</option>
            <option value="code" ${model === 'code' ? 'selected' : ''}>code (code gen/review)</option>
            <option value="compress" ${model === 'compress' ? 'selected' : ''}>compress (summarization)</option>
            <option value="flash" ${model === 'flash' ? 'selected' : ''}>flash (ultra fast, cheap)</option>
            <option value="heavy" ${model === 'heavy' ? 'selected' : ''}>heavy (complex tasks)</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--fg-muted);">API Key</label>
          <input type="password" class="aux-api-key" data-task="${task.key}" value="${escapeHtml(apiKey)}" placeholder="(optional)" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;font-family:var(--font-mono, monospace);" />
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:var(--fg-muted);">Timeout (s)</label>
          <input type="number" class="aux-timeout" data-task="${task.key}" value="${timeout}" style="background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;" />
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
          <button class="btn btn-ghost btn-sm" id="llm-fill-all-btn" title="Fill all with same base_url and api_key">📋 Fill All From First</button>
        </div>
        <div id="aux-model-rows">
          ${AUXILIARY_TASKS.map(task => renderAuxRow(task, auxiliary[task.key] || {})).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;">
          <button class="btn btn-primary" id="llm-save-btn">💾 Save LLM Config</button>
        </div>
      </div>
    `;

    // Enable/disable toggle
    container.addEventListener('change', (e) => {
      if (e.target.classList.contains('aux-enabled')) {
        const task = e.target.dataset.task;
        const fields = container.querySelector(`.aux-row[data-task="${task}"] .aux-fields`);
        if (fields) {
          fields.style.opacity = e.target.checked ? '1' : '0.4';
          fields.style.pointerEvents = e.target.checked ? '' : 'none';
        }
      }
    });

    // Fill all from first
    document.getElementById('llm-fill-all-btn').addEventListener('click', () => {
      const firstUrl = container.querySelector('.aux-base-url')?.value || '';
      const firstKey = container.querySelector('.aux-api-key')?.value || '';
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

      // Update auxiliary
      if (!newConfig.auxiliary) newConfig.auxiliary = {};

      AUXILIARY_TASKS.forEach(task => {
        const enabled = container.querySelector(`.aux-enabled[data-task="${task.key}"]`)?.checked;
        if (!enabled) {
          delete newConfig.auxiliary[task.key];
          return;
        }
        const baseUrl = container.querySelector(`.aux-base-url[data-task="${task.key}"]`)?.value || '';
        const modelId = container.querySelector(`.aux-model[data-task="${task.key}"]`)?.value || '';
        const apiKey = container.querySelector(`.aux-api-key[data-task="${task.key}"]`)?.value || '';
        const timeout = parseInt(container.querySelector(`.aux-timeout[data-task="${task.key}"]`)?.value) || 120;

        const entry = { model: modelId, timeout };
        if (baseUrl) entry.base_url = baseUrl;
        if (apiKey) entry.api_key = apiKey;
        newConfig.auxiliary[task.key] = entry;
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
