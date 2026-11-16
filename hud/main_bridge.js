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
    const CUSTOM_ASSETS_DIR = path.join(PLUGIN_DIR, 'assets', 'custom');
    const RUNTIME_PTR_PATH = path.join(PLUGIN_DIR, 'runtime_server.json');
    const DAEMON_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'daemon');
    const BRAIN_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const FRAME_KEYS = ['idle', 'eat', 'grin', 'xd'];

    const DEFAULT_ANCHOR = {
      v: 2,
      hAnchor: 'right',
      hDist: 0,
      vAnchor: 'bottom',
      vDist: 0
    };

    const DEFAULT_PREFS = {
      prefsVersion: 2,
      enabled: true,
      showStatsBar: true,
      size: 112,
      bubbleScale: 1,
      opacity: 1,
      soundEnabled: true,
      soundSet: 'boing',
      volume: 0.78,
      customAudioPath: '',
      completionEasterEgg: true,
      completionSound: false,
      turnCostBubble: true,
      anchor: { ...DEFAULT_ANCHOR },
      patCount: 0,
      customDialogues: [],
      customFrames: {
        idle: '',
        eat: '',
        grin: '',
        xd: ''
      }
    };

    const SOUND_FILES = [
      'boing_press',
      'boing_release',
      'nya_press',
      'nya_release',
      'duck_press',
      'duck_release',
      'combo_chime'
    ];

    const AUDIO_MIME_MAP = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      '.webm': 'audio/webm'
    };

    const IMAGE_MIME_MAP = {
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif'
    };

    function readJsonSafe(filePath) {
      try {
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        return null;
      }
    }

    function normalizeAnchor(raw, prefsVersion) {
      if (!raw || typeof raw !== 'object') return { ...DEFAULT_ANCHOR };
      const hAnchor = raw.hAnchor === 'left' ? 'left' : 'right';
      const vAnchor = raw.vAnchor === 'top' ? 'top' : 'bottom';
      let hDist = Number.isFinite(Number(raw.hDist)) ? Math.max(0, Math.min(4000, Math.round(Number(raw.hDist)))) : DEFAULT_ANCHOR.hDist;
      let vDist = Number.isFinite(Number(raw.vDist)) ? Math.max(0, Math.min(4000, Math.round(Number(raw.vDist)))) : DEFAULT_ANCHOR.vDist;
      // Migrate old v1 default/snapped margin (e.g. 14/16, 26) to flush bottom-right (0, 0)
      if ((!prefsVersion || Number(prefsVersion) < 2) && hAnchor === 'right' && vAnchor === 'bottom' && hDist <= 24 && vDist <= 32) {
        hDist = 0;
        vDist = 0;
      }
      return { v: 2, hAnchor, hDist, vAnchor, vDist };
    }

    function normalizeCustomDialogues(raw) {
      if (!Array.isArray(raw)) return [];
      const seen = new Set();
      const out = [];
      for (const item of raw) {
        const txt = String(item ?? '').trim().slice(0, 120);
        if (!txt || seen.has(txt)) continue;
        seen.add(txt);
        out.push(txt);
        if (out.length >= 60) break;
      }
      return out;
    }

    function normalizeCustomFrames(raw) {
      const out = { idle: '', eat: '', grin: '', xd: '' };
      if (!raw || typeof raw !== 'object') return out;
      for (const k of FRAME_KEYS) {
        out[k] = typeof raw[k] === 'string' ? raw[k].trim() : '';
      }
      return out;
    }

    function normalizePrefs(raw) {
      const rawVer = raw && typeof raw === 'object' ? raw.prefsVersion : 2;
      const merged = { ...DEFAULT_PREFS, ...(raw && typeof raw === 'object' ? raw : {}) };
      merged.prefsVersion = 2;
      merged.enabled = merged.enabled !== false;
      merged.showStatsBar = merged.showStatsBar !== false;
      const sz = Number(merged.size);
      merged.size = Number.isFinite(sz) ? Math.max(64, Math.min(200, Math.round(sz))) : DEFAULT_PREFS.size;
      const bs = Number(merged.bubbleScale);
      merged.bubbleScale = Number.isFinite(bs) ? Math.max(0.65, Math.min(1.6, Math.round(bs * 100) / 100)) : 1;
      const op = Number(merged.opacity);
      merged.opacity = Number.isFinite(op) ? Math.max(0.35, Math.min(1, Math.round(op * 100) / 100)) : 1;
      merged.soundEnabled = merged.soundEnabled !== false;
      merged.soundSet = ['boing', 'nya', 'duck', 'custom'].includes(merged.soundSet) ? merged.soundSet : 'boing';
      const vol = Number(merged.volume);
      merged.volume = Number.isFinite(vol) ? Math.max(0, Math.min(1, Math.round(vol * 100) / 100)) : DEFAULT_PREFS.volume;
      merged.customAudioPath = typeof merged.customAudioPath === 'string' ? merged.customAudioPath.trim() : '';
      merged.completionEasterEgg = merged.completionEasterEgg !== false;
      merged.completionSound = Boolean(merged.completionSound);
      merged.turnCostBubble = merged.turnCostBubble !== false;
      merged.anchor = normalizeAnchor(merged.anchor, rawVer);
      const pats = Number(merged.patCount);
      merged.patCount = Number.isFinite(pats) && pats >= 0 ? Math.floor(pats) : 0;
      merged.customDialogues = normalizeCustomDialogues(merged.customDialogues);
      merged.customFrames = normalizeCustomFrames(merged.customFrames);
      return merged;
    }

    function loadPrefs() {
      const saved = readJsonSafe(PREFS_PATH);
      const normalized = normalizePrefs(saved);
      if (saved && (!saved.prefsVersion || Number(saved.prefsVersion) < 2)) {
        try {
          fs.mkdirSync(PLUGIN_DIR, { recursive: true });
          fs.writeFileSync(PREFS_PATH, JSON.stringify(normalized, null, 2), 'utf8');
        } catch {}
      }
      return normalized;
    }

    function savePrefs(patch) {
      const current = loadPrefs();
      const nextRaw = { ...current, ...(patch && typeof patch === 'object' ? patch : {}), prefsVersion: 2 };
      const next = normalizePrefs(nextRaw);
      try {
        fs.mkdirSync(PLUGIN_DIR, { recursive: true });
        const tmp = `${PREFS_PATH}.tmp.${process.pid}.${Date.now()}`;
        fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8');
        try {
          fs.renameSync(tmp, PREFS_PATH);
        } catch {
          fs.copyFileSync(tmp, PREFS_PATH);
          fs.rmSync(tmp, { force: true });
        }
      } catch {}
      return next;
    }

    function readBase64Asset(absPath, maxBytes = 8 * 1024 * 1024) {
      try {
        if (!absPath || !fs.existsSync(absPath)) return '';
        const st = fs.statSync(absPath);
        if (!st.isFile() || st.size <= 0 || st.size > maxBytes) return '';
        return fs.readFileSync(absPath).toString('base64');
      } catch {
        return '';
      }
    }

    function readImageDataUrl(absPath, maxBytes = 6 * 1024 * 1024) {
      if (!absPath) return '';
      const ext = path.extname(absPath).toLowerCase();
      const mime = IMAGE_MIME_MAP[ext];
      if (!mime) return '';
      const b64 = readBase64Asset(absPath, maxBytes);
      return b64 ? `data:${mime};base64,${b64}` : '';
    }

    function loadBootAssets(prefs) {
      const defaultFrames = {};
      const frames = {};
      const customFrames = (prefs && prefs.customFrames) || {};
      for (const name of FRAME_KEYS) {
        const defPath = path.join(PLUGIN_DIR, 'assets', 'frames', `${name}.webp`);
        const defUrl = readImageDataUrl(defPath, 2 * 1024 * 1024);
        if (defUrl) defaultFrames[name] = defUrl;

        const customUrl = customFrames[name] ? readImageDataUrl(customFrames[name], 6 * 1024 * 1024) : '';
        if (customUrl) {
          frames[name] = customUrl;
        } else if (defUrl) {
          frames[name] = defUrl;
        }
      }

      const sounds = {};
      for (const name of SOUND_FILES) {
        const sp = path.join(PLUGIN_DIR, 'assets', 'sounds', `${name}.wav`);
        const b64 = readBase64Asset(sp, 2 * 1024 * 1024);
        if (b64) {
          sounds[name] = b64;
        }
      }

      let customAudio = null;
      if (prefs && prefs.customAudioPath) {
        const ext = path.extname(prefs.customAudioPath).toLowerCase();
        const mime = AUDIO_MIME_MAP[ext] || '';
        const b64 = mime ? readBase64Asset(prefs.customAudioPath, 8 * 1024 * 1024) : '';
        if (b64) {
          customAudio = {
            path: prefs.customAudioPath,
            name: path.basename(prefs.customAudioPath),
            mime,
            b64
          };
        }
      }

      return { frames, defaultFrames, sounds, customAudio };
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
    const fallbackMetaCache = new Map();

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
              const resetMs = b.resetTime ? Date.parse(b.resetTime) || 0 : 0;
              return {
                bucketId: b.bucketId || '',
                windowKind: b.window || 'other',
                windowLabel: b.window === '5h' ? '5-hour' : (b.window === 'weekly' ? 'Weekly' : (b.displayName || 'Quota')),
                remainingPct: Math.round(rem * 1000) / 10,
                usedPct: Math.round((1 - rem) * 1000) / 10,
                resetMs,
                resetAtIso: b.resetTime || '',
                resetAtMs: resetMs
              };
            });
            return {
              key: (g.displayName || '').toLowerCase().includes('claude') ? 'claude' : ((g.displayName || '').toLowerCase().includes('argon') ? 'argon' : 'gemini'),
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
      const prefs = loadPrefs();
      const assets = loadBootAssets(prefs);
      return {
        ok: true,
        prefs,
        frames: assets.frames,
        defaultFrames: assets.defaultFrames,
        sounds: assets.sounds,
        customAudio: assets.customAudio,
        sidecarInfo: findSidecarServerInfo()
      };
    });

    ipcMain.handle('neko-hud:save-prefs', async (_event, patch) => {
      return savePrefs(patch);
    });

    ipcMain.handle('neko-hud:pick-audio', async (event) => {
      try {
        const dialog = electron && electron.dialog;
        const BrowserWindow = electron && electron.BrowserWindow;
        if (!dialog) return { ok: false, error: 'Dialog unavailable' };
        const win = (BrowserWindow && event && event.sender) ? BrowserWindow.fromWebContents(event.sender) : null;
        const res = await dialog.showOpenDialog(win || undefined, {
          title: '选择 Gemini 猫娘戳一戳音效文件',
          filters: [
            { name: '音频文件', extensions: ['wav', 'mp3', 'ogg', 'm4a', 'aac', 'flac', 'webm'] }
          ],
          properties: ['openFile']
        });
        if (!res || res.canceled || !Array.isArray(res.filePaths) || res.filePaths.length === 0) {
          return { ok: false, canceled: true };
        }
        const filePath = res.filePaths[0];
        const ext = path.extname(filePath).toLowerCase();
        const mime = AUDIO_MIME_MAP[ext];
        if (!mime) return { ok: false, error: '不支持的音频格式' };
        const b64 = readBase64Asset(filePath, 8 * 1024 * 1024);
        if (!b64) return { ok: false, error: '音频文件为空或超过 8MB 限制' };
        const prefs = savePrefs({ customAudioPath: filePath, soundSet: 'custom', soundEnabled: true });
        return {
          ok: true,
          prefs,
          customAudio: {
            path: filePath,
            name: path.basename(filePath),
            mime,
            b64
          }
        };
      } catch (err) {
        return { ok: false, error: err.message || '打开文件选择器失败' };
      }
    });

    ipcMain.handle('neko-hud:pick-frame', async (event, frameKey) => {
      try {
        const key = FRAME_KEYS.includes(frameKey) ? frameKey : 'idle';
        const dialog = electron && electron.dialog;
        const BrowserWindow = electron && electron.BrowserWindow;
        if (!dialog) return { ok: false, error: 'Dialog unavailable' };
        const win = (BrowserWindow && event && event.sender) ? BrowserWindow.fromWebContents(event.sender) : null;
        const labelMap = { idle: '主形象', eat: '思考(吃大米)差分', xd: '戳一下(><)差分', grin: '彩蛋(呲牙笑)差分' };
        const res = await dialog.showOpenDialog(win || undefined, {
          title: `选择自定义${labelMap[key] || '形象'}图片 (支持 PNG/WebP/JPG/GIF)`,
          filters: [
            { name: '图片文件', extensions: ['png', 'webp', 'jpg', 'jpeg', 'gif'] }
          ],
          properties: ['openFile']
        });
        if (!res || res.canceled || !Array.isArray(res.filePaths) || res.filePaths.length === 0) {
          return { ok: false, canceled: true };
        }
        const srcPath = res.filePaths[0];
        const ext = path.extname(srcPath).toLowerCase();
        const mime = IMAGE_MIME_MAP[ext];
        if (!mime) return { ok: false, error: '不支持的图片格式' };
        const st = fs.statSync(srcPath);
        if (!st.isFile() || st.size <= 0 || st.size > 6 * 1024 * 1024) {
          return { ok: false, error: '图片为空或超过 6MB 限制' };
        }
        fs.mkdirSync(CUSTOM_ASSETS_DIR, { recursive: true });
        for (const existingExt of Object.keys(IMAGE_MIME_MAP)) {
          const oldFile = path.join(CUSTOM_ASSETS_DIR, `${key}${existingExt}`);
          if (fs.existsSync(oldFile)) {
            try { fs.rmSync(oldFile, { force: true }); } catch {}
          }
        }
        const destPath = path.join(CUSTOM_ASSETS_DIR, `${key}${ext}`);
        fs.copyFileSync(srcPath, destPath);
        const dataUrl = readImageDataUrl(destPath, 6 * 1024 * 1024);
        if (!dataUrl) return { ok: false, error: '读取自定义图片失败' };

        const current = loadPrefs();
        const nextCustomFrames = { ...(current.customFrames || {}), [key]: destPath };
        const prefs = savePrefs({ customFrames: nextCustomFrames });
        return { ok: true, frameKey: key, dataUrl, prefs };
      } catch (err) {
        return { ok: false, error: err.message || '打开图片选择器失败' };
      }
    });

    ipcMain.handle('neko-hud:reset-frames', async (_event, frameKey) => {
      try {
        const current = loadPrefs();
        const nextCustomFrames = { ...(current.customFrames || {}) };
        const targets = (frameKey && FRAME_KEYS.includes(frameKey)) ? [frameKey] : FRAME_KEYS;
        for (const k of targets) {
          if (nextCustomFrames[k] && nextCustomFrames[k].startsWith(CUSTOM_ASSETS_DIR)) {
            try { fs.rmSync(nextCustomFrames[k], { force: true }); } catch {}
          }
          nextCustomFrames[k] = '';
        }
        const prefs = savePrefs({ customFrames: nextCustomFrames });
        const assets = loadBootAssets(prefs);
        return { ok: true, prefs, frames: assets.frames };
      } catch (err) {
        return { ok: false, error: err.message || '恢复默认形象失败' };
      }
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
        const host = info.host || '127.0.0.1';
        const headers = info.token ? { 'X-Sidecar-Token': info.token } : {};
        const summaryPromise = httpJsonRequest({
          host,
          port: info.port,
          path: `/api/hud-summary?${qs.toString()}`,
          headers,
          timeoutMs: 1400
        });
        let quotaPromise = null;
        if (forceRefresh === 'turn-end') {
          const qQs = new URLSearchParams();
          qQs.set('refresh', '1');
          if (info.token) qQs.set('token', info.token);
          quotaPromise = httpJsonRequest({
            host,
            port: info.port,
            path: `/api/quota?${qQs.toString()}`,
            headers,
            timeoutMs: 2200
          });
        }
        const [res, qRes] = await Promise.all([summaryPromise, quotaPromise]);
        if (res.ok && res.data) {
          if (qRes && qRes.ok && qRes.data && qRes.data.quota) {
            res.data.quota = qRes.data.quota;
          }
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
