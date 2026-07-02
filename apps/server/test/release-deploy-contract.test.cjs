const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const workflowPath = path.resolve(__dirname, '../../../.github/workflows/release-deploy.yml')
const verifyScriptPath = path.resolve(__dirname, '../../../scripts/verify-release-tag.sh')
const deployScriptPath = path.resolve(__dirname, '../../../deploy/t0ops/deploy-from-runner.sh')

test('release deploy workflow uses the committed verification and runner deploy scripts', () => {
  assert.ok(fs.existsSync(workflowPath), `missing workflow: ${workflowPath}`)

  const workflow = fs.readFileSync(workflowPath, 'utf8')
  assert.match(workflow, /release-v\*/)
  assert.match(workflow, /runs-on:\s*\[self-hosted, linux, suops1, weapp-release\]/)
  assert.match(workflow, /run:\s+sh scripts\/verify-release-tag\.sh/)
  assert.match(workflow, /node-version:\s*24/)
  assert.match(workflow, /REMOTE_HOST:\s+tydeploy@t0ops/)
  assert.match(workflow, /run:\s+bash deploy\/t0ops\/deploy-from-runner\.sh/)
})

test('release tag verification script enforces release branch head matching', () => {
  assert.ok(fs.existsSync(verifyScriptPath), `missing verify script: ${verifyScriptPath}`)

  const verifyScript = fs.readFileSync(verifyScriptPath, 'utf8')
  assert.match(verifyScript, /RELEASE_BRANCH="\$\{RELEASE_BRANCH:-release\}"/)
  assert.match(verifyScript, /TAG_PATTERN="\^\$\{RELEASE_TAG_PREFIX\}-v\[0-9\]\{8\}\\\\\.\[0-9\]\+\$"/)
  assert.match(verifyScript, /\+refs\/heads\/\$\{RELEASE_BRANCH\}:refs\/remotes\/origin\/\$\{RELEASE_BRANCH\}/)
  assert.match(verifyScript, /TAG_COMMIT="\$\(git rev-list -n 1 "\$TAG_NAME"\)"/)
  assert.match(verifyScript, /if \[ "\$TAG_COMMIT" != "\$RELEASE_HEAD" \]/)
})

test('runner deploy script keeps build, deploy, and admin page verification in one flow', () => {
  assert.ok(fs.existsSync(deployScriptPath), `missing deploy script: ${deployScriptPath}`)

  const deployScript = fs.readFileSync(deployScriptPath, 'utf8')
  assert.match(deployScript, /REMOTE_HOST="\$\{REMOTE_HOST:-tydeploy@t0ops\}"/)
  assert.match(deployScript, /REMOTE_PM2_OWNER="\$\{REMOTE_PM2_OWNER:-ops\}"/)
  assert.match(deployScript, /REMOTE_PM2_WRAPPER="\$\{REMOTE_PM2_WRAPPER:-\/usr\/local\/bin\/geo-course-server-pm2\}"/)
  assert.match(deployScript, /pnpm install --frozen-lockfile/)
  assert.match(deployScript, /pnpm build:shared/)
  assert.match(deployScript, /pnpm build:server/)
  assert.match(deployScript, /pnpm build:admin/)
  assert.match(deployScript, /sudo -n -u '\$REMOTE_PM2_OWNER' '\$REMOTE_PM2_WRAPPER' reload/)
  assert.match(deployScript, /PUBLIC_ADMIN_LOGIN_URL="\$PUBLIC_BASE_URL\/admin\/login"/)
  assert.match(deployScript, /run_optional_live_contract_test/)
})
