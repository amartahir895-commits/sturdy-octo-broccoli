const axios = require('axios')

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return m.reply(
      `❌ *BIN required*\n\n` +
      `Example:\n` +
      `${usedPrefix + command} 52393800185325|10|2026\n\n` +
      `Format:\nBIN|MM|YYYY`
    )
  }

  await conn.sendMessage(m.chat, { react: { text: '💳', key: m.key } })

  try {
    // Encode the input for URL
    const binInput = encodeURIComponent(args.join(' '))
    
    // API URL - Yeh aapke server ka hai
    const api = `https://fam-official.serv00.net/api/ccgen.php?bin=${binInput}&count=10`
    
    const { data } = await axios.get(api, { 
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!Array.isArray(data) || data.length === 0) {
      return m.reply('❌ CC generate nahi hui')
    }

    // Simple format without spaces in card numbers
    let result = `✅ *${data.length} Credit Cards Generated*\n\n`
    
    // Add all cards in simple format
    data.forEach((cc, index) => {
      result += `${cc}\n`
    })
    
    // Extract BIN from input
    const inputBin = args[0].split('|')[0]
    
    result += `\n📊 *Format:* Card Number | Expiry | CVV`
    result += `\n🔗 *BIN:* ${inputBin}`
    
    // If BIN is short, show note
    if (inputBin.length <= 8) {
      result += `\n📝 *Note:* First ${inputBin.length} digits fixed, rest random`
    }

    await m.reply(result)
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('CCGEN ERROR:', e)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    
    if (e.code === 'ECONNABORTED') {
      m.reply('❌ Request timeout. API slow hai, thoda wait karo.')
    } else {
      m.reply('❌ Error: ' + (e.message || 'Unknown error'))
    }
  }
}



handler.command = ['gen', 'gencc']
handler.category = 'carding'
handler.limit = false
handler.owner = false
handler.group = false

module.exports = handler
