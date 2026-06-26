---
name: geo-course-design
description: Use this skill to generate well-branded interfaces for GEO Course. Contains colors, type, fonts, assets, and UI kit for prototyping education-mobile-app UIs.
user-invocable: true
---
# GEO Course Design Skill

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts, copy assets out and create static HTML files. If working on production code, read the rules here to become an expert in designing with this brand.

## Quick map

- `README.md` — brand context, content fundamentals, visual foundations (read first)
- `colors_and_type.css` — drop-in CSS variables for colors, type, radius, shadow, spacing
- `css.json` — structured token understanding source
- `components.css` — aggregated component-level CSS
- `components/index.json` — component index + cross-component patterns
- `preview/` — small HTML cards illustrating foundations and components
  - `preview/component-search-bar.html`
  - `preview/component-course-card-grid.html`
  - `preview/component-course-card-list.html`
  - `preview/component-instructor-card.html`
  - `preview/component-tag-pill.html`
  - `preview/component-tab-bar.html`
- `library-consumption.json` — recommended downstream read order

## Essentials at a glance

- Brand primary #0D9488 — cool teal, educational and trustworthy. Status accents: success green #10B981, warning amber #F59E0B, error red #EF4444.
- Radius 4/8/12/16/9999px — progressive softness from compact controls to full pills on TagPill chips.
- Spacing 4px base unit, range 4-40px. Component controls default to compact mobile touch targets.
- Type: PingFang SC (CN primary); system fallback stack with Hiragino Sans GB, Microsoft YaHei, Helvetica Neue. No web font imports.
- Voice: CN-first bilingual, concise, action-oriented — short UI labels, no emoji in interface copy.
- Shadows whisper-quiet: 3 levels from 1px/0.04 alpha to 4px/0.05 alpha — barely perceptible elevation.
- Taro WeChat mini-program native: rpx units in production, all Taro components (View/Text/Image), no HTML tags.

## Components

| Slug | Name | Key Insight |
|------|------|-------------|
| search-bar | SearchBar | Rounded input with placeholder, primary border on focus — main discovery entry point |
| course-card-grid | CourseCardGrid | Thumbnail + meta grid card, category tag, rating — primary course browse pattern |
| course-card-list | CourseCardList | Horizontal layout variant for list views, instructor avatar, lesson count |
| instructor-card | InstructorCard | Avatar + stats + follow action — compact social proof pattern |
| tag-pill | TagPill | Teal-filled or outlined pill for categories and filters — radius-full chips |
| tab-bar | TabBar | Fixed bottom navigation with 5 slots, 50px height, PNG-only icons |
