@echo off
setlocal

cd /d "%~dp0"

echo ==========================================
echo Building NSIS Setup package...
echo ==========================================

if not exist "dist\sb-server.exe" (
  echo [INFO] Building sb-server.exe first...
  call npm run build:server-exe
  if errorlevel 1 goto err_pkg
)

if not exist "dist\sb-server.exe" goto err_no_server_exe

if not exist "tools\nssm\nssm.exe" goto err_no_nssm
if not exist "tools\nginx\nginx.exe" goto err_no_nginx
if not exist "tools\mysql-8.0.45-winx64\bin\mysqld.exe" goto err_no_mysql

set "MAKENSIS_PATH="
for %%I in (makensis.exe) do set "MAKENSIS_PATH=%%~$PATH:I"
if not defined MAKENSIS_PATH if exist "C:\Program Files (x86)\NSIS\makensis.exe" set "MAKENSIS_PATH=C:\Program Files (x86)\NSIS\makensis.exe"
if not defined MAKENSIS_PATH if exist "C:\Program Files\NSIS\makensis.exe" set "MAKENSIS_PATH=C:\Program Files\NSIS\makensis.exe"

if not defined MAKENSIS_PATH goto err_no_nsis

echo [INFO] Building NSIS installer...
"%MAKENSIS_PATH%" "installer\server-setup-nsis.nsi"
if errorlevel 1 goto err_nsis

if not exist "dist\SB-Smart-Server-Setup-NSIS.exe" goto err_no_setup

echo.
echo [SUCCESS] Output setup: dist\SB-Smart-Server-Setup-NSIS.exe
exit /b 0

:err_pkg
echo [ERROR] Failed to build sb-server.exe
exit /b 1

:err_no_server_exe
echo [ERROR] dist\sb-server.exe not found
exit /b 1

:err_no_nssm
echo [ERROR] tools\nssm\nssm.exe not found
exit /b 1

:err_no_nginx
echo [ERROR] tools\nginx\nginx.exe not found
exit /b 1

:err_no_mysql
echo [ERROR] tools\mysql-8.0.45-winx64\bin\mysqld.exe not found
exit /b 1

:err_no_nsis
echo [ERROR] NSIS compiler (makensis.exe) not found
echo Install NSIS from https://nsis.sourceforge.io/Download
exit /b 1

:err_nsis
echo [ERROR] NSIS build failed
exit /b 1

:err_no_setup
echo [ERROR] Setup file was not created
exit /b 1
