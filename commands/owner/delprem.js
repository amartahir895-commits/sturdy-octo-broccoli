const handler = async (m, { conn, args, db }) => {
  // Find the target user
  let who = m.mentionedJid && m.mentionedJid[0]
    ? m.mentionedJid[0]  // If user is mentioned with @tag
    : args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net'  // If phone number is given

  // If no user is specified
  if (!who) return m.reply(`Example:\n!delprem @tag\n!delprem 923XXXXXXXX`)

  // Get user data from database
  let user = db.list().user[who]
  
  // Check if user exists and has premium status
  if (!user || !user.premium) return m.reply('This user is not Premium.')

  // Remove premium status
  user.premium = false
  
  // Save changes to database
  await db.save()

  // Send success message
  m.reply(`✅ ${who}'s Premium status has been removed.`)
}

// Command name
handler.command = ['delprem']

// Category
handler.category = 'owner'

// Description
handler.description = 'Remove Premium status from a user'

// Only bot owner can use
handler.owner = true

module.exports = handler