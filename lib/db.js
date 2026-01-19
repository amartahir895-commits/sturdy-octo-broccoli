const fs = require('fs')

const file = './database/db.json'
let data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : { user: {}, group: {}, owner: [] }

const save = () => fs.writeFileSync(file, JSON.stringify(data, null, 2))

module.exports = {
  list: () => data,
  get: () => data,
  save
}