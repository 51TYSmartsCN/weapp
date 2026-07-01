const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const serverEntryPath = path.resolve(__dirname, '../src/index.ts')

test('server serves admin index.html for admin SPA routes', () => {
  const serverEntry = fs.readFileSync(serverEntryPath, 'utf8')

  assert.match(serverEntry, /app\.get\('\/admin\/\*path'/)
  assert.match(serverEntry, /res\.sendFile\(path\.join\(adminStaticRoot, 'index\.html'\)\)/)
})
