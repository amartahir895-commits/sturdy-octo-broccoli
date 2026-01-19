const handler = async (m, { conn, args, db }) => {
  // Find the target user
  let who = m.mentionedJid && m.mentionedJid[0]
    ? m.mentionedJid[0]  // If user is mentioned with @tag
    : args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net'  // If phone number is given

  // If no user is specified
  if (!who) return m.reply(`Example:\n!delowner @tag\n!delowner 92xxxxxxxxxx`)

  // Check if user is in the owner list
  let index = db.list().owner.indexOf(who)
  
  // If user is not found in owner list
  if (index === -1) return m.reply('This user is not an Owner.')

  // Remove user from owner list
  db.list().owner.splice(index, 1)
  
  // Save changes to database
  await db.save()

  // Send success message
  m.reply(`✅ ${who} has been removed from *Owner* list.`)
}

// Command name
handler.command = ['delowner']

// Category
handler.category = 'owner'

// Description
handler.description = 'Remove user from Owner list'

// Only current owners can use this
handler.owner = true

module.exports = handler