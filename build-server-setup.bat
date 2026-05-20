@echo off
setlocal

cd /d "%~dp0"

echo ==========================================
echo Building Setup package only...
echo ==========================================

if not exist "1.png" goto err_missing_png

if exist "node_modules" goto deps_ok
echo [INFO] Installing dependencies...
call npm install
if errorlevel 1 goto err_npm_install
:deps_ok

if exist "build\icon.ico" goto icon_ok
echo [INFO] Generating icon.ico...
call node scripts\png-to-ico.js
if errorlevel 1 goto err_icon
:icon_ok

if exist "tools\nssm\nssm.exe" goto nssm_ok
echo [INFO] Preparing NSSM helper...
if not exist "tools\nssm" mkdir "tools\nssm"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'tools\\nssm\\nssm.zip'"
if errorlevel 1 goto err_nssm_download
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path 'tools\\nssm\\nssm.zip' -DestinationPath 'tools\\nssm\\extract' -Force"
if errorlevel 1 goto err_nssm_extract
if exist "tools\nssm\extract\nssm-2.24\win64\nssm.exe" copy /y "tools\nssm\extract\nssm-2.24\win64\nssm.exe" "tools\nssm\nssm.exe" >nul
if not exist "tools\nssm\nssm.exe" goto err_no_nssm_exe
"tools\nssm\nssm.exe" version >nul 2>&1
if errorlevel 1 goto err_bad_nssm_exe
:nssm_ok

if exist "tools\nginx\nginx.exe" goto nginx_ok
echo [INFO] Preparing Nginx 1.30.0...
if not exist "tools\nginx" mkdir "tools\nginx"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://nginx.org/download/nginx-1.30.0.zip' -OutFile 'tools\\nginx\\nginx-1.30.0.zip'"
if errorlevel 1 goto err_nginx_download
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path 'tools\\nginx\\nginx-1.30.0.zip' -DestinationPath 'tools\\nginx\\extract' -Force"
if errorlevel 1 goto err_nginx_extract
if exist "tools\nginx\extract\nginx-1.30.0\*" xcopy /E /I /Y "tools\nginx\extract\nginx-1.30.0\*" "tools\nginx\" >nul
if not exist "tools\nginx\nginx.exe" goto err_no_nginx_exe
"tools\nginx\nginx.exe" -v >nul 2>&1
if errorlevel 1 goto err_bad_nginx_exe
:nginx_ok

if exist "tools\win-acme\wacs.exe" goto wacs_ok
echo [INFO] Preparing win-acme helper...
if not exist "tools\win-acme" mkdir "tools\win-acme"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.trimmed.zip' -OutFile 'tools\\win-acme\\win-acme.zip'"
if errorlevel 1 goto err_wacs_download
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path 'tools\\win-acme\\win-acme.zip' -DestinationPath 'tools\\win-acme\\extract' -Force"
if errorlevel 1 goto err_wacs_extract
if exist "tools\win-acme\extract\*" xcopy /E /I /Y "tools\win-acme\extract\*" "tools\win-acme\" >nul
if not exist "tools\win-acme\wacs.exe" goto err_no_wacs_exe
:wacs_ok

if exist "tools\mysql-8.0.45-winx64\bin\mysqld.exe" goto mysql_ok
echo [INFO] Preparing MySQL 8.0.45...
if not exist "tools\mysql-8.0.45-winx64.zip" goto err_no_mysql_zip
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path 'tools\\mysql-8.0.45-winx64.zip' -DestinationPath 'tools' -Force"
if errorlevel 1 goto err_mysql_extract
if not exist "tools\mysql-8.0.45-winx64\bin\mysqld.exe" goto err_no_mysql_exe
:mysql_ok

echo [INFO] Preparing internal server binary for setup...
call npm run build:server-exe
if errorlevel 1 goto err_pkg

if not exist "dist\sb-server.exe" goto err_no_server_exe

