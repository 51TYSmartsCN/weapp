const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const helperPath = path.resolve(__dirname, '../../admin/src/api/request-error.ts')

function loadHelperModule() {
  const source = fs.readFileSync(helperPath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
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

test('getRequestErrorMessage keeps credential errors and distinguishes transport failures', () => {
  assert.ok(fs.existsSync(helperPath), `missing helper: ${helperPath}`)

  const { getRequestErrorMessage } = loadHelperModule()

  assert.equal(
    getRequestErrorMessage(new Error('用户名或密码错误'), '登录失败'),
    '用户名或密码错误',
  )

  assert.equal(
    getRequestErrorMessage({ response: { status: 404 } }, '登录失败'),
    '登录服务异常（HTTP 404）',
  )

  assert.equal(
    getRequestErrorMessage({ message: 'Network Error' }, '登录失败'),
    '网络异常，请稍后重试',
  )
})
