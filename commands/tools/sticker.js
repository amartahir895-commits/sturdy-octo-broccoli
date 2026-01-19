const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec } = require('child_process')

const handler = async (m, { conn, usedPrefix }) => {
  let q = m.quoted ? m.quoted : m

  // Check image
  if (!q || !q.message || !q.message.imageMessage) {
    return m.reply(
      `❌ Kisi image par reply karo\nExample:\nReply image + ${usedPrefix}sticker`
    )
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    // Download image
    const buffer = await downloadMediaMessage(
      q,
      'buffer',
      {},
      { logger: console, reuploadRequest: conn.updateMediaMessage }
    )

    const tmpImg = path.join(os.tmpdir(), `${Date.now()}.jpg`)
    const tmpWebp = path.join(os.tmpdir(), `${Date.now()}.webp`)

    fs.writeFileSync(tmpImg, buffer)

    // Convert image → webp sticker
    exec(
      `ffmpeg -i "${tmpImg}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0" "${tmpWebp}"`,
      async (err) => {
        fs.unlinkSync(tmpImg)
        if (err) {
          console.error(err)
          return m.reply('❌ Sticker convert failed')
        }

        const stickerBuffer = fs.readFileSync(tmpWebp)
        fs.unlinkSync(tmpWebp)

        await conn.sendMessage(m.chat, {
          sticker: stickerBuffer
        }, { quoted: m })

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
      }
    )

  } catch (e) {
    console.error('STICKER ERROR:', e)
    m.reply('❌ Failed to create sticker')
  }
}

handler.command = ['sticker', 's']
handler.category = 'tools'
handler.limit = false
handler.owner = false

module.exports = handler