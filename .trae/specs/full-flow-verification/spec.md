# GEO 课程项目全流程验证 - Product Requirement Document

## Overview
- **Summary**: 对 GEO 课程 monorepo 项目进行全面的全流程验证，确保所有子包（shared、server、miniapp、admin）能够正常构建、运行和协作。
- **Purpose**: 验证项目整体健康状态，发现并修复构建错误、类型错误、运行时问题，确保项目可以正常交付和部署。
- **Target Users**: 开发人员、测试人员、项目管理人员

## Goals
- 验证 @geo/shared 共享类型包能够正常构建
- 验证 @geo/server 后端服务能够正常构建和启动
- 验证 @geo/miniapp 微信小程序能够正常构建
- 验证 @geo/admin 管理后台能够正常构建
- 验证各服务之间的接口契约一致性
- 验证数据库连接和基础 API 可用性

## Non-Goals (Out of Scope)
- 不进行功能层面的全面测试（仅验证构建和基础运行）
- 不进行性能测试和压力测试
- 不进行安全审计
- 不修改业务逻辑或新增功能
- 不涉及微信小程序真机测试（仅验证构建产物）

## Background & Context
- 项目为 pnpm monorepo 架构，包含 4 个子包
- 技术栈：Taro 4.x + React + TypeScript + Express + MySQL
- 项目使用本地静态数据和后端 API 双模式（通过 useLocal 开关控制）
- 之前的会话中涉及过多次功能迭代，需要验证整体稳定性

## Functional Requirements
- **FR-1**: shared 包 TypeScript 编译通过，生成正确的类型声明
- **FR-2**: server 后端 TypeScript 编译通过，服务能够正常启动
- **FR-3**: miniapp 小程序 Taro 构建成功，生成微信小程序产物
- **FR-4**: admin 后台 Vite 构建成功，生成静态产物
- **FR-5**: 后端基础 API 健康检查接口可用
- **FR-6**: 前后端类型定义保持一致（shared 包为单一来源）

## Non-Functional Requirements
- **NFR-1**: 所有包构建过程无 TypeScript 错误
- **NFR-2**: 构建过程无致命警告（warning 可接受，但需记录）
- **NFR-3**: 后端服务启动时间 < 5 秒
- **NFR-4**: 构建产物目录结构符合预期

## Constraints
- **Technical**: 
  - 必须使用 pnpm 作为包管理器
  - TypeScript 编译必须严格模式通过
  - 不得引入新的依赖
- **Business**: 
  - 验证过程不得破坏现有功能
  - 所有修复必须是最小化改动
- **Dependencies**: 
  - MySQL 数据库（可选，用于完整 API 验证）
  - Node.js 环境

## Assumptions
- pnpm 和 Node.js 已正确安装
- 项目依赖已通过 `pnpm install` 安装
- 数据库配置在 .env 文件中已正确设置（如需数据库验证）
- 微信小程序构建不需要微信开发者工具介入（仅验证 Taro 编译）

## Acceptance Criteria

### AC-1: shared 包构建成功
- **Given**: 项目依赖已安装
- **When**: 执行 `pnpm build:shared`
- **Then**: TypeScript 编译成功，dist 目录生成正确的 .js 和 .d.ts 文件
- **Verification**: `programmatic`

### AC-2: server 后端构建成功
- **Given**: shared 包已构建成功
- **When**: 执行 `pnpm build:server`
- **Then**: TypeScript 编译成功，dist 目录生成完整的服务端代码
- **Verification**: `programmatic`

### AC-3: server 后端服务启动成功
- **Given**: server 已构建完成，数据库配置正确
- **When**: 启动后端服务并访问健康检查接口
- **Then**: 服务正常启动，`/api/health` 接口返回 200 状态码
- **Verification**: `programmatic`

### AC-4: miniapp 小程序构建成功
- **Given**: shared 包已构建成功
- **When**: 执行 `pnpm build:miniapp`
- **Then**: Taro 构建成功，dist 目录生成微信小程序产物
- **Verification**: `programmatic`

### AC-5: admin 后台构建成功
- **Given**: shared 包已构建成功
- **When**: 执行 `pnpm build:admin`
- **Then**: Vite 构建成功，dist 目录生成静态网页产物
- **Verification**: `programmatic`

### AC-6: 类型定义一致性
- **Given**: 所有包构建成功
- **When**: 检查前后端使用的类型定义
- **Then**: 所有共享类型均来自 @geo/shared 包，无重复定义
- **Verification**: `human-judgment`

### AC-7: 核心 API 接口可用
- **Given**: 后端服务已启动
- **When**: 调用核心 API（课程列表、讲师列表、用户信息等）
- **Then**: 接口返回正确的状态码和数据结构
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要启动 MySQL 数据库进行完整的 API 验证？
- [ ] 是否需要验证小程序在微信开发者工具中的实际运行？
- [ ] 验证过程中发现的问题是否需要立即修复？
