const os = require('os')
const axios = require('axios')

// ===== GLOBAL THUMB INDEX =====
let thumbIndex = 0

// ===== UPTIME FORMAT =====
function formatUptime(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  // Heavy, dramatic style
  return `⏳🛡 DAYS: ${days} ⏱⚡ HOURS: ${hours} 🕰🔥 MINUTES: ${minutes}`;
}
// ===== FAKE QUOTED MESSAGE =====
const fakeQuoted = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    orderMessage: {
      orderId: "2009",
      thumbnail: null,
      itemCount: "9999",
      status: "INQUIRY",
      surface: "",
      message: `✦ ⏤͟͟͞͞Λ௱௱Λ尺 н4ㄈҚ3尺 ⛧`,
      token: "AR6xBKbXZn0Xwmu76Ksyd7rnxI+Rx87HfinVlW4lwXa6JA=="
    }
  },
  contextInfo: {
    mentionedJid: ["120363390114292114@s.whatsapp.net"],
    forwardingScore: 999,
    isForwarded: true,
  }
};

const handler = async (m, { conn, usedPrefix, user }) => {
  // ===== USER DATA =====
  const exp = user?.exp ?? 0
  const limit = user?.limit ?? 0
  const money = user?.money ?? 0
  const premium = user?.premium ? 'Yes ✅' : 'No ❌'

  // ===== UPTIME =====
  const botUptime = formatUptime(process.uptime() * 1000)
  const vpsUptime = formatUptime(os.uptime() * 1000)

// ===== SINGLE THUMBNAIL =====
  const images = [
    'https://i.ibb.co/bM3xLdvD/IMG-202601117-WA0093.jpg'
  ]

  // Ek image select karo
  const selectedImage = images[thumbIndex]
  thumbIndex = (thumbIndex + 1) % images.length

// ===== CONFIG =====
  const footer = '© 2026 Λ௱௱Λ尺 н4ㄈҚ3尺'
  const botFullName = 'Λ௱௱Λ尺 н4ㄈҚ3尺 BOT'
  const chShort = 'https://whatsapp.com/channel/0029VbBEWeUICVfc8ipiWg2q'
  const idCh = '120363403320186072@newsletter'

  // ===== MENU TEXT (HEAVY PROFESSIONAL DESIGN) =====
  let menuText = `
┏━━━━━━━━━━━━━━━━━━━┓
┃ ✪  *${botFullName}*  ✪
┗━━━━━━━━━━━━━━━━━━━┛
┏╸ 👤 *USER STATISTICS*
┃ ◈ *Rank*    : ${premium ? '👑 Premium' : '👤 Free User'}
┃ ◈ *Money*   : ${money}
┃ ◈ *XP*      : ${exp}
┃ ◈ *Limit*   : ${limit}
┗━━━━━━━━━━━━━━━━━━━╸
┏╸ 🖥️ *SYSTEM STATUS*
┃ ◈ *Uptime*  : ${botUptime}
┃ ◈ *Server*  : ${vpsUptime}
┃ ◈ *Mode*    : Public / Online
┗━━━━━━━━━━━━━━━━━━━╸
`

  // ===== COMMAND CATEGORIES =====
  let categories = {}
  for (let plugin of global.plugins) {
    let cat = plugin.category || 'Main Menu'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(plugin)
  }

  for (let [cat, cmds] of Object.entries(categories)) {
    menuText += `
┌─⭓ *${cat.toUpperCase()}*
│`
    for (let cmd of cmds) {
      if (!cmd.command) continue
      for (let c of cmd.command) {
        menuText += `
│ ◦ ${usedPrefix}${c}`
      }
    }
    menuText += `
└───────────────╸
`
  }

  // "Toolkit" hata kar Professional Info dala hai
  menuText += `
┏╸ 📡 *CONNECTIVITY*
┃ ◈ *Dev*     : Ammar Hacker
┃ ◈ *Ver*     : 1.0 (Stable)
┃ ◈ *Link*    : ${chShort}
┗━━━━━━━━━━━━━━━━━━━╸

${footer}
`

  // ===== DOWNLOAD IMAGE =====
  const downloadImage = async (url) => {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer' })
      return Buffer.from(res.data)
    } catch {
      return null
    }
  }

  const imageBuffer = await downloadImage(selectedImage)
  
  // ===== IMAGE MESSAGE (FIXED) =====
  const imageMessage = {
    image: imageBuffer,
    caption: menuText.trim(),
    footer: footer,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: idCh,
        newsletterName: footer,
      },
    },
  }

  // Send message with fake quoted
  await conn.sendMessage(m.chat, imageMessage, { quoted: fakeQuoted })
}

handler.command = ['allmenu', 'menu', 'help']
handler.category = 'tools'
handler.limit = false

module.exports = handler
