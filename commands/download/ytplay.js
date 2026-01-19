const axios = require('axios')

// ✅ YouTube URL validator
function isYouTubeUrl(url) {
  const ytRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/i
  return ytRegex.test(url)
}

const handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) {
    return m.reply(
      `❌ Link do\n\nExample:\n${usedPrefix}ytmp3 https://youtu.be/xxxx\n${usedPrefix}ytmp4 https://youtube.com/watch?v=xxxx`
    )
  }

  // ❌ Agar YouTube link nahi
  if (!isYouTubeUrl(text)) {
    return m.reply('❌ Yeh YouTube link nahi hai')
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const api = `https://api.ureshii.my.id/api/downloader/youtube?url=${encodeURIComponent(text)}`
    const { data } = await axios.get(api, { timeout: 60000 })

    if (!data.success || !data.media) {
      return m.reply('❌ Download data nahi mila')
    }

    const title = data.title || 'YouTube Media'
    const audio = data.media.find(v => v.type === 'audio')
    const video = data.media.find(v => v.type === 'video')

    // 🎧 MP3
    if (command === 'ytmp3') {
      if (!audio?.url) return m.reply('❌ Audio available nahi')

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: audio.url },
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`
        },
        { quoted: m }
      )

      return conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    }

    // 🎬 MP4
    if (command === 'ytmp4') {
      if (!video?.url) return m.reply('❌ Video available nahi')

      await conn.sendMessage(
        m.chat,
        {
          video: { url: video.url },
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`,
          caption: `🎬 *${title}*`
        },
        { quoted: m }
      )

      return conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    }

  } catch (e) {
    console.error('YT CHECK ERROR:', e)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    m.reply('❌ Download failed')
  }
}

handler.command = ['ytmp3', 'ytmp4']
handler.category = 'downloader'
handler.limit = true
handler.owner = false
handler.group = false

module.exports = handler
