param(
  [Parameter(Mandatory = $true)]
  [string]$AppDir,

  [Parameter(Mandatory = $false)]
  [string]$Domain = "",

  [Parameter(Mandatory = $false)]
  [string]$Email = "",

  [Parameter(Mandatory = $false)]
  [switch]$EnableSsl
)

$ErrorActionPreference = "Stop"

$nginxDir = Join-Path $AppDir "nginx"
$nginxExe = Join-Path $nginxDir "nginx.exe"
$certsDir = Join-Path $nginxDir "certs"
$logsDir = Join-Path $nginxDir "logs"
$confDir = Join-Path $nginxDir "conf"
$confDDir = Join-Path $confDir "conf.d"
$wellKnownDir = Join-Path $nginxDir "html\.well-known\acme-challenge"
$wacsExe = Join-Path $AppDir "win-acme\wacs.exe"

if (-not (Test-Path $nginxExe)) {
  throw "nginx.exe not found at $nginxExe"
}

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
New-Item -ItemType Directory -Force -Path $certsDir | Out-Null
New-Item -ItemType Directory -Force -Path $confDDir | Out-Null
New-Item -ItemType Directory -Force -Path $wellKnownDir | Out-Null

$mainConfigPath = Join-Path $confDir "nginx.conf"
$siteConfigPath = Join-Path $confDDir "sb-smart.conf"

$mainConfig = @"
worker_processes  1;
error_log  logs/error.log;
pid        logs/nginx.pid;
events { worker_connections 1024; }
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    include conf.d/*.conf;
}
"@

Set-Content -Path $mainConfigPath -Value $mainConfig -Encoding ASCII

$shouldUseSsl = $EnableSsl.IsPresent -and -not [string]::IsNullOrWhiteSpace($Domain) -and -not [string]::IsNullOrWhiteSpace($Email)

if ($shouldUseSsl) {
  if (-not (Test-Path $wacsExe)) {
    throw "win-acme (wacs.exe) not found at $wacsExe"
  }

  $domainTrimmed = $Domain.Trim()
  $emailTrimmed = $Email.Trim()

  & $wacsExe `
    --source manual `
    --host $domainTrimmed `
    --validation selfhosting `
    --validationmode tls-alpn-01 `
    --validationport 443 `
    --store pemfiles `
    --pemfilespath $certsDir `
    --pemfilesname $domainTrimmed `
    --installation none `
    --emailaddress $emailTrimmed `
    --accepttos `
    --notaskscheduler `
    --baseuri "https://acme-v02.api.letsencrypt.org/"

  $certPath = Join-Path $certsDir ($domainTrimmed + "-crt.pem")
  $keyPath = Join-Path $certsDir ($domainTrimmed + "-key.pem")

  if (-not ((Test-Path $certPath) -and (Test-Path $keyPath))) {
    throw "SSL certificate files were not generated successfully."
  }

  $siteConfig = @"
server {
    listen 80 default_server;
    server_name _;
    location /.well-known/acme-challenge/ {
        root   html;
    }
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}

server {
    listen 443 ssl default_server;
    http2 on;
    server_name _;
    ssl_certificate     ../certs/$domainTrimmed-crt.pem;
    ssl_certificate_key ../certs/$domainTrimmed-key.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
"@
} else {
  $siteConfig = @"
server {
    listen 80 default_server;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
"@
}

Set-Content -Path $siteConfigPath -Value $siteConfig -Encoding ASCII
Write-Host "Nginx configuration completed successfully."
