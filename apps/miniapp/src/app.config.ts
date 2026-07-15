const enableWechatAi = process.env.TARO_APP_ENABLE_WECHAT_AI === 'true'

export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/course-list/index',
    'pages/learning/index',
    'pages/course-detail/index',
    'pages/lesson-player/index',
    'pages/instructor-list/index',
    'pages/instructor-detail/index',
    'pages/profile/index',
    'pages/edit-profile/index',
    'pages/favorites/index',
    'pages/follows/index',
    'pages/study-records/index',
    'pages/certificates/index',
    'pages/orders/index',
    'pages/order-center/index',
    'pages/coupons/index',
    'pages/invitations/index',
    'pages/help/index',
    'pages/feedback/index',
    'pages/contact-wx/index',
    'pages/settings/index',
    'pages/message-settings/index',
    'pages/about/index',
    'pages/agreement/index',
    'pages/privacy/index',
    'pages/video-unlock/index'
  ],
  ...(enableWechatAi
    ? {
        lazyCodeLoading: 'requiredComponents' as const,
        subPackages: [
          {
            root: 'skills',
            pages: [],
            independent: true,
          },
        ],
        agent: {
          skills: [
            {
              name: 'courseSearch',
              description: 'GEO 课程场景：搜索课程，并按搜索结果进入课程列表或课程详情页',
              path: 'skills/course-search-skill',
            },
          ],
          instruction: 'skills/AGENTS.md',
        },
      }
    : {}),
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#0D9488',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '首页', iconPath: 'assets/tab/home.png', selectedIconPath: 'assets/tab/home-active.png' },
      { pagePath: 'pages/course-list/index', text: '课程', iconPath: 'assets/tab/course.png', selectedIconPath: 'assets/tab/course-active.png' },
      { pagePath: 'pages/learning/index', text: '学习', iconPath: 'assets/tab/learning.png', selectedIconPath: 'assets/tab/learning-active.png' },
      { pagePath: 'pages/profile/index', text: '我的', iconPath: 'assets/tab/profile.png', selectedIconPath: 'assets/tab/profile-active.png' }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'GEO 课程',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom'
  },
})
