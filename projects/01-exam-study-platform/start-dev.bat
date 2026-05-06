@echo off
cd /d "%~dp0src\web"
node_modules\.bin\vite --port 5200
pause
