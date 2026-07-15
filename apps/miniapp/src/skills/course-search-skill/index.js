const searchCourses = require('./apis/searchCourses.js')

const skill = wx.modelContext.createSkill('skills/course-search-skill')

skill.registerAPI('searchCourses', searchCourses)

console.log('[course-search-skill] API registered')
