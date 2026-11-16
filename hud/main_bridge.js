// ===== GEMINI_NEKO_HUD_BEGIN =====
(function () {
  try {
    const electron = require('electron');
    const ipcMain = electron && electron.ipcMain;
    if (!ipcMain || globalThis.__GEMINI_NEKO_MAIN_BRIDGE__) return;
    globalThis.__GEMINI_NEKO_MAIN_BRIDGE__ = true;

    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const http = require('http');
    const https = require('https');

    const PLUGIN_DIR = path.join(os.homedir(), '.gemini', 'config', 'plugins', 'gemini-neko-cockpit');
    const PREFS_PATH = path.join(PLUGIN_DIR, 'hud_prefs.json');
    const RUNTIME_PTR_PATH = path.join(PLUGIN_DIR, 'runtime_server.json');
    const DAEMON_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'daemon');
    const BRAIN_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const DEFAULT_PREFS = {
      corner: 'bottom-right',
      size: 96,
      opacity: 1,
      showStats: true,
      showBubble: true,
      patCount: 0,
      customPos: null,
      bubbleIndex: 0
    };

    function readJsonSafe(filePath) {
      try {
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        return null;
      }
    }

    function loadPrefs() {
      const saved = readJsonSafe(PREFS_PATH);
      if (!saved || typeof saved !== 'object') return { ...DEFAULT_PREFS };
      return { ...DEFAULT_PREFS, ...saved };
    }

    function savePrefs(patch) {
      const next = { ...loadPrefs(), ...(patch && typeof patch === 'object' ? patch : {}) };
      try {
        fs.mkdirSync(PLUGIN_DIR, { recursive: true });
        const tmp = `${PREFS_PATH}.tmp.${process.pid}.${Date.now()}`;
        fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8');
        fs.renameSync(tmp, PREFS_PATH);
      } catch {}
      return next;
    }

    function readAssetDataUrl(filename, mime) {
      try {
        const p = path.join(PLUGIN_DIR, 'assets', filename);
        if (!fs.existsSync(p)) return '';
        const b64 = fs.readFileSync(p).toString('base64');
        return `data:${mime};base64,${b64}`;
      } catch {
        return '';
      }
    }

    function isPidAlive(pid) {
      const n = Number(pid);
      if (!Number.isFinite(n) || n <= 0) return false;
      try {
        process.kill(n, 0);
        return true;
      } catch (e) {
        return e && e.code === 'EPERM';
      }
    }

    function findSidecarServerInfo() {
      const candidates = [
        RUNTIME_PTR_PATH,
        path.join(os.homedir(), '.gemini', 'antigravity', 'sidecar_data', 'gemini-neko-cockpit', 'neko-cockpit', 'data', 'server_info.json')
      ];
      for (const p of candidates) {
        const info = readJsonSafe(p);
        if (info && info.port && (!info.pid || isPidAlive(info.pid))) {
          return info;
        }
      }
      return null;
    }

    function httpJsonRequest({ host = '127.0.0.1', port, path: reqPath, method = 'GET', headers = {}, body = null, useHttps = false, timeoutMs = 1500 }) {
      return new Promise((resolve) => {
        const mod = useHttps ? https : http;
        const opts = {
          hostname: host,
          port: Number(port),
          path: reqPath,
          method,
          headers: { Accept: 'application/json', ...headers },
          timeout: timeoutMs,
          ...(useHttps ? { rejectUnauthorized: false } : {})
        };
        const req = mod.request(opts, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8').trim();
            if (res.statusCode < 200 || res.statusCode >= 300) {
              resolve({ ok: false, status: res.statusCode, error: raw || `HTTP ${res.statusCode}` });
              return;
            }
            try {
              resolve({ ok: true, status: res.statusCode, data: raw ? JSON.parse(raw) : {} });
            } catch {
              resolve({ ok: false, status: res.statusCode, error: 'Invalid JSON' });
            }
          });
        });
        req.on('timeout', () => {
          req.destroy();
          resolve({ ok: false, status: 0, error: 'Timeout' });
        });
        req.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
        if (body !== null) {
          req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
      });
    }

    // --- Direct fallback against Language Server + transcript.jsonl when sidecar isn't up yet ---
    let cachedHub = { info: null, checkedAt: 0 };
    function discoverLiveHubDaemon() {
      const now = Date.now();
      if (cachedHub.info && now - cachedHub.checkedAt < 10000 && isPidAlive(cachedHub.info.pid)) {
        return cachedHub.info;
      }
      try {
        if (!fs.existsSync(DAEMON_DIR)) return null;
        const files = fs.readdirSync(DAEMON_DIR)
          .filter((n) => n.startsWith('hub_') && n.endsWith('.json'))
          .map((n) => {
            const fp = path.join(DAEMON_DIR, n);
            try {
              const st = fs.statSync(fp);
              return { fp, mtimeMs: st.mtimeMs };
            } catch {
              return null;
            }
          })
          .filter(Boolean)
          .sort((a, b) => b.mtimeMs - a.mtimeMs);
        for (const f of files) {
          const info = readJsonSafe(f.fp);
          if (info && info.csrfToken && (info.httpPort || info.httpsPort) && isPidAlive(info.pid)) {
            cachedHub = { info, checkedAt: now };
            return info;
          }
        }
      } catch {}
      return null;
    }

    async function callLsFallback(method, bodyObj) {
      const hub = discoverLiveHubDaemon();
      if (!hub) return null;
      const headers = {
        'Content-Type': 'application/json',
        'x-codeium-csrf-token': hub.csrfToken
      };
      const reqPath = `/exa.language_server_pb.LanguageServerService/${method}`;
      if (hub.httpPort) {
        const res = await httpJsonRequest({
          port: hub.httpPort,
          path: reqPath,
          method: 'POST',
          headers,
          body: bodyObj || {},
          useHttps: false,
          timeoutMs: 2500
        });
        if (res.ok) return res.data;
      }
      if (hub.httpsPort) {
        const res = await httpJsonRequest({
          port: hub.httpsPort,
          path: reqPath,
          method: 'POST',
          headers,
          body: bodyObj || {},
          useHttps: true,
          timeoutMs: 2500
        });
        if (res.ok) return res.data;
      }
      return null;
    }

    function parseDurationMs(val) {
      if (typeof val === 'number' && Number.isFinite(val)) return val;
      if (typeof val !== 'string') return 0;
      const m = /^([\d.]+)s$/i.exec(val.trim());
      if (!m) return 0;
      const sec = parseFloat(m[1]);
      return Number.isFinite(sec) && sec > 0 ? Math.round(sec * 1000) : 0;
    }

    function parseFallbackTranscript(convId) {
      const out = {
        id: convId,
        rounds: 0,
        steps: 0,
        inputTokens: 0,
        cacheReadTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        contextTokens: 0,
        compactions: 0,
        cacheHitPct: null,
        tokPerSec: 0,
        isThinking: false
      };
      try {
        const tp = path.join(BRAIN_DIR, convId, '.system_generated', 'logs', 'transcript.jsonl');
        if (!fs.existsSync(tp)) return out;
        const st = fs.statSync(tp);
        const raw = fs.readFileSync(tp, 'utf8');
        const lines = raw.split('\n');
        let lastStepType = '';
        let lastStepStatus = '';
        let lastHasTools = false;
        let lastPlannerCreatedMs = 0;
        let lastOut = 0;
        for (const ln of lines) {
          const s = ln.trim();
          if (!s) continue;
          try {
            const obj = JSON.parse(s);
            if (typeof obj.step_index === 'number' && obj.step_index + 1 > out.steps) {
              out.steps = obj.step_index + 1;
            }
            const t = obj.type || '';
            lastStepType = t;
            lastStepStatus = obj.status || '';
            lastHasTools = Array.isArray(obj.tool_calls) && obj.tool_calls.length > 0;
            if (t === 'USER_INPUT') out.rounds += 1;
            else if (t === 'CHECKPOINT') out.compactions += 1;
            else if (t === 'PLANNER_RESPONSE') {
              const i = Number(obj.input_tokens) || 0;
              const c = Number(obj.cache_read_tokens) || 0;
              const o = Number(obj.output_tokens) || 0;
              out.inputTokens += i;
              out.cacheReadTokens += c;
              out.outputTokens += o;
              if (i + c > 0) out.contextTokens = i + c;
              if (obj.created_at) {
                const ms = Date.parse(obj.created_at);
                if (ms > 0) lastPlannerCreatedMs = ms;
              }
              if (o > 0) lastOut = o;
            }
          } catch {}
        }
        out.totalTokens = out.inputTokens + out.cacheReadTokens + out.outputTokens;
        const denom = out.inputTokens + out.cacheReadTokens;
        out.cacheHitPct = denom > 0 ? Math.min(100, Math.round((out.cacheReadTokens / denom) * 1000) / 10) : null;
        if (out.rounds === 0 && out.steps > 0) out.rounds = 1;
        if (lastOut > 0 && lastPlannerCreatedMs > 0) {
          const dt = Math.max(0.5, (st.mtimeMs - lastPlannerCreatedMs) / 1000);
          if (dt <= 120) out.tokPerSec = Math.round((lastOut / dt) * 10) / 10;
        }
        out.isThinking =
          Date.now() - st.mtimeMs < 180000 &&
          (lastStepStatus === 'RUNNING' ||
            lastStepType === 'USER_INPUT' ||
            lastStepType === 'GENERIC' ||
            (lastStepType === 'PLANNER_RESPONSE' && lastHasTools));
      } catch {}
      return out;
    }

    let fallbackQuotaCache = { data: null, fetchedAt: 0 };
    let fallbackPlanCache = { data: null, fetchedAt: 0 };
    let fallbackMetaCache = new Map();

    async function getFallbackSummary(reqConvId, forceRefresh) {
      const now = Date.now();
      const convId = (reqConvId && UUID_RE.test(String(reqConvId).trim())) ? String(reqConvId).trim().toLowerCase() : '';
      let summaries = {};
      if (convId) {
        const trajRes = await callLsFallback('GetAllCascadeTrajectories', { excludeSubtrajectories: true });
        summaries = trajRes && trajRes.trajectorySummaries ? trajRes.trajectorySummaries : {};
      }

      if (forceRefresh || now - fallbackQuotaCache.fetchedAt > 20000 || !fallbackQuotaCache.data) {
        const qRes = await callLsFallback('RetrieveUserQuotaSummary', { metadata: { ideName: 'antigravity', extensionName: 'antigravity', locale: 'en' } });
        const rawGroups = qRes && qRes.response && Array.isArray(qRes.response.groups) ? qRes.response.groups : [];
        if (rawGroups.length > 0) {
          const groups = rawGroups.map((g) => {
            const buckets = (g.buckets || []).map((b) => {
              const rem = typeof b.remainingFraction === 'number' ? Math.max(0, Math.min(1, b.remainingFraction)) : 0;
              return {
                bucketId: b.bucketId || '',
                windowKind: b.window || 'other',
                windowLabel: b.window === '5h' ? '5-hour' : (b.window === 'weekly' ? 'Weekly' : (b.displayName || 'Quota')),
                remainingPct: Math.round(rem * 1000) / 10,
                usedPct: Math.round((1 - rem) * 1000) / 10,
                resetAtIso: b.resetTime || '',
                resetAtMs: b.resetTime ? Date.parse(b.resetTime) || 0 : 0
              };
            });
            return {
              key: (g.displayName || '').toLowerCase().includes('claude') ? 'anthropic_openai' : ((g.displayName || '').toLowerCase().includes('argon') ? 'argon' : 'google'),
              label: g.displayName || 'Quota',
              description: g.description || '',
              buckets
            };
          });
          fallbackQuotaCache = { data: { source: 'quota_summary', groups, fetchedAtMs: now }, fetchedAt: now };
        }
      }

      if (forceRefresh || now - fallbackPlanCache.fetchedAt > 120000 || !fallbackPlanCache.data) {
        const usRes = await callLsFallback('GetUserStatus', { metadata: { ideName: 'antigravity', extensionName: 'antigravity', locale: 'en' } });
        const us = usRes && usRes.userStatus;
        if (us) {
          fallbackPlanCache = {
            data: {
              planName: (us.planStatus && us.planStatus.planInfo && us.planStatus.planInfo.planName) || '',
              email: us.email || '',
              userName: us.name || ''
            },
            fetchedAt: now
          };
        }
      }

      let conv = null;
      if (convId) {
        const parsed = parseFallbackTranscript(convId);
        const traj = summaries[convId] || null;
        if (traj) {
          if (Number(traj.stepCount) > parsed.steps) parsed.steps = Number(traj.stepCount);
          if (traj.status === 'CASCADE_RUN_STATUS_RUNNING') parsed.isThinking = true;
          else if (traj.status === 'CASCADE_RUN_STATUS_IDLE') parsed.isThinking = false;
        }
        const gmCached = fallbackMetaCache.get(convId);
        let gm = gmCached && (now - gmCached.ts < 3000) && gmCached.steps === parsed.steps ? gmCached.data : null;
        if (!gm) {
          const gmRes = await callLsFallback('GetCascadeTrajectoryGeneratorMetadata', {
            cascadeId: convId,
            generatorMetadataOffset: 0,
            includeMessages: false
          });
          const list = gmRes && Array.isArray(gmRes.generatorMetadata) ? gmRes.generatorMetadata : [];
          let maxContextTokens = 0;
          let estimatedTokensUsed = 0;
          let modelLabel = '';
          let ttftMs = 0;
          let tokPerSec = 0;
          let tokenBreakdown = null;
          for (let i = list.length - 1; i >= 0; i--) {
            const cm = list[i] && list[i].chatModel;
            if (!cm) continue;
            if (!modelLabel && cm.responseModel) modelLabel = cm.responseModel;
            const cwm = cm.chatStartMetadata && cm.chatStartMetadata.contextWindowMetadata;
            if (cwm) {
              if (!maxContextTokens && Number(cwm.maxContextTokens) > 0) maxContextTokens = Number(cwm.maxContextTokens);
              if (!estimatedTokensUsed && Number(cwm.estimatedTokensUsed) > 0) estimatedTokensUsed = Number(cwm.estimatedTokensUsed);
              if (!tokenBreakdown && cwm.tokenBreakdown && Array.isArray(cwm.tokenBreakdown.groups)) {
                tokenBreakdown = {
                  totalTokens: Number(cwm.tokenBreakdown.totalTokens) || estimatedTokensUsed,
                  groups: cwm.tokenBreakdown.groups.map((g) => ({
                    name: g.name || '',
                    type: g.type || '',
                    numTokens: Number(g.numTokens) || 0,
                    children: Array.isArray(g.children)
                      ? g.children.slice(0, 12).map((c) => ({ name: c.name || '', numTokens: Number(c.numTokens) || 0 }))
                      : []
                  }))
                };
              }
            }
            const sm = parseDurationMs(cm.streamingDuration);
            const ot = Number(cm.usage && (cm.usage.responseOutputTokens || cm.usage.outputTokens)) || 0;
            if (!tokPerSec && sm >= 80 && ot > 0) tokPerSec = Math.round((ot / (sm / 1000)) * 10) / 10;
            if (!ttftMs) ttftMs = parseDurationMs(cm.timeToFirstToken);
            if (maxContextTokens > 0 && tokPerSec > 0) break;
          }
          gm = { maxContextTokens, estimatedTokensUsed, modelLabel, ttftMs, tokPerSec, tokenBreakdown };
          fallbackMetaCache.set(convId, { ts: now, steps: parsed.steps, data: gm });
        }

        const ctxTok = Math.max(parsed.contextTokens, gm.estimatedTokensUsed || 0);
        const ctxMax = gm.maxContextTokens || 0;
        const zeroConvPct = (parsed.steps === 0 && ctxTok === 0) ? 0 : null;
        conv = {
          id: convId,
          title: (traj && traj.summary) || (parsed.steps > 0 ? `对话 ${convId.slice(0, 8)}` : '新对话'),
          isThinking: parsed.isThinking,
          waitState: '',
          modelLabel: gm.modelLabel || '',
          rounds: parsed.rounds,
          steps: parsed.steps,
          tokPerSec: gm.tokPerSec || parsed.tokPerSec || 0,
          ttftMs: gm.ttftMs || 0,
          totalTokens: parsed.totalTokens,
          inputTokens: parsed.inputTokens,
          cacheReadTokens: parsed.cacheReadTokens,
          outputTokens: parsed.outputTokens,
          cacheHitPct: parsed.cacheHitPct,
          contextTokens: ctxTok,
          contextMaxTokens: ctxMax,
          contextPct: ctxMax > 0 ? Math.min(100, Math.round((ctxTok / ctxMax) * 1000) / 10) : zeroConvPct,
          contextSource: ctxMax > 0 ? 'server' : 'observed',
          compactions: parsed.compactions,
          pollution: {
            id: parsed.compactions >= 10 ? 'polluted' : (parsed.compactions >= 6 ? 'heavy' : (parsed.compactions >= 3 ? 'warm' : 'fresh')),
            label: parsed.compactions >= 10 ? 'Polluted' : (parsed.compactions >= 6 ? 'Heavy' : (parsed.compactions >= 3 ? 'Warm' : 'Fresh'))
          },
          tokenBreakdown: gm.tokenBreakdown || null
        };
      }

      return {
        ok: true,
        ts: now,
        fallback: true,
        conv,
        quota: fallbackQuotaCache.data,
        plan: fallbackPlanCache.data || { planName: '' }
      };
    }

    ipcMain.handle('neko-hud:get-boot', async () => {
      return {
        prefs: loadPrefs(),
        nekoStripDataUrl: readAssetDataUrl('neko_strip.webp', 'image/webp') || readAssetDataUrl('neko_strip.png', 'image/png'),
        logoDataUrl: readAssetDataUrl('logo.png', 'image/png'),
        sidecarInfo: findSidecarServerInfo()
      };
    });

    ipcMain.handle('neko-hud:save-prefs', async (_event, patch) => {
      return savePrefs(patch);
    });

    ipcMain.handle('neko-hud:get-state', async (_event, convId, forceRefresh) => {
      const normalizedConvId = typeof convId === 'string' ? convId.trim().toLowerCase() : '';
      const info = findSidecarServerInfo();
      if (info && info.port) {
        const qs = new URLSearchParams();
        qs.set('convId', normalizedConvId);
        qs.set('strict', '1');
        if (forceRefresh) qs.set('refresh', '1');
        if (info.token) qs.set('token', info.token);
        const res = await httpJsonRequest({
          host: info.host || '127.0.0.1',
          port: info.port,
          path: `/api/hud-summary?${qs.toString()}`,
          headers: info.token ? { 'X-Sidecar-Token': info.token } : {},
          timeoutMs: 1200
        });
        if (res.ok && res.data) {
          if (!normalizedConvId) res.data.conv = null;
          return res.data;
        }
      }
      return getFallbackSummary(normalizedConvId, Boolean(forceRefresh));
    });

    ipcMain.handle('neko-hud:get-breakdown', async (_event, convId) => {
      const normalizedConvId = typeof convId === 'string' ? convId.trim().toLowerCase() : '';
      if (!UUID_RE.test(normalizedConvId)) {
        return {
          id: '',
          currentTokens: 0,
          observedCeiling: 0,
          contextSource: 'none',
          compactCount: 0,
          rounds: 0,
          steps: 0,
          tokPerSec: 0,
          ttftMs: 0,
          cacheHitPct: null,
          totalInputTokens: 0,
          totalCacheReadTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
          serverTokenBreakdown: null,
          categories: [],
          activeSkills: [],
          heaviestSteps: [],
          topFiles: []
        };
      }
      const info = findSidecarServerInfo();
      if (info && info.port) {
        const qs = new URLSearchParams({ id: normalizedConvId });
        if (info.token) qs.set('token', info.token);
        const res = await httpJsonRequest({
          host: info.host || '127.0.0.1',
          port: info.port,
          path: `/api/context-breakdown?${qs.toString()}`,
          headers: info.token ? { 'X-Sidecar-Token': info.token } : {},
          timeoutMs: 2500
        });
        if (res.ok && res.data) return res.data;
      }
      const fb = await getFallbackSummary(normalizedConvId, true);
      return {
        id: fb.conv ? fb.conv.id : convId,
        currentTokens: fb.conv ? fb.conv.contextTokens : 0,
        observedCeiling: fb.conv ? fb.conv.contextMaxTokens : 0,
        contextSource: fb.conv ? fb.conv.contextSource : 'server',
        compactCount: fb.conv ? fb.conv.compactions : 0,
        rounds: fb.conv ? fb.conv.rounds : 0,
        steps: fb.conv ? fb.conv.steps : 0,
        tokPerSec: fb.conv ? fb.conv.tokPerSec : 0,
        ttftMs: fb.conv ? fb.conv.ttftMs : 0,
        cacheHitPct: fb.conv ? fb.conv.cacheHitPct : null,
        totalInputTokens: fb.conv ? fb.conv.inputTokens : 0,
        totalCacheReadTokens: fb.conv ? fb.conv.cacheReadTokens : 0,
        totalOutputTokens: fb.conv ? fb.conv.outputTokens : 0,
        totalTokens: fb.conv ? fb.conv.totalTokens : 0,
        serverTokenBreakdown: fb.conv ? fb.conv.tokenBreakdown : null,
        categories: [],
        activeSkills: [],
        heaviestSteps: [],
        topFiles: []
      };
    });

    ipcMain.handle('neko-hud:list-conversations', async () => {
      const info = findSidecarServerInfo();
      if (info && info.port) {
        const qs = info.token ? `?token=${encodeURIComponent(info.token)}` : '';
        const res = await httpJsonRequest({
          host: info.host || '127.0.0.1',
          port: info.port,
          path: `/api/status${qs}`,
          headers: info.token ? { 'X-Sidecar-Token': info.token } : {},
          timeoutMs: 1500
        });
        if (res.ok && res.data && Array.isArray(res.data.conversations)) {
          return res.data.conversations.slice(0, 12).map((c) => ({
            id: c.id,
            title: c.title || c.firstPrompt || c.id.slice(0, 8),
            rounds: c.rounds || c.promptCount || 0,
            steps: c.steps || 0,
            contextPct: c.contextRatio !== null ? Math.round(c.contextRatio * 1000) / 10 : null,
            totalTokens: c.totalTokens || 0,
            cacheHitPct: c.cacheHitPct
          }));
        }
      }
      return [];
    });
  } catch (err) {
    try { console.error('[Gemini-Neko-HUD] main bridge error:', err); } catch {}
  }
})();
// ===== GEMINI_NEKO_HUD_END =====
