const wmbotme = require("wmbotme");
wmbotme.promo();
const fs = require('fs');
const os = require('os');
const pino = require('pino');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const readline = require('readline');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const NodeCache = require('node-cache');
const { toBuffer, toDataURL } = require('qrcode');
const { exec, spawn, execSync } = require('child_process');
const { parsePhoneNumber } = require('awesome-phonenumber');
const { default: WAConnection, useMultiFileAuthState, Browsers, DisconnectReason, makeInMemoryStore, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, proto, jidDecode, jidNormalizedUser, getAggregateVotesInPollMessage, makeWASocket, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { app, server, PORT } = require('./lib/server');
const { dataBase } = require('./lib/database');

// ==============================================================================
// 👇 NEW CODE ADDED: PAIRING WEBSITE SYSTEM (Render Website Logic)
// ==============================================================================

// 1. WEBSITE FRONTEND (HTML)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bot Pairing Server</title>
        <style>
            body { background-color: #0f0f0f; color: #00ff00; font-family: courier; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            h1 { text-shadow: 0 0 10px #00ff00; margin-bottom: 20px; }
            .container { background: #1a1a1a; padding: 40px; border-radius: 10px; border: 1px solid #00ff00; box-shadow: 0 0 20px rgba(0, 255, 0, 0.2); }
            input { padding: 15px; border-radius: 5px; border: 1px solid #00ff00; background: #000; color: #fff; width: 250px; text-align: center; font-size: 16px; margin-bottom: 15px; outline: none; }
            button { padding: 12px 30px; border-radius: 5px; background: #00ff00; color: #000; border: none; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.3s; }
            button:hover { background: #fff; box-shadow: 0 0 15px #fff; }
            #result { margin-top: 20px; font-size: 24px; font-weight: bold; letter-spacing: 3px; min-height: 30px; }
            .footer { margin-top: 30px; font-size: 12px; color: #555; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔗 LINK YOUR BOT</h1>
            <p>Enter WhatsApp Number (with Country Code)</p>
            <input type="number" id="number" placeholder="923001234567">
            <br>
            <button onclick="getCode()">GET PAIR CODE</button>
            <div id="result"></div>
        </div>
        <div class="footer">Powered by Baileys & Render</div>

        <script>
            async function getCode() {
                const num = document.getElementById('number').value;
                const resultDiv = document.getElementById('result');
                
                if(!num || num.length < 10) {
                    resultDiv.innerHTML = "❌ Invalid Number";
                    return;
                }

                resultDiv.innerHTML = "⏳ Processing... (Wait 5s)";
                
                try {
                    const response = await fetch('/pair-code-api?number=' + num);
                    const data = await response.json();
                    
                    if(data.code) {
                        resultDiv.innerHTML = "CODE: <span style='color:white; background:green; padding:5px;'>" + data.code + "</span>";
                    } else {
                        resultDiv.innerHTML = "❌ " + (data.error || "Failed");
                    }
                } catch (e) {
                    resultDiv.innerHTML = "❌ Error: Server Busy";
                }
            }
        </script>
    </body>
    </html>
    `);
});

// 2. PAIRING API BACKEND
app.get('/pair-code-api', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: "Number Missing" });

    const phoneNumber = number.replace(/[^0-9]/g, '');
    const sessionName = "temp_pair_" + Date.now();
    const sessionDir = path.join(__dirname, 'temp_sessions', sessionName);

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: Browsers.macOS("Safari"),
        });

        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', (update) => {
            if (update.connection === 'open') {
                sock.end();
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
        });

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
                res.json({ code: formattedCode });
                sock.end();
            } catch (err) {
                res.json({ error: "Invalid Number / Rate Limit" });
                sock.end();
            }
            // Cleanup
            setTimeout(() => {
                if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
            }, 5000);
        }, 3000);

    } catch (error) {
        res.json({ error: "Server Error" });
        if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
    }
});
// ==============================================================================
// 👆 END OF NEW CODE
// ==============================================================================

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

// Variabel global untuk pilihan login
let usePairingCode = null;
let pairingStarted = false;

const storeDB = dataBase("baileys_store.json");
const database = dataBase("database1.json");
const db = require('./lib/db')
const handleMessage = require('./lib/handler')
const groupParticipantsUpdate = require('./lib/group-participants')
const antiCallHandler = require('./lib/anticall')
global.plugins = []

// ===== FUNGSI UTAMA =====
function loadCommands(dir = path.join(__dirname, './commands')) {
  global.plugins = []
  const walk = (folder) => {
    fs.readdirSync(folder).forEach(file => {
      let filepath = path.join(folder, file)
      if (fs.lstatSync(filepath).isDirectory()) {
        walk(filepath)
      } else if (file.endsWith('.js')) {
        try {
          delete require.cache[require.resolve(filepath)]
          let cmd = require(filepath)
          global.plugins.push(cmd)
          console.log(chalk.hex('#00FF7F')(`✨ Loaded: ${path.relative(dir, filepath)}`))
        } catch (e) {
          console.error(chalk.red(`❌ Error load plugin ${filepath}:`), e)
        }
      }
    })
  }
  walk(dir)
}

function watchCommands(dir = path.join(__dirname, './commands')) {
  fs.watch(dir, { recursive: true }, (event, filename) => {
    if (!filename.endsWith('.js')) return
    console.log(chalk.yellow(`♻️ Plugin ${filename} changed, reloading...`))
    loadCommands(dir)
  })
}

// ===== CEK SESSION ADA ATAU TIDAK =====
function checkSessionExists() {
  const sessionPath = path.join(__dirname, 'auth');
  if (!fs.existsSync(sessionPath)) {
    return false;
  }
  
  const files = fs.readdirSync(sessionPath);
  const importantFiles = files.filter(file => 
    file.includes('creds') || 
    file.includes('keys') ||
    file.endsWith('.json')
  );
  
  return importantFiles.length > 0;
}

// ===== TAMPILAN BANNER =====
async function showBannerAndDetectMethod() {
  console.clear();
  
  const banner = `
${chalk.hex('#FF6B6B').bold('╔══════════════════════════════════════╗')}
${chalk.hex('#4ECDC4').bold('║                                        ║')}
${chalk.hex('#45B7D1').bold('║    ') + chalk.hex('#FFEAA7').bold('W H A T S A P P   B O T') + chalk.hex('#45B7D1').bold('     ║')}
${chalk.hex('#96CEB4').bold('║                                        ║')}
${chalk.hex('#FFEAA7').bold('║  ') + chalk.hex('#DDA0DD')('Multi-Device Support ') + chalk.hex('#FFEAA7').bold('      ║')}
${chalk.hex('#FF6B6B').bold('║                                        ║')}
${chalk.hex('#4ECDC4').bold('╚══════════════════════════════════════╝')}
${chalk.hex('#DDA0DD')('Version: ' + chalk.bold('2.0.0'))} | ${chalk.hex('#96CEB4')('Baileys MD')}
${chalk.hex('#FFD93D').bold('='.repeat(40))}
  `;
  console.log(banner);
  
  const sessionExists = checkSessionExists();
  
  if (sessionExists) {
    console.log(chalk.hex('#00FF7F').bold('\n✅ Session ditemukan!'));
    console.log(chalk.hex('#45B7D1')('📱 Mode: Auto Login'));
    usePairingCode = false; 
    return usePairingCode;
  }
  
  // ============================================================
  // 👇 FIX FOR RENDER: AUTO SKIP QUESTION (Avoid Stuck on Deployment)
  // ============================================================
  console.log(chalk.hex('#FF6B6B').bold('\n⚠️  Session tidak ditemukan'));
  
  // Agar Render par bot stuck na ho, hum user input skip karke QR mode select karte hain
  // Aap website se Pair Code le sakte hain, isliye console par QR ana chahiye
  console.log(chalk.hex('#96CEB4')('ℹ️ Running on Server: Defaulting to QR Code Mode'));
  console.log(chalk.hex('#96CEB4')('ℹ️ Open the website to get Pairing Code if needed.'));
  
  usePairingCode = false; // Default to QR so bot starts and Website goes Online
  return usePairingCode;
  // ============================================================
}

// ===== FUNGSI START BOT =====
async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const level = pino({ level: 'silent' });

  await showBannerAndDetectMethod();

  const conn = makeWASocket({
    printQRInTerminal: !usePairingCode,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    generateHighQualityLinkPreview: true,
    patchMessageBeforeSending: (message) => {
  const requiresPatch = !!(
    (message.buttonsMessage ||
     message.templateMessage ||
     message.listMessage) &&
    !message.interactiveMessage 
  );

  if (requiresPatch) {
    message = {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadataVersion: 2,
            deviceListMetadata: {},
          },
          ...message,
        },
      },
    };
  }
  return message;
},
    version: (await (await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json')).json()).version,
    browser: ["Windows", "Chrome", "20.0.04"],
    logger: pino({ level: 'fatal' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino().child({
        level: 'silent',
        stream: 'store'
      })),
    }
  });

  conn.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {}
      return decode.user && decode.server && decode.user + '@' + decode.server || jid
    } else return jid
  }

  loadCommands()
  watchCommands()

  conn.ev.on('messages.upsert', async ({ messages }) => {
    let raw = messages[0]
    if (!raw.message) return
    
    const getCorrectRemoteJid = (key) => {
      return key.participant || key.senderPn || key.remoteJid;
    };

    raw.chat = raw.key.remoteJid
    raw.sender = getCorrectRemoteJid(raw.key)
    raw.isGroup = raw.chat.endsWith('@g.us')
    raw.pushName = raw.pushName || 'User'
    raw.text =
      raw.message.conversation ||
      raw.message.extendedTextMessage?.text ||
      raw.message.imageMessage?.caption ||
      raw.message.videoMessage?.caption ||
      ''

    if (raw?.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const ctx = raw.message.extendedTextMessage.contextInfo
      const quoted = ctx.quotedMessage
      const type = Object.keys(quoted)[0]
      const msg = quoted[type]
      raw.quoted = {
        key: {
          remoteJid: ctx.remoteJid || raw.chat,
          fromMe: ctx.participant
            ? jidNormalizedUser(ctx.participant) === jidNormalizedUser(conn.user.id)
            : false,
          id: ctx.stanzaId,
          participant: ctx.participant,
        },
        message: quoted,
        type,
        msg,
        text:
          msg?.text ||
          msg?.conversation ||
          msg?.caption ||
          msg?.contentText ||
          msg?.selectedDisplayText ||
          msg?.title ||
          (typeof msg === 'string' ? msg : '') ||
          '',
        isMedia: !!(msg?.mimetype || msg?.thumbnailDirectPath),
        download: () =>
          downloadMediaMessage(
            { message: quoted },
            'buffer',
            {},
            { logger: console, reuploadRequest: conn.updateMediaMessage }
          ),
      }
    }

    raw.reply = (txt) => conn.sendMessage(raw.chat, { text: txt }, { quoted: raw })

    if (raw.isGroup) {
      let metadata = await conn.groupMetadata(raw.chat)
      raw.isAdmin = metadata.participants.find(p => p.id === raw.sender)?.admin != null
      raw.isBotAdmin = metadata.participants.find(p => p.id === conn.user.id)?.admin != null
    }

    await handleMessage(raw, { conn, usedPrefixList: ['.', '!', '/'] })
  })

  conn.ev.on('group-participants.update', async (update) => {
    try {
      await groupParticipantsUpdate(conn, update)
    } catch (e) {
      console.error(chalk.red('Error group-participants.update:'), e)
    }
  })

  conn.ev.on('call', async (call) => {
    try {
      await antiCallHandler(conn, call)
    } catch (e) {
      console.error(chalk.red('Error antiCall:'), e)
    }
  })

  conn.ev.on('creds.update', saveCreds)

  conn.ev.on('connection.update', async (update) => {
    const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update

    try {
      const loadData = await database.read()
      const storeLoadData = await storeDB.read()

      if (!loadData || Object.keys(loadData).length === 0) {
        global.db = {
          hit: {},
          set: {},
          cmd: {},
          store: {},
          users: {},
          game: {},
          groups: {},
          database: {},
          premium: [],
          sewa: [],
          ...(loadData || {}),
        }
        await database.write(global.db)
      } else {
        global.db = loadData
      }

      if (!storeLoadData || Object.keys(storeLoadData).length === 0) {
        global.store = {
          contacts: {},
          presences: {},
          messages: {},
          groupMetadata: {},
          ...(storeLoadData || {}),
        }
        await storeDB.write(global.store)
      } else {
        global.store = storeLoadData
      }

      setInterval(async () => {
        if (global.db) await database.write(global.db)
        if (global.store) await storeDB.write(global.store)
      }, 30 * 1000)

    } catch (e) {
      console.log(chalk.red('Database Error:'), e)
      process.exit(1)
    }

    console.log(chalk.hex('#45B7D1')(`📡 Status: ${connection || 'unknown'}`));

    // === MODIFIED FOR RENDER ===
    // Agar QR mode active hai (jo humne default kiya), to QR console pe print hoga
    // Aur user Website se Pair Code le sakega
    if (qr && !usePairingCode && !checkSessionExists()) {
       // QR print ho raha hai by default 'printQRInTerminal: true'
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode
      // ... Error handling logic same as before ...
      if ([DisconnectReason.restartRequired, DisconnectReason.timedOut].includes(reason)) {
        setTimeout(() => start(), 5000)
      } else if (reason === DisconnectReason.loggedOut) {
        exec('rm -rf ./auth/*', () => process.exit(1))
      }
    }

    if (connection == 'open') {
      console.log(chalk.hex('#00FF7F').bold('\n╔══════════════════════════════════════╗'));
      console.log(chalk.hex('#4ECDC4').bold('║      ') + chalk.hex('#FFEAA7')('CONNECTED SUCCESSFULLY') + chalk.hex('#4ECDC4').bold('      ║'));
      console.log(chalk.hex('#00FF7F').bold('╚══════════════════════════════════════╝'));
    }
  });

  conn.ev.on('contacts.update', update => {
    for (let contact of update) {
      let id = conn.decodeJid(contact.id)
      if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
    }
  })
}

console.log(chalk.hex('#45B7D1')('\n🚀 Starting WhatsApp Bot & Web Server...'));
start().catch(err => {
  console.error(chalk.red('Failed to start bot:'), err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down bot...'));
  rl.close();
  process.exit(0);
});
