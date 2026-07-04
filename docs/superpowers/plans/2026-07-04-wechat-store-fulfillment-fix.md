# Wechat Store Fulfillment Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix WeChat Store course auto-fulfillment so paid orders can be delivered through the official course delivery API, mapped to the correct course, and resumed through miniapp login without losing `token` or `scene`.

**Architecture:** Move fulfillment to an order-detail-driven backend flow. The webhook will fetch official order details, resolve the purchased course from `product_infos`, build a structured course delivery payload, and keep claim-token fallback. On the miniapp side, add a focused login-return helper so forced login preserves the original unlock URL.

**Tech Stack:** Node.js, Express, TypeScript, mysql2, Taro 4.x, React, node:test

## Global Constraints

- No new dependencies.
- Keep diffs small and reversible.
- Prefer pure helpers for new logic so tests can lock behavior.
- All manual edits must use `apply_patch`.
- Preserve existing claim-token and redeem-code fallback behavior.
- Do not touch unrelated dirty files in the worktree.

---

### Task 1: Lock Backend Delivery And Order Parsing Behavior

**Files:**
- Create: `apps/server/test/wechat-store-fulfillment-fix.test.cjs`
- Modify: `apps/server/src/services/channels-api.ts`
- Modify: `apps/server/src/routes/wxshop.ts`

**Interfaces:**
- Produces: `getChannelsOrderDetail(orderId: string): Promise<ChannelsOrderDetail>`
- Produces: `buildCourseDeliveryRequest(input): CourseDeliveryRequest`
- Produces: `resolveCourseIdFromProductInfos(productInfos): Promise<number | null>`

- [ ] **Step 1: Write the failing test**

Add a new node test that expects:

```js
const test = require('node:test')
const assert = require('node:assert/strict')

test('course delivery payload includes product infos and miniapp course path', async () => {
  const mod = require('../dist/services/channels-api.js')
  const payload = mod.buildCourseDeliveryRequest({
    orderId: 'wx-order-1',
    productInfos: [{ product_id: 'p1', sku_id: 'sku1' }],
    miniappAppId: 'wx123',
    miniappPath: 'pages/video-unlock/index?token=abc',
  })

  assert.deepEqual(payload, {
    order_id: 'wx-order-1',
    delivery_list: [{
      deliver_type: 3,
      product_infos: [{ product_id: 'p1', sku_id: 'sku1' }],
      course_info: {
        course_path: {
          type: 0,
          wxa_appid: 'wx123',
          wxa_path: 'pages/video-unlock/index?token=abc',
        },
      },
    }],
  })
})
```

Also add tests that `resolveCourseIdFromProductInfos()` can resolve from `product_infos[]` and that missing `product_infos` returns `null`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @geo/server build && node --test apps/server/test/wechat-store-fulfillment-fix.test.cjs`

Expected: FAIL because the helper exports do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:

- `ChannelsOrderDetail`-style typing in `channels-api.ts`
- `getChannelsOrderDetail(orderId)`
- `buildCourseDeliveryRequest(...)`
- `resolveCourseIdFromProductInfos(productInfos)` in `wxshop.ts`

Keep helpers small and data-oriented.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @geo/server build && node --test apps/server/test/wechat-store-fulfillment-fix.test.cjs`

Expected: PASS

### Task 2: Switch Webhook Fulfillment To Official Order Detail Flow

**Files:**
- Modify: `apps/server/src/routes/channels-webhook.ts`
- Modify: `apps/server/src/services/wechat-store-auto-delivery.ts`
- Modify: `apps/server/src/services/channels-api.ts`

**Interfaces:**
- Consumes: `getChannelsOrderDetail(orderId)`
- Consumes: `deliverVirtualOrder({ orderId, productInfos, miniappPath })`
- Produces: order-detail-driven fulfillment in channels webhook

- [ ] **Step 1: Extend the failing backend test**

Add assertions that the webhook-facing data normalization prefers order detail fields:

