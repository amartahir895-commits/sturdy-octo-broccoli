const handler = async (m, { args, command, db }) => {
  let target

  // 1️⃣ Agar reply me use kiya
  if (m.quoted) {
    target = m.quoted.sender
  }
  // 2️⃣ Agar mention kiya
  else if (m.mentionedJid && m.mentionedJid.length > 0) {
    target = m.mentionedJid[0]
  }
  // 3️⃣ Agar number diya (923xx)
  else if (args[1]) {
    let num = args[1].replace(/[^0-9]/g, '')
    target = num + '@s.whatsapp.net'
  }
  // 4️⃣ Warna khud pe
  else {
    target = m.sender
  }

  let user = db.list().user[target]
  if (!user) return m.reply('❌ User database me nahi mila')

  let amount = parseInt(args[0])
  if (!amount || isNaN(amount))
    return m.reply('❌ Pehle amount likho')

  if (command === 'addexp') {
    user.exp += amount
    m.reply(`✅ ${amount} EXP add kar di`)
  }

  if (command === 'addlimit') {
    user.limit += amount
    m.reply(`✅ ${amount} Limit add kar di`)
  }

  if (command === 'addmoney') {
    user.money += amount
    m.reply(`✅ ${amount} Money add kar di`)
  }

  db.save()
}

handler.command = ['addexp', 'addlimit', 'addmoney']
handler.owner = true
handler.limit = false
handler.category = 'owner'
handler.description = 'Add exp / limit / money (reply, mention, number)'

module.exports = handler