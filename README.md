# Gemini 猫娘观察台 · 反重力观察窗（Antigravity Observer）

> 专为 **Google Antigravity 2.0** 打造的应用内紧贴右下角 **Gemini 猫娘挂件** 与**上下文 / Token / 额度观察窗**（插件 ID：`gemini-neko-cockpit`）。

---

## ✨ 核心特性

### 1. 应用内紧贴右下角 Gemini 猫娘挂件
- **平时仅显示主形象**：紧贴窗口右下角（`0px` 贴边），静默呈现统一色彩与透明抠图后的 Gemini 娘主形象，无常驻遮挡条与按钮。
- **表情差分实时联动**：
  - **平时待机**：主形象立绘，带有柔和呼吸微动；
  - **思考 / 生成中**：检测到模型正在推理或发送按钮为取消态时，自动切换为统一色调的 **「吃大米」差分**；
  - **戳一下**：触发 **`><` 差分**、Q 弹按压回弹与离线合成音效；
  - **彩蛋差分（呲牙笑）**：连戳 3 下或 AI 一轮思考完成时短暂触发 **「呲牙笑」差分**。
- **左键 3 段式椭圆气泡交互（对标 DSH 小鲸鱼气泡）**：
  1. **第一次左键点击形象**：弹出椭圆思考气泡展示当前**模型剩余额度、上下文长度与已用 Token**（同时触发 `><` 差分与音效）；
  2. **再次左键单击气泡**：平滑淡入切换为猫娘台词对话（「好猫猫…」「好模型…」以及用户自己添加的自定义语句）；
  3. **第三次左键点击气泡**：关闭气泡。
- **每轮对话完成自动冒泡（10 秒自动关闭）**：
  - 每次与模型对话结束后自动弹出气泡，展示本轮消耗的额度变化、最新剩余额度与新增 Token，**10 秒后自动收起**（也可点击提前关闭，可在设置中开关）。
- **右键信息卡 & 独立「挂件设置」按钮**：
  - **右键点击形象**弹出完整遥测信息卡片（上下文长度 / 服务端构成拆解 / 本对话已用 Token / 模型 5h 与每周剩余额度），底部提供 **`🔍 上下文观察窗口`**、**`🔄 刷新`** 与独立的 **`⚙️ 挂件设置`** 按钮。
  - 在「挂件设置」中支持：
    - 📏 **挂件大小 / 👁 透明度** 滑块实时预览；
    - 💭 **气泡大小** 按钮调节（`－` / `小` / `默认` / `大` / `超大` / `＋`）；
    - 🖼️ **自定义形象**（`更改主形象` 及 `思考` / `戳一戳` / `彩蛋` 差分图，支持 `.png / .webp / .jpg / .gif` 与一键恢复默认）；
    - 💬 **自定义气泡对话**（输入框 + `+ 添加对话` 按钮，支持 `{quota_5h}`、`{ctx_pct}` 等动态占位符，逐条删除）；
    - 🔊 **戳一下声音**（内置 **Q弹叮咚** / **软萌喵呜** / **小黄鸭** 离线合成 WAV + 本地自定义音频选择，支持 60s 空闲挂起与输入法组字避让）；
    - 📍 **四分之一边缘拖拽吸附 + 贴左水平镜像翻转**（`v:2` 锚点自适应全屏/窗口缩放）。

