@echo off
REM Builds the Windows desktop executable of my-version.
REM   1. npm install        (once)
REM   2. this script        -> dist\my-version-win32-x64\my-version.exe
setlocal
cd /d "%~dp0"

where node >nul 2>nul || (echo node is required & exit /b 1)

if not exist node_modules\electron\dist\electron.exe (
  echo installing the electron runtime...
  call npm install --no-audit --no-fund || exit /b 1
  if not exist node_modules\electron\dist\electron.exe (
    node node_modules\electron\install.js || exit /b 1
  )
)

if not exist build.ico node tools\make-icon.js

echo packaging...
call npx --yes @electron/packager . "my-version" --platform=win32 --arch=x64 ^
  --out=dist --overwrite --asar --prune=true --icon=build.ico || exit /b 1

echo.
echo done: dist\my-version-win32-x64\my-version.exe
start "" "dist\my-version-win32-x64\my-version.exe"
endlocal
