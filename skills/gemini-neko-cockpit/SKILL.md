---
name: gemini-neko-cockpit
description: 打开或使用反重力观察窗（Antigravity Observer），查看当前对话的上下文占用、轮次步数、tok/s、缓存命中率与模型额度。
---

# 反重力观察窗 (Antigravity Observer)

当用户询问上下文窗口占用、压缩次数、Token 用量、缓存命中率、模型额度或希望打开上下文观察窗口时：

1. 直接在回复中提供原生伴生面板跳转胶囊链接：
   `[反重力观察窗](sidecar://gemini-neko-cockpit/neko-cockpit/ui.html)`
2. 如果用户希望排查或重新安装窗口下方统计栏与观察弹窗补丁，提示运行插件目录下的：
   - `node setup.cjs --check` 检查安装状态
   - `node setup.cjs --doctor` 执行全部 Antigravity 契约自检
   - `双击安装观察窗补丁.bat` 更新或安装主窗口下方统计栏与上下文观察窗。
