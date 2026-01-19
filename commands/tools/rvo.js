const { downloadMediaMessage } = require('@whiskeysockets/baileys')

const handler = async (m, { conn, usedPrefix }) => {
  if (!m.quoted) {
    return m.reply(
      `❌ Kisi View Once media par reply karo\nExample:\nReply media + ${usedPrefix}rvo`
    )
  }

  // quoted message
  const q = m.quoted.message

  // view once extract
  const viewOnce =
    q.viewOnceMessageV2Extension?.message ||
    q.viewOnceMessageV2?.message ||
    q.viewOnceMessage?.message ||
    q

  const mediaType =
    viewOnce.imageMessage ? 'image' :
    viewOnce.videoMessage ? 'video' :
    viewOnce.audioMessage ? 'audio' : null

  if (!mediaType) {
    return m.reply('❌ Ye media supported nahi ya already opened hai')
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const buffer = await downloadMediaMessage(
      { message: { [`${mediaType}Message`]: viewOnce[`${mediaType}Message`] } },
      'buffer',
      {},
      { logger: console, reuploadRequest: conn.updateMediaMessage }
    )

    let sendType = {}
    if (mediaType === 'image') sendType.image = buffer
    if (mediaType === 'video') sendType.video = buffer
    if (mediaType === 'audio') {
      sendType.audio = buffer
      sendType.mimetype = 'audio/mp4'
    }

    await conn.sendMessage(
      m.chat,
      {
        ...sendType,
        caption: '👁️ View Once media unlocked'
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('RVO ERROR:', e)
    m.reply('❌ View Once media nikalne me error')
  }
}

handler.command = ['rvo', 'readviewonce', 'viewonce']
handler.category = 'tools'
handler.limit = false
handler.owner = false
handler.group = false

module.exports = handler