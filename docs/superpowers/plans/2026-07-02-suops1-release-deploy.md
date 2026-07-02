# suops1 Release Tag 自动发布 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `release-vYYYYMMDD.N` 标签触发 `suops1` runner 编译并把 `@geo/server + @geo/admin` 安全发布到 `t0ops`。

**Architecture:** GitHub Actions 只接受合法 `release-v*` 标签，并要求标签 commit 与 `origin/release` HEAD 一致。正式部署逻辑沉到仓库脚本里，在 `suops1` 上完成依赖安装、构建、测试、rsync、pm2 reload 和线上验活。

**Tech Stack:** GitHub Actions, self-hosted runner, Bash, pnpm, rsync, ssh, pm2, Node.js test runner

## Global Constraints

- 不提交 `.env`、`docs/t0ops-server-admin-deploy-script.md`、`scripts/deploy-t0ops.sh`
- `t0ops` 只运行运行时服务，不在远端执行构建
- 保持 `apps/server/public/admin/` 为构建同步产物，不纳入 Git
- 发布必须 fail-fast；任何一步失败都不能继续部署
- 只允许合法 `release-vYYYYMMDD.N` 标签发布，且标签必须指向 `origin/release` HEAD
- 不影响 `t0ops` 上其他服务，只 reload `geo-course-server`

---

### Task 1: 固化 release 标签校验与 runner 部署脚本

**Files:**
- Create: `scripts/verify-release-tag.sh`
- Create: `deploy/t0ops/deploy-from-runner.sh`
- Test: `apps/server/test/admin-static-sync-script.test.cjs`

**Interfaces:**
- Consumes: 根脚本 `pnpm build:shared`, `pnpm build:server`, `pnpm build:admin`
- Produces: `scripts/verify-release-tag.sh` 可输出 `tag_name/tag_commit/release_head`
- Produces: `deploy/t0ops/deploy-from-runner.sh` 支持在 runner 上一键完成构建、同步、reload、验活

- [ ] **Step 1: 写出校验点清单并锁定已有构建/同步链路**

确认以下既有约束必须被新脚本复用：

```text
pnpm build:admin -> apps/admin/dist -> scripts/sync-admin-static.sh -> apps/server/public/admin
deploy target -> t0ops:/opt/geo-course/weapp
pm2 process -> geo-course-server
health url -> /api/health
admin page -> /admin/login
```

- [ ] **Step 2: 编写 release 标签校验脚本**

新增脚本需要具备以下核心逻辑：

```sh
TAG_PATTERN='^release-v[0-9]{8}\.[0-9]+$'
git fetch --force --prune --tags origin \
  "+refs/heads/release:refs/remotes/origin/release" \
  "+refs/tags/release-v*:refs/tags/release-v*"
TAG_COMMIT="$(git rev-list -n 1 "$GITHUB_REF_NAME")"
RELEASE_HEAD="$(git rev-parse "refs/remotes/origin/release^{commit}")"
test "$TAG_COMMIT" = "$RELEASE_HEAD"
```

- [ ] **Step 3: 编写 runner 部署脚本**

新增脚本最小职责：

```sh
pnpm install --frozen-lockfile
pnpm build:shared
pnpm build:server
pnpm build:admin
node --test apps/server/test/admin-auth.test.cjs \
  apps/server/test/config-production.test.cjs \
  apps/server/test/seed-assets.test.cjs \
  apps/server/test/admin-static-sync-script.test.cjs
rsync -az --delete apps/server/dist/ "$REMOTE_HOST:$REMOTE_DIST_ROOT/"
rsync -az --delete apps/server/public/admin/ "$REMOTE_HOST:$REMOTE_ADMIN_ROOT/"
ssh "$REMOTE_HOST" "pm2 reload '$REMOTE_PM2_NAME'"
```

- [ ] **Step 4: 为 runner 脚本补齐发布后验证**

至少覆盖以下命令：

```sh
ssh "$REMOTE_HOST" "curl -fsS http://127.0.0.1:4010/api/health"
curl -fsS https://ty-server-api.tysmarts.cn/api/health
curl -fsS https://ty-server-api.tysmarts.cn/admin/login
```

- [ ] **Step 5: 运行脚本级验证**

