-- ============================================================
-- GEO 课程项目 - 数据库初始化脚本
-- MySQL 8.0+ / InnoDB / utf8mb4
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 表名：users（用户表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '微信 openid',
  `unionid` VARCHAR(64) NULL COMMENT '微信 unionid',
  `name` VARCHAR(64) NOT NULL COMMENT '昵称',
  `avatar` VARCHAR(512) NOT NULL COMMENT '头像文字或 URL',
  `vip` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否 VIP（0=否 1=是）',
  `vip_expire_at` DATETIME NULL COMMENT 'VIP 到期时间',
  `bought_courses` INT NOT NULL DEFAULT 0 COMMENT '已购课程数（冗余）',
  `finished_lessons` INT NOT NULL DEFAULT 0 COMMENT '已完成课时数（冗余）',
  `study_hours` INT NOT NULL DEFAULT 0 COMMENT '累计学习时长（小时）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_vip` (`vip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ------------------------------------------------------------
-- 表名：instructors（讲师表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `instructors`;
CREATE TABLE `instructors` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(64) NOT NULL COMMENT '姓名',
  `title` VARCHAR(64) NOT NULL COMMENT '头衔',
  `service` VARCHAR(128) NOT NULL COMMENT '服务说明',
  `bio` TEXT NULL COMMENT '简介',
  `color` VARCHAR(16) NOT NULL COMMENT '头像背景色',
  `avatar` VARCHAR(32) NULL COMMENT '头像文字',
  `expertise` VARCHAR(256) NULL COMMENT '专长领域，逗号分隔',
  `years` INT NULL COMMENT '从业年限',
  `student_count` INT NULL COMMENT '累计学员数',
  `course_count` INT NULL COMMENT '累计课程数',
  `achievements` TEXT NULL COMMENT '个人成就，换行分隔',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='讲师表';

-- ------------------------------------------------------------
-- 表名：courses（课程表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` VARCHAR(128) NOT NULL COMMENT '课程标题',
  `desc` VARCHAR(256) NOT NULL COMMENT '简短描述',
  `instructor_id` BIGINT NOT NULL COMMENT '讲师ID',
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 0.0 COMMENT '评分',
  `students` INT NOT NULL DEFAULT 0 COMMENT '学习人数',
  `price` DECIMAL(10,2) NOT NULL COMMENT '现价',
  `original_price` DECIMAL(10,2) NULL COMMENT '原价',
  `cover` VARCHAR(256) NOT NULL COMMENT '封面',
  `is_hot` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否热门（0=否 1=是）',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '上下架（0=下架 1=上架）',
  `requires_access` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否需要购课权限才能观看视频（0=开放观看 1=需要购买/登录）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_instructor_id` (`instructor_id`),
  KEY `idx_is_hot` (`is_hot`),
  KEY `idx_status` (`status`),
  KEY `idx_requires_access` (`requires_access`),
  CONSTRAINT `fk_courses_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `instructors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- ------------------------------------------------------------
-- 表名：categories（分类表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code` VARCHAR(32) NOT NULL COMMENT '枚举值如 geo-intro',
  `name` VARCHAR(32) NOT NULL COMMENT '显示名',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ------------------------------------------------------------
-- 表名：course_categories（课程-分类关联表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `course_categories`;
CREATE TABLE `course_categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `category_id` BIGINT NOT NULL COMMENT '分类ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_course_category` (`course_id`, `category_id`),
  KEY `idx_category_id` (`category_id`),
  CONSTRAINT `fk_cc_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cc_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程-分类关联表';

-- ------------------------------------------------------------
-- 表名：lessons（课时表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `lessons`;
CREATE TABLE `lessons` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `title` VARCHAR(128) NOT NULL COMMENT '课时标题',
  `duration` VARCHAR(16) NOT NULL COMMENT '时长描述（形如 15min）',
  `duration_seconds` INT NULL COMMENT '实际秒数',
  `video_url` VARCHAR(512) NULL COMMENT '视频地址',
  `content` TEXT NULL COMMENT '图文教程内容（模块展示模式为 text-image 时使用）',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_course_id_sort` (`course_id`, `sort`),
  CONSTRAINT `fk_lessons_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课时表';

-- ------------------------------------------------------------
-- 表名：reviews（评价表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `name` VARCHAR(64) NOT NULL COMMENT '显示用昵称（冗余）',
  `rating` TINYINT NOT NULL COMMENT '评分 1-5',
  `content` TEXT NOT NULL COMMENT '评价内容',
  `date` DATE NOT NULL COMMENT '显示日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_course_id_created` (`course_id`, `created_at` DESC),
  CONSTRAINT `fk_reviews_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价表';

-- ------------------------------------------------------------
-- 表名：coupons（优惠券表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `code` VARCHAR(32) NOT NULL COMMENT '券码',
  `type` TINYINT NOT NULL COMMENT '类型（1=满减 2=折扣）',
  `value` DECIMAL(10,2) NOT NULL COMMENT '减金额或折扣率',
  `min_amount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '满减门槛',
  `expire_at` DATETIME NOT NULL COMMENT '过期时间',
  `status` TINYINT NOT NULL COMMENT '状态（0=未使用 1=已使用 2=已过期）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_coupons_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠券表';

