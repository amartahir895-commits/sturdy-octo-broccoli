const handler = async (m, { conn, args, db }) => {
  // Find the target user
  let who = m.mentionedJid && m.mentionedJid[0]
    ? m.mentionedJid[0]  // If user is mentioned with @tag
    : args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net'  // If phone number is given

  // If no user is specified
  if (!who) return m.reply(`Example:\n!addprem @tag\n!addprem 923XXXXXXXX`)

  // Get user data from database or create new user
  let user = db.list().user[who] ||= { exp: 0, limit: 10, money: 0, premium: false }
  
  // Check if user already has premium
  if (user.premium) return m.reply('This user is already Premium.')

  // Give premium status
  user.premium = true
  
  // Save changes to database
  await db.save()

  // Send success message
  m.reply(`✅ ${who} is now a *Premium User*!`)
}

// Command name
handler.command = ['addprem']

// Category
handler.category = 'owner'

// Description
handler.description = 'Add Premium status to a user'

// Only bot owner can use
handler.owner = true

module.exports = handler