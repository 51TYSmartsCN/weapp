import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import webpack from 'webpack'
import devConfig from './dev'
import prodConfig from './prod'

/**
 * 修复 webpackbar 5.x 与 webpack 5.108+ 的 schema 冲突。
 *
 * Taro 4.2.0 注入的 webpackbar 插件 `extends webpack.ProgressPlugin`，
 * 并把 `{name,color,reporters,fancy,basic}` 这些 webpackbar 自有字段
 * 覆盖到 ProgressPlugin 实例的 `this.options`，导致 webpack 5.108 在
 * apply 阶段的 schema 校验（`additionalProperties: false`）直接抛错。
 *
 * 这里直接用 webpack 内置的 ProgressPlugin 替换它，schema 合法，
 * 进度条照常显示；Taro 原有的 warnings/errors 高亮回调由 stats 输出兜底。
 */
function replaceWebpackBar(chain: any) {
  if (chain.plugins.has('webpackbar')) {
    chain.plugin('webpackbar').use(webpack.ProgressPlugin, [{
      entries: true,
      modules: true,
      dependencies: true,
      modulesCount: 5000,
      dependenciesCount: 10000
    }])
  }
}

export default defineConfig<'webpack5'>(async (merge) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'geo-course',
    date: '2026-6-26',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {}
    },
    framework: 'react',
    compiler: {
      type: 'webpack5',
      prebundle: { enable: false }
    },
    cache: {
      enable: false
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
      webpackChain(chain) {
        chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin)
        if (chain.plugins.has('miniCssExtractPlugin')) {
          chain.plugin('miniCssExtractPlugin').tap((args) => [
            { ...args[0], ignoreOrder: true }
          ])
        }
        replaceWebpackBar(chain)
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: {
        filename: 'js/[name].[hash:8].js',
        chunkFilename: 'js/[name].[chunkhash:8].js'
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
      webpackChain(chain) {
        chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin)
        if (chain.plugins.has('miniCssExtractPlugin')) {
          chain.plugin('miniCssExtractPlugin').tap((args) => [
            { ...args[0], ignoreOrder: true }
          ])
        }
        replaceWebpackBar(chain)
      }
    },
    rn: {
      appName: 'taroDemo',
      postcss: {
        cssModules: {
          enable: false
        }
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})
