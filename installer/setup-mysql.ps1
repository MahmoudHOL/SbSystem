param(
  [Parameter(Mandatory = $true)]
  [string]$AppDir,

  [Parameter(Mandatory = $false)]
  [string]$LogPath = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($LogPath)) {
  $LogPath = Join-Path $AppDir "logs\setup-install.log"
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LogPath) | Out-Null
Start-Transcript -Path $LogPath -Append | Out-Null

function Write-SetupLog {
  param([string]$Message)
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[$stamp] [MYSQL] $Message"
}

$mysqlRoot = Join-Path $AppDir "mysql"
$mysqlBin = Join-Path $mysqlRoot "bin"
$mysqldExe = Join-Path $mysqlBin "mysqld.exe"
$mysqlExe = Join-Path $mysqlBin "mysql.exe"
$dataDir = Join-Path $mysqlRoot "data"
$serviceName = "SBSmartMySQL"
$myIni = Join-Path $mysqlRoot "my.ini"
$migrationsDir = Join-Path $AppDir "database\migrations"
$baseDumpPath = Join-Path $AppDir "database\base\sb_pos.sql"

function Wait-ServiceRunning {
  param(
    [string]$Name,
    [int]$TimeoutSeconds = 30
  )
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
    $svc = Get-Service -Name $Name -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq 'Running') {
      return $true
    }
    Start-Sleep -Seconds 1
  }
  return $false
}

if (-not (Test-Path $mysqldExe)) {
  throw "mysqld.exe not found at $mysqldExe"
}
if (-not (Test-Path $mysqlExe)) {
  throw "mysql.exe not found at $mysqlExe"
}

New-Item -ItemType Directory -Force -Path $mysqlRoot | Out-Null
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
Write-SetupLog "Prepared MySQL directories."

$myIniContent = @"
[mysqld]
basedir=$($mysqlRoot -replace '\\','/')
datadir=$($dataDir -replace '\\','/')
port=3306
bind-address=127.0.0.1
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

[client]
port=3306
default-character-set=utf8mb4
"@

Set-Content -Path $myIni -Value $myIniContent -Encoding ASCII
Write-SetupLog "Generated my.ini."

if (-not (Test-Path (Join-Path $dataDir "mysql"))) {
  Write-SetupLog "Initializing MySQL data directory..."
  & $mysqldExe --defaults-file="$myIni" --initialize-insecure --console
}

$serviceExists = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $serviceExists) {
  Write-SetupLog "Installing MySQL Windows service: $serviceName"
  & $mysqldExe --install $serviceName --defaults-file="$myIni"
}

Start-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not (Wait-ServiceRunning -Name $serviceName -TimeoutSeconds 40)) {
  throw "MySQL service '$serviceName' failed to reach Running state."
}
Write-SetupLog "MySQL service is running."

& $mysqlExe -u root --execute="ALTER USER 'root'@'localhost' IDENTIFIED BY '2202122'; FLUSH PRIVILEGES;" 2>$null

& $mysqlExe -u root -p2202122 --execute="CREATE DATABASE IF NOT EXISTS sb_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
& $mysqlExe -u root -p2202122 --execute="SELECT 1;" | Out-Null
Write-SetupLog "Database sb_pos is ready."

if (-not (Test-Path $baseDumpPath)) {
  throw "Base schema dump not found at $baseDumpPath"
}

$schemaOnlyTemp = Join-Path $env:TEMP ("sb-pos-schema-only-" + [guid]::NewGuid().ToString() + ".sql")
Get-Content -Path $baseDumpPath |
  Where-Object {
    ($_ -notmatch '^\s*INSERT INTO ') -and
    ($_ -notmatch '^\s*LOCK TABLES ') -and
    ($_ -notmatch '^\s*UNLOCK TABLES') -and
    ($_ -notmatch '^\s*/\*!\d+\s+ALTER TABLE .* (DISABLE|ENABLE) KEYS \*/;')
  } |
  Set-Content -Path $schemaOnlyTemp -Encoding ASCII

Get-Content -Path $schemaOnlyTemp -Raw | & $mysqlExe -u root -p2202122 sb_pos
Remove-Item -Path $schemaOnlyTemp -Force -ErrorAction SilentlyContinue
Write-SetupLog "Base schema imported."

if (-not (Test-Path $migrationsDir)) {
  throw "Migrations directory not found at $migrationsDir"
}

$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter *.sql | Sort-Object Name
foreach ($file in $migrationFiles) {
  $sqlPath = $file.FullName -replace '\\','/'
  Write-SetupLog "Applying migration: $($file.Name)"
  & $mysqlExe -u root -p2202122 --force sb_pos --execute="source $sqlPath"
}

& $mysqlExe -u root -p2202122 sb_pos --execute="SET FOREIGN_KEY_CHECKS=0; DELETE FROM user_roles; DELETE FROM users; SET FOREIGN_KEY_CHECKS=1;"
& $mysqlExe -u root -p2202122 sb_pos --execute="INSERT INTO users (id, username, password_hash, full_name, is_active) VALUES (1, 'admin', '$2a$10$CcGPdq1CV/h4fpk1pgtBxO7o1Kwz2.x4amjvQsbcsB3VSYay3TtKm', 'admin', 1) ON DUPLICATE KEY UPDATE username=VALUES(username), password_hash=VALUES(password_hash), full_name=VALUES(full_name), is_active=VALUES(is_active), updated_at=NOW();"

Write-Host "MySQL setup completed successfully."
Write-SetupLog "MySQL setup completed successfully."
Stop-Transcript | Out-Null
