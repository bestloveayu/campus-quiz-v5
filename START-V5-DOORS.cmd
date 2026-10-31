@echo off
cd /d "%~dp0"
echo Campus Learning Island V5 - Doors and Unlock Rules
echo This edition uses port 3035 to avoid conflicting with the old V5 on 3034.
echo Open http://127.0.0.1:3035/ after the server starts.
set "CAMPUS_PY=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if exist "%CAMPUS_PY%" (
  "%CAMPUS_PY%" server.py --port 3035
) else (
  where py >nul 2>&1
  if errorlevel 1 (
    python server.py --port 3035
  ) else (
    py -3 server.py --port 3035
  )
)
echo.
echo Server stopped. Check Python installation and port 3035 if it did not start.
pause
