import 'dotenv/config'
import { pool } from './db'

// ==================== 静态数据（同构自 src/data/） ====================

// 源自 src/data/user.ts
const mockUser = {
  openid: 'mock_openid_demo',
  name: '李晓明',
  avatar: '李',
  vip: 1,
  bought_courses: 3,
  finished_lessons: 12,
  study_hours: 86,
}

// 源自 src/data/instructors.ts（3 条）；源数据无 bio/avatar，bio=NULL，avatar=姓名首字
const instructorsData = [
  { id: 1, name: '陈志远', title: 'GEO 优化专家', service: '已服务 500+ 企业', color: '#0D9488' },
  { id: 2, name: '李思涵', title: 'AI 营销总监', service: '已服务 300+ 企业', color: '#8B5CF6' },
  { id: 3, name: '王子豪', title: '内容策略顾问', service: '已服务 450+ 企业', color: '#EC4899' },
]

// 源自 src/types/index.ts 的 Category 枚举与 CATEGORY_LABELS
const categoriesData = [
  { id: 1, code: 'all', name: '全部', sort: 0 },
  { id: 2, code: 'geo-intro', name: 'GEO入门', sort: 1 },
  { id: 3, code: 'content-optimization', name: '内容优化', sort: 2 },
  { id: 4, code: 'tech-practice', name: '技术实战', sort: 3 },
  { id: 5, code: 'enterprise-training', name: '企业培训', sort: 4 },
]

// 源自 src/data/courses.ts 的 allCourses（6 条）；instructor_id 统一为 1（mock 简化）
const coursesData = [
  { id: 1, title: 'GEO 实战入门：从零掌握 AI 搜索优化', desc: '从零理解生成式引擎优化', rating: 4.9, students: 2368, price: 199, originalPrice: 399, cover: 'linear-gradient(135deg, #0D9488, #14B8A6)', tags: ['GEO入门', '内容优化', '实战'] },
  { id: 2, title: 'AI 时代的品牌内容策略', desc: '打造高可见度品牌内容', rating: 4.8, students: 1856, price: 299, originalPrice: null as number | null, cover: 'linear-gradient(135deg, #0F766E, #0D9488)', tags: ['内容优化'] },
  { id: 3, title: '企业级 GEO 落地指南', desc: '面向团队的 GEO 实施方法论', rating: 4.9, students: 1205, price: 599, originalPrice: null as number | null, cover: 'linear-gradient(135deg, #0D9488, #99F6E4)', tags: ['企业培训', '实战'] },
  { id: 4, title: '提示词工程与内容生成', desc: '掌握 AI 提示词，高效生产内容', rating: 4.7, students: 3120, price: 249, originalPrice: null as number | null, cover: 'linear-gradient(135deg, #115E59, #0F766E)', tags: ['技术实战'] },
  { id: 5, title: '搜索意图分析实战', desc: '洞察用户搜索背后的真实需求', rating: 4.8, students: 980, price: 349, originalPrice: null as number | null, cover: 'linear-gradient(135deg, #99F6E4, #14B8A6)', tags: ['技术实战'] },
  { id: 6, title: '多语言 GEO 内容策略', desc: '拓展海外市场的 GEO 内容打法', rating: 4.6, students: 756, price: 399, originalPrice: null as number | null, cover: 'linear-gradient(135deg, #115E59, #0D9488)', tags: ['内容优化'] },
]

// hotCourses 中的课程 id（1, 2）需标记 is_hot=1
const hotCourseIds = [1, 2]

