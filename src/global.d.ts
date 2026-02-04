/**
 * 全局类型声明
 * 用于 webpack DefinePlugin 注入的构建配置
 */

interface BuildConfig {
  backend: string;
}

declare const BUILD_CONFIG: BuildConfig;