```js
assert.equal(
  mod.pickPaidAtFromOrderDetail({ pay_time: 1720000000 }),
  '2024-07-03 09:46:40'
)
assert.equal(
  mod.pickBuyerOpenidFromOrderDetail({ openid: 'buyer-openid' }),
  'buyer-openid'
)
```

Expected failure: helper missing or old path still not using order detail structure.

- [ ] **Step 2: Run the test red**

Run: `pnpm --filter @geo/server build && node --test apps/server/test/wechat-store-fulfillment-fix.test.cjs`

Expected: FAIL

- [ ] **Step 3: Implement the webhook refactor**

Update the webhook so it:

- fetches official order detail after receiving `order_id`
- reads `product_infos`, `openid`, `unionid`, `pay_time`, and price from that detail
- resolves `courseId` from the detail product list
- passes normalized detail into `createAndDeliverPostPurchaseFulfillment`
- only auto-grants course access when a real buyer `openid` is available

Update `deliverVirtualOrder` to accept structured input instead of only `deliveryNote`.

- [ ] **Step 4: Run verification**

Run: `pnpm --filter @geo/server build && node --test apps/server/test/wechat-store-fulfillment-fix.test.cjs`

Expected: PASS

### Task 3: Preserve Miniapp Return Context Through Login

**Files:**
- Create: `apps/miniapp/src/services/login-redirect.ts`
- Create: `apps/server/test/miniapp-login-redirect.test.cjs`
- Modify: `apps/miniapp/src/services/index.ts`
- Modify: `apps/miniapp/src/services/request.ts`
- Modify: `apps/miniapp/src/app.ts`
- Modify: `apps/miniapp/src/pages/login/index.tsx`

**Interfaces:**
- Produces: `saveLoginReturnUrl(url: string): void`
- Produces: `consumeLoginReturnUrl(): string`
- Produces: `buildLoginPageUrl(returnUrl?: string): string`

- [ ] **Step 1: Write the failing test**

Create a pure helper test that transpiles `apps/miniapp/src/services/login-redirect.ts` and expects:

```js
assert.equal(
  buildLoginPageUrl('/pages/video-unlock/index?token=abc'),
  '/pages/login/index?returnUrl=%2Fpages%2Fvideo-unlock%2Findex%3Ftoken%3Dabc'
)
assert.equal(
  sanitizeReturnUrl('/pages/login/index?returnUrl=x'),
  ''
)
```

Expected failure: file/helper missing.

- [ ] **Step 2: Run the test red**

Run: `node --test apps/server/test/miniapp-login-redirect.test.cjs`

Expected: FAIL because helper file does not exist yet.

- [ ] **Step 3: Implement the helper and wire it in**

Use the helper in:

- `app.ts` when launch detects no login
- `request.ts` when required auth is missing or token expires
- `login/index.tsx` after login success or profile completion

Rules:

- preserve the original unlock page URL with query
- never store the login page itself as the return target
- default to `/pages/index/index` only when there is no valid return target

- [ ] **Step 4: Run the helper test**

Run: `node --test apps/server/test/miniapp-login-redirect.test.cjs`

Expected: PASS

### Task 4: Full Verification

**Files:**
- No new files required

**Interfaces:**
- Consumes all previous tasks

- [ ] **Step 1: Build server**

Run: `pnpm --filter @geo/server build`

Expected: exit 0

- [ ] **Step 2: Run targeted tests**

Run: `node --test apps/server/test/wechat-store-fulfillment-fix.test.cjs apps/server/test/miniapp-login-redirect.test.cjs`

Expected: PASS

- [ ] **Step 3: Build miniapp**

Run: `pnpm build:miniapp`

Expected: exit 0

- [ ] **Step 4: Review diff with simple-code-quality**

Check:

- no speculative abstraction beyond the two small helper modules
- naming is domain-specific (`productInfos`, `returnUrl`, `coursePath`)
- fail-fast validation for missing order detail and missing product infos
- fallback claim flow preserved intentionally
