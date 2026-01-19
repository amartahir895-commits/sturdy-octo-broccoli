
const { jidDecode } = require("@whiskeysockets/baileys");
const db = require('./db')
const env = require("../settings")
const decodeJid = (jid) => {
  if (!jid) return jid;
  try {
    const decode = jidDecode(jid);
    return decode?.user && decode?.server ? decode.user + "@" + decode.server : jid;
  } catch {
    return jid;
  }
};

/**
 * Handler utama
 */
async function handleMessage(m, { conn, usedPrefixList = ['.', '!', '/'] }) {
  try {
    let body = m.message?.conversation || m.message?.extendedTextMessage?.text
    if (!body) return

    // Inisialisasi user & grup
    let user = db.list().user[m.sender] ||= {
      exp: 0,
      limit: 10,
      money: 0,
      premium: false,
      name: m.pushName || 'Unknown',
    }

    let group = m.isGroup ? db.list().group[m.chat] ||= {
      welcome: false,
      mute: false,
    } : null

    db.save()

    // Sesi interaktif
    if (m.quoted && global.sesiInteraktif?.[m.quoted.id]) {
      let callback = global.sesiInteraktif[m.quoted.id]
      delete global.sesiInteraktif[m.quoted.id]
      return callback(m, { conn, db })
    }

    // Hook all()
    for (let plugin of global.plugins) {
      if (typeof plugin.all === 'function') {
        try { await plugin.all(m, { conn, db }) } catch (e) { console.error(e) }
      }
    }

    // Cek prefix
    let prefix = usedPrefixList.find(p => body.startsWith(p))
    if (!prefix) {
      // listener onMessage()
      for (let plugin of global.plugins) {
        if (typeof plugin.onMessage === 'function') {
          try { await plugin.onMessage(m, { conn, db }) } catch (e) { console.error(e) }
        }
      }
      return
    }

    let args = body.slice(prefix.length).trim().split(/ +/)
    let command = args.shift().toLowerCase()
    let text = args.join(' ')
    let groupMetadata = {}
if (m.isGroup) {
  try {
    groupMetadata = await conn.groupMetadata(m.chat) || {}
  } catch (e) {
    groupMetadata = {}
  }
}

const participants = groupMetadata.participants || []

const isAdmin = participants.some(p => 
  p.jid === m.sender && (p.admin === 'admin' || p.admin === 'superadmin')
)

const isBotAdmin = participants.some(p => 
  p.jid === conn.user.id && (p.admin === 'admin' || p.admin === 'superadmin')
)
    const isOwner = [
  ...(env.owner || []).map(a => a + "@s.whatsapp.net"),
  ...(db.list().owner || []),
  decodeJid(conn.user.id)
].includes(m.sender);

    // Cari plugin
    let plugin = global.plugins.find(p => p.command && p.command.includes(command))
    if (!plugin) return

    // Hook before()
    if (typeof plugin.before === 'function') {
      let stop = await plugin.before(m, { conn, args, usedPrefix: prefix, command, db, text })
      if (stop) return
    }

    // Validasi
// Check 1: Owner-only feature
if (plugin.owner && !isOwner) return m.reply('This feature is for Owner only!')

// Check 2: Premium-only feature  
if (plugin.premium && !user.premium) return m.reply('This feature is for Premium users only!')

// Check 3: Group-only feature
if (plugin.group && !m.isGroup) return m.reply('This feature is only for Groups!')

// Check 4: Admin-only feature
if (plugin.admin && !(isAdmin || isOwner)) return m.reply('This feature is for Group Admins only!')

// Check 5: Bot must be admin
if (plugin.botAdmin && !isBotAdmin) return m.reply('Bot must be Admin first!')

// Check 6: User must be registered
if (plugin.register && !user.registered) return m.reply('Please register first with .register')

// Check 7: Check user's limit
if (plugin.limit) {
  if (user.limit <= 0) return m.reply('Your limit has run out!')
  user.limit--  // Reduce limit by 1
}

    // Eksekusi command
    // In handler.js, around line 115:
    // Eksekusi command
    try {
      await plugin(m, { 
        conn, 
        args, 
        usedPrefix: prefix, 
        command, 
        db, 
        isBotAdmin, 
        isAdmin, 
        text,
        isOwner,
        user,
        group
      })
      incrementCommand(command)
    } catch (err) {
      console.error('Error Command:', err)
      m.reply('Error: ' + err.message)
      // lapor ke owner
      for (let owner of db.list().owner) {
        await conn.sendMessage(owner, { text: `❌ Error pada command *${command}*:\n\n${err.stack}` })
      }
    }

  } catch (e) {
    console.error('Error Handler:', e)
  }
}

global.stats = global.stats || {}
function incrementCommand(cmd) {
  global.stats[cmd] = (global.stats[cmd] || 0) + 1
}

module.exports = handleMessage