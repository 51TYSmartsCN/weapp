-- 微信小店购后承接：兑换码 hash、claimToken、小程序入口、小程序码、发货日志
-- 适用于已存在数据库。若是全新数据库，直接执行 db/schema.sql 即可。

ALTER TABLE `redeem_codes`
  MODIFY COLUMN `code` VARCHAR(32) NULL COMMENT '旧版明文兑换码（兼容存量数据，新数据优先使用 code_hash）',
  ADD COLUMN `code_hash` CHAR(64) NULL COMMENT '兑换码 SHA-256 哈希' AFTER `code`,
  ADD COLUMN `code_suffix` VARCHAR(8) NULL COMMENT '兑换码后缀，便于客服核对' AFTER `code_hash`,
  ADD COLUMN `entitlement_id` BIGINT NULL COMMENT '绑定的课程权益ID' AFTER `code_suffix`,
  ADD UNIQUE KEY `uk_code_hash` (`code_hash`),
  ADD UNIQUE KEY `uk_entitlement` (`entitlement_id`),
  ADD KEY `idx_order_no` (`order_no`);

CREATE TABLE IF NOT EXISTS `wechat_store_orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `store_order_id` VARCHAR(64) NOT NULL COMMENT '微信小店订单号',
  `source_scene` VARCHAR(32) NOT NULL DEFAULT 'unknown' COMMENT '来源场景 miniapp/channels_video/channels_live/channels_showcase/store/unknown',
  `buyer_openid` VARCHAR(64) NULL COMMENT '买家 openid（可获得时保存）',
  `buyer_unionid` VARCHAR(64) NULL COMMENT '买家 unionid（可获得时保存）',
  `pay_status` VARCHAR(16) NOT NULL DEFAULT 'paid' COMMENT '支付状态 pending/paid/closed/refunded',
  `fulfillment_status` VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT '发货状态 pending/ready/delivered/failed',
  `raw_payload` JSON NULL COMMENT '回调或订单详情原始数据',
  `paid_at` DATETIME NULL COMMENT '支付时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_store_order_id` (`store_order_id`),
  KEY `idx_source_scene` (`source_scene`),
  KEY `idx_pay_status` (`pay_status`),
  KEY `idx_fulfillment_status` (`fulfillment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信小店订单承接表';

CREATE TABLE IF NOT EXISTS `wechat_store_order_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `store_order_id` VARCHAR(64) NOT NULL COMMENT '微信小店订单号',
  `store_product_id` VARCHAR(64) NOT NULL COMMENT '微信小店商品ID',
  `store_sku_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '微信小店 SKU ID',
  `course_id` BIGINT NOT NULL COMMENT 'GEO 课程ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '购买数量',
  `item_status` VARCHAR(16) NOT NULL DEFAULT 'paid' COMMENT '明细状态 paid/fulfilled/claimed/refunded',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_store_order_item` (`store_order_id`, `store_product_id`, `store_sku_id`),
  KEY `idx_course_id` (`course_id`),
  CONSTRAINT `fk_wsoi_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信小店订单明细表';

CREATE TABLE IF NOT EXISTS `course_entitlements` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `course_id` BIGINT NOT NULL COMMENT 'GEO 课程ID',
  `user_id` BIGINT NULL COMMENT '领取后绑定的用户ID',
  `source_type` VARCHAR(32) NOT NULL DEFAULT 'wechat_store' COMMENT '来源类型',
  `source_order_id` VARCHAR(64) NOT NULL COMMENT '微信小店订单号',
  `source_order_item_id` BIGINT NOT NULL COMMENT '微信小店订单明细ID',
  `status` VARCHAR(16) NOT NULL DEFAULT 'unclaimed' COMMENT '权益状态 unclaimed/active/revoked/expired',
  `claimed_at` DATETIME NULL COMMENT '领取时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_source_item` (`source_type`, `source_order_item_id`),
  KEY `idx_user_course` (`user_id`, `course_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_ce_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ce_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程权益表';

CREATE TABLE IF NOT EXISTS `claim_tokens` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `token_hash` CHAR(64) NOT NULL COMMENT '领取 token 哈希',
  `short_code` VARCHAR(32) NOT NULL COMMENT '小程序码 scene 短码',
  `entitlement_id` BIGINT NOT NULL COMMENT '课程权益ID',
  `store_order_id` VARCHAR(64) NOT NULL COMMENT '微信小店订单号',
  `url_link` TEXT NULL COMMENT '小程序入口链接，优先 Short Link，降级 URL Link',
  `qrcode_url` VARCHAR(512) NULL COMMENT '小程序码图片 URL',
  `status` VARCHAR(16) NOT NULL DEFAULT 'active' COMMENT '状态 active/claimed/revoked/expired',
  `expires_at` DATETIME NULL COMMENT '过期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token_hash` (`token_hash`),
  UNIQUE KEY `uk_short_code` (`short_code`),
  UNIQUE KEY `uk_entitlement` (`entitlement_id`),
  KEY `idx_store_order_id` (`store_order_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_claim_entitlement` FOREIGN KEY (`entitlement_id`) REFERENCES `course_entitlements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信小店购后领取 token 表';

CREATE TABLE IF NOT EXISTS `fulfillment_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `store_order_id` VARCHAR(64) NOT NULL COMMENT '微信小店订单号',
  `channel` VARCHAR(32) NOT NULL COMMENT 'redeem_code/short_link/url_link/qrcode/store_delivery/customer_service/sms',
  `status` VARCHAR(16) NOT NULL COMMENT 'success/failed/retrying',
  `payload` JSON NULL COMMENT '投递内容摘要',
  `error_message` VARCHAR(512) NULL COMMENT '失败原因',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_store_order_channel` (`store_order_id`, `channel`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信小店购后发货日志表';
