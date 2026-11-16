@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================================
echo   Gemini 猫娘观察台 · 反重力观察窗 一键安装程序
echo ======================================================
echo.
echo 正在部署 Sidecar、同步猫娘形象与音效资源，并安装主窗口补丁...
echo (会自动保留原中文汉化补丁，并安全重启 Antigravity)
echo.
node setup.cjs --kill --relaunch
if errorlevel 1 (
  echo.
  echo [!] 安装遇到问题，请确认已安装 Node.js 18+ 且拥有 Antigravity 目录写入权限。
  pause
  exit /b 1
)
echo.
echo [√] 安装完成！Antigravity 已重新启动，右下角 Gemini 猫娘挂件与观察窗已激活！
timeout /t 3 >nul
