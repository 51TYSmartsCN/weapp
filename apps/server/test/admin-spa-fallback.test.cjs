const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const serverEntryPath = path.resolve(__dirname, '../src/index.ts')

test('server serves admin index.html for admin SPA routes', () => {
  const serverEntry = fs.readFileSync(serverEntryPath, 'utf8')

  assert.ok(
    serverEntry.includes("app.get(/^\\/admin(?:\\/.*)?$/, (req, res, next) => {"),
    'expected admin SPA fallback to use a regex route that matches /admin/login',
  )
  assert.match(serverEntry, /if \(path\.extname\(req\.path\)\)/)
  assert.match(serverEntry, /res\.sendFile\(path\.join\(adminStaticRoot, 'index\.html'\)\)/)
})
