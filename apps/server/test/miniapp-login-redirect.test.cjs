const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const helperPath = path.resolve(__dirname, '../../miniapp/src/services/login-redirect.ts')

function loadHelperModule() {
  assert.ok(fs.existsSync(helperPath), `missing helper: ${helperPath}`)
  const source = fs.readFileSync(helperPath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: helperPath,
  })

  const module = { exports: {} }
  const context = vm.createContext({
    module,
    exports: module.exports,
    require,
  })

  vm.runInContext(transpiled.outputText, context, { filename: helperPath })
  return module.exports
}

test('buildLoginPageUrl encodes the original unlock target', () => {
  const helper = loadHelperModule()

  assert.equal(
    helper.buildLoginPageUrl('/pages/video-unlock/index?token=abc'),
    '/pages/login/index?returnUrl=%2Fpages%2Fvideo-unlock%2Findex%3Ftoken%3Dabc'
  )
})

test('sanitizeReturnUrl rejects the login page itself', () => {
  const helper = loadHelperModule()

  assert.equal(
    helper.sanitizeReturnUrl('/pages/login/index?returnUrl=%2Fpages%2Fvideo-unlock%2Findex'),
    ''
  )
  assert.equal(
    helper.sanitizeReturnUrl('/pages/video-unlock/index?scene=foo'),
    '/pages/video-unlock/index?scene=foo'
  )
})