// 源自 src/data/lessons.ts（6 条），统一关联 course_id=1
const lessonsData = [
  { title: '01 - 什么是 GEO？为什么现在必须学', duration: '15min', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { title: '02 - AI 搜索引擎的工作原理', duration: '22min', videoUrl: 'https://www.w3schools.com/html/movie.mp4' },
  { title: '03 - 内容结构化与语义标记', duration: '30min', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { title: '04 - 关键词策略在 AI 时代的变化', duration: '25min', videoUrl: 'https://www.w3schools.com/html/movie.mp4' },
  { title: '05 - GEO 实战案例分析', duration: '28min', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { title: '06 - 效果监测与持续优化', duration: '20min', videoUrl: 'https://www.w3schools.com/html/movie.mp4' },
]

// 源自 src/data/reviews.ts（2 条），统一关联 course_id=1、user_id=mock 用户
const reviewsData = [
  { name: '李雨桐', rating: 5, content: '课程内容非常实用，从基础概念到实际操作都有详细讲解。学完之后直接用到了工作中，客户网站流量提升了40%！强烈推荐给做内容营销的朋友。', date: '2026-06-20' },
  { name: '王思远', rating: 5, content: '张老师讲得很清楚，案例丰富。特别是AI搜索引擎工作原理那节课，让我对未来的SEO方向有了全新的认识。性价比超高。', date: '2026-06-15' },
]

// 课程 tags（中文）→ category_id 映射（基于 categoriesData 的显式 id）
const TAG_TO_CATEGORY_ID: Record<string, number> = {
  'GEO入门': 2,
  '内容优化': 3,
  '技术实战': 4,
  '企业培训': 5,
  // '实战' 无对应分类，跳过
}

// 解析 "15min" → 900（秒）
function parseDuration(duration: string): number {
  const m = duration.match(/^(\d+)\s*min/i)
  return m ? parseInt(m[1], 10) * 60 : 0
}

async function seed() {
  console.log('开始 seed...')
  try {
    // 1. TRUNCATE 所有表（按外键依赖逆序）
    await pool.query('SET FOREIGN_KEY_CHECKS = 0')
    const tables = [
      'help_articles',
      'feedbacks',
      'study_records',
      'certificates',
      'invitations',
      'orders',
      'follows',
      'favorites',
      'lesson_progress',
      'user_courses',
      'coupons',
      'reviews',
      'lessons',
      'course_categories',
      'categories',
      'courses',
      'instructors',
      'users',
    ]
    for (const t of tables) {
      await pool.query(`TRUNCATE ${t}`)
    }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1')
    console.log(`[1/8] TRUNCATE 完成（${tables.length} 张表）`)

    // 2. 插入 mock 用户
    const [userResult] = await pool.execute(
      `INSERT INTO users (openid, name, avatar, vip, bought_courses, finished_lessons, study_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        mockUser.openid,
        mockUser.name,
        mockUser.avatar,
        mockUser.vip,
        mockUser.bought_courses,
        mockUser.finished_lessons,
        mockUser.study_hours,
      ]
    )
    const userId = (userResult as { insertId: number }).insertId
    console.log(`[2/8] 插入 users：1 条（id=${userId}）`)

    // 3. 插入 instructors（bio=NULL，avatar=姓名首字）
    for (const ins of instructorsData) {
      await pool.execute(
        `INSERT INTO instructors (id, name, title, service, bio, color, avatar)
         VALUES (?, ?, ?, ?, NULL, ?, ?)`,
        [ins.id, ins.name, ins.title, ins.service, ins.color, ins.name.charAt(0)]
      )
    }
    console.log(`[3/8] 插入 instructors：${instructorsData.length} 条`)

    // 4. 插入 categories（显式 id 1-5）
    for (const cat of categoriesData) {
      await pool.execute(
        `INSERT INTO categories (id, code, name, sort) VALUES (?, ?, ?, ?)`,
        [cat.id, cat.code, cat.name, cat.sort]
      )
    }
    console.log(`[4/8] 插入 categories：${categoriesData.length} 条`)

    // 5. 插入 courses（instructor_id 统一为 1）+ 标记 hot
    for (const c of coursesData) {
      await pool.execute(
        `INSERT INTO courses (id, title, \`desc\`, instructor_id, rating, students, price, original_price, cover, is_hot, status)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, 0, 1)`,
        [c.id, c.title, c.desc, c.rating, c.students, c.price, c.originalPrice, c.cover]
      )
    }
    await pool.query(`UPDATE courses SET is_hot = 1 WHERE id IN (${hotCourseIds.join(',')})`)
    console.log(`[5/8] 插入 courses：${coursesData.length} 条（标记 hot：${hotCourseIds.length} 条）`)

    // 6. 插入 course_categories（基于 tags 映射）
    let ccCount = 0
    for (const c of coursesData) {
      const tags = c.tags || []
      for (const tag of tags) {
        const categoryId = TAG_TO_CATEGORY_ID[tag]
        if (!categoryId) continue // 忽略无对应分类的 tag（如 '实战'）
        await pool.execute(
          `INSERT INTO course_categories (course_id, category_id) VALUES (?, ?)`,
          [c.id, categoryId]
        )
        ccCount++
      }
    }
    console.log(`[6/8] 插入 course_categories：${ccCount} 条`)

    // 7. 插入 lessons（统一 course_id=1，sort=index+1）
    for (let i = 0; i < lessonsData.length; i++) {
      const l = lessonsData[i]
      await pool.execute(
        `INSERT INTO lessons (course_id, title, duration, duration_seconds, video_url, sort)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [1, l.title, l.duration, parseDuration(l.duration), l.videoUrl, i + 1]
      )
    }
    console.log(`[7/8] 插入 lessons：${lessonsData.length} 条`)

    // 8. 插入 reviews（统一 course_id=1，user_id=mock 用户）
    for (const r of reviewsData) {
      await pool.execute(
        `INSERT INTO reviews (course_id, user_id, name, rating, content, date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [1, userId, r.name, r.rating, r.content, r.date]
      )
    }
    console.log(`[8/8] 插入 reviews：${reviewsData.length} 条`)

    // 输出各表总数
    const summaryTables = [
      'users',
      'instructors',
      'categories',
      'courses',
      'course_categories',
      'lessons',
      'reviews',
    ]
    console.log('\n========== Seed 完成！==========')
    console.log('各表总数：')
    for (const t of summaryTables) {
      const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM ${t}`)
      const cnt = (rows as { cnt: number }[])[0].cnt
      const pad = t.padEnd(20)
      console.log(`  ${pad}: ${cnt}`)
    }

    process.exit(0)
  } catch (err) {
    console.error('Seed 失败：', err)
    process.exit(1)
  }
}

seed()
