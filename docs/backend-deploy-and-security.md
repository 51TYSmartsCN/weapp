# GEO 小程序后端部署与安全上线清单

本文档只覆盖当前仓库 `@geo/server` 的真实部署面，目标是把后端安全上线到服务器，并与小程序前端联调。

## 1. 部署范围

- 小程序 API 服务：`apps/server`
- 对外 API 域名：`https://ty-server-api.tysmarts.cn`
- 数据库：MySQL 8
- 反向代理：Nginx
- 进程托管：`systemd` 或 `pm2`

## 2. 上线前必须满足的代码约束

当前代码已经具备以下安全收口：

- `admin` 路由必须使用 admin token，普通小程序用户 token 不能访问 `/api/admin/*`
- `NODE_ENV=production` 时缺少关键环境变量会直接启动失败
- `NODE_ENV=production` 时 `WXSHOP_MOCK` 不再生效
- `CORS` 在生产环境按 `CORS_ORIGINS` 白名单放行

对应关键环境变量：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `WECHAT_APPID`
- `WECHAT_SECRET`
- `WXSHOP_CALLBACK_TOKEN`
- `WXSHOP_ENCODING_AES_KEY`
- `CORS_ORIGINS`

## 3. 服务器准备

建议服务器最小形态：

- Ubuntu 22.04 LTS
- Node.js 18 或更高
- pnpm 11
- Nginx
- 可访问的 MySQL 8（可部署在其他内网机器）

建议目录：

- 代码目录：`/opt/geo-course/weapp`
- 日志目录：`/opt/geo-course/logs`
- 环境变量文件：`/opt/geo-course/env/server.production.env`

不要把 MySQL 暴露到公网。只允许本机或内网访问。

当前项目已确认的生产形态：

- `t0ops` 只运行 `Nginx + 单实例 Node API`
- MySQL 使用独立主机 `192.168.123.101`
- 不在 `t0ops` 上部署本地 MySQL 或 Docker 化数据库

## 4. 生产环境变量

示例：

```env
NODE_ENV=production
PORT=4010
HOST=127.0.0.1
BASE_URL=https://ty-server-api.tysmarts.cn

DB_HOST=192.168.123.101
DB_PORT=3306
DB_USER=replace_with_real_user
DB_PASS=replace_with_real_password
DB_NAME=replace_with_real_database

JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d

ADMIN_USERNAME=replace_with_real_admin_user
ADMIN_PASSWORD=replace_with_real_admin_password

WECHAT_APPID=replace_with_real_appid
WECHAT_SECRET=replace_with_real_secret

WXSHOP_CALLBACK_TOKEN=replace_with_real_callback_token
WXSHOP_ENCODING_AES_KEY=replace_with_real_encoding_aes_key

CORS_ORIGINS=https://admin.your-domain.com
NODE_TLS_REJECT_UNAUTHORIZED=1
```

要求：

- `JWT_SECRET` 必须是高强度随机字符串
- `ADMIN_PASSWORD` 不要继续使用默认值
- `CORS_ORIGINS` 只填真实浏览器后台域名，不要写 `*`
- 生产环境不要设置 `WXSHOP_MOCK=1`

## 5. 数据库初始化

首次建库：

```bash
mysql -uroot -p -e "CREATE DATABASE geo_course CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -uroot -p geo_course < /opt/geo-course/weapp/db/schema.sql
```

建议单独创建业务账号：

```sql
CREATE USER 'geo_course_app'@'<t0ops出口IP或内网网段>' IDENTIFIED BY 'replace_with_real_password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON geo_course.* TO 'geo_course_app'@'<t0ops出口IP或内网网段>';
FLUSH PRIVILEGES;
```

如果需要初始化演示数据，再执行：

```bash
cd /opt/geo-course/weapp
pnpm --filter @geo/server seed
```

生产环境若不是演示/测试环境，不建议直接导入 seed 数据。

## 6. 构建与启动