-- ------------------------------------------------------------
-- 表名：user_courses（用户-课程关系表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `user_courses`;
CREATE TABLE `user_courses` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `status` TINYINT NOT NULL COMMENT '状态（0=已购未学 1=学习中 2=已完成）',
  `progress` INT NOT NULL DEFAULT 0 COMMENT '进度 0-100',
  `completed_lessons` INT NOT NULL DEFAULT 0 COMMENT '已完成课时数',
  `total_lessons` INT NOT NULL DEFAULT 0 COMMENT '总课时数',
  `last_study_at` DATETIME NULL COMMENT '最后学习时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_course` (`user_id`, `course_id`),
  KEY `idx_user_last_study` (`user_id`, `last_study_at` DESC),
  CONSTRAINT `fk_uc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_uc_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-课程关系表';

-- ------------------------------------------------------------
-- 表名：lesson_progress（课时进度表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `lesson_progress`;
CREATE TABLE `lesson_progress` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `lesson_id` BIGINT NOT NULL COMMENT '课时ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成（0=否 1=是）',
  `watched_seconds` INT NOT NULL DEFAULT 0 COMMENT '已观看秒数',
  `last_position` INT NOT NULL DEFAULT 0 COMMENT '上次观看位置（秒）',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_lesson` (`user_id`, `lesson_id`),
  KEY `idx_user_course` (`user_id`, `course_id`),
  CONSTRAINT `fk_lp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lp_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lp_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课时进度表';

-- ------------------------------------------------------------
-- 表名：favorites（收藏表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_course` (`user_id`, `course_id`),
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fav_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ------------------------------------------------------------
-- 表名：follows（关注讲师表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `follows`;
CREATE TABLE `follows` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `instructor_id` BIGINT NOT NULL COMMENT '讲师ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_instructor` (`user_id`, `instructor_id`),
  CONSTRAINT `fk_follow_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_follow_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `instructors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注讲师表';

