const fs = require('fs')
const path = require('path')

const handler = async (m, { conn, args, command, text }) => {
  const baseDir = path.join(__dirname, '../..', 'commands') // The commands folder
  let subcmd = command.toLowerCase()

  // 1. ADD PLUGIN
  if (subcmd === 'addplugin') {
    if (!args[0]) return m.reply('Example: !addplugin owner/delprem.js\n(then reply with JS code)')
    if (!m.quoted || !m.quoted.text) return m.reply('Reply with the plugin code!')
    
    let filePath = path.join(baseDir, args[0])
    let dir = path.dirname(filePath)

    // Create folder if it doesn't exist
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    
    // Save the code to a file
    fs.writeFileSync(filePath, m.quoted.text)

    m.reply(`✅ Plugin successfully added at *${args[0]}*`)
    return
  }

  // 2. DELETE PLUGIN
  if (subcmd === 'delplugin') {
    if (!args[0]) return m.reply('Example: !delplugin owner/delprem.js')
    let filePath = path.join(baseDir, args[0])
    
    // Check if file exists
    if (!fs.existsSync(filePath)) return m.reply('Plugin not found.')

    // Delete the file
    fs.unlinkSync(filePath)
    m.reply(`✅ Plugin *${args[0]}* successfully deleted.`)
    return
  }

  // 3. LIST PLUGINS
  if (subcmd === 'daftarplugin') {
    let plugins = []

    // Function to search all folders
    const walk = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        let filepath = path.join(dir, file)
        
        // If it's a folder, search inside it
        if (fs.lstatSync(filepath).isDirectory()) walk(filepath)
        
        // If it's a JavaScript file, add to list
        else if (file.endsWith('.js')) {
          plugins.push(path.relative(baseDir, filepath))
        }
      })
    }
    
    // Start searching
    walk(baseDir)

    if (plugins.length === 0) return m.reply('No plugins yet.')
    m.reply(`📂 *Plugin List:*\n\n${plugins.map(p => '• ' + p).join('\n')}`)
    return
  }

  // 4. VIEW PLUGIN CONTENT
  if (subcmd === 'isiplugin') {
    if (!args[0]) return m.reply('Example: !isiplugin owner/delprem.js')
    let filePath = path.join(baseDir, args[0])
    if (!fs.existsSync(filePath)) return m.reply('Plugin not found.')

    // Read the file content
    let isi = fs.readFileSync(filePath, 'utf-8')
    
    // Check if content is too long
    if (isi.length > 3000) return m.reply('Plugin content is too long!')
    m.reply(`📄 Content of plugin *${args[0]}*:\n\n${isi}`)
    return
  }
}

// Command names
handler.command = ['addplugin', 'delplugin', 'daftarplugin', 'isiplugin']

// Category
handler.category = 'owner'

// Description
handler.description = 'Dynamic plugin management (add/delete/list/view content)'

// Only bot owner can use these commands
handler.owner = true

module.exports = handler