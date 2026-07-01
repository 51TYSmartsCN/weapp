const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const helperPath = path.resolve(__dirname, '../../admin/src/api/client.ts')

function loadHelperModule() {
  const source = fs.readFileSync(helperPath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  })

  const module = { exports: {} }
  const fakeAxios = {
    create() {
      return {
        interceptors: {
          request: { use() {} },
          response: { use() {} },
        },
      }
    },
  }

  const context = vm.createContext({
    module,
    exports: module.exports,
    require(id) {
      if (id === 'axios') {
        return {
          default: fakeAxios,
          ...fakeAxios,
        }
      }
      return require(id)
    },
    localStorage: {
      getItem() {
        return null
      },
      removeItem() {},
    },
    window: {
      location: {
        href: '',
      },
    },
    import_meta: {
      env: {
        BASE_URL: '/admin/',
        VITE_API_BASE_URL: 'https://ty-server-api.tysmarts.cn',
      },
    },
  })

  vm.runInContext(
    transpiled.outputText.replaceAll('import.meta', 'import_meta'),
    context,
    { filename: helperPath },
  )

  return module.exports
}

test('resolveApiBaseUrl normalizes admin production base url to /api endpoints', () => {
  assert.ok(fs.existsSync(helperPath), `missing helper: ${helperPath}`)

  const { resolveApiBaseUrl } = loadHelperModule()

  assert.equal(resolveApiBaseUrl('https://ty-server-api.tysmarts.cn'), 'https://ty-server-api.tysmarts.cn/api')
  assert.equal(resolveApiBaseUrl('https://ty-server-api.tysmarts.cn/api'), 'https://ty-server-api.tysmarts.cn/api')
  assert.equal(resolveApiBaseUrl('/api'), '/api')
  assert.equal(resolveApiBaseUrl(''), '/api')
})
