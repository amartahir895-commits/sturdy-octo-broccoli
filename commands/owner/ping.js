const handler = async (m, { conn }) => {
  const start = new Date().getTime();
  
  await conn.sendMessage(m.chat, { 
    text: '🏓 Pinging...' 
  }, { quoted: m });
  
  const end = new Date().getTime();
  const latency = end - start;
  
  const speedText = `
▰▰▰ PING RESULTS ▰▰▰
⚡ Latency   :: ${latency}ms
⚡ Status    :: ${latency < 500 ? '✅ Excellent' : latency < 1000 ? '⚡ Good' : '⚠️ Slow'}
⚡ Server    :: Online
⚡ Time      :: ${new Date().toLocaleTimeString()}

${latency < 500 ? '✅ Bot is running fast!' : '⚠️ Bot response is slow.'}
▰▰▰▰▰▰▰▰▰▰▰.'}
  `;
  
  await conn.sendMessage(m.chat, { 
    text: speedText,
    edit: m.key 
  });
}

handler.command = ['ping', 'speed', 'p'];
handler.category = 'tools';
handler.description = 'Check bot response speed';
handler.owner = false;
handler.limit = false;

module.exports = handler;