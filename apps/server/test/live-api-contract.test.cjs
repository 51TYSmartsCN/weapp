const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const envPath = path.resolve(__dirname, '../../../.env')

function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const entries = {}

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    entries[key] = value
  }

  return entries
}

function requiredEnv(name, env) {
  const value = env[name]
  assert.ok(value, `missing ${name} in process.env or ${envPath}`)
  return value
}

function loadRuntimeEnv() {
  const fileEnv = fs.existsSync(envPath) ? loadEnvFile(envPath) : {}
  return {
    ...fileEnv,
    ...process.env,
  }
}

async function getJson(url, init) {
  const response = await fetch(url, init)
  const text = await response.text()
  let json

  try {
    json = JSON.parse(text)
  } catch (error) {
    assert.fail(`expected JSON from ${url}, received: ${text}`)
  }

  return { response, json }
}

test('live API contract matches the frontend integration doc', async () => {
  const env = loadRuntimeEnv()
  const baseUrl = requiredEnv('live_api_base_url', env)
  const adminUsername = requiredEnv('live_api_admin_username', env)
  const adminPassword = requiredEnv('live_api_admin_password', env)
  const allowedOrigin = env.live_api_allowed_origin || 'http://localhost:4007'
  const forbiddenOrigin = env.live_api_forbidden_origin || 'https://evil.example.com'

  const health = await getJson(`${baseUrl}/api/health`)
  assert.equal(health.response.status, 200)
  assert.deepEqual(health.json, { code: 0, data: { status: 'ok' } })

  const adminLoginPage = await fetch(`${baseUrl}/admin/login`)
  assert.equal(adminLoginPage.status, 200)
  assert.match(adminLoginPage.headers.get('content-type') || '', /text\/html/)
  assert.match(await adminLoginPage.text(), /\/admin\/assets\//)

  const allowedCors = await fetch(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: allowedOrigin,
      'Access-Control-Request-Method': 'GET',
    },
  })
  assert.equal(allowedCors.status, 204)
  assert.equal(allowedCors.headers.get('access-control-allow-origin'), allowedOrigin)

  const forbiddenCors = await getJson(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: forbiddenOrigin,
      'Access-Control-Request-Method': 'GET',
    },
  })
  assert.equal(forbiddenCors.response.status, 403)
  assert.deepEqual(forbiddenCors.json, { code: 403, message: 'CORS: origin not allowed' })

  const banners = await getJson(`${baseUrl}/api/banners`)
  assert.equal(banners.response.status, 200)
  assert.equal(banners.json.code, 0)
  assert.ok(Array.isArray(banners.json.data))
  assert.ok(banners.json.data.length >= 2)
  for (const banner of banners.json.data) {
    assert.match(banner.image, /^https:\/\/ty-server-api\.tysmarts\.cn\/images\//)
  }

  const courses = await getJson(`${baseUrl}/api/courses`)
  assert.equal(courses.response.status, 200)
  assert.equal(courses.json.code, 0)
  assert.ok(Array.isArray(courses.json.data))
  assert.ok(courses.json.data.length >= 6)
  for (const course of courses.json.data) {
    assert.match(course.cover, /^https:\/\/ty-server-api\.tysmarts\.cn\/images\//)
  }

  const courseDetail = await getJson(`${baseUrl}/api/courses/1`)
  assert.equal(courseDetail.response.status, 200)
  assert.equal(courseDetail.json.code, 0)
  assert.equal(courseDetail.json.data.id, 1)

  const categories = await getJson(`${baseUrl}/api/categories`)
  assert.equal(categories.response.status, 200)
  assert.equal(categories.json.code, 0)
  assert.ok(Array.isArray(categories.json.data))
  assert.ok(categories.json.data.some((item) => item.code === 'content-optimization'))

  const lessons = await getJson(`${baseUrl}/api/courses/1/lessons`)
  assert.equal(lessons.response.status, 200)
  assert.equal(lessons.json.code, 0)
  assert.ok(Array.isArray(lessons.json.data))
  assert.ok(lessons.json.data.length >= 1)
  for (const lesson of lessons.json.data) {
    assert.equal('videoUrl' in lesson, false)
  }

  const helpArticles = await getJson(`${baseUrl}/api/help-articles`)
  assert.equal(helpArticles.response.status, 200)
  assert.equal(helpArticles.json.code, 0)
  assert.ok(Array.isArray(helpArticles.json.data))

  const guestDashboard = await getJson(`${baseUrl}/api/admin/dashboard`)
  assert.equal(guestDashboard.response.status, 401)
  assert.deepEqual(guestDashboard.json, { code: 401, message: '未登录' })

  const adminLogin = await getJson(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: adminUsername,
      password: adminPassword,
    }),
  })
  assert.equal(adminLogin.response.status, 200)
  assert.equal(adminLogin.json.code, 0)
  assert.match(adminLogin.json.data.token, /^[\w-]+\.[\w-]+\.[\w-]+$/)

  const adminDashboard = await getJson(`${baseUrl}/api/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${adminLogin.json.data.token}`,
    },
  })
  assert.equal(adminDashboard.response.status, 200)
  assert.equal(adminDashboard.json.code, 0)
  assert.ok(adminDashboard.json.data.totalCourses >= 6)
  assert.ok(adminDashboard.json.data.totalInstructors >= 3)
})
