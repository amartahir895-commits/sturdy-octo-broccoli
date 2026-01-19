const fs = require('fs')
const path = require('path')

const handler = async (m, { conn, isOwner }) => {
  try {
    if (!isOwner) {
      return m.reply('❌ Only the Owner can use this command!')
    }

    const authFolder = path.join(__dirname, '..', '../auth')
    const safeFiles = ['creds.json']

    await conn.sendMessage(m.chat, { react: { text: '🧹', key: m.key } })
    await m.reply('⏳ *Cleaning auth session files...*')

    if (!fs.existsSync(authFolder)) {
      return m.reply('❌ *Auth folder not found!*')
    }

    const files = fs.readdirSync(authFolder)
    let deleted = 0

    for (const file of files) {
      const filePath = path.join(authFolder, file)

      if (
        fs.lstatSync(filePath).isFile() &&
        !safeFiles.includes(file)
      ) {
        fs.unlinkSync(filePath)
        deleted++
      }
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    m.reply(
      `✅ *Auth cleaned successfully!*\n🗑 Deleted: ${deleted} files\n🔐 creds.json is safe`
    )

  } catch (err) {
    console.error('CLEAN AUTH ERROR:', err)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    m.reply('⚠️ *Error while cleaning auth files*')
  }
}

handler.command = ['clean', 'cleanauth']
handler.category = 'owner'
handler.owner = true
handler.limit = false
handler.group = false

module.exports = handler