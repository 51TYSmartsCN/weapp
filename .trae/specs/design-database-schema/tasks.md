# Tasks

## 阶段一：数据库表设计落地（DDL）

- [x] Task 1: 编写数据库初始化 SQL 脚本
  - [x] SubTask 1.1: 创建 `users` 表（含 openid 唯一索引、vip 字段、冗余统计字段）
  - [x] SubTask 1.2: 创建 `instructors` 表（讲师基础信息 + bio + color + avatar）
  - [x] SubTask 1.3: 创建 `courses` 表（外键 instructor_id、is_hot、status、original_price）
  - [x] SubTask 1.4: 创建 `categories` + `course_categories` 多对多关联（含唯一联合索引）
  - [x] SubTask 1.5: 创建 `lessons` 表（外键 course_id、duration_seconds、sort 复合索引）
  - [x] SubTask 1.6: 创建 `reviews` 表（外键 course_id + user_id，course_id + created_at 索引）
  - [x] SubTask 1.7: 创建 `user_courses` 关系表（唯一联合索引 user_id+course_id，last_study_at 索引）
  - [x] SubTask 1.8: 创建 `lesson_progress` 表（唯一联合索引 user_id+lesson_id）
  - [x] SubTask 1.9: 创建 `favorites` + `follows` 两张轻量表（唯一联合索引防重）
  - [x] SubTask 1.10: 创建 `orders` 表（order_no 唯一、user_id+status 索引、coupon_id 外键）
  - [x] SubTask 1.11: 创建 `coupons` 表（user_id+status 索引、expire_at）
  - [x] SubTask 1.12: 创建 `invitations`、`certificates`、`study_records`、`feedbacks`、`help_articles` 表

## 阶段二：前端类型扩展

- [x] Task 2: 在 `src/types/index.ts` 中补充后端契约类型
  - [x] SubTask 2.1: 新增 `Order`、`OrderStatus` 枚举
  - [x] SubTask 2.2: 新增 `Coupon`、`CouponType` 枚举
  - [x] SubTask 2.3: 新增 `LessonProgress`、`UserCourse`、`StudyRecord` 类型
  - [x] SubTask 2.4: 新增 `Favorite`、`Follow`、`Certificate`、`Invitation`、`Feedback`、`HelpArticle` 类型
  - [x] SubTask 2.5: 扩展 `User` 接口，新增 `id`、`vipExpireAt` 字段；扩展 `Course` 新增 `instructorId`、`isHot`、`status` 字段

## 阶段三：services 层接口补全

- [x] Task 3: 改造现有 service，补全缺失接口
  - [x] SubTask 3.1: `services/course.ts` 中 `getHotCourses` / `getAllCourses` / `getCoursesByCategory` 接入 `request<T>` 并支持分页参数
  - [x] SubTask 3.2: `services/lesson.ts` 中 `getLessons` 改为按 `courseId` 获取；新增 `reportLessonProgress`
  - [x] SubTask 3.3: 新增 `services/favorite.ts`：`toggleFavorite` / `checkFavorite`
  - [x] SubTask 3.4: 新增 `services/follow.ts`：`toggleFollow` / `checkFollow`
  - [x] SubTask 3.5: 新增 `services/order.ts`：`createOrder` / `getOrders` / `getOrderById`
  - [x] SubTask 3.6: 新增 `services/learning.ts`：`getLearningSummary` / `getMyCourses`
  - [x] SubTask 3.7: 新增 `services/profile.ts`：`getCoupons` / `getInvitations` / `getCertificates` / `getStudyRecords` / `createFeedback` / `getHelpArticles`
  - [x] SubTask 3.8: 在 `services/index.ts` 中 re-export 所有新增 service

## 阶段四：数据源切换验证

- [x] Task 4: 验证 `useLocal = false` 链路打通
  - [x] SubTask 4.1: 确认所有 service 函数都遵循 `shouldUseLocal(options)` 分支
  - [x] SubTask 4.2: 确认 `services/config.ts` 中 `apiConfig.useLocal` 切换为 `false` 后无 import 报错
  - [x] SubTask 4.3: 确认所有新接口的错误均通过 `showApiError` 统一展示

# Task Dependencies
- Task 2 依赖 Task 1（类型需对应表字段）
- Task 3 依赖 Task 2（service 返回类型需先定义）
- Task 4 依赖 Task 3
