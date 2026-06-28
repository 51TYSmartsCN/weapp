import type { Lesson } from '../types'

export const lessons: Lesson[] = [
  {
    id: 1,
    title: '01 - 什么是 GEO？为什么现在必须学',
    duration: '15min',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    content: 'GEO（Generative Engine Optimization，生成式引擎优化）是面向 AI 搜索引擎的内容优化方法论。\n\n本节将带你了解：\n1. GEO 的定义与核心目标\n2. 为什么 GEO 在 2026 年成为必备技能\n3. GEO 与传统 SEO 的关键差异\n4. 学习 GEO 的前置知识\n\n通过本节学习，你将对 GEO 形成整体认知，为后续章节打下基础。',
  },
  {
    id: 2,
    title: '02 - AI 搜索引擎的工作原理',
    duration: '22min',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    content: 'AI 搜索引擎（如 Perplexity、ChatGPT Search、文心一言等）的工作流程与传统搜索引擎截然不同。\n\n核心流程：\n- 意图理解：将用户查询转化为语义向量\n- 检索召回：从知识库召回相关内容片段\n- 生成回答：由 LLM 基于召回内容生成自然语言回答\n- 引用标注：标注答案来源\n\n理解这个流程，才能针对性地优化内容结构。',
  },
  {
    id: 3,
    title: '03 - 内容结构化与语义标记',
    duration: '30min',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    content: 'AI 引擎更偏好结构化、语义清晰的内容。\n\n本节要点：\n- 使用 Schema.org 结构化数据标记\n- 合理使用 H1-H6 层级\n- FAQ 结构化常见问题\n- 表格化对比数据\n- 段落首句概括要点',
  },
  {
    id: 4,
    title: '04 - 关键词策略在 AI 时代的变化',
    duration: '25min',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    content: 'AI 搜索时代，关键词策略从「密度堆砌」转向「语义覆盖」。\n\n关键变化：\n1. 长尾问题优于短尾关键词\n2. 同义词与上下文语义扩展\n3. 问题式表达（如何、为什么、什么是）更易被召回\n4. 实体关系构建',
  },
  {
    id: 5,
    title: '05 - GEO 实战案例分析',
    duration: '28min',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    content: '通过 3 个真实案例拆解 GEO 优化全过程。\n\n案例一：教育类网站如何提升 AI 搜索曝光\n案例二：电商产品页的语义化改造\n案例三：企业官网的内容矩阵搭建\n\n每个案例包含问题诊断、优化方案、效果数据三部分。',
  },
  {
    id: 6,
    title: '06 - 效果监测与持续优化',
    duration: '20min',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    content: 'GEO 不是一次性工作，需要持续监测与迭代。\n\n监测指标：\n- AI 搜索引擎的引用频次\n- 品牌词召回率\n- 答案中的引用位置\n- 竞品对比\n\n工具推荐与监测周期建议。',
  },
]
