const os = require('os');
const fs = require('fs');
const moment = require('moment-timezone');
moment.tz.setDefault('UTC');

const handler = async (m, { conn, usedPrefix }) => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  const totalCommands = global.plugins.length;
  const stats = global.stats || {};
  const mostUsed = Object.entries(stats).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  
  // Get active users count from db
  const activeUsers = Object.keys(global.db?.users || {}).length;
  
  const infoText = `
╭─「 *BOT INFORMATION* 」
│ • Name: ${conn.user.name}
│ • Version: 2.0.0
│ • Prefix: ${usedPrefix}
│ • Platform: Multi-Device
│
│ • Uptime: ${hours}h ${minutes}m ${seconds}s
│ • Platform: ${os.platform()} ${os.arch()}
│ • Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
│ • CPU: ${os.cpus()[0].model}
│
│ • Total Plugins: ${totalCommands}
│ • Active Users: ${activeUsers}
│ • Most Used Command: ${mostUsed[0]} (${mostUsed[1]} times)
│
│ • Owner: @${(global.owner || ['unknown'])[0].replace('@s.whatsapp.net', '')}
│ • Server Time: ${moment().format('YYYY-MM-DD HH:mm:ss UTC')}
╰────────────────────

*Quick Commands:*
${usedPrefix}menu - Show menu
${usedPrefix}owner - Contact owner
${usedPrefix}ping - Check bot speed
${usedPrefix}simdata - Check SIM information
${usedPrefix}allmenu - Full command list

*Support:*
If you find bugs or need help, contact the owner.
  `;

  await conn.sendMessage(m.chat, {
    text: infoText,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true
    }
  }, { quoted: m });
}

handler.command = ['info', 'botinfo', 'status', 'about'];
handler.category = 'tools';
handler.description = 'Display bot information and statistics';
handler.owner = false;
handler.limit = false;

module.exports = handler;