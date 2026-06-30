# GEO 课程项目全流程验证 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 验证 @geo/shared 共享包构建
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 执行 `pnpm build:shared` 构建共享类型包
  - 验证 TypeScript 编译无错误
  - 检查 dist 目录产物是否正确生成
- **Acceptance Criteria Addressed**: AC-1, AC-6
- **Test Requirements**:
  - `programmatic` TR-1.1: `pnpm build:shared` 命令退出码为 0
  - `programmatic` TR-1.2: dist/index.js 和 dist/index.d.ts 文件存在
  - `human-judgement` TR-1.3: 类型定义文件内容完整，包含所有共享接口
- **Notes**: shared 包是其他所有包的依赖，必须最先验证

## [ ] Task 2: 验证 @geo/server 后端构建
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 执行 `pnpm build:server` 构建后端服务
  - 验证 TypeScript 编译无错误
  - 检查 dist 目录结构是否完整
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: `pnpm build:server` 命令退出码为 0
  - `programmatic` TR-2.2: dist/index.js 文件存在且可执行
  - `programmatic` TR-2.3: dist/routes/ 目录包含所有路由文件
- **Notes**: 注意检查是否有类型错误，特别是 Buffer、Uint8Array 等之前出现过问题的地方

## [ ] Task 3: 验证后端服务启动与健康检查
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 启动后端服务（开发模式或构建产物）
  - 验证健康检查接口 /api/health 可用
  - 测试核心 API 接口响应
- **Acceptance Criteria Addressed**: AC-3, AC-7
- **Test Requirements**:
  - `programmatic` TR-3.1: 后端服务启动成功，监听指定端口（4000）
  - `programmatic` TR-3.2: GET /api/health 返回 200 状态码
  - `programmatic` TR-3.3: 核心 API（课程、讲师等）返回正确结构
  - `human-judgement` TR-3.4: 服务启动日志无异常错误
- **Notes**: 如果数据库未启动，可能会有部分接口失败；优先验证无需数据库的接口

## [ ] Task 4: 验证 @geo/miniapp 小程序构建
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 执行 `pnpm build:miniapp` 构建微信小程序
  - 验证 Taro 构建过程无错误
  - 检查 dist 目录产物结构
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: `pnpm build:miniapp` 命令退出码为 0
  - `programmatic` TR-4.2: dist 目录生成微信小程序产物（app.js、app.json 等）
  - `programmatic` TR-4.3: 所有页面均成功编译，无遗漏
  - `human-judgement` TR-4.4: 构建过程无致命 warning
- **Notes**: 小程序构建可能耗时较长，注意观察构建进度

## [ ] Task 5: 验证 @geo/admin 后台构建
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 执行 `pnpm build:admin` 构建管理后台
  - 验证 TypeScript 编译和 Vite 打包无错误
  - 检查 dist 目录静态产物
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-5.1: `pnpm build:admin` 命令退出码为 0
  - `programmatic` TR-5.2: dist/index.html 和静态资源文件存在
  - `programmatic` TR-5.3: TypeScript 类型检查通过（tsc -b）
  - `human-judgement` TR-5.4: 构建产物大小合理
- **Notes**: Admin 使用 React 19 和 Ant Design 6，注意类型兼容性

## [ ] Task 6: 类型一致性与架构验证
- **Priority**: medium
- **Depends On**: Task 1, Task 2, Task 4, Task 5
- **Description**: 
  - 验证前后端类型定义的一致性
  - 检查 shared 包是否作为单一类型来源
  - 验证整体架构符合约束文档
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `human-judgement` TR-6.1: 前后端核心类型均来自 @geo/shared
  - `human-judgement` TR-6.2: 无重复定义的类型接口
  - `human-judgement` TR-6.3: 服务层架构符合 AGENTS.md 规范
- **Notes**: 此项为人工审核，需要检查关键文件的 import 语句

## [ ] Task 7: 问题修复与二次验证
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3, Task 4, Task 5
- **Description**: 
  - 收集前面步骤中发现的所有问题
  - 逐一修复构建错误、类型错误
  - 重新构建验证修复效果
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-7.1: 所有构建错误均已修复
  - `programmatic` TR-7.2: 修复后重新构建全部通过
  - `human-judgement` TR-7.3: 修复方案合理，未引入新问题
- **Notes**: 修复应遵循最小改动原则，不修改业务逻辑
