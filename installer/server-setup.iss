#define MyAppName "SB Smart Server"
#define MyAppVersion GetStringFileInfo(AddBackslash(SourcePath) + "..\\dist\\sb-server.exe", "ProductVersion")
#define MyAppPublisher "SB Smart"
#define MyAppExeName "sb-server.exe"

[Setup]
AppId={{A8B84E36-86E1-46CC-B219-1B0DF1030C93}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
PrivilegesRequired=admin
DefaultDirName={autopf}\SBSmartServer
DisableProgramGroupPage=yes
OutputDir=..\dist
OutputBaseFilename=SB-Smart-Server-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Dirs]
Name: "{app}\nginx\logs"
Name: "{app}\nginx\certs"
Name: "{app}\nginx\conf\conf.d"
Name: "{app}\nginx\html\.well-known\acme-challenge"
Name: "{app}\mysql"
Name: "{app}\mysql\data"
Name: "{app}\logs"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"
Name: "mysql"; Description: "Install MySQL 8.0.45 and initialize SB database"; GroupDescription: "Database options:"
Name: "nginx"; Description: "Install Nginx reverse proxy (ports 80/443)"; GroupDescription: "Nginx options:"
Name: "nginx\ssl"; Description: "Request free Let's Encrypt certificate (requires real domain + public port 443)"; GroupDescription: "Nginx options:"

[Files]
Source: "..\dist\sb-server.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\node_modules\bootstrap\dist\*"; DestDir: "{app}\node_modules\bootstrap\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\node_modules\@fortawesome\fontawesome-free\*"; DestDir: "{app}\node_modules\@fortawesome\fontawesome-free"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\tools\nginx\*"; DestDir: "{app}\nginx"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\tools\win-acme\*"; DestDir: "{app}\win-acme"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\tools\mysql-8.0.45-winx64\*"; DestDir: "{app}\mysql"; Flags: ignoreversion recursesubdirs createallsubdirs; Tasks: mysql
Source: "..\database\migrations\*"; DestDir: "{app}\database\migrations"; Flags: ignoreversion recursesubdirs createallsubdirs; Tasks: mysql
Source: "..\sb_pos.sql"; DestDir: "{app}\database\base"; DestName: "sb_pos.sql"; Flags: ignoreversion; Tasks: mysql
Source: "setup-mysql.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion; Tasks: mysql
Source: "setup-services.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\SB Smart Server"; Filename: "{app}\sb-server.exe"
Name: "{autodesktop}\SB Smart Server"; Filename: "{app}\sb-server.exe"; Tasks: desktopicon

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\installer\setup-mysql.ps1"" -AppDir ""{app}"" -LogPath ""{app}\logs\setup-install.log"""; StatusMsg: "Installing MySQL, initializing database, and applying project migrations..."; Flags: runhidden waituntilterminated; Tasks: mysql
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""& '{app}\win-acme\wacs.exe' --source manual --host '{code:GetDomain}' --validation selfhosting --validationmode tls-alpn-01 --validationport 443 --store pemfiles --pemfilespath '{app}\nginx\certs' --pemfilesname '{code:GetDomain}' --installation none --emailaddress '{code:GetEmail}' --accepttos --notaskscheduler --baseuri 'https://acme-v02.api.letsencrypt.org/' --verbose 2>&1 | Tee-Object -FilePath '{app}\nginx\logs\wacs.log' | Tee-Object -FilePath '{app}\logs\setup-install.log' -Append"""; StatusMsg: "Creating Let's Encrypt certificate over port 443, please wait..."; Flags: waituntilterminated; Tasks: nginx\ssl

[Code]
var
  NginxPage: TInputQueryWizardPage;

procedure AppendSetupLog(Msg: string);
var
  LogPath: string;
  Line: string;
