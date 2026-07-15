const BASE_URL_KEY = 'geo_wechat_ai_base_url'
const DEFAULT_PAGE_PATH = '/pages/course-list/index'
const DETAIL_PAGE_PATH = '/pages/course-detail/index'
const MAX_FETCH_SIZE = 1000
const MAX_RETURN_ITEMS = 10

function getBaseUrl() {
  const baseUrl = wx.getStorageSync(BASE_URL_KEY)
  if (!baseUrl) {
    throw new Error('未找到课程服务地址，请先启动小程序后再使用微信 AI 搜索')
  }
  return String(baseUrl).replace(/\/$/, '')
}

function requestAllCourses() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}/api/courses`,
      method: 'GET',
      data: { size: MAX_FETCH_SIZE },
      success(res) {
        const body = res.data || {}
        if ((body.code !== 0 && body.code !== 200) || !Array.isArray(body.data)) {
          reject(new Error(body.message || '课程搜索失败'))
          return
        }
        resolve(body.data)
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function scoreCourse(course, keyword) {
  if (!keyword) return 1

  const title = normalizeText(course.title)
  const instructor = normalizeText(course.instructor)
  const desc = normalizeText(course.desc)
  const tags = Array.isArray(course.tags) ? course.tags.map(normalizeText) : []

  if (title === keyword) return 100
  if (title.includes(keyword)) return 80
  if (instructor.includes(keyword)) return 60
  if (tags.some((tag) => tag.includes(keyword))) return 50
  if (desc.includes(keyword)) return 30
  return 0
}

function buildCourseItem(course) {
  return {
    id: Number(course.id),
    title: course.title || '',
    instructor: course.instructor || '',
    price: Number(course.price || 0),
    tags: Array.isArray(course.tags) ? course.tags : [],
  }
}

module.exports = async function searchCourses(args) {
  const keyword = String((args && args.keyword) || '').trim()
  const normalizedKeyword = normalizeText(keyword)

  try {
    const courses = await requestAllCourses()
    const scored = courses
      .map((course) => ({
        course,
        score: scoreCourse(course, normalizedKeyword),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.course.rating || 0) - Number(a.course.rating || 0))

    const matchedCourses = scored.map((item) => item.course)
    const resultItems = matchedCourses.slice(0, MAX_RETURN_ITEMS).map(buildCourseItem)

    if (matchedCourses.length === 1) {
      const course = matchedCourses[0]
      return {
        content: [
          {
            type: 'text',
            text: `已为你定位到课程「${course.title}」，请点击卡片查看课程详情。`,
          },
        ],
        structuredContent: {
          keyword,
          total: 1,
          items: [buildCourseItem(course)],
          destination: 'course-detail',
        },
        handoff() {
          return {
            path: DETAIL_PAGE_PATH,
            query: `id=${encodeURIComponent(String(course.id))}`,
            payload: {
              keyword,
              courseId: Number(course.id),
            },
          }
        },
      }
    }

    if (matchedCourses.length > 1) {
      return {
        content: [
          {
            type: 'text',
            text: keyword
              ? `已找到 ${matchedCourses.length} 门相关课程，请点击卡片查看搜索结果。`
              : `已整理出 ${matchedCourses.length} 门课程，请点击卡片继续浏览。`,
          },
        ],
        structuredContent: {
          keyword,
          total: matchedCourses.length,
          items: resultItems,
          destination: 'course-list',
        },
        handoff() {
          return {
            path: DEFAULT_PAGE_PATH,
            query: keyword ? `keyword=${encodeURIComponent(keyword)}` : '',
            payload: {
              keyword,
              total: matchedCourses.length,
              courseIds: matchedCourses.slice(0, MAX_RETURN_ITEMS).map((course) => Number(course.id)),
            },
          }
        },
      }
    }

    const fallbackCourses = courses.slice(0, MAX_RETURN_ITEMS).map(buildCourseItem)
    return {
      content: [
        {
          type: 'text',
          text: keyword
            ? `暂未找到和「${keyword}」直接匹配的课程，请点击卡片继续浏览全部课程。`
            : '请点击卡片查看全部课程。',
        },
      ],
      structuredContent: {
        keyword,
        total: 0,
        items: fallbackCourses,
        destination: 'course-list',
      },
      handoff() {
        return {
          path: DEFAULT_PAGE_PATH,
          query: keyword ? `keyword=${encodeURIComponent(keyword)}` : '',
          payload: {
            keyword,
            total: 0,
          },
        }
      },
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: error instanceof Error ? error.message : '课程搜索暂时不可用，请稍后重试。',
        },
      ],
    }
  }
}
