/**
 * 构建配置
 * 从 config/{BUILD_ENV}.json 读取配置
 *
 * 配置文件:
 * - config/test.json: 测试环境配置 (backend: CloudEagle)
 * - config/prod.json: 线上环境配置 (backend: YunYing)
 *
 * 使用方式:
 * - 测试环境构建: npm run build (默认使用 config/test.json)
 * - 线上环境构建: BUILD_ENV=prod npm run build (使用 config/prod.json)
 */

// 使用 webpack DefinePlugin 注入的构建配置
// DefinePlugin 会将 BUILD_CONFIG 替换为实际的配置对象
declare const BUILD_CONFIG: { backend: string };

export const BACKEND = BUILD_CONFIG.backend;
