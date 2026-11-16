// ===== GEMINI_NEKO_HUD_BEGIN =====
(function () {
  try {
    if (window.top !== window || globalThis.__GEMINI_NEKO_PRELOAD_HUD__) return;
    globalThis.__GEMINI_NEKO_PRELOAD_HUD__ = true;

    const { ipcRenderer } = require('electron');

    const IDS = {
      style: 'gemini-neko-hud-style',
      stats: 'gemini-neko-stats-bar',
      modal: 'gemini-neko-observer-modal'
    };

    const CSS = `
/* Antigravity Observer In-Window HUD */
#${IDS.stats} {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 6px 9px;
  width: fit-content;
  max-width: calc(100% - 12px);
  height: 15px;
  min-height: 15px;
  margin: 0 auto -5px;
  padding: 0 7px;
  font-size: 10.5px;
  line-height: 14px;
  white-space: nowrap;
  overflow: hidden;
  color: var(--muted-foreground, #8e929b);
  user-select: none;
  cursor: pointer;
  border-radius: 999px;
  transition: background 0.16s ease, color 0.16s ease;
  -webkit-app-region: no-drag;
}
#${IDS.stats}:hover {
  color: var(--foreground, #e5e7eb);
  background: color-mix(in srgb, var(--foreground, #888) 7%, transparent);
}
#${IDS.stats} .gn-seg {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  flex-shrink: 0;
}
#${IDS.stats} .gn-ico {
  width: 11px;
  height: 11px;
  opacity: 0.78;
  flex-shrink: 0;
}
#${IDS.stats} .gn-dot-sep {
  opacity: 0.45;
  margin: 0 1px;
}
#${IDS.stats} .gn-compact-pill {
  font-size: 9.5px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.16);
  color: #f59e0b;
  font-weight: 600;
}

.gn-bar-row {
  margin-bottom: 6px;
}
.gn-bar-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 3px;
}
.gn-bar-track {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--foreground, #fff) 10%, transparent);
  overflow: hidden;
}
.gn-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}
.gn-kv-k {
  font-size: 10px;
  color: var(--muted-foreground, #94a3b8);
}
.gn-kv-v {
  font-size: 12px;
  font-weight: 700;
  margin-top: 1px;
  font-variant-numeric: tabular-nums;
}
.gn-chip {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  border: 1px solid color-mix(in srgb, var(--border, #ffffff24) 90%, transparent);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.gn-chip.is-active {
  background: #7c3aed;
  color: #fff;
  border-color: #7c3aed;
}

/* Full Context Observation Modal (反重力上下文观察窗口) */
#${IDS.modal} {
  position: fixed;
  inset: 0;
  z-index: 2147483100;
  background: rgba(9, 11, 20, 0.62);
  backdrop-filter: blur(6px);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  -webkit-app-region: no-drag;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
#${IDS.modal}.is-open {
  display: flex;
}
#${IDS.modal} * {
  box-sizing: border-box;
  -webkit-app-region: no-drag;
}
.gn-modal-card {
  width: min(760px, 95vw);
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: color-mix(in srgb, var(--card, #141722) 98%, #0f172a);
  color: var(--foreground, #f8fafc);
  border: 1px solid rgba(139, 92, 246, 0.35);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.52);
  overflow: hidden;
  pointer-events: auto;
}
.gn-modal-head {
  flex-shrink: 0;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--border, #ffffff18) 85%, transparent);
}
#gn-conv-select option {
  background: var(--card, #181a24);
  color: var(--foreground, #f8fafc);
}
.gn-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 18px 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: block;
}
.gn-modal-body > * + * {
  margin-top: 12px;
}
.gn-stat-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 640px) {
  .gn-stat-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.gn-box {
  padding: 11px 13px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--foreground, #fff) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--border, #ffffff15) 90%, transparent);
}
.gn-box-title {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.gn-row-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  padding: 3px 0;
}
.gn-mono {
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
`;

    // ---- Formatting helpers ----
    function fmtTok(n) {
      const v = Number(n) || 0;
      if (v <= 0) return '0';
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2).replace(/\.0+$/, '')}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
      return String(Math.round(v));
    }

    function fmtResetCountdown(isoOrMs) {
      const ms = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs || '');
      if (!ms || !Number.isFinite(ms)) return '';
      const diff = Math.max(0, ms - Date.now());
      if (diff <= 0) return '即将重置';
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) return `${days}天${hrs % 24}小时后重置`;
      if (hrs > 0) return `${hrs}小时${mins % 60}分后重置`;
      return `${Math.max(1, mins)}分钟后重置`;
    }

    function esc(s) {
      return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function pctColor(pct, invertForRemaining = false) {
      const val = Number(pct) || 0;
      if (invertForRemaining) {
        if (val <= 15) return '#ef4444';
        if (val <= 35) return '#f59e0b';
        return '#10b981';
      }
      if (val >= 90) return '#ef4444';
      if (val >= 78) return '#f97316';
      if (val >= 62) return '#eab308';
      return '#10b981';
    }

    function isVisibleEl(el) {
      if (!el) return false;
      if (el.isConnected === false) return false;
      if (typeof el.hasAttribute === 'function' && el.hasAttribute('hidden')) return false;
      if (typeof el.getAttribute === 'function' && el.getAttribute('aria-hidden') === 'true') return false;
      if (typeof el.closest === 'function' && el.closest('[hidden], [aria-hidden="true"]')) return false;
      if (typeof el.getClientRects === 'function' && el.getClientRects().length === 0) return false;
      if (typeof window.getComputedStyle === 'function') {
        try {
          const st = window.getComputedStyle(el);
          if (st && (st.display === 'none' || st.visibility === 'hidden')) return false;
        } catch {}
      }
      return true;
    }

    function queryVisibleAll(selector, root) {
      const scope = root || document;
      if (typeof scope.querySelectorAll === 'function') {
        return Array.from(scope.querySelectorAll(selector)).filter((el) => isVisibleEl(el));
      }
      if (typeof scope.querySelector === 'function') {
        const single = scope.querySelector(selector);
        return single && isVisibleEl(single) ? [single] : [];
      }
      return [];
    }

    function findVisibleEl(selector, root) {
      const list = queryVisibleAll(selector, root);
      return list.length > 0 ? list[0] : null;
    }

    function detectActiveConvId() {
      const locPath = (window.location && window.location.pathname) ? String(window.location.pathname) : '';
      const locHash = (window.location && window.location.hash) ? String(window.location.hash) : '';
      const urlMatch = (`${locPath} ${locHash}`).match(/\/c\/([0-9a-f-]{8,})/i);
      const urlConvId = urlMatch ? urlMatch[1].toLowerCase() : '';
      const docTitle = typeof document.title === 'string' ? document.title.trim() : '';

      const visibleViews = queryVisibleAll('[data-testid="conversation-view"]');
      let activeView = null;
      if (visibleViews.length > 0) {
        activeView = (urlConvId && visibleViews.find((v) => (v.getAttribute('data-cascade-id') || '').trim().toLowerCase() === urlConvId))
          || visibleViews[visibleViews.length - 1];
      }

      if (activeView) {
        const attr = (activeView.getAttribute('data-cascade-id') || '').trim();
        if (!attr || attr === 'conversation') return '';
        if (/^[0-9a-f-]{8,}$/i.test(attr)) {
          const domId = attr.toLowerCase();
          if (!urlConvId && locPath) {
            const hasViewMsg = queryVisibleAll('[data-testid="user-input-step"], [data-testid="planner-response-text"]', activeView).length > 0;
            if (!hasViewMsg && (!docTitle || docTitle === 'Antigravity')) {
              return '';
            }
          }
          return domId;
        }
      }

      const hasAnyVisibleMsg = queryVisibleAll('[data-testid="user-input-step"], [data-testid="planner-response-text"]').length > 0;
      const inputBox = findVisibleEl('[data-testid="agent-input-box"]') || document.querySelector('[data-testid="agent-input-box"]');
      const ancestor = inputBox && typeof inputBox.closest === 'function' ? inputBox.closest('[data-cascade-id]') : null;
      if (ancestor && isVisibleEl(ancestor)) {
        const a = (ancestor.getAttribute('data-cascade-id') || '').trim();
        if (!a || a === 'conversation') return '';
        if (/^[0-9a-f-]{8,}$/i.test(a)) {
          if (!urlConvId && locPath && !hasAnyVisibleMsg && (!docTitle || docTitle === 'Antigravity')) {
            return '';
          }
          return a.toLowerCase();
        }
      }

      if (visibleViews.length === 0 && !hasAnyVisibleMsg && (!docTitle || docTitle === 'Antigravity')) {
        return '';
      }

      return urlConvId;
    }

    function detectDomBusy() {
      return Boolean(document.querySelector('[data-tooltip-id="input-send-button-cancel-tooltip"]'));
    }

    function injectStyles() {
      if (document.getElementById(IDS.style)) return;
      const st = document.createElement('style');
      st.id = IDS.style;
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    }

    // ---- HUD State ----
    const hud = {
      activeConvId: '__init__',
      refreshSeq: 0,
      state: null,
      modalOpen: false,
      modalConvId: '',
      modalBreakdown: null,
      modalConvList: [],
      pollTimer: null
    };

    function syncActiveConversation() {
      const nextId = detectActiveConvId();
      if (nextId === hud.activeConvId) return false;
      const prevId = hud.activeConvId;
      hud.activeConvId = nextId;
      hud.refreshSeq += 1;
      if (hud.state) {
        hud.state = { ...hud.state, conv: null };
      }
      hud.modalConvId = nextId;
      hud.modalBreakdown = null;
      updateStatsBar();
      if (hud.modalOpen) renderObserverModal();
      if (prevId !== '__init__') {
        refreshTelemetry(true);
      }
      return true;
    }

    // ---- Component A: Input Stats Bar ----
    function mountStatsBarOnly() {
      const inputBox = findVisibleEl('[data-testid="agent-input-box"]') || document.querySelector('[data-testid="agent-input-box"]');
      if (!inputBox || !inputBox.parentElement) return false;
      let bar = document.getElementById(IDS.stats);
      if (!bar) {
        bar = document.createElement('div');
        bar.id = IDS.stats;
        bar.title = '点击打开反重力上下文观察窗口';
        bar.addEventListener('click', (e) => {
          e.stopPropagation();
          openObserverModal();
        });
        inputBox.insertAdjacentElement('afterend', bar);
        return true;
      }
      if (bar.previousElementSibling !== inputBox) {
        inputBox.insertAdjacentElement('afterend', bar);
        return true;
      }
      return false;
    }

    function ensureStatsBar() {
      const created = mountStatsBarOnly();
      if (created || document.getElementById(IDS.stats)) {
        updateStatsBar();
      }
    }

    function updateStatsBar() {
      const bar = document.getElementById(IDS.stats);
      if (!bar) return;
      const conv = hud.state && hud.state.conv;
      const r = 5;
      const c = 2 * Math.PI * r;
      if (!conv) {
        const emptyHtml = `
          <span class="gn-seg">
            <svg class="gn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 14l4-4"/><circle cx="12" cy="14" r="1.5"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
            <span>0 轮 0 步</span>
          </span>
          <span class="gn-seg">
            <svg class="gn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>
            <span>0 tok</span>
            <span class="gn-dot-sep">·</span>
            <span>新对话</span>
          </span>
          <span class="gn-seg">
            <svg class="gn-ico" viewBox="0 0 16 16" style="width:11px;height:11px;">
              <circle cx="8" cy="8" r="${r}" fill="none" stroke="currentColor" stroke-opacity="0.24" stroke-width="2.2"/>
            </svg>
            <span>0%</span>
          </span>
        `;
        const emptyTip = '当前为新对话或暂无会话记录\n点击打开上下文观察窗口';
        if (bar.title !== emptyTip) bar.title = emptyTip;
        if (bar.innerHTML !== emptyHtml) bar.innerHTML = emptyHtml;
        return;
      }
      const rounds = conv.rounds || 0;
      const steps = conv.steps || 0;
      const speed = conv.tokPerSec > 0 ? `${conv.tokPerSec} tok/s` : '— tok/s';
      const totalStr = `${fmtTok(conv.totalTokens)} tok`;
      const hitStr = (conv.cacheHitPct !== null && conv.cacheHitPct !== undefined) ? `${conv.cacheHitPct}%` : '—';
      const ctxPct = conv.contextPct !== null && conv.contextPct !== undefined ? Math.round(conv.contextPct) : null;
      const ringColor = ctxPct !== null ? pctColor(ctxPct, false) : '#94a3b8';
      const fill = ctxPct !== null ? Math.max(0.04, Math.min(1, ctxPct / 100)) * c : 0;

      const tip = [
        `模型: ${conv.modelLabel || '未知'}`,
        `上下文: ${fmtTok(conv.contextTokens)} / ${conv.contextMaxTokens ? fmtTok(conv.contextMaxTokens) : '?'} (${conv.contextPct ?? '?'}%)`,
        `总用量: 新输入 ${fmtTok(conv.inputTokens)} · 缓存读取 ${fmtTok(conv.cacheReadTokens)} · 输出 ${fmtTok(conv.outputTokens)}`,
        conv.ttftMs ? `首字延迟 TTFT: ${(conv.ttftMs / 1000).toFixed(2)}s` : '',
        '点击打开上下文观察窗口'
      ].filter(Boolean).join('\n');
      if (bar.title !== tip) bar.title = tip;

      const nextHtml = `
        <span class="gn-seg">
          <svg class="gn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 14l4-4"/><circle cx="12" cy="14" r="1.5"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
          <span>${rounds} 轮 ${steps} 步</span>
          <span class="gn-dot-sep">·</span>
          <span>${speed}</span>
        </span>
        <span class="gn-seg">
          <svg class="gn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>
          <span>${totalStr}</span>
          <span class="gn-dot-sep">·</span>
          <span>缓存命中 ${hitStr}</span>
        </span>
        <span class="gn-seg">
          <svg class="gn-ico" viewBox="0 0 16 16" style="width:11px;height:11px;">
            <circle cx="8" cy="8" r="${r}" fill="none" stroke="currentColor" stroke-opacity="0.24" stroke-width="2.2"/>
            ${ctxPct !== null ? `<circle cx="8" cy="8" r="${r}" fill="none" stroke="${ringColor}" stroke-width="2.2" stroke-dasharray="${fill.toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 8 8)" stroke-linecap="round"/>` : ''}
          </svg>
          <span style="color:${ringColor};font-weight:600;">${ctxPct !== null ? ctxPct + '%' : fmtTok(conv.contextTokens)}</span>
          ${conv.compactions > 0 ? `<span class="gn-compact-pill">压缩 ${conv.compactions}次</span>` : ''}
        </span>
      `;
      if (bar.innerHTML !== nextHtml) bar.innerHTML = nextHtml;
    }

    // ---- Component B: In-Window Context Observer Modal ----
    function ensureObserverModal() {
      let modal = document.getElementById(IDS.modal);
      if (modal || !document.body) return modal;
      modal = document.createElement('div');
      modal.id = IDS.modal;
      modal.innerHTML = `
        <div class="gn-modal-card">
          <div class="gn-modal-head">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
              <span style="font-size:15px;font-weight:800;white-space:nowrap;">✦ 反重力上下文观察窗口</span>
              <select id="gn-conv-select" style="max-width:300px;padding:4px 8px;border-radius:8px;border:1px solid rgba(148,163,184,.35);background:transparent;color:inherit;font-size:12px;"></select>
            </div>
            <button type="button" class="gn-chip" data-gn-close-modal="1" style="font-size:14px;padding:4px 10px;">关闭 ×</button>
          </div>
          <div class="gn-modal-body" id="gn-modal-body"></div>
        </div>
      `;
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('[data-gn-close-modal]')) {
          closeObserverModal();
        }
      });
      modal.addEventListener('change', (e) => {
        const sel = e.target.closest('#gn-conv-select');
        if (sel) {
          hud.modalConvId = sel.value || '';
          if (hud.modalConvId) {
            loadObserverBreakdown(hud.modalConvId);
          } else {
            hud.modalBreakdown = null;
            renderObserverModal();
          }
        }
      });
      document.body.appendChild(modal);
      return modal;
    }

    async function loadObserverBreakdown(convId) {
      if (!convId) {
        hud.modalBreakdown = null;
        renderObserverModal();
        return;
      }
      hud.modalBreakdown = null;
      renderObserverModal();
      try {
        const bd = await ipcRenderer.invoke('neko-hud:get-breakdown', convId);
        if (hud.modalConvId === convId) {
          hud.modalBreakdown = bd;
        }
      } catch {}
      renderObserverModal();
    }

    async function openObserverModal() {
      const modal = ensureObserverModal();
      if (!modal) return;
      syncActiveConversation();
      hud.modalOpen = true;
      modal.classList.add('is-open');
      const activeId = detectActiveConvId();
      hud.modalConvId = activeId;
      hud.modalBreakdown = null;
      renderObserverModal();
      try {
        const [list] = await Promise.all([
          ipcRenderer.invoke('neko-hud:list-conversations').catch(() => []),
          refreshTelemetry(true)
        ]);
        hud.modalConvList = Array.isArray(list) ? list : [];
      } catch {}
      const latestId = detectActiveConvId();
      if (!hud.modalConvId || hud.modalConvId === latestId) {
        hud.modalConvId = latestId;
      }
      if (hud.modalConvId) {
        await loadObserverBreakdown(hud.modalConvId);
      } else {
        renderObserverModal();
      }
    }

    function closeObserverModal() {
      hud.modalOpen = false;
      const modal = document.getElementById(IDS.modal);
      if (modal) modal.classList.remove('is-open');
    }

    function renderObserverModal() {
      const modal = document.getElementById(IDS.modal);
      if (!modal || !hud.modalOpen) return;
      const stateConv = hud.state && hud.state.conv;
      const modalConv = (stateConv && hud.modalConvId && String(stateConv.id || '').toLowerCase() === String(hud.modalConvId).toLowerCase())
        ? stateConv
        : null;
      const bd = (hud.modalBreakdown && (!hud.modalConvId || !hud.modalBreakdown.id || String(hud.modalBreakdown.id).toLowerCase() === String(hud.modalConvId).toLowerCase()))
        ? hud.modalBreakdown
        : null;
      const quota = hud.state && hud.state.quota;
      const groups = (quota && Array.isArray(quota.groups)) ? quota.groups : [];

      const curTok = (bd && bd.currentTokens) || (modalConv && modalConv.contextTokens) || 0;
      const maxTok = (bd && bd.observedCeiling) || (modalConv && modalConv.contextMaxTokens) || 0;
      const pct = maxTok > 0 ? Math.min(100, Math.round((curTok / maxTok) * 1000) / 10) : 0;
      const srvGroups = (bd && bd.serverTokenBreakdown && bd.serverTokenBreakdown.groups) || (modalConv && modalConv.tokenBreakdown && modalConv.tokenBreakdown.groups) || [];
      const cats = (bd && Array.isArray(bd.categories)) ? bd.categories : [];
      const skills = (bd && Array.isArray(bd.activeSkills)) ? bd.activeSkills : [];
      const heavy = (bd && Array.isArray(bd.heaviestSteps)) ? bd.heaviestSteps : [];
      const topFiles = (bd && Array.isArray(bd.topFiles)) ? bd.topFiles : [];
      const hasExactMatch = Boolean(hud.modalConvId && hud.modalConvList.some((c) => c.id === hud.modalConvId));
      const convOptsList = [];
      if (!hud.modalConvId) {
        convOptsList.push(`<option value="" selected>当前新对话 (暂无会话记录)</option>`);
      } else if (!hasExactMatch) {
        convOptsList.push(`<option value="${esc(hud.modalConvId)}" selected>${esc((modalConv && modalConv.title) || '当前对话 (' + hud.modalConvId.slice(0, 8) + ')')}</option>`);
      }
      for (const c of hud.modalConvList) {
        convOptsList.push(`<option value="${esc(c.id)}" ${c.id === hud.modalConvId ? 'selected' : ''}>${esc(c.title)} (${c.rounds}轮 ${c.steps}步${c.contextPct !== null ? ' · ' + c.contextPct + '%' : ''})</option>`);
      }
      const convOpts = convOptsList.join('');

      const selEl = modal.querySelector('#gn-conv-select');
      const bodyEl = modal.querySelector('.gn-modal-body');
      if (selEl) {
        if (selEl.__gnOptsHtml !== convOpts) {
          selEl.__gnOptsHtml = convOpts;
          selEl.innerHTML = convOpts;
        }
        if (selEl.value !== (hud.modalConvId || '')) {
          selEl.value = hud.modalConvId || '';
        }
      }

      const rawHit = (bd && bd.cacheHitPct !== undefined) ? bd.cacheHitPct : (modalConv ? modalConv.cacheHitPct : null);
      const hitText = rawHit !== null && rawHit !== undefined ? `${rawHit}%` : '—';

      const bodyHtml = `
        <div class="gn-stat-cards">
          <div class="gn-box">
            <div class="gn-kv-k">轮次 / 步数</div>
            <div class="gn-kv-v gn-mono" style="font-size:15px;">${(bd && bd.rounds) ?? (modalConv && modalConv.rounds) ?? 0} 轮 ${(bd && bd.steps) ?? (modalConv && modalConv.steps) ?? 0} 步</div>
          </div>
          <div class="gn-box">
            <div class="gn-kv-k">上下文占用</div>
            <div class="gn-kv-v gn-mono" style="font-size:15px;color:${pctColor(pct, false)};">${fmtTok(curTok)} / ${maxTok ? fmtTok(maxTok) : '?'} (${pct}%)</div>
          </div>
          <div class="gn-box">
            <div class="gn-kv-k">精准缓存命中率</div>
            <div class="gn-kv-v gn-mono" style="font-size:15px;color:#38bdf8;">${hitText}</div>
          </div>
          <div class="gn-box">
            <div class="gn-kv-k">实时生成速度</div>
            <div class="gn-kv-v gn-mono" style="font-size:15px;">${((bd && bd.tokPerSec) || (modalConv && modalConv.tokPerSec) || 0)} tok/s</div>
          </div>
        </div>

        ${srvGroups.length > 0 ? `
          <div class="gn-box">
            <div class="gn-box-title"><span>🧠 服务端上下文精准构成 (Language Server)</span><span class="gn-mono">${fmtTok(curTok)} tok</span></div>
            ${srvGroups.map((g) => {
              const gp = curTok > 0 ? Math.min(100, Math.round((g.numTokens / curTok) * 1000) / 10) : 0;
              return `
                <div class="gn-bar-row">
                  <div class="gn-bar-meta"><span>${esc(g.name)}</span><span class="gn-mono">${fmtTok(g.numTokens)} tok (${gp}%)</span></div>
                  <div class="gn-bar-track"><div class="gn-bar-fill" style="width:${Math.max(2, gp)}%;background:#8b5cf6;"></div></div>
                </div>`;
            }).join('')}
          </div>
        ` : ''}

        ${groups.length > 0 ? `
          <div class="gn-box">
            <div class="gn-box-title"><span>⚡ 模型额度与重置时间</span><span style="font-size:11px;opacity:.75;">${esc((modalConv && modalConv.modelLabel) || '')}</span></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
              ${groups.map((g) => `
                <div style="padding:8px;border-radius:8px;background:rgba(148,163,184,.08);">
                  <div style="font-size:11.5px;font-weight:700;margin-bottom:5px;">${esc(g.label)}</div>
                  ${(g.buckets || []).map((b) => {
                    const rem = b.remainingPct ?? 0;
                    const col = pctColor(rem, true);
                    return `
                      <div class="gn-bar-row">
                        <div class="gn-bar-meta"><span>${esc(b.windowLabel)}</span><span class="gn-mono" style="color:${col};">${rem}%</span></div>
                        <div class="gn-bar-track"><div class="gn-bar-fill" style="width:${Math.max(2, rem)}%;background:${col};"></div></div>
                        <div style="font-size:9.5px;opacity:.6;text-align:right;">${esc(fmtResetCountdown(b.resetAtIso || b.resetAtMs))}</div>
                      </div>`;
                  }).join('')}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">
          <div class="gn-box">
            <div class="gn-box-title"><span>🛠 活跃窗口工具消耗</span></div>
            ${cats.length > 0 ? cats.map((c) => `
              <div class="gn-row-line">
                <span>${esc(c.label)} (${c.count})</span>
                <span class="gn-mono" style="opacity:.85;">~${fmtTok(c.estTokens)} tok</span>
              </div>
            `).join('') : '<div style="font-size:11.5px;opacity:.6;">等待 sidecar 详细拆解或暂无工具调用</div>'}
          </div>

          <div class="gn-box">
            <div class="gn-box-title"><span>📚 已加载技能与压缩状态</span><span>压缩 ${(bd && bd.compactCount) ?? (modalConv && modalConv.compactions) ?? 0} 次</span></div>
            ${skills.length > 0 ? skills.map((s) => `
              <div class="gn-row-line"><span>${esc(s.name)}</span><span class="gn-mono">~${fmtTok(s.estTokens)} tok</span></div>
            `).join('') : '<div style="font-size:11.5px;opacity:.6;">当前窗口未额外加载 SKILL.md</div>'}
          </div>
        </div>

        ${heavy.length > 0 ? `
          <div class="gn-box">
            <div class="gn-box-title"><span>🏋 最重步骤 Top 5</span></div>
            ${heavy.map((s, i) => `
              <div class="gn-row-line">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">#${i + 1} [${esc(s.tool)}] ${esc(s.target)}</span>
                <span class="gn-mono" style="flex-shrink:0;">~${fmtTok(s.estTokens)} tok</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${topFiles.length > 0 ? `
          <div class="gn-box">
            <div class="gn-box-title"><span>📄 高频读写文件</span></div>
            ${topFiles.map((f) => `
              <div class="gn-row-line">
                <span class="gn-mono" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(f.label)} (读${f.readCount}/写${f.editCount})</span>
                <span class="gn-mono" style="flex-shrink:0;">~${fmtTok(f.estTokens)} tok</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="font-size:11px;opacity:.68;display:flex;justify-content:space-between;align-items:center;">
          <span>提示：也可在右上角扩展 / Sidecar 面板打开完整「反重力观察窗」侧栏（按 Esc 关闭本窗口）。</span>
          <span class="gn-mono">总输入 ${fmtTok((bd && bd.totalInputTokens) ?? (modalConv && modalConv.inputTokens) ?? 0)} · 缓存 ${fmtTok((bd && bd.totalCacheReadTokens) ?? (modalConv && modalConv.cacheReadTokens) ?? 0)} · 输出 ${fmtTok((bd && bd.totalOutputTokens) ?? (modalConv && modalConv.outputTokens) ?? 0)}</span>
        </div>
      `;

      if (bodyEl && bodyEl.__gnBodyHtml !== bodyHtml) {
        const prevScrollTop = bodyEl.scrollTop || 0;
        bodyEl.__gnBodyHtml = bodyHtml;
        bodyEl.innerHTML = bodyHtml;
        bodyEl.scrollTop = prevScrollTop;
      }
    }

    // ---- Telemetry Loop ----
    let refreshInFlight = false;
    async function refreshTelemetry(force = false) {
      syncActiveConversation();
      if (refreshInFlight && !force) return;
      refreshInFlight = true;
      const reqConvId = detectActiveConvId();
      const reqSeq = hud.refreshSeq;
      try {
        const data = await ipcRenderer.invoke('neko-hud:get-state', reqConvId, force);
        if (reqSeq !== hud.refreshSeq || detectActiveConvId() !== reqConvId) {
          return;
        }
        if (data && data.ok) {
          if (reqConvId) {
            if (data.conv && data.conv.id && String(data.conv.id).toLowerCase() !== reqConvId) {
              data.conv = null;
            }
          } else {
            data.conv = null;
          }
          hud.state = data;
          ensureStatsBar();
          if (hud.modalOpen) renderObserverModal();
        }
      } catch {} finally {
        refreshInFlight = false;
      }
    }

    async function bootHud() {
      const startDom = () => {
        if (!document.body) return;
        const legacyPet = document.getElementById('gemini-neko-pet-root');
        if (legacyPet) legacyPet.remove();
        syncActiveConversation();
        injectStyles();
        ensureStatsBar();
        refreshTelemetry(true);

        let rafScheduled = false;
        const obs = new MutationObserver(() => {
          if (rafScheduled) return;
          rafScheduled = true;
          requestAnimationFrame(() => {
            rafScheduled = false;
            syncActiveConversation();
            if (mountStatsBarOnly()) updateStatsBar();
          });
        });
        obs.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-cascade-id', 'hidden', 'aria-hidden']
        });

        const scheduleNavSync = () => {
          syncActiveConversation();
          setTimeout(syncActiveConversation, 25);
          setTimeout(syncActiveConversation, 110);
          setTimeout(syncActiveConversation, 260);
        };

        window.addEventListener('popstate', scheduleNavSync);
        window.addEventListener('hashchange', scheduleNavSync);
        document.addEventListener('click', (e) => {
          const modalEl = document.getElementById(IDS.modal);
          if (modalEl && modalEl.contains(e.target)) {
            return;
          }
          if (e.target && typeof e.target.closest === 'function') {
            if (e.target.closest('[data-testid="new-conversation-button"], [data-testid="conversation-row-sidebar"], [data-testid="project-group"], a[href="/"], a[href^="/c/"], button')) {
              scheduleNavSync();
            }
          }
        }, true);
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && hud.modalOpen) {
            closeObserverModal();
            return;
          }
          if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'O' || e.key === 'o')) {
            scheduleNavSync();
          }
        }, true);

        let pollTick = 0;
        hud.pollTimer = setInterval(() => {
          pollTick += 1;
          const switched = syncActiveConversation();
          if (mountStatsBarOnly()) updateStatsBar();
          if (!switched && pollTick % 6 === 0) {
            const busy = detectDomBusy() || Boolean(hud.state && hud.state.conv && hud.state.conv.isThinking);
            refreshTelemetry(busy);
          }
        }, 250);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startDom, { once: true });
      } else {
        startDom();
      }
    }

    bootHud();
  } catch (err) {
    try { console.error('[Gemini-Neko-HUD] preload error:', err); } catch {}
  }
})();
// ===== GEMINI_NEKO_HUD_END =====
