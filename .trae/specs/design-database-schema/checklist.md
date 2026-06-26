# Checklist

## 表设计完整性
- [x] users 表含 openid 唯一索引、vip/vip_expire_at、三个冗余统计字段（bought_courses/finished_lessons/study_hours）
- [x] instructors 表含 name/title/service/color，并补充 bio / avatar 字段以支撑课程详情页
- [x] courses 表通过 instructor_id 外键关联讲师，含 is_hot、status、original_price
- [x] categories + course_categories 实现课程与分类的多对多关系（对应前端 tags）
- [x] lessons 表含 course_id 外键、sort 排序字段、duration_seconds 用于进度计算
- [x] reviews 表关联 course_id 与 user_id，并冗余 name 用于展示
- [x] user_courses 表含唯一索引 (user_id, course_id)，含 progress / completed_lessons / last_study_at
- [x] lesson_progress 表含唯一索引 (user_id, lesson_id)，含 watched_seconds / last_position
- [x] favorites 与 follows 表均含唯一联合索引防止重复收藏/关注
- [x] orders 表含 order_no 唯一索引、status 枚举、coupon_id 外键
- [x] coupons 表含 type（满减/折扣）、value、expire_at、status
- [x] invitations 表含 inviter_id / invitee_id / reward
- [x] certificates 表含 certificate_no 唯一、(user_id, course_id) 唯一
- [x] study_records 表含 (user_id, studied_at) 索引用于学习记录菜单
- [x] feedbacks 表含 type / content / contact
- [x] help_articles 表含 category + sort 复合索引

## 操作流程覆盖
- [x] 用户登录流程：wx.login → code → /api/auth/login → upsert users → 返回 token（spec 已规划，service 暂未实现，由后端处理）
- [x] 首页加载流程：courses?hot=1 + categories + instructors 三接口并发
- [x] 课程列表分类筛选流程：通过 course_categories JOIN 实现
- [x] 课程详情流程：course + lessons + reviews + favorite/check + follow/check
- [x] 收藏/取消收藏流程：POST /api/favorites（toggle 语义），操作 favorites 表
- [x] 关注/取消关注流程：POST /api/follows（toggle 语义），操作 follows 表
- [x] 报名流程：创建 orders(status=0) → 支付回调由后端处理 → 更新 orders + 插入 user_courses + 更新 users.bought_courses
- [x] 课时进度上报流程：POST /api/lessons/{id}/progress（UPSERT/证书颁发由后端处理）
- [x] 学习中心流程：getLearningSummary → /api/user/learning/summary
- [x] 个人中心菜单流程：覆盖订单/优惠券/邀请/证书/学习记录/反馈/帮助中心七类接口

## 前端契约一致性
- [x] src/types/index.ts 新增类型与表字段一一对应
- [x] services/* 中所有函数保留 shouldUseLocal 分支，本地分支仍返回 src/data 数据
- [x] services/index.ts 完整 re-export 所有新增 service
- [x] 所有新增 service 函数返回 Promise<T>，错误通过 showApiError 处理（service 抛 ApiException，页面 catch 后调 showApiError）
- [x] services/config.ts 中 useLocal 切换为 false 时无 import 报错（tsc --noEmit 通过）
