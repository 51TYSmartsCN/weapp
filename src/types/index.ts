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
}

export interface Instructor {
  id: number
  name: string
  title: string
  service: string
  color: string
}

export interface Lesson {
  id: number
  title: string
  duration: string
}

export interface Review {
  id: number
  name: string
  rating: number
  content: string
  date: string
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