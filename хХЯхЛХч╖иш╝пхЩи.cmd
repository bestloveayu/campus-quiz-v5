@echo off
cd /d "%~dp0"
echo Campus interaction editor V5
echo Open http://127.0.0.1:3034/ in your browser.
echo Keep this window open while using the editor.
set "CAMPUS_PY=C:\Users\bestl\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if exist "%CAMPUS_PY%" (
  "%CAMPUS_PY%" server.py
) else (
  python server.py
)
echo.
echo Server stopped. If port 3034 is already in use, the editor may already be running.
pause
