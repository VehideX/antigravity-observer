// ===== GEMINI_NEKO_HUD_BEGIN =====
(function () {
  try {
    if (window.top !== window || globalThis.__GEMINI_NEKO_PRELOAD_HUD__) return;
    globalThis.__GEMINI_NEKO_PRELOAD_HUD__ = true;

    const { ipcRenderer } = require('electron');

    const IDS = {
      style: 'gemini-neko-hud-style',
      stats: 'gemini-neko-stats-bar',
      petRoot: 'gemini-neko-pet-root',
      modal: 'gemini-neko-observer-modal'
    };

    const PAT_CURSOR_SVG = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M12.5 4.2c-.9 0-1.6.7-1.6 1.6v6.7l-.9-.9c-.7-.7-1.8-.7-2.4 0-.7.7-.6 1.8.1 2.4l4.1 4.2c1.1 1.1 2.5 1.8 4.1 1.8h2.6c2.7 0 4.9-2.2 4.9-4.9V9.8c0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5v1.6h-.5V7.1c0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5v3.6h-.5V5.8c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6v4.9h-.5V5.8c0-.9-.7-1.6-1.6-1.6z" fill="#fff" stroke="#3b2d5e" stroke-width="1.5" stroke-linejoin="round"/></svg>`
    );

    const CSS = `
/* Gemini Neko Cockpit In-Window HUD */
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

/* Corner Gemini Neko Widget */
#${IDS.petRoot} {
  position: fixed;
  z-index: 2147482800;
  user-select: none;
  -webkit-user-drag: none;
  -webkit-app-region: no-drag;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
#${IDS.petRoot} * {
  box-sizing: border-box;
  -webkit-app-region: no-drag;
}
#${IDS.petRoot} .gn-stage {
  position: relative;
  pointer-events: auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
#${IDS.petRoot} .gn-avatar-btn {
  position: relative;
  width: var(--gn-size, 96px);
  height: var(--gn-size, 96px);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: url("data:image/svg+xml,${PAT_CURSOR_SVG}") 14 10, pointer;
  outline: none;
  transform-origin: 50% 92%;
  transition: transform 0.36s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 6px 14px rgba(18, 16, 40, 0.28));
}
#${IDS.petRoot}[data-corner^="top"] .gn-avatar-btn {
  transform-origin: 50% 15%;
}
#${IDS.petRoot} .gn-avatar-btn:hover {
  transform: translateY(-2px) scale(1.03);
}
#${IDS.petRoot} .gn-avatar-btn.is-pressed {
  transform: scale(1.11, 0.84) translateY(7px) !important;
  transition: transform 0.08s ease-out !important;
}
#${IDS.petRoot} .gn-sprite {
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-size: 400% 100%;
  background-position: 0% 0%;
  pointer-events: none;
  animation: gnNekoFloat 4.4s ease-in-out infinite;
}
#${IDS.petRoot}[data-pose="thinking"] .gn-sprite {
  background-position: 33.3333% 0%;
  animation: gnNekoThink 2.4s ease-in-out infinite;
}
#${IDS.petRoot}[data-pose="working"] .gn-sprite {
  background-position: 66.6666% 0%;
  animation: gnNekoWork 1.4s ease-in-out infinite;
}
#${IDS.petRoot}[data-pose="pat"] .gn-sprite {
  background-position: 100% 0%;
  animation: gnNekoPurr 0.45s ease-in-out infinite;
}
@keyframes gnNekoFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(-0.6deg); }
}
@keyframes gnNekoThink {
  0%, 100% { transform: translateY(0px) rotate(-1deg); }
  50% { transform: translateY(-3px) rotate(2deg); }
}
@keyframes gnNekoWork {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-4px) scale(1.02); }
}
@keyframes gnNekoPurr {
  0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
  50% { transform: translateY(-2px) rotate(1.5deg); }
}

/* Floating Heart / Sparkle Particles */
.gn-particle {
  position: fixed;
  z-index: 2147482900;
  pointer-events: none;
  font-size: 14px;
  font-weight: 700;
  animation: gnParticleRise 0.95s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes gnParticleRise {
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.6); }
  20% { opacity: 1; transform: translate(-50%, -10px) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -46px) scale(0.9); }
}

/* Mini Status Ring Badge on Avatar Corner */
#${IDS.petRoot} .gn-mini-badge {
  position: absolute;
  bottom: 3px;
  left: 1px;
  padding: 0px 5px;
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  background: rgba(20, 22, 34, 0.84);
  color: #e2e8f0;
  border: 1px solid rgba(167, 139, 250, 0.45);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

/* Side Floating Pills (... and ≡) */
#${IDS.petRoot} .gn-pills {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 4px;
  top: 24%;
  left: -25px;
  pointer-events: auto;
  z-index: 2;
}
#${IDS.petRoot}[data-corner$="left"] .gn-pills {
  left: auto;
  right: -25px;
}
#${IDS.petRoot} .gn-pill-btn {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 1px solid color-mix(in srgb, var(--border, #ffffff28) 90%, rgba(167, 139, 250, 0.4));
  background: color-mix(in srgb, var(--card, #ffffff) 92%, rgba(235, 232, 255, 0.9));
  color: var(--foreground, #334155);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.22);
  transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease;
}
#${IDS.petRoot} .gn-pill-btn:hover {
  transform: scale(1.08);
  border-color: #8b5cf6;
}
#${IDS.petRoot} .gn-pill-btn.is-active {
  background: #7c3aed;
  color: #fff;
  border-color: #8b5cf6;
}

/* Thought Bubble (喵言喵语) */
#${IDS.petRoot} .gn-bubble-wrap {
  position: absolute;
  bottom: calc(100% + 10px);
  right: 2px;
  width: 204px;
  pointer-events: auto;
  transition: opacity 0.22s ease, transform 0.22s ease;
}
#${IDS.petRoot}[data-corner$="left"] .gn-bubble-wrap {
  right: auto;
  left: 2px;
}
#${IDS.petRoot}[data-corner^="top"] .gn-bubble-wrap {
  bottom: auto;
  top: calc(100% + 10px);
}
#${IDS.petRoot} .gn-bubble-wrap.is-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px) scale(0.96);
}
#${IDS.petRoot} .gn-bubble {
  position: relative;
  padding: 7px 11px 6px;
  border-radius: 999px / 54px;
  background: radial-gradient(circle at 50% 25%, rgba(255, 255, 255, 0.97), rgba(242, 238, 255, 0.95));
  color: #5b21b6;
  border: 1.5px solid rgba(167, 139, 250, 0.48);
  box-shadow: 0 10px 26px rgba(30, 27, 75, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  text-align: center;
}
#${IDS.petRoot} .gn-bubble-head {
  font-size: 10.5px;
  font-weight: 700;
  color: #8b5cf6;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}
#${IDS.petRoot} .gn-bubble-close {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 2px 4px;
}
#${IDS.petRoot} .gn-bubble-close:hover {
  color: #475569;
}
#${IDS.petRoot} .gn-bubble-text {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  color: #6d28d9;
  padding: 0 10px;
  word-break: break-word;
  cursor: pointer;
}
#${IDS.petRoot} .gn-bubble-sub {
  margin-top: 4px;
  font-size: 10px;
  color: #94a3b8;
}
#${IDS.petRoot} .gn-bubble-pager {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  color: #64748b;
}
#${IDS.petRoot} .gn-bubble-pager button {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.85);
  color: #475569;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 0;
}
#${IDS.petRoot} .gn-bubble-pager button:hover {
  border-color: #8b5cf6;
  color: #6d28d9;
}
#${IDS.petRoot} .gn-thought-dots {
  position: absolute;
  right: 48px;
  bottom: -11px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  pointer-events: none;
}
#${IDS.petRoot}[data-corner$="left"] .gn-thought-dots {
  right: auto;
  left: 48px;
  align-items: flex-start;
}
#${IDS.petRoot}[data-corner^="top"] .gn-thought-dots {
  bottom: auto;
  top: -11px;
  flex-direction: column-reverse;
}
#${IDS.petRoot} .gn-thought-dot1 {
  width: 10px;
  height: 7px;
  border-radius: 999px;
  background: rgba(244, 240, 255, 0.95);
  border: 1px solid rgba(167, 139, 250, 0.45);
}
#${IDS.petRoot} .gn-thought-dot2 {
  width: 6px;
  height: 5px;
  border-radius: 999px;
  margin-right: 6px;
  background: rgba(244, 240, 255, 0.9);
  border: 1px solid rgba(167, 139, 250, 0.45);
}

/* Status Card Popover (Quota + Usage + Context) & Quick Menu */
#${IDS.petRoot} .gn-popover {
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  width: 288px;
  max-height: 76vh;
  overflow-y: auto;
  padding: 10px 11px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--card, #181a24) 96%, #141625);
  color: var(--foreground, #eef2ff);
  border: 1px solid rgba(167, 139, 250, 0.36);
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(16px);
  pointer-events: auto;
  display: none;
  z-index: 5;
}
#${IDS.petRoot}[data-corner$="left"] .gn-popover {
  right: auto;
  left: 0;
}
#${IDS.petRoot}[data-corner^="top"] .gn-popover {
  bottom: auto;
  top: calc(100% + 10px);
}
#${IDS.petRoot} .gn-popover.is-open {
  display: block;
}
.gn-pop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 7px;
  border-bottom: 1px solid color-mix(in srgb, var(--border, #ffffff18) 80%, transparent);
}
.gn-pop-title {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.gn-plan-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.22);
  color: #c4b5fd;
  border: 1px solid rgba(139, 92, 246, 0.35);
}
.gn-sec {
  margin-top: 9px;
}
.gn-sec-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted-foreground, #94a3b8);
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.gn-kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.gn-kv {
  padding: 6px 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--foreground, #fff) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--border, #ffffff14) 85%, transparent);
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
.gn-pop-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}
.gn-btn {
  flex: 1;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--border, #ffffff22) 90%, transparent);
  background: color-mix(in srgb, var(--foreground, #fff) 8%, transparent);
  color: var(--foreground, #f1f5f9);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
.gn-btn:hover {
  border-color: #8b5cf6;
}
.gn-btn-primary {
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: #fff;
  border-color: transparent;
}
.gn-menu-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.gn-menu-item {
  width: 100%;
  text-align: left;
  padding: 7px 9px;
  border-radius: 8px;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.gn-menu-item:hover {
  background: rgba(139, 92, 246, 0.16);
}
.gn-chip-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  padding: 4px 2px;
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

/* Full Context Observation Modal (上下文观察窗口) */
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
      prefs: {
        corner: 'bottom-right',
        size: 96,
        opacity: 1,
        showStats: true,
        showBubble: true,
        patCount: 0,
        customPos: null,
        bubbleIndex: 0
      },
      nekoStripDataUrl: '',
      activeConvId: '__init__',
      refreshSeq: 0,
      state: null,
      popoverMode: '', // '' | 'status' | 'menu'
      pattingUntil: 0,
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
      updatePetDisplay();
      if (hud.modalOpen) renderObserverModal();
      if (prevId !== '__init__') {
        refreshTelemetry(true);
      }
      return true;
    }

    function savePrefsPatch(patch) {
      hud.prefs = { ...hud.prefs, ...patch };
      applyPetGeometry();
      updateStatsBar();
      ipcRenderer.invoke('neko-hud:save-prefs', patch).catch(() => {});
    }

    function computePose() {
      if (Date.now() < hud.pattingUntil) return 'pat';
      const conv = hud.state && hud.state.conv;
      const busyDom = detectDomBusy();
      if (conv && conv.waitState) return 'thinking';
      if (busyDom || (conv && conv.isThinking)) {
        const steps = (conv && conv.steps) || 0;
        return steps > 0 && (steps % 2 === 0) ? 'working' : 'thinking';
      }
      return 'idle';
    }

    function buildBubbleMessages() {
      const conv = hud.state && hud.state.conv;
      const quota = hud.state && hud.state.quota;
      const groups = (quota && Array.isArray(quota.groups)) ? quota.groups : [];
      const gemGrp = groups.find((g) => /gemini/i.test(g.label) && !/argon/i.test(g.label)) || groups[0];
      const fiveH = gemGrp && gemGrp.buckets ? gemGrp.buckets.find((b) => b.windowKind === '5h') : null;
      const weekly = gemGrp && gemGrp.buckets ? gemGrp.buckets.find((b) => b.windowKind === 'weekly') : null;

      const qLine = fiveH
        ? `Gemini 5h额度剩 ${fiveH.remainingPct}%${weekly ? ` · 周限 ${weekly.remainingPct}%` : ''} 喵，${fiveH.remainingPct < 25 ? '省着点用哦~' : '状态满满!'}`
        : '正在同步模型额度数据喵~';

      const ctxLine = conv
        ? `本会话 ${conv.rounds || 0}轮 ${conv.steps || 0}步，缓存命中 ${conv.cacheHitPct !== null && conv.cacheHitPct !== undefined ? conv.cacheHitPct + '%' : '—'}，上下文 ${conv.contextPct !== null ? conv.contextPct + '%' : fmtTok(conv.contextTokens)} 喵~`
        : '点下面「···」可以偷看额度和上下文哦~';

      const spdLine = conv && conv.tokPerSec > 0
        ? `输出速度 ${conv.tokPerSec} tok/s！已被摸摸 ${hud.prefs.patCount || 0} 次喵 ♥`
        : `今天已经被摸摸 ${hud.prefs.patCount || 0} 次啦，好感度上升中 ♥`;

      const idleLine = (conv && conv.isThinking)
        ? '本喵正在帮你盯着推理进度呢，别急喵~'
        : '哼，这么安静，是在憋大招？';

      return [idleLine, qLine, ctxLine, spdLine];
    }

    // ---- Component A: Input Stats Bar ----
    function mountStatsBarOnly() {
      if (!hud.prefs.showStats) {
        const old = document.getElementById(IDS.stats);
        if (old) old.remove();
        return false;
      }
      const inputBox = findVisibleEl('[data-testid="agent-input-box"]') || document.querySelector('[data-testid="agent-input-box"]');
      if (!inputBox || !inputBox.parentElement) return false;
      let bar = document.getElementById(IDS.stats);
      if (!bar) {
        bar = document.createElement('div');
        bar.id = IDS.stats;
        bar.title = '点击打开 Gemini 猫猫上下文观察窗口';
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

    // ---- Component B: Corner Pressable Gemini Catgirl ----
    function spawnParticles(anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const glyphs = ['♥', '✦', '喵~', '★'];
      const colors = ['#f472b6', '#60a5fa', '#fbbf24', '#c084fc'];
      for (let i = 0; i < 4; i++) {
        const p = document.createElement('div');
        p.className = 'gn-particle';
        p.textContent = glyphs[i % glyphs.length];
        p.style.color = colors[i % colors.length];
        p.style.left = `${rect.left + rect.width * (0.28 + Math.random() * 0.44)}px`;
        p.style.top = `${rect.top + rect.height * (0.12 + Math.random() * 0.25)}px`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 980);
      }
    }

    function applyPetGeometry() {
      const root = document.getElementById(IDS.petRoot);
      if (!root) return;
      const corner = hud.prefs.corner || 'bottom-right';
      root.setAttribute('data-corner', corner);
      root.setAttribute('data-pose', computePose());
      root.style.setProperty('--gn-size', `${hud.prefs.size || 96}px`);
      root.style.opacity = String(hud.prefs.opacity ?? 1);

      root.style.top = 'auto';
      root.style.right = 'auto';
      root.style.bottom = 'auto';
      root.style.left = 'auto';

      if (hud.prefs.customPos && typeof hud.prefs.customPos.x === 'number' && typeof hud.prefs.customPos.y === 'number') {
        const size = hud.prefs.size || 96;
        const maxX = Math.max(8, window.innerWidth - size - 8);
        const maxY = Math.max(8, window.innerHeight - size - 8);
        root.style.left = `${Math.min(maxX, Math.max(8, hud.prefs.customPos.x))}px`;
        root.style.top = `${Math.min(maxY, Math.max(8, hud.prefs.customPos.y))}px`;
      } else {
        if (corner.includes('bottom')) root.style.bottom = '2px';
        else root.style.top = '36px';
        if (corner.includes('right')) root.style.right = '10px';
        else root.style.left = '10px';
      }
    }

    function renderPopover() {
      const root = document.getElementById(IDS.petRoot);
      if (!root) return;
      const pop = root.querySelector('.gn-popover');
      const statusBtn = root.querySelector('[data-gn-btn="status"]');
      const menuBtn = root.querySelector('[data-gn-btn="menu"]');
      if (!pop) return;

      if (statusBtn) statusBtn.classList.toggle('is-active', hud.popoverMode === 'status');
      if (menuBtn) menuBtn.classList.toggle('is-active', hud.popoverMode === 'menu');

      if (!hud.popoverMode) {
        pop.classList.remove('is-open');
        return;
      }
      pop.classList.add('is-open');

      if (hud.popoverMode === 'menu') {
        const curCorner = hud.prefs.corner || 'bottom-right';
        const curSize = hud.prefs.size || 96;
        pop.innerHTML = `
          <div class="gn-pop-head">
            <span class="gn-pop-title">✦ 猫猫快捷控制</span>
            <button type="button" class="gn-chip" data-gn-act="close-pop">×</button>
          </div>
          <div class="gn-menu-list">
            <button type="button" class="gn-menu-item" data-gn-act="open-observer">
              <span>🔍 打开上下文观察窗口</span><span>→</span>
            </button>
            <button type="button" class="gn-menu-item" data-gn-act="toggle-stats">
              <span>📊 输入框下方轮步统计栏</span><span>${hud.prefs.showStats ? '已开启' : '已隐藏'}</span>
            </button>
            <button type="button" class="gn-menu-item" data-gn-act="toggle-bubble">
              <span>💬 喵言喵语思考气泡</span><span>${hud.prefs.showBubble ? '已开启' : '已隐藏'}</span>
            </button>
          </div>
          <div class="gn-sec">
            <div class="gn-sec-title"><span>📍 停靠窗口角落</span></div>
            <div class="gn-chip-row">
              ${[
                ['bottom-right', '右下角'],
                ['bottom-left', '左下角'],
                ['top-right', '右上角'],
                ['top-left', '左上角']
              ].map(([k, lbl]) => `<button type="button" class="gn-chip ${curCorner === k && !hud.prefs.customPos ? 'is-active' : ''}" data-gn-corner="${k}">${lbl}</button>`).join('')}
            </div>
          </div>
          <div class="gn-sec">
            <div class="gn-sec-title"><span>📏 猫猫大小</span></div>
            <div class="gn-chip-row">
              ${[[72, '小'], [96, '中'], [124, '大']].map(([sz, lbl]) => `<button type="button" class="gn-chip ${curSize === sz ? 'is-active' : ''}" data-gn-size="${sz}">${lbl} (${sz}px)</button>`).join('')}
            </div>
          </div>
        `;
        return;
      }

      // Status popover: Quotas + Usage + Context
      const conv = hud.state && hud.state.conv;
      const quota = hud.state && hud.state.quota;
      const plan = (hud.state && hud.state.plan && hud.state.plan.planName) || '';
      const groups = (quota && Array.isArray(quota.groups)) ? quota.groups : [];

      let quotaHtml = '<div style="font-size:11px;opacity:.65;">正在获取额度数据…</div>';
      if (groups.length > 0) {
        quotaHtml = groups.map((g) => {
          const bucketsHtml = (g.buckets || []).map((b) => {
            const rem = typeof b.remainingPct === 'number' ? b.remainingPct : 0;
            const col = pctColor(rem, true);
            const reset = fmtResetCountdown(b.resetAtIso || b.resetAtMs);
            return `
              <div class="gn-bar-row">
                <div class="gn-bar-meta">
                  <span>${esc(g.label.replace(' models', '').replace(' Models', ''))} · ${esc(b.windowLabel)}</span>
                  <span class="gn-mono" style="color:${col};font-weight:700;">剩 ${rem}%</span>
                </div>
                <div class="gn-bar-track"><div class="gn-bar-fill" style="width:${Math.max(2, rem)}%;background:${col};"></div></div>
                ${reset ? `<div style="font-size:9.5px;opacity:.6;text-align:right;margin-top:1px;">${esc(reset)}</div>` : ''}
              </div>`;
          }).join('');
          return bucketsHtml;
        }).join('');
      }

      const ctxPct = conv && conv.contextPct !== null && conv.contextPct !== undefined ? conv.contextPct : 0;
      const ctxCol = pctColor(ctxPct, false);

      const statusHtml = `
        <div class="gn-pop-head">
          <span class="gn-pop-title">✦ Gemini 猫猫状态卡 ${plan ? `<span class="gn-plan-tag">${esc(plan)}</span>` : ''}</span>
          <button type="button" class="gn-chip" data-gn-act="close-pop">×</button>
        </div>

        <div class="gn-sec">
          <div class="gn-sec-title"><span>⚡ 模型额度与重置</span><span class="gn-mono" style="font-weight:500;">${esc((conv && conv.modelLabel) || '')}</span></div>
          ${quotaHtml}
        </div>

        <div class="gn-sec">
          <div class="gn-sec-title"><span>📊 本会话使用情况</span><span>摸摸 ${hud.prefs.patCount || 0} 次 ♥</span></div>
          ${conv ? `
            <div class="gn-kv-grid">
              <div class="gn-kv"><div class="gn-kv-k">轮次 / 步数</div><div class="gn-kv-v">${conv.rounds} 轮 ${conv.steps} 步</div></div>
              <div class="gn-kv"><div class="gn-kv-k">生成速率 / TTFT</div><div class="gn-kv-v">${conv.tokPerSec ? conv.tokPerSec + ' tok/s' : '—'}${conv.ttftMs ? ' · ' + (conv.ttftMs / 1000).toFixed(1) + 's' : ''}</div></div>
              <div class="gn-kv"><div class="gn-kv-k">总消耗 / 缓存命中</div><div class="gn-kv-v">${fmtTok(conv.totalTokens)} · ${conv.cacheHitPct !== null && conv.cacheHitPct !== undefined ? conv.cacheHitPct + '%' : '—'}</div></div>
              <div class="gn-kv"><div class="gn-kv-k">新输入 / 缓存 / 输出</div><div class="gn-kv-v">${fmtTok(conv.inputTokens)} / ${fmtTok(conv.cacheReadTokens)} / ${fmtTok(conv.outputTokens)}</div></div>
            </div>
          ` : '<div style="font-size:11px;opacity:.65;">暂无活跃会话</div>'}
        </div>

        <div class="gn-sec">
          <div class="gn-sec-title">
            <span>🧠 上下文窗口</span>
            <span class="gn-mono" style="color:${ctxCol};">${conv ? `${fmtTok(conv.contextTokens)} / ${conv.contextMaxTokens ? fmtTok(conv.contextMaxTokens) : '?'} (${ctxPct}%)` : '—'}</span>
          </div>
          <div class="gn-bar-track" style="height:8px;">
            <div class="gn-bar-fill" style="width:${Math.max(2, ctxPct)}%;background:${ctxCol};"></div>
          </div>
          ${conv && conv.tokenBreakdown && Array.isArray(conv.tokenBreakdown.groups) ? `
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;font-size:10px;opacity:.8;">
              ${conv.tokenBreakdown.groups.map((g) => `<span>${esc(g.name)}: ${fmtTok(g.numTokens)}</span>`).join('<span>·</span>')}
            </div>
          ` : ''}
        </div>

        <div class="gn-pop-actions">
          <button type="button" class="gn-btn gn-btn-primary" data-gn-act="open-observer">🔍 上下文观察窗口</button>
          <button type="button" class="gn-btn" data-gn-act="refresh">🔄 刷新</button>
        </div>
      `;
      if (pop.innerHTML !== statusHtml) {
        const prevPopTop = pop.scrollTop || 0;
        pop.innerHTML = statusHtml;
        pop.scrollTop = prevPopTop;
      }
    }

    function updatePetDisplay() {
      const root = document.getElementById(IDS.petRoot);
      if (!root) return;
      root.setAttribute('data-pose', computePose());
      const badge = root.querySelector('.gn-mini-badge');
      const conv = hud.state && hud.state.conv;
      if (badge) {
        if (conv && conv.contextPct !== null && conv.contextPct !== undefined) {
          badge.textContent = `${Math.round(conv.contextPct)}%`;
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }
      const bWrap = root.querySelector('.gn-bubble-wrap');
      const bText = root.querySelector('.gn-bubble-text');
      const bIdx = root.querySelector('.gn-bubble-idx');
      if (bWrap && bText && bIdx) {
        const shouldHide = !hud.prefs.showBubble || Boolean(hud.popoverMode);
        bWrap.classList.toggle('is-hidden', shouldHide);
        const lines = buildBubbleMessages();
        const idx = ((hud.prefs.bubbleIndex || 0) % lines.length + lines.length) % lines.length;
        bText.textContent = lines[idx];
        bIdx.textContent = `${idx + 1}/${lines.length}`;
      }
      if (hud.popoverMode === 'status') {
        renderPopover();
      }
    }

    function mountPetWidget() {
      if (document.getElementById(IDS.petRoot) || !document.body) return;
      const root = document.createElement('div');
      root.id = IDS.petRoot;
      root.innerHTML = `
        <div class="gn-stage">
          <div class="gn-bubble-wrap">
            <div class="gn-bubble">
              <div class="gn-bubble-head">✦ 喵言喵语 ✦ <button type="button" class="gn-bubble-close" data-gn-act="hide-bubble" title="隐藏气泡">×</button></div>
              <div class="gn-bubble-text" data-gn-act="next-line"></div>
              <div class="gn-bubble-sub">点点本喵，再聊一句</div>
              <div class="gn-bubble-pager">
                <button type="button" data-gn-act="prev-line">‹</button>
                <span class="gn-bubble-idx">1/4</span>
                <button type="button" data-gn-act="next-line">›</button>
              </div>
              <div class="gn-thought-dots">
                <span class="gn-thought-dot1"></span>
                <span class="gn-thought-dot2"></span>
              </div>
            </div>
          </div>

          <div class="gn-pills">
            <button type="button" class="gn-pill-btn" data-gn-btn="status" title="查看模型额度、用量与上下文">···</button>
            <button type="button" class="gn-pill-btn" data-gn-btn="menu" title="猫猫设置与上下文观察窗口">≡</button>
          </div>

          <button type="button" class="gn-avatar-btn" title="按一按摸摸 Gemini 猫猫 (可拖拽移动位置)">
            <div class="gn-sprite"></div>
            <span class="gn-mini-badge" style="display:none;"></span>
          </button>

          <div class="gn-popover"></div>
        </div>
      `;

      const spriteEl = root.querySelector('.gn-sprite');
      if (spriteEl && hud.nekoStripDataUrl) {
        spriteEl.style.backgroundImage = `url("${hud.nekoStripDataUrl}")`;
      }

      const avatarBtn = root.querySelector('.gn-avatar-btn');
      let dragState = null;

      avatarBtn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        avatarBtn.setPointerCapture(e.pointerId);
        avatarBtn.classList.add('is-pressed');
        const rect = root.getBoundingClientRect();
        dragState = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          origX: rect.left,
          origY: rect.top,
          moved: false
        };
      });

      avatarBtn.addEventListener('pointermove', (e) => {
        if (!dragState || dragState.pointerId !== e.pointerId) return;
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (!dragState.moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
          dragState.moved = true;
          avatarBtn.classList.remove('is-pressed');
        }
        if (dragState.moved) {
          hud.prefs.customPos = { x: dragState.origX + dx, y: dragState.origY + dy };
          applyPetGeometry();
        }
      });

      const endPress = (e) => {
        if (!dragState || dragState.pointerId !== e.pointerId) return;
        const wasMoved = dragState.moved;
        dragState = null;
        avatarBtn.classList.remove('is-pressed');
        try { avatarBtn.releasePointerCapture(e.pointerId); } catch {}
        if (wasMoved) {
          savePrefsPatch({ customPos: hud.prefs.customPos });
        } else {
          // Head-pat / press!
          hud.pattingUntil = Date.now() + 1800;
          spawnParticles(avatarBtn);
          const nextPat = (hud.prefs.patCount || 0) + 1;
          const nextIdx = ((hud.prefs.bubbleIndex || 0) + 1) % 4;
          savePrefsPatch({ patCount: nextPat, bubbleIndex: nextIdx, showBubble: true });
          updatePetDisplay();
          setTimeout(updatePetDisplay, 1850);
        }
      };
      avatarBtn.addEventListener('pointerup', endPress);
      avatarBtn.addEventListener('pointercancel', endPress);

      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-gn-btn], [data-gn-act], [data-gn-corner], [data-gn-size]');
        if (!btn) return;
        e.stopPropagation();
        const btnKind = btn.getAttribute('data-gn-btn');
        if (btnKind) {
          hud.popoverMode = hud.popoverMode === btnKind ? '' : btnKind;
          renderPopover();
          updatePetDisplay();
          if (hud.popoverMode === 'status') refreshTelemetry(true);
          return;
        }
        const corner = btn.getAttribute('data-gn-corner');
        if (corner) {
          savePrefsPatch({ corner, customPos: null });
          renderPopover();
          return;
        }
        const sz = btn.getAttribute('data-gn-size');
        if (sz) {
          savePrefsPatch({ size: parseInt(sz, 10) || 96 });
          renderPopover();
          return;
        }
        const act = btn.getAttribute('data-gn-act');
        if (act === 'close-pop') {
          hud.popoverMode = '';
          renderPopover();
          updatePetDisplay();
        } else if (act === 'hide-bubble') {
          savePrefsPatch({ showBubble: false });
          updatePetDisplay();
        } else if (act === 'next-line') {
          savePrefsPatch({ bubbleIndex: (hud.prefs.bubbleIndex || 0) + 1 });
          updatePetDisplay();
        } else if (act === 'prev-line') {
          savePrefsPatch({ bubbleIndex: (hud.prefs.bubbleIndex || 0) - 1 });
          updatePetDisplay();
        } else if (act === 'toggle-stats') {
          savePrefsPatch({ showStats: !hud.prefs.showStats });
          ensureStatsBar();
          renderPopover();
        } else if (act === 'toggle-bubble') {
          savePrefsPatch({ showBubble: !hud.prefs.showBubble });
          updatePetDisplay();
          renderPopover();
        } else if (act === 'open-observer') {
          hud.popoverMode = '';
          renderPopover();
          updatePetDisplay();
          openObserverModal();
        } else if (act === 'refresh') {
          refreshTelemetry(true);
        }
      });

      document.body.appendChild(root);
      applyPetGeometry();
      updatePetDisplay();
    }

    // ---- Component C: In-Window Context Observer Modal ----
    function ensureObserverModal() {
      let modal = document.getElementById(IDS.modal);
      if (modal || !document.body) return modal;
      modal = document.createElement('div');
      modal.id = IDS.modal;
      modal.innerHTML = `
        <div class="gn-modal-card">
          <div class="gn-modal-head">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
              <span style="font-size:15px;font-weight:800;white-space:nowrap;">✦ Gemini 猫猫上下文观察窗口</span>
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
          <span>提示：也可在右上角扩展 / Sidecar 面板打开完整「Gemini 猫猫观察台」侧栏。</span>
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
          updatePetDisplay();
          if (hud.modalOpen) renderObserverModal();
        }
      } catch {} finally {
        refreshInFlight = false;
      }
    }

    async function bootHud() {
      try {
        const boot = await ipcRenderer.invoke('neko-hud:get-boot');
        if (boot && boot.prefs) hud.prefs = { ...hud.prefs, ...boot.prefs };
        if (boot && boot.nekoStripDataUrl) hud.nekoStripDataUrl = boot.nekoStripDataUrl;
      } catch {}

      const startDom = () => {
        if (!document.body) return;
        syncActiveConversation();
        injectStyles();
        ensureStatsBar();
        mountPetWidget();
        refreshTelemetry(true);

        let rafScheduled = false;
        const obs = new MutationObserver(() => {
          if (rafScheduled) return;
          rafScheduled = true;
          requestAnimationFrame(() => {
            rafScheduled = false;
            syncActiveConversation();
            if (mountStatsBarOnly()) updateStatsBar();
            if (!document.getElementById(IDS.petRoot)) mountPetWidget();
            const root = document.getElementById(IDS.petRoot);
            const nextPose = computePose();
            if (root && root.getAttribute('data-pose') !== nextPose) {
              root.setAttribute('data-pose', nextPose);
            }
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
        window.addEventListener('resize', applyPetGeometry);
        document.addEventListener('click', (e) => {
          const root = document.getElementById(IDS.petRoot);
          const modalEl = document.getElementById(IDS.modal);
          if (hud.popoverMode && root && !root.contains(e.target)) {
            hud.popoverMode = '';
            renderPopover();
            updatePetDisplay();
          }
          if ((root && root.contains(e.target)) || (modalEl && modalEl.contains(e.target))) {
            return;
          }
          if (e.target && typeof e.target.closest === 'function') {
            if (e.target.closest('[data-testid="new-conversation-button"], [data-testid="conversation-row-sidebar"], [data-testid="project-group"], a[href="/"], a[href^="/c/"], button')) {
              scheduleNavSync();
            }
          }
        }, true);
        document.addEventListener('keydown', (e) => {
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
