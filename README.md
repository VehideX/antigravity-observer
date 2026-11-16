# 反重力观察窗（Antigravity Observer · Gemini 猫猫观察台）

> 专为 **Google Antigravity 2.0** 组装并深度优化的上下文与额度可视化增强插件（插件 ID：`gemini-neko-cockpit`）。
> 集成了**输入框下方超紧凑单行统计条**、**可顺畅滚动的上下文深度观察弹窗**、**原生 Sidecar 观察台侧栏**，以及**窗口角落可按压交互的 Gemini 猫猫**。

---

## ✨ 核心功能

1. **输入框下方超紧凑单行统计胶囊**
   - 紧贴 `[data-testid="agent-input-box"]` 下方单行显示：`X 轮 Y 步 · Z tok/s · 总 tok · 缓存命中 XX.X% · ◔ 上下文%`（以及 `压缩 N 次` 标签）。
   - 采用 15px 紧凑胶囊布局，不挤占对话视口；点击即可直接弹出**上下文观察窗口**。
2. **上下文观察窗口（弹窗 & Sidecar 侧栏双入口）**
   - **主窗口观察弹窗**：展示轮次/步数、服务端上下文占用与真实上限、精确缓存命中率、实时生成速度（`tok/s` / `TTFT`）、服务端精准构成拆解（系统提示词 / 工具 / 聊天消息）、各模型 5 小时与每周额度及重置倒计时、工具消耗分类、已加载 `SKILL.md` 与压缩次数、`CHECKPOINT` 健康分级、最重步骤 Top 5、高频读写文件，并支持右上角下拉切换历史对话。
   - **原生 Sidecar 侧栏**：注册 Antigravity 原生 `AUX_PANE` 观察面板（`sidecar://gemini-neko-cockpit/neko-cockpit/ui.html`），支持全局会话检索与 Two-Step Smart Handoff。
   - **滚动与稳定性优化**：弹窗采用持久 DOM 外壳与滚动容器，定时遥测刷新时自动保存并恢复 `scrollTop`，解决长列表拉不下去、拖动滚动条跳回顶部的问题。
3. **窗口一角可按压交互 Gemini 猫猫**
   - 默认右下角停靠（支持四角切换、小/中/大三档尺寸及自由拖拽定位）。
   - 四态透明精灵图（待机 / 思考中 / 工具执行中 / 摸头害羞），支持摸头手型光标、Q 弹按压形变、飘心粒子、好感度计数与 `✦ 喵言喵语 ✦` 思考气泡。
   - 点击侧边 `···` 随时打开悬浮状态卡查看 **Gemini / Claude & GPT / Argon 额度与重置倒计时**、本会话消费与上下文进度条；点击 `≡` 快速开关组件与调整位置尺寸。
4. **严格按窗口 / 按每次对话独立绑定**
   - 新开窗口、点击「+ 新建对话」或「在此项目中新建对话」切换回欢迎页时，自动忽略隐藏保活的旧会话标签，实时清零显示为 `0 轮 0 步 · 0 tok · 新对话 · 0%`，杜绝上一个对话残留。
