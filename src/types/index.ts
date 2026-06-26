/** API 契约 — 共享类型定义 */

export interface Course {
  id: number
  title: string
  desc: string
  instructor: string
  rating: number
  students: number
  price: number
  originalPrice?: number
  cover: string
  tags?: string[]
  instructorId?: number
  isHot?: boolean
  status?: number
}

export interface Instructor {
  id: number
  name: string
  title: string
  service: string
  color: string
  bio?: string
  avatar?: string
}

export interface Lesson {
  id: number
  title: string
  duration: string
  videoUrl?: string
  courseId?: number
  durationSeconds?: number
  sort?: number
}

export interface Review {
  id: number
  name: string
  rating: number
  content: string
  date: string
  userId?: number
  courseId?: number
}

export interface User {
  name: string
  avatar: string
  vip: boolean
  boughtCourses: number
  finishedLessons: number
  studyHours: number
  continueCourse: {
    title: string
    progress: number
    completed: number
    total: number
    lastStudy: string
  }
  id?: number
  vipExpireAt?: string
}

export interface MenuItemData {
  icon: string
  label: string
}

/** 课程分类枚举 */
export enum Category {
  All = 'all',
  GeoIntro = 'geo-intro',
  ContentOptimization = 'content-optimization',
  TechPractice = 'tech-practice',
  EnterpriseTraining = 'enterprise-training',
}

/** Category → 中文显示名 */
export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.All]: '全部',
  [Category.GeoIntro]: 'GEO入门',
  [Category.ContentOptimization]: '内容优化',
  [Category.TechPractice]: '技术实战',
  [Category.EnterpriseTraining]: '企业培训',
}

/** Category → 课程数据中 tags 对应的值，用于筛选 */
export const CATEGORY_TAG: Record<Category, string | null> = {
  [Category.All]: null,
  [Category.GeoIntro]: 'GEO入门',
  [Category.ContentOptimization]: '内容优化',
  [Category.TechPractice]: '技术实战',
  [Category.EnterpriseTraining]: '企业培训',
}

export interface MenuGroup {
  title?: string
  items: MenuItemData[]
}

// ==================== 后端契约扩展类型 ====================

/** 订单状态枚举 */
export enum OrderStatus {
  Pending = 0,    // 待支付
  Paid = 1,       // 已支付
  Refunded = 2,   // 已退款
  Cancelled = 3,  // 已取消
}

/** 订单 */
export interface Order {
  id: number
  orderNo: string
  userId: number
  courseId: number
  amount: number
  originalAmount?: number
  couponId?: number
  status: OrderStatus
  payMethod?: string
  paidAt?: string
  createdAt: string
}

/** 优惠券类型枚举 */
export enum CouponType {
  Discount = 1,  // 满减
  Rate = 2,      // 折扣
}

/** 优惠券状态枚举 */
export enum CouponStatus {
  Unused = 0,    // 未使用
  Used = 1,      // 已使用
  Expired = 2,   // 已过期
}

/** 优惠券 */
export interface Coupon {
  id: number
  userId: number
  code: string
  type: CouponType
  value: number
  minAmount: number
  expireAt: string
  status: CouponStatus
  createdAt: string
}

/** 用户-课程关系状态枚举 */
export enum UserCourseStatus {
  Purchased = 0,  // 已购未学
  Learning = 1,   // 学习中
  Finished = 2,   // 已完成
}

/** 用户-课程关系（学习中心"我的课程"与"继续学习"） */
export interface UserCourse {
  id: number
  userId: number
  courseId: number
  status: UserCourseStatus
  progress: number         // 0-100
  completedLessons: number
  totalLessons: number
  lastStudyAt?: string
  createdAt: string
  updatedAt: string
}

/** 课时进度 */
export interface LessonProgress {
  id: number
  userId: number
  lessonId: number
  courseId: number
  completed: boolean
  watchedSeconds: number
  lastPosition: number
  updatedAt: string
}

/** 学习记录 */
export interface StudyRecord {
  id: number
  userId: number
  courseId: number
  lessonId: number
  duration: number  // 秒
  studiedAt: string
}

/** 收藏 */
export interface Favorite {
  id: number
  userId: number
  courseId: number
  createdAt: string
}

/** 关注 */
export interface Follow {
  id: number
  userId: number
  instructorId: number
  createdAt: string
}

/** 学习证书 */
export interface Certificate {
  id: number
  userId: number
  courseId: number
  certificateNo: string
  issuedAt: string
}

/** 邀请记录 */
export interface Invitation {
  id: number
  inviterId: number
  inviteeId: number
  reward: number
  createdAt: string
}

/** 邀请统计（个人中心"邀请好友"用） */
export interface InvitationSummary {
  invitedCount: number
  rewardTotal: number
  invitations: Invitation[]
}

/** 意见反馈 */
export interface Feedback {
  id: number
  userId: number
  type: string
  content: string
  contact?: string
  createdAt: string
}

/** 反馈创建载荷 */
export interface FeedbackPayload {
  type: string
  content: string
  contact?: string
}

/** 帮助文章 */
export interface HelpArticle {
  id: number
  title: string
  content: string
  category: string
  sort: number
}

/** 学习中心汇总（GET /api/user/learning/summary 返回结构） */
export interface LearningSummary {
  continueCourse: {
    courseId: number
    title: string
    progress: number
    completed: number
    total: number
    lastStudy: string
  } | null
  myCourses: UserCourse[]
  stats: {
    boughtCourses: number
    finishedLessons: number
    studyHours: number
  }
}

/** 课时进度上报载荷 */
export interface ReportProgressPayload {
  watchedSeconds: number
  completed: boolean
  lastPosition: number
}

/** 创建订单载荷 */
export interface CreateOrderPayload {
  courseId: number
  couponId?: number
}