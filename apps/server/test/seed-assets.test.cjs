const test = require('node:test')
const assert = require('node:assert/strict')

test('createSeedImageBase uses the configured public base url', () => {
  const { createSeedImageBase } = require('../dist/seed-assets.js')

  assert.equal(
    createSeedImageBase('https://ty-server-api.tysmarts.cn'),
    'https://ty-server-api.tysmarts.cn/images/'
  )
})

test('createSeedImageBase trims a trailing slash from the public base url', () => {
  const { createSeedImageBase } = require('../dist/seed-assets.js')

  assert.equal(
    createSeedImageBase('https://ty-server-api.tysmarts.cn/'),
    'https://ty-server-api.tysmarts.cn/images/'
  )
})
