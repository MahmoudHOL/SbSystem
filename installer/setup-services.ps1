param(
  [Parameter(Mandatory = $true)]
  [string]$AppDir,

  [Parameter(Mandatory = $false)]
  [switch]$InstallNginx,

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
  Write-Host "[$stamp] [SERVICES] $Message"
}

$nssmExe = Join-Path $AppDir "nssm\nssm.exe"
if (-not (Test-Path $nssmExe)) {
  throw "nssm.exe not found at $nssmExe"
}

function Remove-ServiceIfExists {
  param(
    [string]$Name,
    [string]$NginxExe = "",
    [string]$NginxDir = ""
  )

  if ($Name -eq "SBSmartNginx" -and $NginxExe -and (Test-Path $NginxExe)) {
    try {
      # Use native nginx control command for graceful stop.
      & $NginxExe -p "$($NginxDir -replace '\\','/')/" -c conf/nginx.conf -s stop | Out-Null
      Start-Sleep -Seconds 1
    } catch {
      # Ignore and continue with NSSM stop/remove fallback.
    }
  }

  $svc = Get-Service -Name $Name -ErrorAction SilentlyContinue
  if ($svc) {
    Write-SetupLog "Removing existing service: $Name"
    & $nssmExe stop $Name | Out-Null
    Start-Sleep -Seconds 1
    & $nssmExe remove $Name confirm | Out-Null
  }
}

function Install-NssmService {
  param(
    [string]$Name,
    [string]$DisplayName,
    [string]$Description,
    [string]$Application,
    [string]$AppDirectory,
    [string]$Arguments = "",
    [string]$NginxExe = "",
    [string]$NginxDir = ""
  )

  Remove-ServiceIfExists -Name $Name -NginxExe $NginxExe -NginxDir $NginxDir

  if ([string]::IsNullOrWhiteSpace($Arguments)) {
    & $nssmExe install $Name $Application | Out-Null
  } else {
    & $nssmExe install $Name $Application $Arguments | Out-Null
  }
  Write-SetupLog "Installed service: $Name"

  & $nssmExe set $Name DisplayName $DisplayName | Out-Null
  & $nssmExe set $Name Description $Description | Out-Null
  & $nssmExe set $Name AppDirectory $AppDirectory | Out-Null
  & $nssmExe set $Name Start SERVICE_AUTO_START | Out-Null
  & $nssmExe set $Name AppExit Default Restart | Out-Null
}

$serverExeA = Join-Path $AppDir "sb-server.exe"
$serverExeB = Join-Path $AppDir "sb_server.exe"
$serverExe = if (Test-Path $serverExeA) { $serverExeA } else { $serverExeB }
if (-not (Test-Path $serverExe)) {
  throw "Server executable not found at $serverExeA or $serverExeB"
}

Install-NssmService `
  -Name "SBSmartServer" `
  -DisplayName "SB Smart Server" `
  -Description "SB Smart backend service" `
  -Application $serverExe `
  -AppDirectory $AppDir

& $nssmExe start "SBSmartServer" | Out-Null
Write-SetupLog "Started service: SBSmartServer"

if ($InstallNginx.IsPresent) {
  $nginxExe = Join-Path $AppDir "nginx\nginx.exe"
  $nginxDir = Join-Path $AppDir "nginx"
  if (-not (Test-Path $nginxExe)) {
    throw "nginx.exe not found at $nginxExe"
  }

  Install-NssmService `
    -Name "SBSmartNginx" `
    -DisplayName "SB Smart Nginx" `
    -Description "SB Smart reverse proxy service" `
    -Application $nginxExe `
    -AppDirectory $nginxDir `
    -Arguments "-p $($nginxDir -replace '\\','/')/ -c conf/nginx.conf" `
    -NginxExe $nginxExe `
    -NginxDir $nginxDir

  & $nssmExe start "SBSmartNginx" | Out-Null
  Write-SetupLog "Started service: SBSmartNginx"
}

Write-Host "Service setup completed successfully."
Write-SetupLog "Service setup completed successfully."
Stop-Transcript | Out-Null
