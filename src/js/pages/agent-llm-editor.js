import { state, t } from '../core/state.js';
import { showToast } from '../components/toast.js';
import { api } from '../core/api.js';
import { escapeHtml } from '../core/utils.js';

// Available models from the LiteLLM proxy
const AVAILABLE_MODELS = [
  { value: 'fast', label: 'Fast (Kimi K2.5 → DeepSeek V4 Flash)' },
  { value: 'think', label: 'Think (DeepSeek V4 Pro → GLM 5.2)' },
  { value: 'code', label: 'Code (Qwen3-Coder → DeepSeek V4 Pro)' },
  { value: 'compress', label: 'Compress (Gemini Flash → MiniMax M2.5)' },
  { value: 'flash', label: 'Flash (Gemini Flash Lite → DeepSeek V4 Flash)' },
  { value: 'heavy', label: 'Heavy (GLM 5.2)' },
];

const AUXILIARY_TASKS = [
  { key: 'coding', label: 'Coding', desc: 'Code generation and review', recommended: 'code' },
  { key: 'compression', label: 'Compression', desc: 'Context summarization', recommended: 'compress' },
  { key: 'vision', label: 'Vision', desc: 'Image analysis', recommended: 'fast' },
  { key: 'web_extract', label: 'Web Extract', desc: 'Web page summarization', recommended: 'compress' },
  { key: 'skills_hub', label: 'Skills Hub', desc: 'Skill discovery', recommended: 'flash' },
  { key: 'monitor', label: 'Monitor', desc: 'Urgency classification', recommended: 'flash' },
  { key: 'background_review', label: 'Background Review', desc: 'Post-turn self-improvement', recommended: 'compress' },
  { key: 'triage_specifier', label: 'Triage Specifier', desc: 'Kanban task specification', recommended: 'think' },
  { key: 'kanban_decomposer', label: 'Kanban Decomposer', desc: 'Task decomposition', recommended: 'think' },
  { key: 'curator', label: 'Curator', desc: 'Skills usage review', recommended: 'compress' },
  { key: 'title_generation', label: 'Title Generation', desc: 'Session title generation', recommended: 'flash' },
];

function renderModelSelect(id, currentValue, includeAuto = true) {
  const options = includeAuto
    ? [{ value: '', label: '— auto (use main model) —' }, ...AVAILABLE_MODELS]
    : AVAILABLE_MODELS;
  return `<select id="${id}" style="flex:1;background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;">
    ${options.map(o => `<option value="${escapeHtml(o.value)}" ${o.value === (currentValue || '') ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}
  </select>`;
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
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
          <label style="min-width:120px;font-size:12px;color:var(--fg);">Default</label>
          <input type="text" id="llm-main-model" value="${escapeHtml(model.default || '')}" style="flex:1;background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;" />
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
          <label style="min-width:120px;font-size:12px;color:var(--fg);">Provider</label>
          <input type="text" id="llm-main-provider" value="${escapeHtml(model.provider || '')}" style="flex:1;background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;" />
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <label style="min-width:120px;font-size:12px;color:var(--fg);">Context Length</label>
          <input type="number" id="llm-main-context" value="${model.context_length || 1000000}" style="flex:1;background:var(--bg-input);color:var(--fg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;" />
        </div>
      </div>

      <div class="card">
        <div class="card-title">🧠 Auxiliary Models</div>
        <p style="font-size:11px;color:var(--fg-muted);margin-bottom:12px;">Select which model handles each auxiliary task. "auto" uses the main model.</p>
        <div id="aux-model-rows">
          ${AUXILIARY_TASKS.map(task => {
            const current = auxiliary[task.key] || {};
            const currentModel = current.model || '';
            return `
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:8px;border-radius:6px;background:var(--bg-inset);">
                <div style="min-width:160px;">
                  <div style="font-size:12px;font-weight:500;color:var(--fg);">${escapeHtml(task.label)}</div>
                  <div style="font-size:10px;color:var(--fg-muted);">${escapeHtml(task.desc)}</div>
                </div>
                ${renderModelSelect(`aux-${task.key}`, currentModel)}
                <span style="font-size:10px;color:var(--fg-muted);min-width:60px;" title="Recommended: ${task.recommended}">💡 ${task.recommended}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;">
          <button class="btn btn-primary" id="llm-save-btn">💾 Save LLM Config</button>
          <button class="btn btn-ghost" id="llm-recommended-btn">🎯 Apply Recommended</button>
        </div>
      </div>
    `;

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
      const baseUrl = 'http://163.192.213.24:4001/v1';
      const apiKey = 'sk-bloquo-litellm-master-2026';

      AUXILIARY_TASKS.forEach(task => {
        const selected = document.getElementById(`aux-${task.key}`).value;
        if (selected) {
          newConfig.auxiliary[task.key] = {
            base_url: baseUrl,
            api_key: apiKey,
            model: selected,
            timeout: task.key === 'web_extract' ? 360 : (task.key === 'curator' || task.key === 'kanban_decomposer' ? 180 : 120),
          };
        } else {
          delete newConfig.auxiliary[task.key];
        }
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

    // Apply recommended
    document.getElementById('llm-recommended-btn').addEventListener('click', () => {
      AUXILIARY_TASKS.forEach(task => {
        const sel = document.getElementById(`aux-${task.key}`);
        if (sel) sel.value = task.recommended;
      });
      showToast('Recommended models applied — click Save to persist', 'info');
    });

  } catch (e) {
    container.innerHTML = `<div class="card"><div class="error-msg">Error: ${escapeHtml(e.message)}</div></div>`;
  }
}

window.loadAgentLLMEditor = loadAgentLLMEditor;
export { loadAgentLLMEditor };
