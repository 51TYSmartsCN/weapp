const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const configModulePath = path.resolve(__dirname, '../dist/config.js')

function loadConfigWithEnv(envOverrides) {
  const previousEnv = { ...process.env }

  delete require.cache[configModulePath]

  Object.keys(process.env).forEach((key) => {
    if (
      key === 'NODE_ENV' ||
      key === 'JWT_SECRET' ||
      key === 'WECHAT_APPID' ||
      key === 'WECHAT_SECRET' ||
      key === 'WXSHOP_CALLBACK_TOKEN' ||
      key === 'WXSHOP_ENCODING_AES_KEY' ||
      key === 'ADMIN_USERNAME' ||
      key === 'ADMIN_PASSWORD' ||
      key === 'CORS_ORIGINS' ||
      key === 'GEO_SERVER_SKIP_DOTENV'
    ) {
      delete process.env[key]
    }
  })

  Object.assign(process.env, envOverrides)

  try {
    return { result: require(configModulePath) }
  } catch (error) {
    return { error }
  } finally {
    delete require.cache[configModulePath]
    process.env = previousEnv
  }
}

test('production config fails fast when required secrets are missing', () => {
  const { error } = loadConfigWithEnv({
    NODE_ENV: 'production',
    GEO_SERVER_SKIP_DOTENV: '1',
    JWT_SECRET: 'secret',
    WECHAT_APPID: 'appid',
    WECHAT_SECRET: 'wx-secret',
    WXSHOP_CALLBACK_TOKEN: 'callback-token',
    // deliberately omit WXSHOP_ENCODING_AES_KEY
    ADMIN_USERNAME: 'admin-user',
    ADMIN_PASSWORD: 'admin-password',
  })

  assert.ok(error instanceof Error)
  assert.match(error.message, /缺少生产环境必填变量/)
  assert.match(error.message, /(WXSHOP_ENCODING_AES_KEY|CORS_ORIGINS)/)
})

test('production config exposes only wxshop callback secrets', () => {
  const { result, error } = loadConfigWithEnv({
    NODE_ENV: 'production',
    GEO_SERVER_SKIP_DOTENV: '1',
    JWT_SECRET: 'secret',
    WECHAT_APPID: 'appid',
    WECHAT_SECRET: 'wx-secret',
    WXSHOP_CALLBACK_TOKEN: 'callback-token',
    WXSHOP_ENCODING_AES_KEY: 'encoding-key',
    ADMIN_USERNAME: 'admin-user',
    ADMIN_PASSWORD: 'admin-password',
    CORS_ORIGINS: 'https://admin.example.com',
  })

  assert.equal(error, undefined)
  assert.deepEqual(Object.keys(result.wxshopConfig).sort(), ['callbackToken', 'encodingAESKey'])
})
