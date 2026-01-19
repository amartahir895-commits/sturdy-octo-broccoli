const handler = async (m, { conn, args, db }) => {
  // Find the target user
  let who = m.mentionedJid && m.mentionedJid[0]
    ? m.mentionedJid[0]  // If user is mentioned with @tag
    : args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net'  // If phone number is given

  // If no user is specified
  if (!who) return m.reply(`Example:\n!addowner @tag\n!addowner 923XXXXXXXX`)

  // Check if user is already an owner
  if (db.list().owner.includes(who)) return m.reply('This user is already an Owner.')
  
  // Add user to owner list
  db.list().owner.push(who)
  
  // Save changes to database
  await db.save()

  // Send success message
  m.reply(`✅ Successfully added ${who} as *Owner*.`)
}

// Command name
handler.command = ['addowner']

// Category
handler.category = 'owner'

// Description
handler.description = 'Add new Owner'

// Only current owners can use this
handler.owner = true

module.exports = handler