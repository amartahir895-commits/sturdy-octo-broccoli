const axios = require('axios')

let handler = async (m, { text }) => {
  if (!text) return m.reply('❌ BIN number do\n\nExample: .bin 45717360')

  let bin = text.replace(/\D/g, '').slice(0, 8)
  if (bin.length < 6) return m.reply('❌ Valid BIN enter karo (min 6 digits)')

  try {
    const res = await axios.get(`https://lookup.binlist.net/${bin}`, {
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    })

    const d = res.data

    let msg = `
💳 *BIN INFORMATION*

• BIN: ${bin}
• Scheme: ${d.scheme || '-'}
• Type: ${d.type || '-'}
• Brand: ${d.brand || '-'}

🏦 *Bank*
• Name: ${d.bank?.name || '-'}
• URL: ${d.bank?.url || '-'}
• Phone: ${d.bank?.phone || '-'}

🌍 *Country*
• Name: ${d.country?.name || '-'}
• Code: ${d.country?.alpha2 || '-'}
• Currency: ${d.country?.currency || '-'}
• Emoji: ${d.country?.emoji || '-'}
`.trim()

    m.reply(msg)

  } catch (e) {
    m.reply('❌ BIN info nahi mil saki\nTry again later')
  }
}

handler.command = ['bin', 'bininfo']
handler.category = 'carding'
handler.description = 'Check BIN information'
handler.limit = false

module.exports = handler
