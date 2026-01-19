const handler = async (m, { text, db }) => {
  // Check if this is a group chat
  if (!m.isGroup) return m.reply('This feature is only for groups!')
  
  // Check if text is provided
  if (!text) return m.reply(`Example:\n!setwelcome Hello @user, welcome to @subject group`)

  // Get group data from database or create new
  let group = db.list().group[m.chat] ||= {}
  
  // Set the welcome message
  group.textWelcome = text
  
  // Save to database
  await db.save()

  // Send confirmation
  m.reply('✅ Welcome message successfully changed!')
}

// Command name
handler.command = ['setwelcome']

// Category
handler.category = 'group'

// Description - mentions @user and @subject can be used
handler.description = 'Set custom welcome message for group (@user and @subject can be used)'

// Can only be used in groups
handler.group = true

// Only group admins can use this
handler.admin = true

module.exports = handler
