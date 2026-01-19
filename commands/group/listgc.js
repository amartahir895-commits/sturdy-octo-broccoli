const handler = async (m, { conn }) => {
  try {
    
    // Get all groups where bot is a member
    const groups = await conn.groupFetchAllParticipating()
    const groupList = Object.values(groups)
    
    // Check if bot is in any groups
    if (groupList.length === 0) {
      return m.reply('🤖 Bot is not in any groups yet.')
    }
    
    // Format the message
    let text = `📊 *GROUP LIST*\n`
    text += `Total: ${groupList.length} groups\n\n`
    
    // Loop through each group
    groupList.forEach((group, i) => {
      const subject = group.subject || 'No Name'  // Group name
      const participants = group.participants?.length || 0  // Number of members
      const isBotAdmin = group.participants?.find(p => p.id === conn.user.id && p.admin)  // Check if bot is admin
      const groupId = group.id  // Group ID
      
      // Add group info to text
      text += `*${i + 1}. ${subject}*\n`
      text += `   👥 Members: ${participants}\n`
      text += `   🆔 ID: ${groupId}\n`
      text += `   🤖 Bot Admin: ${isBotAdmin ? '✅' : '❌'}\n`
      text += `   ─────────────\n`
    })
    
    // Send the message
    await m.reply(text)
    
  } catch (error) {
    console.error(error)
    m.reply('❌ Failed to get group list: ' + error.message)
  }
}

// Command names
handler.command = ['listgc', 'daftargroup']

// Category
handler.category = 'owner'

// Description
handler.description = 'View all groups where bot is a member'

// Only bot owner can use
handler.owner = true

module.exports = handler
