const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const syncScriptPath = path.resolve(__dirname, '../../../scripts/sync-admin-static.sh')
const rootPackageJsonPath = path.resolve(__dirname, '../../../package.json')

test('root build:admin script syncs admin dist into server public admin', () => {
  assert.ok(fs.existsSync(syncScriptPath), `missing sync script: ${syncScriptPath}`)

  const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'))

  assert.equal(rootPackageJson.scripts['sync:admin-static'], 'bash ./scripts/sync-admin-static.sh')
  assert.equal(
    rootPackageJson.scripts['build:admin'],
    'pnpm --filter @geo/admin build && pnpm sync:admin-static',
  )
})