begin
  if WizardDirValue <> '' then
    LogPath := AddBackslash(WizardDirValue) + 'logs\setup-install.log'
  else
    LogPath := ExpandConstant('{tmp}\sb-setup-preinit.log');
  Line := '[' + GetDateTimeString('yyyy-mm-dd hh:nn:ss', #0, #0) + '] [SETUP] ' + Msg + #13#10;
  SaveStringToFile(LogPath, Line, True);
end;

function GetDomain(Param: string): string;
begin
  if Assigned(NginxPage) then
    Result := Trim(NginxPage.Values[0])
  else
    Result := '';
end;

function GetEmail(Param: string): string;
begin
  if Assigned(NginxPage) then
    Result := Trim(NginxPage.Values[1])
  else
    Result := '';
end;

function GetCertFilePath(DomainValue: string): string;
var
  PreferredPath: string;
  AlternatePath: string;
begin
  PreferredPath := ExpandConstant('{app}\nginx\certs\' + DomainValue + '-crt.pem');
  AlternatePath := ExpandConstant('{app}\nginx\certs\' + DomainValue + '.pem');
  if FileExists(PreferredPath) then
    Result := PreferredPath
  else
    Result := AlternatePath;
end;

function CanStartNginx: Boolean;
var
  DomainValue: string;
  CertPath: string;
  KeyPath: string;
begin
  if not WizardIsTaskSelected('nginx') then
  begin
    Result := False;
    exit;
  end;

  if not WizardIsTaskSelected('nginx\ssl') then
  begin
    Result := True;
    exit;
  end;

  DomainValue := GetDomain('');
  CertPath := GetCertFilePath(DomainValue);
  KeyPath := ExpandConstant('{app}\nginx\certs\' + DomainValue + '-key.pem');
  Result := FileExists(CertPath) and FileExists(KeyPath);
end;

function ShouldRunServicesWithNginx: Boolean;
begin
  Result := WizardIsTaskSelected('nginx') and CanStartNginx;
end;

function ShouldRunServerOnlyServices: Boolean;
begin
  Result := not ShouldRunServicesWithNginx;
end;

procedure InitializeWizard;
begin
  AppendSetupLog('Initializing Nginx/HTTPS wizard page.');
  NginxPage := CreateInputQueryPage(
    wpSelectTasks,
    'Nginx / HTTPS Settings',
    'Configure Nginx and optional free certificate',
    'When Nginx is selected, fill a real domain. If SSL is selected, port 443 must be publicly reachable for Let''s Encrypt (TLS-ALPN-01).'
  );
  NginxPage.Add('Domain name (e.g. app.example.com):', False);
  NginxPage.Add('Email for certificate renewal:', False);
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;
  if Assigned(NginxPage) and (PageID = NginxPage.ID) then
    Result := not WizardIsTaskSelected('nginx');
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  DomainValue: string;
  EmailValue: string;
begin
  Result := True;
  if Assigned(NginxPage) and (CurPageID = NginxPage.ID) then
  begin
    DomainValue := Trim(NginxPage.Values[0]);
    EmailValue := Trim(NginxPage.Values[1]);

    if DomainValue = '' then
    begin
      MsgBox('Please enter a domain name for Nginx.', mbError, MB_OK);
      Result := False;
      exit;
    end;
    if Pos('.', DomainValue) = 0 then
    begin
      MsgBox('Please enter a valid domain name (must contain a dot).', mbError, MB_OK);
      Result := False;
      exit;
    end;
    if WizardIsTaskSelected('nginx\ssl') and (EmailValue = '') then
    begin
      MsgBox('Email is required to request the free SSL certificate.', mbError, MB_OK);
      Result := False;
      exit;
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  MainConfigPath: string;
  ConfigPath: string;
  DomainValue: string;
  MainConfigContent: string;
  ConfigContent: string;
begin
  if (CurStep <> ssPostInstall) or (not WizardIsTaskSelected('nginx')) then
    exit;

  AppendSetupLog('Generating Nginx configuration files.');
  DomainValue := GetDomain('');
  ForceDirectories(ExpandConstant('{app}\nginx\logs'));
  ForceDirectories(ExpandConstant('{app}\nginx\conf\conf.d'));
  ForceDirectories(ExpandConstant('{app}\nginx\certs'));
  ForceDirectories(ExpandConstant('{app}\nginx\html\.well-known\acme-challenge'));
  MainConfigPath := ExpandConstant('{app}\nginx\conf\nginx.conf');
  ConfigPath := ExpandConstant('{app}\nginx\conf\conf.d\sb-smart.conf');

  MainConfigContent :=
    'worker_processes  1;' + #13#10 +
    'error_log  logs/error.log;' + #13#10 +
    'pid        logs/nginx.pid;' + #13#10 +
    'events { worker_connections 1024; }' + #13#10 +
    'http {' + #13#10 +
    '    include       mime.types;' + #13#10 +
    '    default_type  application/octet-stream;' + #13#10 +
    '    sendfile        on;' + #13#10 +
    '    keepalive_timeout  65;' + #13#10 +
    '    include conf.d/*.conf;' + #13#10 +
    '}' + #13#10;

  SaveStringToFile(MainConfigPath, MainConfigContent, False);
  AppendSetupLog('Written nginx.conf.');

  if WizardIsTaskSelected('nginx\ssl') then
  begin
    ConfigContent :=
      'server {' + #13#10 +
      '    listen 80 default_server;' + #13#10 +
      '    server_name _;' + #13#10 +
      '    location /.well-known/acme-challenge/ {' + #13#10 +
      '        root   html;' + #13#10 +
      '    }' + #13#10 +
      '    location / {' + #13#10 +
      '        proxy_pass http://127.0.0.1:3000;' + #13#10 +
      '        proxy_http_version 1.1;' + #13#10 +
      '        proxy_set_header Host $host;' + #13#10 +
      '        proxy_set_header X-Real-IP $remote_addr;' + #13#10 +
      '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' + #13#10 +
      '        proxy_set_header X-Forwarded-Proto $scheme;' + #13#10 +
      '    }' + #13#10 +
      '}' + #13#10 + #13#10 +
      'server {' + #13#10 +
      '    listen 443 ssl default_server;' + #13#10 +
      '    http2 on;' + #13#10 +
      '    server_name _;' + #13#10 +
      '    ssl_certificate     ../certs/' + DomainValue + '-crt.pem;' + #13#10 +
      '    ssl_certificate_key ../certs/' + DomainValue + '-key.pem;' + #13#10 +
      '    ssl_session_timeout 1d;' + #13#10 +
      '    ssl_session_cache shared:MozSSL:10m;' + #13#10 +
      '    ssl_protocols TLSv1.2 TLSv1.3;' + #13#10 +
      '    location / {' + #13#10 +
      '        proxy_pass http://127.0.0.1:3000;' + #13#10 +
      '        proxy_http_version 1.1;' + #13#10 +
      '        proxy_set_header Host $host;' + #13#10 +
      '        proxy_set_header X-Real-IP $remote_addr;' + #13#10 +
      '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' + #13#10 +
      '        proxy_set_header X-Forwarded-Proto $scheme;' + #13#10 +
      '    }' + #13#10 +
      '}' + #13#10;
  end
  else
  begin
    ConfigContent :=
      'server {' + #13#10 +
      '    listen 80 default_server;' + #13#10 +
      '    server_name _;' + #13#10 +
      '    location / {' + #13#10 +
      '        proxy_pass http://127.0.0.1:3000;' + #13#10 +
      '        proxy_http_version 1.1;' + #13#10 +
      '        proxy_set_header Host $host;' + #13#10 +
      '        proxy_set_header X-Real-IP $remote_addr;' + #13#10 +
      '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' + #13#10 +
      '        proxy_set_header X-Forwarded-Proto $scheme;' + #13#10 +
      '    }' + #13#10 +
      '}' + #13#10;
  end;

  SaveStringToFile(ConfigPath, ConfigContent, False);
  AppendSetupLog('Written sb-smart.conf.');
end;