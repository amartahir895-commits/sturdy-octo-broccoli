// commands/tools/tatq.js
const handler = async (m, { conn, usedPrefix, command }) => {
  let txt = `
╭───〔 *TATQ - About Bot* 〕
│👨‍💻 *Developer:* Ammar
│🤖 *AI Support:* ChatGPT
│⚙️ *Handler Engine:* DeepSeek
│🐞 *Error Tracker:* Gemini
│📌 *Command:* ${usedPrefix + command}
╰───────────────
  `

  await m.reply(txt.trim())
}

handler.command = ['tatq']
handler.category = 'tools'
handler.description = 'Displays bot creator information and supporting technologies'
handler.owner = false

module.exports = handler