-- ------------------------------------------------------------
-- 表名：orders（订单表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '实付金额',
  `original_amount` DECIMAL(10,2) NULL COMMENT '原价',
  `coupon_id` BIGINT NULL COMMENT '优惠券ID',
  `status` TINYINT NOT NULL COMMENT '订单状态（0=待支付 1=已支付 2=已退款 3=已取消）',
  `source` TINYINT NOT NULL DEFAULT 0 COMMENT '订单来源（0=小程序内购 1=微信小店）',
  `pay_method` VARCHAR(16) NULL COMMENT '支付方式',
  `paid_at` DATETIME NULL COMMENT '支付时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_status` (`user_id`, `status`),
  KEY `idx_source` (`source`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ------------------------------------------------------------
-- 表名：invitations（邀请记录表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `invitations`;
CREATE TABLE `invitations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `inviter_id` BIGINT NOT NULL COMMENT '邀请人ID',
  `invitee_id` BIGINT NOT NULL COMMENT '被邀请人ID',
  `reward` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '奖励金额',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_inviter_id` (`inviter_id`),
  UNIQUE KEY `uk_invitee_id` (`invitee_id`),
  CONSTRAINT `fk_inv_inviter` FOREIGN KEY (`inviter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inv_invitee` FOREIGN KEY (`invitee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请记录表';

-- ------------------------------------------------------------
-- 表名：certificates（学习证书表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `certificates`;
CREATE TABLE `certificates` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `certificate_no` VARCHAR(32) NOT NULL COMMENT '证书编号',
  `issued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '颁发时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_certificate_no` (`certificate_no`),
  UNIQUE KEY `uk_user_course` (`user_id`, `course_id`),
  CONSTRAINT `fk_cert_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习证书表';

-- ------------------------------------------------------------
-- 表名：study_records（学习记录表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `study_records`;
CREATE TABLE `study_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `lesson_id` BIGINT NOT NULL COMMENT '课时ID',
  `duration` INT NOT NULL DEFAULT 0 COMMENT '本次学习秒数',
  `studied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '学习时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_studied` (`user_id`, `studied_at` DESC),
  CONSTRAINT `fk_sr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sr_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sr_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习记录表';

-- ------------------------------------------------------------
-- 表名：feedbacks（意见反馈表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `feedbacks`;
CREATE TABLE `feedbacks` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `type` VARCHAR(32) NOT NULL COMMENT '反馈类型',
  `content` TEXT NOT NULL COMMENT '反馈内容',
  `contact` VARCHAR(64) NULL COMMENT '联系方式',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_fb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='意见反馈表';

-- ------------------------------------------------------------
-- 表名：banners（首页 Banner 表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` VARCHAR(128) NOT NULL COMMENT '标题',
  `subtitle` VARCHAR(256) NULL COMMENT '副标题',
  `image` VARCHAR(512) NOT NULL COMMENT '图片 URL',
  `link_type` VARCHAR(16) NOT NULL DEFAULT 'none' COMMENT '跳转类型 none/course/page',
  `link_value` VARCHAR(128) NULL COMMENT '跳转值（课程ID 或页面路径）',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用 0=否 1=是',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='首页 Banner 表';

-- ------------------------------------------------------------
-- 表名：help_articles（帮助文章表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `help_articles`;
CREATE TABLE `help_articles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` VARCHAR(128) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `category` VARCHAR(32) NOT NULL COMMENT '分类',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (`id`),
  KEY `idx_category_sort` (`category`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮助文章表';

-- ------------------------------------------------------------
-- 表名：app_configs（应用配置表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `app_configs`;
CREATE TABLE `app_configs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `key` VARCHAR(64) NOT NULL COMMENT '配置键',
  `value` TEXT NOT NULL COMMENT '配置值（JSON 字符串）',
  `description` VARCHAR(256) NULL COMMENT '描述',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用配置表';

-- 初始主题配置（蓝紫色系）
INSERT INTO `app_configs` (`key`, `value`, `description`) VALUES
('theme', '{"primary": "#6366F1", "primaryLight": "#818CF8", "primaryLighter": "#C7D2FE", "primaryLightest": "#EEF2FF", "primaryDark": "#4F46E5", "primaryDarker": "#4338CA"}', '小程序主题色配置');

-- 模块展示模式配置（控制各模块在视频/图文之间切换）
INSERT INTO `app_configs` (`key`, `value`, `description`) VALUES
('module_modes', '{"lessonPlayer":{"contentMode":"video"},"courseDetailCover":{"mode":"image"}}', '模块展示模式配置（lessonPlayer.contentMode / courseDetailCover.mode）');

-- 应用基础信息配置（名称、描述、Logo）
INSERT INTO `app_configs` (`key`, `value`, `description`) VALUES
('app-info', '{"appName":"GEO 课程","appDescription":"专注 GEO 领域的实战学习平台"}', '应用基础信息（名称、描述、Logo）');

-- ------------------------------------------------------------
-- 表名：wxshop_products（微信小店商品-课程映射表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `wxshop_products`;
CREATE TABLE `wxshop_products` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `product_id` VARCHAR(64) NOT NULL COMMENT '微信小店商品ID(product_id/out_product_id)',
  `product_title` VARCHAR(256) NULL COMMENT '商品标题(便于识别)',
  `course_id` BIGINT NOT NULL COMMENT '关联的课程ID',
  `course_title` VARCHAR(256) NULL COMMENT '课程标题(冗余)',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态 0=禁用 1=启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_id` (`product_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信小店商品-课程映射表';

SET FOREIGN_KEY_CHECKS = 1;
