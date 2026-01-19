const handler = async (m, { conn, args, usedPrefix, text }) => {
  if (!text) {
    return m.reply(`❌ Please provide a phone number!\nExample: ${usedPrefix}simdata 03XX-XXXXXXX\nExample: ${usedPrefix}simdata +923XX-XXXXXXX`);
  }

  // Clean input
  const cleanedNumber = text.replace(/[^\d+]/g, '').replace(/^\+?(\d+)$/, '$1');

  // Validate phone number
  if (!/^\+?\d{10,13}$/.test(cleanedNumber)) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    return m.reply(`❌ Invalid phone number!\nExample: ${usedPrefix}simdata 03XX-XXXXXXX or +923XX-XXXXXXX`);
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

  try {
    const axios = require('axios');
    const response = await axios.get(`https://fam-official.serv00.net/api/database.php?number=${encodeURIComponent(cleanedNumber)}`, {
      timeout: 40000
    });

    const data = response.data;

    // Handle response
    if (!data.success || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      return m.reply(`❌ No data found for number ${text}. Try another number.`);
    }

    // Format response
    let formattedResponse = `✅ *SIM DATABASE RESULTS*\n`;
    formattedResponse += `📞 Phone Number: ${cleanedNumber}\n`;
    formattedResponse += `📊 Total Records: ${data.data.length}\n`;
    formattedResponse += `╭─────────────\n`;

    data.data.forEach((userData, index) => {
      formattedResponse += `│ 📌 *Record ${index + 1}:*\n`;
      formattedResponse += `│ • Name: ${userData.name || 'Unknown'}\n`;
      formattedResponse += `│ • Number: ${userData.number || 'Unknown'}\n`;
      formattedResponse += `│ • CNIC: ${userData.cnic || 'Unknown'}\n`;
      formattedResponse += `│ • Address: ${userData.address?.trim() || 'Unknown'}\n`;
      if (userData.family) formattedResponse += `│ • Family: ${userData.family}\n`;
      if (userData.operator) formattedResponse += `│ • Operator: ${userData.operator}\n`;
      if (index < data.data.length - 1) formattedResponse += `│ ─────────────\n`;
    });

    formattedResponse += `╰─────────────\n`;
    formattedResponse += `🔍 ${data.credit || 'Powered by Ammar'}\n`;
    formattedResponse += `⚠️ *Disclaimer:* This information is for legal purposes only`;

    await conn.sendMessage(m.chat, { 
      text: formattedResponse,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true
      }
    }, { quoted: m });
    
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    
  } catch (error) {
    console.error("SIM Data Error:", error);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      await m.reply(`❌ Request timeout. Please try again later.`);
    } else if (error.response?.status === 404) {
      await m.reply(`❌ API endpoint not found.`);
    } else if (error.response?.status === 429) {
      await m.reply(`❌ Too many requests. Please wait before trying again.`);
    } else {
      await m.reply(`❌ Failed to retrieve SIM data: ${error.message}`);
    }
  }
}

handler.command = ['simdata', 'sim', 'database', 'checknumber'];
handler.category = 'database';
handler.description = 'Check SIM database information by phone number';
handler.owner = false;
handler.premium = false;
handler.limit = false;
handler.group = false;

module.exports = handler;