Run: `bash -n scripts/verify-release-tag.sh && bash -n deploy/t0ops/deploy-from-runner.sh`

Expected: 两个脚本语法校验通过，退出码为 `0`

- [ ] **Step 6: Commit**

```bash
git add scripts/verify-release-tag.sh deploy/t0ops/deploy-from-runner.sh
git commit -m "feat(deploy): 新增 runner 发布脚本与 release 标签校验"
```

### Task 2: 接入 GitHub Actions release 发布 workflow

**Files:**
- Create: `.github/workflows/release-deploy.yml`
- Modify: `docs/backend-deploy-and-security.md`

**Interfaces:**
- Consumes: `scripts/verify-release-tag.sh`, `deploy/t0ops/deploy-from-runner.sh`
- Produces: 监听 `release-v*` 的 Actions 流程，要求 runner labels 为 `self-hosted, linux, suops1, weapp-release`

- [ ] **Step 1: 创建 workflow 骨架**

基础结构：

```yaml
on:
  push:
    tags:
      - 'release-v*'

concurrency:
  group: release-deploy-t0ops
  cancel-in-progress: false
```

- [ ] **Step 2: 增加 checkout 与标签校验步骤**

核心步骤：

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

- name: Verify release tag
  env:
    PROD_DEPLOY_TAGGERS: ${{ vars.PROD_DEPLOY_TAGGERS }}
  run: sh scripts/verify-release-tag.sh
```

- [ ] **Step 3: 调用 runner 部署脚本**

核心步骤：

```yaml
- name: Deploy to t0ops
  env:
    REMOTE_HOST: t0ops
    REMOTE_ROOT: /opt/geo-course/weapp
    REMOTE_RELEASE_ROOT: /opt/geo-course/releases
    REMOTE_PM2_NAME: geo-course-server
  run: sh deploy/t0ops/deploy-from-runner.sh
```

- [ ] **Step 4: 更新后端部署文档**

把以下事实写入文档：

```text
release 分支承载生产候选
release-vYYYYMMDD.N tag 触发 GitHub Actions
suops1 runner 负责构建和同步
t0ops 只做运行时接收与 reload
```

- [ ] **Step 5: 运行 YAML/文档校验**

Run: `python3 - <<'PY'\nimport yaml, pathlib\npath = pathlib.Path('.github/workflows/release-deploy.yml')\nprint(yaml.safe_load(path.read_text())['jobs'].keys())\nPY`

Expected: 能成功解析 workflow，并输出 `deploy`

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/release-deploy.yml docs/backend-deploy-and-security.md
git commit -m "feat(ci): 接入 release tag 自动发布 workflow"
```

### Task 3: 增补联调与线上契约验证

**Files:**
- Modify: `docs/frontend-api-联调与测试.md`
- Modify: `apps/server/test/live-api-contract.test.cjs`

**Interfaces:**
- Consumes: `.env` 中已有的线上管理员账号和基础 URL
- Produces: 文档化的联调入口与可直接执行的线上契约测试命令

- [ ] **Step 1: 复查当前线上契约测试覆盖**

确认现有测试至少覆盖：

```text
GET /api/health
POST /api/admin/login
GET /api/admin/dashboard
```

- [ ] **Step 2: 扩展为发布后验证视角**

测试最小增强方向：

```js
const adminPage = await fetch(`${baseUrl}/admin/login`)
assert.equal(adminPage.status, 200)
assert.match(await adminPage.text(), /<title>/)
```

- [ ] **Step 3: 更新前端联调文档**

把发布后的验证方式明确写成：

```text
1. 确认 Actions release-deploy 成功
2. 访问 /api/health
3. 访问 /admin/login
4. 执行 node --test apps/server/test/live-api-contract.test.cjs
```

- [ ] **Step 4: 跑验证命令**

Run: `node --test apps/server/test/live-api-contract.test.cjs`

Expected: 在 `.env` 提供 `live_api_*` 环境变量时通过

- [ ] **Step 5: Commit**

```bash
git add docs/frontend-api-联调与测试.md apps/server/test/live-api-contract.test.cjs
git commit -m "test(docs): 补齐线上联调与发布后契约验证"
```
