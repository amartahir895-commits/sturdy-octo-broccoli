const yts = require('yt-search')

const handler = async (m, { text, usedPrefix }) => {
  if (!text) return m.reply(`❌ Search query do\nExample: ${usedPrefix}yt alan walker`)

  const res = await yts(text)
  const videos = res.videos.slice(0, 5)

  if (!videos.length) return m.reply('❌ No results found')

  let msg = `🔎 *YouTube Search Results*\n\n`
  videos.forEach((v, i) => {
    msg += `*${i + 1}. ${v.title}*\n`
    msg += `⏱ ${v.timestamp} | 👀 ${v.views}\n`
    msg += `🔗 ${v.url}\n\n`
  })

  m.reply(msg)
}

handler.command = ['yt', 'yts', 'ytsearch']
handler.category = 'search'
handler.limit = false

module.exports = handler
