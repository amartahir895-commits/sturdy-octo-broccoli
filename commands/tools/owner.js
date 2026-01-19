const handler = async (m, { conn, usedPrefix }) => {
  const ownerNumbers = global.owner || ['923195447147'];
  
  let ownerText = `╭─「 *BOT OWNER* 」\n`;
  
  ownerNumbers.forEach((num, index) => {
    const cleanNum = num.replace('@s.whatsapp.net', '');
    ownerText += `│ ${index + 1}. https://wa.me/${cleanNum}\n`;
  });
  
  ownerText += `╰────────────────────\n\n`;
  ownerText += `📧 *Contact for:*\n`;
  ownerText += `• Bug reports\n`;
  ownerText += `• Feature requests\n`;
  ownerText += `• Premium inquiries\n`;
  ownerText += `• Business collaboration\n\n`;
  ownerText += `⏰ *Response Time:* Usually within 24 hours`;

  await conn.sendMessage(m.chat, {
    text: ownerText,
    contextInfo: {
      mentionedJid: ownerNumbers.map(num => num.includes('@') ? num : num + '@s.whatsapp.net'),
      forwardingScore: 999,
      isForwarded: true
    }
  }, { quoted: m });
}

handler.command = ['owner', 'creator', 'developer', 'admin'];
handler.category = 'tools';
handler.description = 'Contact bot owner/developer';
handler.owner = false;
handler.limit = false;

module.exports = handler;