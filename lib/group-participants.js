const db = require('./db')

/**
 * Listener untuk event group-participants.update
 */
async function groupParticipantsUpdate(conn, update) {
  let data = db.list()
  let group = data.group[update.id] ||= {
    welcome: false,
    textWelcome: 'Halo @user, selamat datang di grup @subject',
    textLeave: 'Selamat tinggal @user',
  }

  await db.save()

  // Ambil metadata grup
  let metadata = await conn.groupMetadata(update.id)
  let subject = metadata.subject

  for (let participant of update.participants) {
    let userTag = '@' + participant.split('@')[0]

    if (update.action === 'add' && group.welcome) {
      let teks = group.textWelcome
        .replace(/@user/gi, userTag)
        .replace(/@subject/gi, subject)
      await conn.sendMessage(update.id, { text: teks, mentions: [participant] })
    }

    if (update.action === 'remove' && group.welcome) {
      let teks = group.textLeave
        .replace(/@user/gi, userTag)
        .replace(/@subject/gi, subject)
      await conn.sendMessage(update.id, { text: teks, mentions: [participant] })
    }
  }
}

module.exports = groupParticipantsUpdate