部署命令：

```bash
cd /opt/geo-course/weapp
pnpm install --frozen-lockfile
pnpm build:shared
pnpm build:server
```

直接启动验证：

```bash
set -a
source /opt/geo-course/env/server.production.env
set +a
node apps/server/dist/index.js
```

健康检查：

```bash
curl -i http://127.0.0.1:4010/api/health
```

预期返回：

```json
{"code":0,"data":{"status":"ok"}}
```

## 7. PM2 示例

文件：

- `/opt/geo-course/weapp/deploy/t0ops/geo-course-server.ecosystem.config.cjs`
- `/opt/geo-course/weapp/deploy/t0ops/start-geo-course-server.sh`

```js
module.exports = {
  apps: [
    {
      name: 'geo-course-server',
      cwd: '/opt/geo-course/weapp',
      script: '/opt/geo-course/weapp/deploy/t0ops/start-geo-course-server.sh',
      interpreter: 'bash',
      instances: 1,
      exec_mode: 'fork',
      out_file: '/opt/geo-course/logs/server.stdout.log',
      error_file: '/opt/geo-course/logs/server.stderr.log',
      max_memory_restart: '256M',
    },
  ],
}
```

启动：

```bash
cd /opt/geo-course/weapp
chmod +x deploy/t0ops/start-geo-course-server.sh
pm2 start deploy/t0ops/geo-course-server.ecosystem.config.cjs
pm2 save
pm2 status geo-course-server
```

## 8. Nginx 示例

文件：`/etc/nginx/conf.d/ty-server-api.tysmarts.cn.conf`

```nginx
server {
    listen 80;
    server_name ty-server-api.tysmarts.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ty-server-api.tysmarts.cn;

    ssl_certificate /etc/letsencrypt/live/ty-server-api.tysmarts.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ty-server-api.tysmarts.cn/privkey.pem;

    client_max_body_size 6m;

    location / {
        proxy_pass http://127.0.0.1:4010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

加载配置：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 9. 微信侧配合事项

小程序前端同事需要确认：

- 小程序 request 合法域名已配置 `https://ty-server-api.tysmarts.cn`
- 若有媒体/下载域名限制，也要同步登记
- 若改动 API 域名，小程序需要重新发版

微信小店/消息推送需要确认：

- 回调地址：`https://ty-server-api.tysmarts.cn/api/wxshop/order/callback`
- `Token` 与 `EncodingAESKey` 与生产环境变量严格一致

## 10. 上线验收清单

上线前至少执行以下检查：

1. `curl https://ty-server-api.tysmarts.cn/api/health` 返回 `200`
2. 普通小程序登录后，用用户 token 请求 `/api/admin/dashboard` 返回 `403`
3. admin 登录成功后，请求 `/api/admin/dashboard` 返回 `200`
4. 去掉任意一个生产必填 env 后，服务应启动失败而不是带默认值继续跑
5. 将 `WXSHOP_MOCK=1` 注入生产环境时，`config` 仍应强制关闭 mock
6. 从非白名单浏览器域名访问 admin API，应被 CORS 拦截
7. 微信登录真实可用，不再走 mock openid
8. 微信小店回调验签通过
9. 数据库仅允许 `t0ops` 对应出口 IP 或可信内网网段访问，不对公网暴露
10. 服务重启后健康检查恢复正常

## 11. 当前仍然存在但未在本轮代码中解决的风险

这些不是本次提交范围，但仍建议尽快排期：

- admin 账号目前仍是环境变量口令，不是数据库账号体系，也没有密码哈希
- JWT 登出黑名单仍是内存实现，服务重启后黑名单丢失
- 用户头像与后台上传目前只做了基础限制，未做文件头校验和更严格的内容安全检查
- 视频播放接口仍直接下发真实 `videoUrl`，不具备短时签名 URL 或防盗链能力
- `fail()` 仍大量返回 HTTP 200 业务错误，后续建议逐步改成真实状态码
