const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')

const handler = async (m, { conn, usedPrefix }) => {
  const q = m.quoted ? m.quoted : m
  const msg = q.message

  const media =
    msg?.imageMessage ||
    msg?.videoMessage

  if (!media) {
    return m.reply(
      `⚠️ Image ya video par reply karo\nExample:\nReply media + ${usedPrefix}tourl`
    )
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const buffer = await downloadMediaMessage(
      q,
      'buffer',
      {},
      { logger: console, reuploadRequest: conn.updateMediaMessage }
    )

    const mime = media.mimetype || ''
    const ext = mime.includes('image') ? 'jpg' : mime.includes('video') ? 'mp4' : 'bin'

    const tmpFile = path.join(os.tmpdir(), `tourl_${Date.now()}.${ext}`)
    fs.writeFileSync(tmpFile, buffer)

    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', fs.createReadStream(tmpFile))

    const res = await axios.post(
      'https://catbox.moe/user/api.php',
      form,
      { headers: form.getHeaders() }
    )

    fs.unlinkSync(tmpFile)

    if (typeof res.data === 'string' && res.data.startsWith('https://')) {
      await m.reply(`✅ *Media URL:*\n${res.data}`)
      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    } else {
      throw new Error('Invalid response from server')
    }

  } catch (e) {
    console.error('TOURL ERROR:', e)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    m.reply('❌ Media upload failed')
  }
}

handler.command = ['tourl', 'upload']
handler.category = 'tools'
handler.limit = false
handler.owner = false
handler.group = false

module.exports = handler