const handler = async (m, { args, db }) => {
  // Create settings object if it doesn't exist
  if (!db.list().settings) db.list().settings = { anticall: false }

  // If no argument is given
  if (!args[0]) return m.reply(`Example:\n!anticall on\n!anticall off`)

  // Turn ON anti-call
  if (args[0].toLowerCase() === 'on') {
    db.list().settings.anticall = true
    await db.save()
    return m.reply('✅ Anti-Call activated. Bot will reject all calls.')
  }

  // Turn OFF anti-call
  if (args[0].toLowerCase() === 'off') {
    db.list().settings.anticall = false
    await db.save()
    return m.reply('❌ Anti-Call deactivated.')
  }

  // If argument is not 'on' or 'off'
  return m.reply('Options only: on / off')
}

// Command name
handler.command = ['anticall']

// Category
handler.category = 'owner'

// Description
handler.description = 'Activate/deactivate anti-call feature'

// Only bot owner can use
handler.owner = true

module.exports = handler