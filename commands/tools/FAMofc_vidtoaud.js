const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')

const handler = async (m, { conn, usedPrefix }) => {
  const q = m.quoted ? m.quoted : m
  const msg = q.message
  const video = msg?.videoMessage

  if (!video) {
    return m.reply(
      `⚠️ Video par reply karo\nExample:\nReply video + ${usedPrefix}toaudio`
    )
  }

  await conn.sendMessage(m.chat, { react: { text: '🎧', key: m.key } })

  try {
    const buffer = await downloadMediaMessage(
      q,
      'buffer',
      {},
      { logger: console, reuploadRequest: conn.updateMediaMessage }
    )

    const inputPath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`)
    const outputPath = path.join(os.tmpdir(), `audio_${Date.now()}.mp3`)

    fs.writeFileSync(inputPath, buffer)

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate(128)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath)
    })

    await conn.sendMessage(
      m.chat,
      {
        audio: fs.readFileSync(outputPath),
        mimetype: 'audio/mpeg',
        ptt: false
      },
      { quoted: m }
    )

    fs.unlinkSync(inputPath)
    fs.unlinkSync(outputPath)

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('TOAUDIO ERROR:', e)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    m.reply('❌ ffmpeg system me available nahi')
  }
}

handler.command = ['toaudio', 'mp3']
handler.category = 'tools'
handler.limit = false
handler.owner = false
handler.group = false

module.exports = handler