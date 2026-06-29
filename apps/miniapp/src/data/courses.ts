import type { Course } from '../types'
import { Category } from '../types'

// 默认在线课程封面图（通过后端 /api/courses 可覆盖）
const IMG = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3`

export const hotCourses: Course[] = [
  {
    id: 1,
    title: 'GEO 实战入门',
    desc: '从零理解生成式引擎优化',
    instructor: '张明远',
    rating: 4.9,
    students: 2368,
    price: 199,
    cover: IMG('AI search engine optimization concept with glowing search bar and neural network, teal gradient background, modern tech illustration')
  },
  {
    id: 2,
    title: 'AI 内容营销策略',
    desc: '打造高可见度品牌内容',
    instructor: '李婉清',
    rating: 4.8,
    students: 1856,
    price: 299,
    cover: IMG('Digital brand content marketing strategy with media elements, content creation visualization, amber orange gradient background')
  }
]

export const allCourses: Course[] = [
  {
    id: 1,
    title: 'GEO 实战入门：从零掌握 AI 搜索优化',
    desc: '从零理解生成式引擎优化',
    instructor: '张明远',
    rating: 4.9,
    students: 2368,
    price: 199,
    originalPrice: 399,
    cover: IMG('AI search engine optimization concept with glowing search bar and neural network, teal gradient background, modern tech illustration'),
    tags: ['GEO入门', '内容优化', '实战']
  },
  {
    id: 2,
    title: 'AI 时代的品牌内容策略',
    desc: '打造高可见度品牌内容',
    instructor: '李婉清',
    rating: 4.8,
    students: 1856,
    price: 299,
    cover: IMG('Digital brand content marketing strategy with media elements, content creation visualization, amber orange gradient background'),
    tags: ['内容优化']
  },
  {
    id: 3,
    title: '企业级 GEO 落地指南',
    desc: '面向团队的 GEO 实施方法论',
    instructor: '王志强',
    rating: 4.9,
    students: 1205,
    price: 599,
    cover: IMG('Enterprise team collaboration meeting with AI technology dashboard, corporate business training, professional teal theme'),
    tags: ['企业培训', '实战']
  },
  {
    id: 4,
    title: '提示词工程与内容生成',
    desc: '掌握 AI 提示词，高效生产内容',
    instructor: '陈思雨',
    rating: 4.7,
    students: 3120,
    price: 249,
    cover: IMG('AI prompt engineering with code interface and neural network, content generation visualization, dark green tech theme'),
    tags: ['技术实战']
  },
  {
    id: 5,
    title: '搜索意图分析实战',
    desc: '洞察用户搜索背后的真实需求',
    instructor: '刘浩然',
    rating: 4.8,
    students: 980,
    price: 349,
    cover: IMG('Search intent data analytics dashboard with magnifying glass and user behavior charts, insights visualization, teal theme'),
    tags: ['技术实战']
  },
  {
    id: 6,
    title: '多语言 GEO 内容策略',
    desc: '拓展海外市场的 GEO 内容打法',
    instructor: '赵雅琳',
    rating: 4.6,
    students: 756,
    price: 399,
    cover: IMG('Global multilingual content strategy with world map and language symbols, international marketing, teal emerald theme'),
    tags: ['内容优化']
  }
]

export const categories: Category[] = [
  Category.All,
  Category.GeoIntro,
  Category.ContentOptimization,
  Category.TechPractice,
  Category.EnterpriseTraining,
]
