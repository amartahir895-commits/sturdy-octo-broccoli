const axios = require('axios')
const FormData = require('form-data')

let handler = async (m, { conn, usedPrefix, command, user, isOwner }) => {
  try {
    // Agar user ne kisi audio ko reply kiya ho
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''

    if (!/audio/.test(mime))
      return m.reply(`❌ *Misal:*\nAudio ko reply karo aur likho ${usedPrefix + command}`)

    // ⏳ Loading reaction
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    // Audio download karo
    let media = await q.download()
    if (!media) return m.reply('❌ Audio download nahi ho saka')

    // ===== FormData tayar karo =====
    let form = new FormData()
    form.append('file', media, {
      filename: 'audio.mp3',
      contentType: mime
    })
    form.append('sample_size', '118784')

    // ===== API request bhejo =====
    let res = await axios.post(
      'https://api.doreso.com/humming',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'user-agent': 'Mozilla/5.0 (Android)',
          'origin': 'https://www.aha-music.com',
          'referer': 'https://www.aha-music.com/'
        },
        timeout: 20000
      }
    )

    let json = res.data

    if (!json?.data?.title) {
      return m.reply('🍂 *Music detect nahi ho saki*')
    }

    // Result message
    let jawab = `
🎵 *MUSIC PEHCHAN LI GAI*

🎤 Artist : ${json.data.artists || 'Maloom nahi'}
🎧 Song   : ${json.data.title || 'Maloom nahi'}
🆔 Track  : ${json.data.acrid || '-'}
`.trim()

    await m.reply(jawab)

  } catch (e) {
    console.error('WHATMUSIC ERROR:', e)
    m.reply('🍂 *Music detect karte waqt error aa gaya*')
  } finally {
    // Reaction hata do
    await conn.sendMessage(m.chat, { react: { text: '', key: m.key } })
  }
}

handler.command = ['whatmusic']
handler.category = 'tools'
handler.limit = false
handler.owner = false
handler.premium = false

module.exports = handler