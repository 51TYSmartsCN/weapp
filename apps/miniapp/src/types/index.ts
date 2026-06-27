/**
 * 类型出口 — 统一从 @geo/shared 共享包 re-export
 *
 * 历史原因：项目内大量文件通过 `import { ... } from '../../types'` 引用类型，
 * 这里保留作为 barrel 文件，避免批量改动 30+ 文件的导入路径。
 *
 * 新增类型请直接写入 packages/shared/src/index.ts。
 */
export * from '@geo/shared'
