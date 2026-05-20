@echo off
cd /d "%~dp0"
echo.
echo ============================================
echo  WARNING: All data in the database will be deleted.
echo  Then only user admin / 123456 will be created.
echo ============================================
echo.
set /p OK="Type YES to continue: "
if /I not "%OK%"=="YES" (
  echo Cancelled.
  pause
  exit /b 0
)
echo.
echo Running reset...
echo.

where mysql >nul 2>&1
if errorlevel 1 (
  echo mysql client not found. Install MySQL client and try again.
  pause
  exit /b 1
)

set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=pandora
set DB_PASSWORD=2202122
set DB_NAME=sb_pos

set TMP_SQL=%TEMP%\sb_reset_database.sql
(
  echo SET FOREIGN_KEY_CHECKS=0;
  echo SET SESSION group_concat_max_len=1000000;
  echo SELECT GROUP_CONCAT(CONCAT('TRUNCATE TABLE `', TABLE_NAME, '`') SEPARATOR ';'^) INTO @trunc_sql
  echo FROM INFORMATION_SCHEMA.TABLES
  echo WHERE TABLE_SCHEMA = '%DB_NAME%' AND TABLE_TYPE = 'BASE TABLE';
  echo SET @trunc_sql = IFNULL(@trunc_sql, 'SELECT 1'^);
  echo PREPARE stmt FROM @trunc_sql;
  echo EXECUTE stmt;
  echo DEALLOCATE PREPARE stmt;
  echo SET FOREIGN_KEY_CHECKS=1;
  echo INSERT INTO users ^(username, password_hash, full_name, is_active^)
  echo VALUES ^('admin', '$2a$10$hZtX/3AiZc1ocSnID6Tsy.bBTpArvr44dFW5X04qO8siEfTRQlrXC', 'مدير النظام', 1^);
  echo INSERT IGNORE INTO minimum_stock_default ^(id, default_minimum_quantity^) VALUES ^(1, 0^);
) > "%TMP_SQL%"

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%TMP_SQL%"
if errorlevel 1 (
  echo.
  echo Failed. Check MySQL is running and embedded credentials are correct.
  if exist "%TMP_SQL%" del /q "%TMP_SQL%" >nul 2>&1
  pause
  exit /b 1
)
if exist "%TMP_SQL%" del /q "%TMP_SQL%" >nul 2>&1
echo Reset completed successfully. Admin user created: admin / 123456
echo.
pause
