@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 LTS from https://nodejs.org/en/download
  echo Then close this window and run start-demo.cmd again.
  pause
  exit /b 1
)
node -e "const v=process.versions.node.split('.').map(Number);if(v[0]<22||(v[0]===22&&v[1]<12)){console.error('Please install Node.js 24 LTS.');process.exit(1)}"
if errorlevel 1 (
  pause
  exit /b 1
)
if not exist "node_modules\vite\package.json" (
  echo Installing project dependencies. Internet access is needed on the first run.
  call npm.cmd ci
  if errorlevel 1 (
    echo Installation failed. Check your connection and try again.
    pause
    exit /b 1
  )
)
echo Keep this window open while using the website.
call npm.cmd start -- --open
pause
