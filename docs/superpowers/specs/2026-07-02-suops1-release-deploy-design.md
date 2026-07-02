# suops1 Release Tag 自动发布设计

## 目标

把当前 `t0ops` 的手工发布链路收敛为可审计的 GitHub Actions 流程：只有当 `release-vYYYYMMDD.N` 标签指向 `origin/release` 的最新提交时，才允许 `suops1` 上的 self-hosted runner 构建 `@geo/server` 和 `@geo/admin`，并把产物同步到 `t0ops` 后执行 `pm2 reload` 与线上验活。

## 约束

- `t0ops` 仅承担运行时职责，不在其上执行构建。
- `suops1` 负责编译与推送，且必须能免密 SSH 到 `t0ops`。
- 本地运维脚本 `scripts/deploy-t0ops.sh` 继续保留为未入库工具，本次不提交。
- 后台静态产物 `apps/server/public/admin/` 继续作为构建同步结果，不纳入 Git。
- 失败顺序必须是严格 fail-fast：标签校验失败、依赖安装失败、构建失败、测试失败、同步失败、重载失败、线上验活失败，任一环节失败都不能进入后续部署。

## 方案

### 1. 发布入口

GitHub Actions 监听 `release-v*` 标签推送，但真正执行前再做两层校验：

1. 标签名必须匹配 `^release-v[0-9]{8}\.[0-9]+$`
2. 标签最终解析出的 commit 必须等于 `origin/release` 的 HEAD

这两层校验通过后，才允许后续发布。

### 2. suops1 runner 构建职责

runner 侧脚本直接在 workflow checkout 出来的源码上执行：

- `pnpm install --frozen-lockfile`
- `pnpm build:shared`
- `pnpm build:server`
- `pnpm build:admin`
- `node --test ...`

其中 `pnpm build:admin` 依赖已有的 `scripts/sync-admin-static.sh`，会把后台静态资源同步到 `apps/server/public/admin/`，保证最终 rsync 给 `t0ops` 的就是服务端托管目录。

### 3. t0ops 发布职责

runner 通过 SSH 在 `t0ops` 创建远端备份目录，然后使用 `rsync --delete` 同步以下路径：

- `apps/server/dist/`
- `apps/server/public/admin/`
- `apps/server/src/index.ts`
- `deploy/t0ops/`

同步完成后只 reload `geo-course-server`，不触碰其他 PM2 服务或其他 Nginx vhost。

### 4. 发布后验证

runner 发布成功后立刻执行：

- `http://127.0.0.1:4010/api/health`
- `https://ty-server-api.tysmarts.cn/api/health`
- 允许 `http://localhost:4007` 的 CORS 预检
- 拒绝非法 Origin 的 CORS 预检
- `https://ty-server-api.tysmarts.cn/admin/login` 返回后台登录页

再补一个线上接口契约测试脚本，允许在 runner 或本地用 `.env` 中的线上账号做冒烟验证。

## 文件边界

- `.github/workflows/release-deploy.yml`
  - GitHub Actions 入口，只负责 checkout、标签校验、调用部署脚本
- `deploy/t0ops/deploy-from-runner.sh`
  - self-hosted runner 上执行的正式发布脚本
- `scripts/verify-release-tag.sh`
  - 复用型标签校验脚本，既可供 Actions 用，也可供本地手工校验
- `docs/backend-deploy-and-security.md`
  - 增补自动发布链路与 runner 约束
- `docs/frontend-api-联调与测试.md`
  - 增补 tag 发布后的联调入口与验证方式

## 风险与收口

- `release` 分支不存在时，workflow 必须直接失败，不做任何部署动作。
- self-hosted runner 必须串行执行生产发布，避免两个 tag 并发互相覆盖。
- 线上验证只读，不执行破坏性写操作；后台登录仅换 token，不修改业务数据。
- 远端备份只覆盖 `geo-course-server` 当前使用的 server/admin 目录，回滚粒度与现有手工脚本一致。
