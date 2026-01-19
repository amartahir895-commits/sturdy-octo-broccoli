const { exec } = require("child_process")  // For running system commands
const util = require("util")               // For formatting output
const execPromise = util.promisify(exec)   // Makes exec() easier to use

let handler = async (m, { conn, usedPrefix, command, text, isOwner }) => {

    if (!text) return m.reply(`How to use:
${usedPrefix}=> conn.sendMessage(...)  // Run async JavaScript
${usedPrefix}> 1+1                      // Run regular JavaScript
${usedPrefix}$ ls                        // Run system commands`)
    
    // 1. For ASYNC JavaScript: =>
    if (command === '=>') {
        try {
            const result = await eval(`(async () => { 
                try { return await ${text} } 
                catch (e) { return e } 
            })()`)
            return m.reply(util.format(result))
        } catch (e) {
            return m.reply(util.format(e))
        }
    }

    // 2. For REGULAR JavaScript: >
    if (command === '>') {
        try {
            const result = eval(text)       // Run the JavaScript code
            return m.reply(util.format(result))
        } catch (e) {
            return m.reply(util.format(e))
        }
    }

    // 3. For SYSTEM COMMANDS: $
    if (command === '$') {
        try {
            const { stdout, stderr } = await execPromise(text)
            let output = ''

            if (stdout) output += `*[ stdout ]*\n${stdout.trim()}\n\n`  // Normal output
            if (stderr) output += `*[ stderr ]*\n${stderr.trim()}`      // Error output

            if (!stdout && !stderr) output = "✅ Command completed without output."

            return m.reply(output)
        } catch (e) {
            return m.reply(`❌ ERROR:\n${e.stderr || e.stdout || e.message}`)
        }
    }
}

// Three different commands
handler.command = ['=>', '>', '$']

// Category
handler.category = 'owner'

// Description
handler.description = 'Eval & shell commands for developers'

// Only bot owner can use
handler.owner = true

// No usage limit
handler.limit = false

module.exports = handler