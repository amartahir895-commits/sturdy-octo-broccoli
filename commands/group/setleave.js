const handler = async (m, { text, db }) => {
  // Check if this is a group chat
  if (!m.isGroup) return m.reply('This feature is only for groups!')
  
  // Check if text is provided
  if (!text) return m.reply(`Example:\n!setleave Goodbye @user`)

  // Get group data from database or create new
  let group = db.list().group[m.chat] ||= {}
  
  // Set the leave message
  group.textLeave = text
  
  // Save to database
  await db.save()

  // Send confirmation
  m.reply('✅ Leave message successfully changed!')
}

// Command name
handler.command = ['setleave']

// Category
handler.category = 'group'

// Description - mentions @user and @subject can be used
handler.description = 'Set custom leave message for group (@user and @subject can be used)'

// Can only be used in groups
handler.group = true

// Only group admins can use this
handler.admin = true

module.exports = handler
