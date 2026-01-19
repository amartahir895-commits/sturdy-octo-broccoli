const handler = async (m, { text }) => {
  if (!text) return m.reply('Contoh: !say halo')
  m.reply(text)
}

handler.command = ['say']
handler.category = 'tools'
handler.description = 'Bot repeat text'
handler.owner = false
handler.limit = true

handler.before = async (m) => {
  console.log('before say:', m.sender)
}
handler.all = async (m) => {
  console.log('all hook:', m.text)
}
handler.onMessage = async (m) => {
  if (m.text?.toLowerCase() === 'halo') m.reply('Hai also!')
}

module.exports = handler