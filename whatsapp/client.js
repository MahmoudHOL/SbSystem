const fs = require('fs');
const path = require('path');
const { getWhatsappAuthDir } = require('../utils/paths');

/** Pino v10 needs Node APIs missing in pkg's Node 18.5; Baileys only needs a pino-like object. */
function createSilentBaileysLogger() {
  const noop = () => {};
  const logger = {
    level: 'silent',
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    child() {
      return logger;
    },
  };
  return logger;
}

let sock = null;
let lastQr = null;
let lastStatus = 'disconnected';
let initializing = null;

const AUTH_DIR = getWhatsappAuthDir();

async function loadBaileys() {
  // dynamic import because Baileys v7 is ESM
  const m = await import('@whiskeysockets/baileys');
  return m;
}

async function initClient() {
  if (sock) return sock;
  if (initializing) return initializing;

  initializing = (async () => {
    const baileys = await loadBaileys();
    const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = baileys;

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state,
      logger: createSilentBaileysLogger(),
    });

    lastStatus = 'connecting';

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { qr, connection, lastDisconnect } = update;
      if (qr) {
        lastQr = qr;
        lastStatus = 'qr';
      }
      if (connection === 'open') {
        lastStatus = 'connected';
        lastQr = null;
      } else if (connection === 'close') {
        lastStatus = 'disconnected';
        sock = null;
      }
    });

    return sock;
  })();

  try {
    await initializing;
    return sock;
  } finally {
    initializing = null;
  }
}

async function getQr() {
  await initClient();
  return { qr: lastQr, status: lastStatus };
}

async function getStatus() {
  return { status: lastStatus, hasQr: !!lastQr, connected: lastStatus === 'connected' };
}

function phoneToJid(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean) throw new Error('رقم غير صالح');
  return `${clean}@s.whatsapp.net`;
}

async function sendText(to, text) {
  if (!text || !String(text).trim()) {
    throw new Error('النص فارغ');
  }
  const client = await initClient();
  const jid = phoneToJid(to);
  await client.sendMessage(jid, { text: String(text) });
}

async function sendFile(to, url, caption) {
  if (!url) throw new Error('رابط الملف مطلوب');
  const client = await initClient();
  const jid = phoneToJid(to);
  await client.sendMessage(jid, {
    document: { url },
    mimetype: 'application/octet-stream',
    fileName: path.basename(url.split('?')[0]) || 'file',
    caption: caption || undefined,
  });
}

async function resetAuth() {
  // delete auth folder and reset client
  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }
  sock = null;
  lastQr = null;
  lastStatus = 'disconnected';
  await initClient();
  return { status: lastStatus };
}

module.exports = {
  initClient,
  getQr,
  getStatus,
  sendText,
  sendFile,
  resetAuth,
};

