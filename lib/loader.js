const fs = require('fs')
const path = require('path')

function loadPlugins(dir = path.join(__dirname, '../commands')) {
  global.plugins = []

  const walk = (folder) => {
    fs.readdirSync(folder).forEach(file => {
      let filepath = path.join(folder, file)
      if (fs.lstatSync(filepath).isDirectory()) {
        walk(filepath)
      } else if (file.endsWith('.js')) {
        try {
          delete require.cache[require.resolve(filepath)]
          let plugin = require(filepath)
          global.plugins.push(plugin)
          console.log(`✅ Loaded plugin: ${path.relative(dir, filepath)}`)
        } catch (e) {
          console.error(`❌ Error load plugin: ${filepath}\n`, e)
        }
      }
    })
  }

  walk(dir)
}

function watchPlugins(dir = path.join(__dirname, '../commands')) {
  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename.endsWith('.js')) return
    console.log(`♻️ Plugin changed: ${filename}, reloading...`)
    loadPlugins(dir)
  })
}

module.exports = { loadPlugins, watchPlugins }