/** API 契约 — 跨端共享类型定义（@geo/shared） */

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
  /** 是否需要购课权限才能观看视频（true=需要购买/登录，false=开放观看，用于测试） */
  requiresAccess?: boolean
}

export interface Instructor {
  id: number
  name: string
  title: string
  service: string
  color: string
  status?: number
  bio?: string
  avatar?: string
  /** 专长领域（标签数组） */
  expertise?: string[]
  /** 从业年限（年） */
  years?: number
  /** 累计学员数 */
  studentCount?: number
  /** 累计课程数 */
  courseCount?: number
  /** 个人成就/经历（多条） */
  achievements?: string[]
}

export interface Lesson {
  id: number
  title: string
  duration: string
  videoUrl?: string
  courseId?: number
  durationSeconds?: number
  sort?: number
  /** 图文教程内容（当模块展示模式为 text-image 时使用） */
  content?: string
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
  /** 后端在用户尚未开始任何课程时会返回 null */
  continueCourse: {
    title: string
    progress: number
    completed: number
    total: number
    lastStudy: string
  } | null
  id?: number
  vipExpireAt?: string
  /** 是否已完善资料（昵称 + 头像）。后端登录/资料接口返回 */
  hasProfile?: boolean
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

/** Banner 跳转类型 */
export type BannerLinkType = 'none' | 'course' | 'page'

/** 首页 Banner */
export interface Banner {
  id: number
  title: string
  subtitle: string
  image: string
  linkType: BannerLinkType
  linkValue: string
  sort: number
}

/** 首页统计项 */
export interface HomeStatItem {
  value: string
  label: string
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

/** 订单来源枚举 */
export enum OrderSource {
  MiniApp = 0,  // 小程序内购
  WxShop = 1,   // 微信小店
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
  /** 订单来源:0=小程序内购 1=微信小店。老数据未设置时默认 0 */
  source?: OrderSource
  payMethod?: string
  paidAt?: string
  createdAt: string
}

/** 课程访问权限结果(GET /api/courses/:id/access) */
export interface CourseAccess {
  /** 课程 ID */
  courseId: number
  /** 是否免费(price = 0) */
  isFree: boolean
  /** 当前用户是否已购(或免费课程自动为 true) */
  purchased: boolean
  /** 是否可以学习视频(isFree || purchased || isVip) */
  canLearn: boolean
  /** 当前用户是否为 VIP */
  isVip: boolean
}

/** 课时播放地址(GET /api/lessons/:id/play) */
export interface LessonPlayUrl {
  lessonId: number
  courseId: number
  /** 视频播放地址(带签名的临时URL，仅当用户有权限时返回,否则接口返回 403) */
  videoUrl: string
  /** 链接过期时间戳(毫秒) */
  expiresAt: number
}

/** 课时图文内容(GET /api/lessons/:id/content，需鉴权) */
export interface LessonContent {
  lessonId: number
  courseId: number
  /** 图文教程内容 */
  content: string
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
  instructor?: Instructor
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

/** 主题配置 */
export interface ThemeConfig {
  primary: string
  primaryLight: string
  primaryLighter: string
  primaryLightest: string
  primaryDark: string
  primaryDarker: string
  /** TabBar 选中文字色（默认跟随 primary） */
  tabBarSelectedColor?: string
  /** TabBar 未选中文字色 */
  tabBarColor?: string
  /** TabBar 背景色 */
  tabBarBgColor?: string
  /** TabBar 图标配置（4 个 tab） */
  tabItems?: TabItem[]
}

/** TabBar 单项配置 */
export interface TabItem {
  text: string
  iconUrl: string
  activeIconUrl: string
}

/** 模块展示模式配置（app_configs.module_modes） */
export interface ModuleDisplayModes {
  /** 课时播放页：内容展示模式 */
  lessonPlayer: {
    /** 'video' = 视频播放; 'text-image' = 图文教程 */
    contentMode: 'video' | 'text-image'
  }
  /** 课程详情页封面：展示模式 */
  courseDetailCover: {
    /** 'image' = 静态封面图; 'video' = 视频预览 */
    mode: 'image' | 'video'
    /** 当 mode=video 时使用的视频 URL（为空则回退到 image） */
    videoUrl?: string
  }
}
