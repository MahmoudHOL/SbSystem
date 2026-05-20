param(
  [Parameter(Mandatory = $true)]
  [string]$AppDir,

  [Parameter(Mandatory = $false)]
  [switch]$InstallNginx
)

$ErrorActionPreference = "Stop"

$nssmExe = Join-Path $AppDir "nssm\nssm.exe"
if (-not (Test-Path $nssmExe)) {
  throw "nssm.exe not found at $nssmExe"
}

function Remove-ServiceIfExists {
  param([string]$Name)
  $svc = Get-Service -Name $Name -ErrorAction SilentlyContinue
  if ($svc) {
    try { & $nssmExe stop $Name | Out-Null } catch {}
    Start-Sleep -Seconds 1
    & $nssmExe remove $Name confirm | Out-Null
  }
}

function Install-NssmService {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$DisplayName,
    [Parameter(Mandatory = $true)][string]$Description,
    [Parameter(Mandatory = $true)][string]$Application,
    [Parameter(Mandatory = $true)][string]$AppDirectory,
    [Parameter(Mandatory = $false)][string]$AppParameters = ""
  )

  Remove-ServiceIfExists -Name $Name

  # Following NSSM recommended style: install then set fields explicitly.
  & $nssmExe install $Name $Application | Out-Null
  & $nssmExe set $Name DisplayName $DisplayName | Out-Null
  & $nssmExe set $Name Description $Description | Out-Null
  & $nssmExe set $Name Application $Application | Out-Null
  & $nssmExe set $Name AppDirectory $AppDirectory | Out-Null
  if (-not [string]::IsNullOrWhiteSpace($AppParameters)) {
    & $nssmExe set $Name AppParameters $AppParameters | Out-Null
  }
  & $nssmExe set $Name Start SERVICE_AUTO_START | Out-Null
  & $nssmExe set $Name AppExit Default Restart | Out-Null
}

$serverExe1 = Join-Path $AppDir "sb-server.exe"
$serverExe2 = Join-Path $AppDir "sb_server.exe"
$serverExe = if (Test-Path $serverExe1) { $serverExe1 } else { $serverExe2 }
if (-not (Test-Path $serverExe)) {
  throw "Server executable not found at $serverExe1 or $serverExe2"
}

Install-NssmService `
  -Name "SBSmartServer" `
  -DisplayName "SB Smart Server" `
  -Description "SB Smart backend service" `
  -Application $serverExe `
  -AppDirectory $AppDir

& $nssmExe start SBSmartServer | Out-Null

if ($InstallNginx.IsPresent) {
  $nginxDir = Join-Path $AppDir "nginx"
  $nginxExe = Join-Path $nginxDir "nginx.exe"
  if (-not (Test-Path $nginxExe)) {
    throw "nginx.exe not found at $nginxExe"
  }

  # Use nginx native args in NSSM service.
  $nginxParams = "-p $($nginxDir -replace '\\','/')/ -c conf/nginx.conf"

  Install-NssmService `
    -Name "SBSmartNginx" `
    -DisplayName "SB Smart Nginx" `
    -Description "SB Smart reverse proxy service" `
    -Application $nginxExe `
    -AppDirectory $nginxDir `
    -AppParameters $nginxParams

  & $nssmExe start SBSmartNginx | Out-Null
}

Write-Host "NSSM service setup completed successfully."