### 2. 输入框下方紧凑统计栏 & 深度观察窗口 & Sidecar
- 保留输入框 `[data-testid="agent-input-box"]` 下方 15px 紧凑统计胶囊（可在设置中随时开关），点击弹出可顺畅滚动的「反重力上下文观察窗口」。
- 注册 Antigravity 原生 `AUX_PANE` Sidecar 面板（`sidecar://gemini-neko-cockpit/neko-cockpit/ui.html`）。
- ASAR 补丁仅以独立隔离标记块 `// ===== GEMINI_NEKO_HUD_BEGIN =====` ~ `END` 附加于 `dist/main.js` 与 `dist/preload.js` 末尾，完整保留 [`antigravity-zh-plugin`](https://github.com/yunjuanyunshu114-byte/antigravity-zh-plugin)（`AG_ZH`）汉化代码及官方备份。

---

## 📦 如何安装

### 前置条件
- 已安装 **Google Antigravity 2.0** 桌面客户端（Windows / macOS / Linux）
- 已安装 **Node.js 18+**（命令行可执行 `node -v`）

### 方式一：Windows 一键双击安装（推荐）

```bash
git clone https://github.com/yunjuanyunshu114-byte/antigravity-observer.git
```
进入仓库目录，双击运行 [`双击安装观察窗补丁.bat`](./双击安装观察窗补丁.bat) 即可自动部署插件资源、同步写入主窗口补丁并重启 Antigravity。

### 方式二：命令行安装 / 更新 / 检查 / 卸载

```bash
git clone https://github.com/yunjuanyunshu114-byte/antigravity-observer.git
cd antigravity-observer

# 默认安装（部署 Sidecar 与资源 + 生成/应用 app.asar 补丁）
node setup.cjs

# 若 Antigravity 正在运行且锁住了文件，关闭后应用或直接关闭并重启应用：
node setup.cjs --kill --relaunch

# 状态检查与全套 Antigravity 契约自检
node setup.cjs --check
node setup.cjs --doctor

# 安全卸载（保留原有 AG_ZH 汉化与官方备份）
node setup.cjs --uninstall --kill --relaunch
```

---

## 📁 目录结构

```text
├── assets/
│   ├── frames/                      # 4 帧统一色调贴边透明 WebP 立绘 (idle / eat / grin / xd)
│   ├── sounds/                      # 离线合成音效包 (boing / nya / duck / combo_chime)
│   └── logo.png                     # 插件图标 (256x256 RGBA)
├── hud/
│   ├── main_bridge.js               # Electron 主进程桥接、配置迁移持久化、自定义资源选择与 RPC 兜底
│   └── preload_hud.js               # 渲染层注入：右下角 Gemini 猫娘挂件、椭圆气泡、右键详情卡与观察弹窗
├── sidecars/neko-cockpit/
│   ├── sidecar.json                 # Sidecar 清单 (AUX_PANE)
│   ├── server.cjs                   # 本地观测 HTTP 服务 & Language Server / Transcript 引擎
│   └── ui.html                      # Sidecar 侧栏 Web UI
├── skills/gemini-neko-cockpit/
│   └── SKILL.md                     # 对话内快捷调用 Antigravity Skill
├── src/
│   └── asar_patcher.js              # ASAR 无损重写与 SHA-256 块校验器
├── plugin.json                      # Antigravity 插件元信息
├── setup.cjs                        # 安装 / 暂存 / 状态检查 / 自检 / 卸载主程序
├── 双击安装观察窗补丁.bat             # Windows 一键安装脚本
└── 双击卸载观察窗补丁.bat             # Windows 一键卸载脚本
```

---

## 🙏 开源参考与致谢

本项目在开发与交互设计过程中参考并融合了以下优秀开源项目的思路与实现：
- [`MeteorNOX/DeepSeek-Balance-Whale-Widget`](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)（Q弹按压手感、3 段式思考气泡、每轮消耗冒泡、Web Audio 预解码与同步起播、空闲挂起、IME 组字避让、四边吸附与左翻）
- [`Void-LifeStream/dsh-gemini-kitten-widget`](https://github.com/Void-LifeStream/dsh-gemini-kitten-widget)（Gemini 猫娘挂件视觉、锚点定位与额度分级展示）
- [`Sutera-Diffusus/dsh-whale-musume`](https://github.com/Sutera-Diffusus/dsh-whale-musume)（不打扰工作态原则与互动彩蛋体验）
- [`subamanis/agy-cockpit`](https://github.com/subamanis/agy-cockpit)、[`n2ns/antigravity-panel`](https://github.com/n2ns/antigravity-panel)、[`YashjitPal/BetterGravity`](https://github.com/YashjitPal/BetterGravity)、[`qqxpee/antigravity2-cn`](https://github.com/qqxpee/antigravity2-cn)
