@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================================
echo   反重力观察窗 (Antigravity Observer) 一键安装程序
echo ======================================================
echo.
echo [1/2] 正在部署 Sidecar 上下文观察面板插件...
node setup.cjs --sidecar-only
echo.
echo [2/2] 正在为 Antigravity 主窗口安装底部统计栏与观察窗补丁...
echo       (会自动保留原中文汉化补丁，安全重启 Antigravity)
echo.
node setup.cjs --apply-staged --kill --relaunch
if errorlevel 1 (
  echo.
  echo [!] 安装遇到问题，请确认已安装 Node.js 且 Antigravity 已关闭。
  pause
  exit /b 1
)
echo.
echo [√] 安装完成！Antigravity 已重新启动，输入框下方观察窗已激活！
timeout /t 3 >nul
