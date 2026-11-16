@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================================
echo   Gemini 猫猫观察台 (Neko Cockpit) 一键安全卸载程序
echo ======================================================
echo.
echo 正在安全移除猫猫补丁与 Sidecar 插件（保留原有中文汉化补丁）...
node setup.cjs --uninstall --kill --relaunch
if errorlevel 1 (
  echo.
  echo [!] 卸载遇到问题，请关闭 Antigravity 后重试。
  pause
  exit /b 1
)
echo.
echo [√] 已卸载并恢复 Antigravity！
timeout /t 3 >nul
