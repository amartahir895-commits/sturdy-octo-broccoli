const handler = async (m, { args, db }) => {
  // Check if this is a group chat
  if (!m.isGroup) return m.reply('This feature is only for groups!')
  
  // Get group data from database or create with welcome disabled
  let group = db.list().group[m.chat] ||= { welcome: false }

  // Check if argument is provided
  if (!args[0]) return m.reply(`Example:\n!welcome on\n!welcome off`)

  // Turn ON welcome/leave messages
  if (args[0].toLowerCase() === 'on') {
    group.welcome = true
    await db.save()
    return m.reply('✅ Welcome/Leave messages enabled in this group')
  } 
  // Turn OFF welcome/leave messages
  else if (args[0].toLowerCase() === 'off') {
    group.welcome = false
    await db.save()
    return m.reply('❌ Welcome/Leave messages disabled in this group')
  } 
  // Invalid option
  else {
    return m.reply('Options only: on / off')
  }
}

// Command name
handler.command = ['welcome']

// Category
handler.category = 'group'

// Description
handler.description = 'Enable/disable welcome & leave messages in group'

// Can only be used in groups
handler.group = true

// Only group admins can use this
handler.admin = true

// Bot doesn't need to be admin
handler.botAdmin = false

module.exports = handler