5. **与现有中文汉化补丁无损共存**
   - ASAR 补丁仅以独立隔离块 `// ===== GEMINI_NEKO_HUD_BEGIN =====` ~ `END` 附加于 `dist/main.js` 与 `dist/preload.js` 末尾，完整保留 [`antigravity-zh-plugin`](https://github.com/yunjuanyunshu114-byte/antigravity-zh-plugin)（`AG_ZH`）汉化代码及 `app.asar.bak` 官方备份。

---

## 📦 如何安装

### 前置条件
- 已安装 **Google Antigravity 2.0** 桌面客户端（Windows / macOS / Linux，脚本主要面向 Windows 一键体验，CLI 跨平台通用）
- 已安装 **Node.js 18+**（命令行可执行 `node -v`）

### 方式一：Windows 一键双击安装（推荐）

1. 克隆或下载本仓库压缩包并解压到本地任意文件夹：
   ```bash
   git clone https://github.com/yunjuanyunshu114-byte/antigravity-observer.git
   ```
2. 双击运行仓库根目录中的：
   - [`双击安装窗口猫猫补丁.bat`](./双击安装窗口猫猫补丁.bat)
3. 脚本会自动完成以下操作：
   - 将插件清单、精灵图资源、`SKILL.md` 及 Sidecar 服务安装到 `~/.gemini/config/plugins/gemini-neko-cockpit`；
   - 关闭并安全为 Antigravity 的 `resources/app.asar` 打入主进程桥接与预加载 HUD 补丁（自动保留已有汉化）；
   - 重新启动 Antigravity 生效。

### 方式二：命令行安装（支持自定义安装与客户端更新后一键恢复）

```bash
git clone https://github.com/yunjuanyunshu114-byte/antigravity-observer.git
cd antigravity-observer

# 1) 默认安装（部署 Sidecar + 写入/暂存 app.asar 补丁）
node setup.cjs

# 如果 Antigravity 正在运行且锁住了 app.asar，可执行以下指令关闭并应用暂存补丁后重启：
node setup.cjs --apply-staged --kill --relaunch
```

> **仅安装 Sidecar 伴生面板（不修改 `app.asar`，无主窗口猫猫和底部栏）**：
> ```bash
> node setup.cjs --sidecar-only
> ```

> **Antigravity 官方客户端自动更新后**：原 `app.asar` 会被新版本覆盖，重新双击一次 `双击安装窗口猫猫补丁.bat`（或执行 `node setup.cjs --kill --relaunch`）即可一键恢复观察窗与猫猫。

### 状态检查、自检与卸载

```bash
# 查看插件部署与 app.asar 补丁状态（含原汉化完整性检查）
node setup.cjs --check

# 运行全套自检（Language Server RPC、Transcript 解析、Sidecar 端口与权限契约）
node setup.cjs --doctor

# 安全卸载（移除插件并剥离 HUD 标记块，保留原有 AG_ZH 汉化与官方备份）
node setup.cjs --uninstall --kill --relaunch
```
也可直接双击 [`双击卸载窗口猫猫补丁.bat`](./双击卸载窗口猫猫补丁.bat) 一键卸载。

---

## 🔧 用了什么方法（核心实现原理）

### 1. 多源数据采集：Language Server 本地 RPC + Transcript 增量解析
- **自动服务发现与私有 gRPC/Connect-JSON 调用**（`sidecars/neko-cockpit/server.cjs`、`hud/main_bridge.js`）：
  - 扫描 `~/.gemini/antigravity/daemon/*.json` 读取运行中的 Antigravity Language Server 端口与 CSRF Token，建立本机 HTTPS/HTTP2 客户端，调用：
    - `GetAllCascadeTrajectories`：获取会话列表与实时步数/运行状态；
    - `GetCascadeTrajectoryGeneratorMetadata`：获取模型级权威 `maxContextTokens`、`estimatedTokensUsed`、`tokenBreakdown`（`System Prompt / Tools / Chat Messages`）、流式输出速率 `tok/s` 与首字延迟 `TTFT`；
    - `RetrieveUserQuotaSummary` / `GetCascadeModelConfigData` / `GetUserStatus`：获取账户订阅等级与各模型池 5 小时、每周剩余额度及精确重置时间戳。
- **本地日志文件增量解析**：
  - 结合 `~/.gemini/antigravity/brain/<cascadeId>/.system_generated/logs/transcript.jsonl`（与 `transcript_full.jsonl`）统计真实用户轮次、步数、新输入 Token、缓存读取 Token、输出 Token，按 `cacheRead / (input + cacheRead)` 计算精准缓存命中率，并拆解文件读写热点、重型步骤 Top 5、`SKILL.md` 加载足迹及 `CHECKPOINT` 压缩等级。

### 2. Sidecar 伴生服务 + Electron ASAR 无损双通道架构
- **Antigravity 原生 Sidecar 插件**（`plugin.json`、`sidecars/neko-cockpit/sidecar.json`、`server.cjs`、`ui.html`）：
  - 注册 Sidecar Web UI 入口 `SIDECAR_UI_ENTRYPOINT_AUX_PANE`，内建零外部依赖的 Node HTTP 服务提供 `/api/status`、`/api/hud-summary`、`/api/context-breakdown` 等接口，并通过 `~/.gemini/config/plugins/gemini-neko-cockpit/runtime_server.json` 共享端口与令牌。
- **ASAR 二进制无损重写与 SHA-256 块校验**（`src/asar_patcher.js`、`setup.cjs`）：
  - 解析 Electron `app.asar` 头部索引与文件偏移，计算 4MB 分块 `SHA-256` 完整性元数据，以追加隔离标记块（`GEMINI_NEKO_HUD_BEGIN` ~ `END`）的方式向 `dist/main.js` 注入 `ipcMain` 通信桥、向 `dist/preload.js` 注入渲染端 UI；补丁前后严格校验 `node --check` 语法及原有 `AG_ZH` 汉化块不受损，且在 Windows 文件被锁时自动暂存为 `app.asar.neko-staged` 安全替换。
- **主进程降级兜底**（`hud/main_bridge.js`）：
  - 渲染端优先通过 `neko-hud:get-state` 向本地 Sidecar 查询聚合数据；若 Sidecar 暂未拉起，`main_bridge.js` 会直接复用本机 Language Server RPC 与 Transcript 解析器无缝兜底，保证猫猫状态卡与底部统计栏随时可用。

### 3. Electron `contextIsolation: true` 下的渲染层注入与严格会话绑定
- **跨隔离上下文 UI 挂载**（`hud/preload_hud.js`）：
  - 主客户端启用了 `contextIsolation: true`，HUD 在独立预加载世界中运行，直接通过标准 DOM API 在可见 `[data-testid="agent-input-box"]` 下方挂载紧凑统计胶囊，并在右上/右下等角挂载猫猫浮层与观察弹窗，通过 `ipcRenderer.invoke` 与主进程交换遥测与偏好配置（持久化至 `hud_prefs.json`）。
- **每窗口 / 新建对话防串台机制**：
  - **可见性感知**：利用 `hidden`、`aria-hidden`、`getClientRects()` 与 `getComputedStyle()` 过滤 Antigravity 切换页面后仍留在 DOM 中的隐藏保活会话容器，避免读取已隐藏旧对话的 `data-cascade-id`。
  - **多信号判定与即时清零**：结合路由 `/c/<uuid>` 与首页 `/`、可见 `conversation-view` 属性、可见消息步骤数与 `document.title` 综合判定当前会话；当切换至欢迎页或新对话时同步触发 `syncActiveConversation()` 立即清零界面并递增 `refreshSeq` 请求序列号，自动丢弃在途过期异步返回；同时 Sidecar `/api/hud-summary?strict=1` 与 `main_bridge.js` 在空 `convId` 时彻底禁止回退到最近对话。
  - **事件联动检测**：通过 `MutationObserver`（监听 DOM 增删及 `data-cascade-id` / `hidden` / `aria-hidden` 属性变化）、侧栏与新建对话按钮点击捕获、`Ctrl/Cmd+Shift+O` 快捷键捕获与 `250ms` 轻量路由轮询确保新建对话同步刷新。
- **滚动容器不跳顶与防中断设计**：
  - 观察弹窗 `.gn-modal-card` / `.gn-modal-head` / `.gn-modal-body` 在打开后保持 DOM 节点实例不变，轮询更新时仅对比内容签名并在读写 `bodyEl.scrollTop` 保护下局部更新内容，确保拖拽滚动条与滚轮浏览长列表稳定顺畅。

### 4. 交互式透明猫娘动画与物理反馈
- 4 帧横向精灵图（`assets/neko_strip.webp` / `neko_strip.png`）通过 CSS `background-position` 切换 **待机 / 思考 / 工作 / 摸头害羞** 状态；
- 结合 `PointerEvent`（`setPointerCapture`）区分短按摸头与长按拖拽，按压时触发 CSS `scale(1.11, 0.84)` Q 弹形变与飘心粒子，松手切换四角吸附或自定义坐标。

---

## 📁 目录结构

```text
├── assets/                          # Gemini 猫娘四态精灵图 (webp / png) 与插件图标
├── hud/
│   ├── main_bridge.js               # Electron 主进程 IPC 桥接 & Language Server 兜底采集
│   └── preload_hud.js               # 渲染层注入：紧凑状态栏、角落猫猫、观察弹窗 & 会话隔离
├── sidecars/neko-cockpit/
│   ├── sidecar.json                 # Sidecar 清单 (AUX_PANE)
│   ├── server.cjs                   # Sidecar 本地观测 HTTP 服务 & Transcript/RPC 引擎
│   └── ui.html                      # Sidecar 侧栏完整 Web UI
├── skills/gemini-neko-cockpit/
│   └── SKILL.md                     # 对话内快捷调用观察台的 Antigravity Skill
├── src/
│   └── asar_patcher.js              # ASAR 读写、SHA-256 块完整性重打包与校验器
├── plugin.json                      # Antigravity 插件元信息
├── setup.cjs                        # 安装 / 暂存应用 / 状态检查 / 自检 / 卸载主程序
├── 双击安装窗口猫猫补丁.bat           # Windows 一键安装脚本
└── 双击卸载窗口猫猫补丁.bat           # Windows 一键卸载脚本
```

---

## 🙏 开源参考与致谢

本项目在开发与组装过程中参考并整合了以下优秀开源项目的思路与实现：
- [`subamanis/agy-cockpit`](https://github.com/subamanis/agy-cockpit)（Sidecar 上下文观测与交接基础框架）
- [`n2ns/antigravity-panel`](https://github.com/n2ns/antigravity-panel)（Language Server 元数据与额度接口调用思路）
- [`noone89A/dsh-gauge`](https://github.com/noone89A/dsh-gauge)（轮步与速率/缓存命中统计条设计）
- [`PC2005-cloud/dsh-pet`](https://github.com/PC2005-cloud/dsh-pet) & [`luoyan96/dsh-catnap-studio`](https://github.com/luoyan96/dsh-catnap-studio)（角落交互宠物与按压气泡样式灵感）
- [`YashjitPal/BetterGravity`](https://github.com/YashjitPal/BetterGravity)（Antigravity DOM 结构与路由特征参考）
- [`qqxpee/antigravity2-cn`](https://github.com/qqxpee/antigravity2-cn)（无损 ASAR 补丁及汉化共存实践）
