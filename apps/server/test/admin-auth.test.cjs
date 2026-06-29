const test = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')

function createResponseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

test('exports a dedicated adminAuthMiddleware', () => {
  const auth = require('../dist/auth.js')

  assert.equal(typeof auth.adminAuthMiddleware, 'function')
})

test('adminAuthMiddleware rejects a normal user token', () => {
  const { adminAuthMiddleware, signToken } = require('../dist/auth.js')
  const req = {
    headers: {
      authorization: `Bearer ${signToken(123)}`,
    },
  }
  const res = createResponseRecorder()
  let nextCalled = false

  adminAuthMiddleware(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.code, 403)
})

test('signToken can issue an admin-scoped token', () => {
  const { signToken } = require('../dist/auth.js')
  const { jwtConfig } = require('../dist/config.js')
  const token = signToken(99999, 'admin')
  const payload = jwt.verify(token, jwtConfig.secret)

  assert.equal(payload.userId, 99999)
  assert.equal(payload.role, 'admin')
})
