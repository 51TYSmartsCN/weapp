const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const adminIndexHtmlPath = path.resolve(__dirname, '../public/admin/index.html')

test('admin static html uses /admin asset base paths', () => {
  const html = fs.readFileSync(adminIndexHtmlPath, 'utf8')

  assert.match(html, /href="\/admin\/favicon\.svg"/)
  assert.match(html, /src="\/admin\/assets\/[^"]+\.js"/)
  assert.match(html, /href="\/admin\/assets\/[^"]+\.css"/)
  assert.doesNotMatch(html, /src="\/assets\//)
  assert.doesNotMatch(html, /href="\/assets\//)
})