set "ISCC_PATH="
for %%I in (ISCC.exe) do set "ISCC_PATH=%%~$PATH:I"
if not defined ISCC_PATH if exist "C:\Progra~2\Inno Setup 7\ISCC.exe" set "ISCC_PATH=C:\Progra~2\Inno Setup 7\ISCC.exe"
if not defined ISCC_PATH if exist "C:\Progra~1\Inno Setup 7\ISCC.exe" set "ISCC_PATH=C:\Progra~1\Inno Setup 7\ISCC.exe"
if not defined ISCC_PATH if exist "C:\Progra~2\Inno Setup 6\ISCC.exe" set "ISCC_PATH=C:\Progra~2\Inno Setup 6\ISCC.exe"
if not defined ISCC_PATH if exist "C:\Progra~1\Inno Setup 6\ISCC.exe" set "ISCC_PATH=C:\Progra~1\Inno Setup 6\ISCC.exe"

if not defined ISCC_PATH goto err_no_iscc

if exist "dist\SB-Smart-Server-Setup.exe" (
  del /q "dist\SB-Smart-Server-Setup.exe" >nul 2>&1
  if exist "dist\SB-Smart-Server-Setup.exe" goto err_setup_in_use
)

echo [INFO] Building Setup with Inno Setup...
"%ISCC_PATH%" "installer\server-setup.iss"
if errorlevel 1 goto err_iscc

if not exist "dist\SB-Smart-Server-Setup.exe" goto err_no_setup

if exist "dist\sb-server.exe" del /q "dist\sb-server.exe" >nul 2>&1

echo.
echo [SUCCESS] Output setup: dist\SB-Smart-Server-Setup.exe
echo [INFO] Services are configured as AUTO_START in installer.
echo [INFO] No standalone server exe is kept in dist.
exit /b 0

:err_missing_png
echo [ERROR] 1.png is missing in project root.
echo This file is required to generate build\icon.ico.
exit /b 1

:err_npm_install
echo [ERROR] npm install failed.
exit /b 1

:err_icon
echo [ERROR] Failed to generate build\icon.ico.
exit /b 1

:err_nssm_download
echo [ERROR] Failed to download NSSM.
exit /b 1

:err_nssm_extract
echo [ERROR] Failed to extract NSSM archive.
exit /b 1

:err_no_nssm_exe
echo [ERROR] NSSM executable was not prepared.
exit /b 1

:err_nginx_download
echo [ERROR] Failed to download Nginx 1.30.0.
exit /b 1

:err_nginx_extract
echo [ERROR] Failed to extract Nginx archive.
exit /b 1

:err_no_nginx_exe
echo [ERROR] Nginx executable was not prepared.
exit /b 1

:err_wacs_download
echo [ERROR] Failed to download win-acme.
exit /b 1

:err_wacs_extract
echo [ERROR] Failed to extract win-acme archive.
exit /b 1

:err_no_wacs_exe
echo [ERROR] win-acme executable was not prepared.
exit /b 1

:err_no_mysql_zip
echo [ERROR] tools\mysql-8.0.45-winx64.zip not found.
echo Put MySQL ZIP at tools\mysql-8.0.45-winx64.zip then rerun.
exit /b 1

:err_mysql_extract
echo [ERROR] Failed to extract MySQL archive.
exit /b 1

:err_no_mysql_exe
echo [ERROR] MySQL executable was not prepared (mysqld.exe missing).
exit /b 1

:err_pkg
echo [ERROR] Failed to build sb-server.exe with pkg.
exit /b 1

:err_no_server_exe
echo [ERROR] dist\sb-server.exe was not created.
exit /b 1

:err_no_iscc
echo [ERROR] Inno Setup compiler (ISCC.exe) not found.
echo Install Inno Setup 7 or 6, then run this script again.
echo Download: https://jrsoftware.org/isinfo.php
exit /b 1

:err_iscc
echo [ERROR] Inno Setup build failed.
exit /b 1

:err_no_setup
echo [ERROR] Setup file was not created.
exit /b 1

:err_setup_in_use
echo [ERROR] dist\SB-Smart-Server-Setup.exe is currently in use.
echo Close the installer/exe file, then run this script again.
exit /b 1

::err_bad_nssm_exe
echo [ERROR] NSSM executable exists but is not runnable.
echo Delete tools\nssm and run this script again to re-download NSSM.
exit /b 1

::err_bad_nginx_exe
echo [ERROR] Nginx executable exists but is not runnable.
echo Delete tools\nginx and run this script again to re-download Nginx.
exit /b 1
