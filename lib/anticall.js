const db = require('./db')

async function antiCallHandler(conn, call) {
  let data = db.list()
  if (!data.settings) data.settings = { anticall: false }
  let settings = data.settings

  if (!settings.anticall) return

  for (let c of call) {
    if (c.status === 'offer') { // jika ada orang nelpon
      let jid = c.from
      await conn.rejectCall(c.id, c.from) // langsung tolak
      await conn.sendMessage(jid, { text: '⚠️ Maaf, bot tidak menerima panggilan. Kamu diblokir sementara.' })
      // opsional: auto block
      // await conn.updateBlockStatus(jid, 'block')
    }
  }
}

module.exports = antiCallHandler
