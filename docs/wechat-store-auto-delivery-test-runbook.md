# 微信小店自动发货测试 Runbook

更新日期：2026-07-05

## 结论

微信小店自动发货的主链路在服务端，不需要每次都重新提交小程序审核。

只有以下情况才需要小程序发版审核：

- 修改了小程序页面、登录回跳、承接页 UI 或路由。
- 需要让正式版用户使用新的小程序前端逻辑。

以下测试不需要小程序正式发版：

- 微信小店消息推送 URL 验证。
- 支付成功回调验签、解密、事件解析。
- 服务端查询订单详情、商品映射、课程权益创建。
- 服务端调用微信小店 `senddelivery` 发货。
- 使用开发版/体验版打开承接页验证 `token` / `scene`。

## 官方协议要点

- 消息推送配置入口：微信小店后台「服务市场」-「自研」-「消息推送」。
- POST 回调使用 URL query 的 `timestamp`、`nonce`、`encrypt_type=aes`、`msg_signature`，body 为 JSON `Encrypt`。
- `msg_signature` 计算方式为 `sha1(sort(token, timestamp, nonce, Encrypt))`，不能用普通 `signature` 验证密文消息。
- 支付成功事件名是 `channels_ec_order_pay`，订单号在 `order_info.order_id`。
- 课程虚拟发货接口是 `POST /channels/ec/order/delivery/send`，`deliver_type=3`，`product_infos[]` 必须包含 `product_id`、`sku_id`、`product_cnt`，课程路径在 `course_info.course_path`。

参考：

- https://developers.weixin.qq.com/doc/store/shop/dev_before/message_push.html
- https://developers.weixin.qq.com/doc/store/shop/notify/order_callback/channels_ec_order_pay.html
- https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/delivery/api_senddelivery.html

## 推荐测试顺序

1. 本地回归测试

```bash
pnpm --filter @geo/server build
node --test apps/server/test/wechat-store-fulfillment-fix.test.cjs
```

2. 配置检查

确认 server 生产环境至少有：

```text
CHANNELS_TOKEN
CHANNELS_ENCODING_AES_KEY
CHANNELS_APP_ID
CHANNELS_APP_SECRET
WECHAT_APPID
FULFILLMENT_CLAIM_PAGE=/pages/video-unlock/index
```

3. 商品映射检查

确认真实微信小店商品映射到正确课程：

```sql
SELECT product_id, product_title, course_id, course_title, status
FROM wxshop_products
WHERE product_id = '10001045402929';
```

预期：`course_id = 1`，`status = 1`。

4. 微信小店 URL 验证工具

使用官方 URL 验证工具验证：

```text
https://<server-domain>/api/channels/webhook
```

通过标准：GET 验签通过并原样返回 `echostr`。

5. 消息推送调试或真实订单回调

用微信小店后台消息推送调试能力或低价测试单触发 `channels_ec_order_pay`。

服务端日志应看到：

```text
[channels] 自动履约发货完成
[channels] 订单自动解锁完成
```

如果发货失败，优先看 `deliveryError` 和微信接口返回 `errcode/errmsg`。

6. 数据库验证

按订单号检查：

```sql
SELECT * FROM wechat_store_orders WHERE store_order_id = '<order_id>';
SELECT * FROM course_entitlements WHERE source_order_id = '<order_id>';
SELECT * FROM claim_tokens WHERE store_order_id = '<order_id>';
SELECT * FROM fulfillment_logs WHERE store_order_id = '<order_id>' ORDER BY id DESC;
SELECT * FROM orders WHERE order_no = '<order_id>';
SELECT * FROM user_courses WHERE course_id = 1 ORDER BY id DESC LIMIT 5;
```

通过标准：

- `wechat_store_orders.fulfillment_status` 为 `delivered` 或有明确失败原因。
- `course_entitlements` 已生成。
- `claim_tokens` 已生成。
- `fulfillment_logs` 有 `store_delivery` 成功记录，或失败日志含微信错误码。
- 能拿到 buyer openid 时，`orders` 与 `user_courses` 已写入。

7. 小程序承接页验证

无需正式发版。使用微信开发者工具或开发版小程序打开发货生成的路径：

```text
/pages/video-unlock/index?token=<claim_token>
```

或用小程序码 `scene` 进入承接页。

通过标准：

- 未登录时不会丢失 `token` / `scene`。
- 登录后能回到承接页。
- 领取后能进入对应课程。

## 当前真实订单补测

订单：

```text
order_id=3737550999277696000
product_id=10001045402929
sku_id=18710130505
title=中小企业GEO优化2天课
real_price=990
```

修复部署后，先确认商品映射，再对该订单执行一次补处理。补处理应复用同一套服务端履约逻辑，避免手工绕过 `senddelivery`、权益和发货日志。

## 常见失败判断

- 收不到回调：先查微信小店后台 URL 验证、公网 HTTPS、反向代理路径 `/api/channels/webhook`。
- 回调 401：重点查 `CHANNELS_TOKEN` 和 `msg_signature`，密文消息不能用 header HMAC。
- 解密失败：重点查 `CHANNELS_ENCODING_AES_KEY` 是否来自微信小店自研消息推送配置。
- 查不到课程：重点查 `wxshop_products.product_id` 是否为真实微信小店 `product_id`。
- 发货失败 `109002/606031`：重点查发货 payload 是否带了订单中的真实 `product_id/sku_id/product_cnt`。
- 发货失败 `606038`：重点查 `WECHAT_APPID` 和 `wxa_path`。
