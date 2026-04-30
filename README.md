# UCloud CloudWatch Grafana 插件（客户版）

为 Grafana 提供 UCloud CloudWatch 监控数据查询能力。**datasource 数据源插件 + Go 后端进程**：前端负责配置 UI 与 Query 面板，Go 后端承担 PublicKey/PrivateKey 鉴权、签名生成、UCloud OpenAPI 转发，**私钥不会出现在浏览器请求中**。

PRD：需求单 #49376（cloudwatch 提供 grafana 插件获取监控数据）

---

## 一、功能概览

- **配置页**：PublicKey + PrivateKey（secureJsonFields 加密存储）+ Base URL（默认 `https://api.ucloud.cn`）
- **Save & Test**：错误分类 `Invalid Credentials` / `Permission Denied` / `Network Error` / `Data source is working`
- **Query 面板**：项目、产品类型（可搜索）、地域、指标（可搜索）、资源对象（多选 ≤20）、数据维度（KV）、聚合方式（API 动态获取）
- **自动查询**：必填字段填满后自动触发查询，无需点按钮
- **模板变量**：JSON 形式定义，支持 `$project` / `$region` / `$resource` 联动；变量定义里可引用其他变量实现联动
- **部分失败**：成功资源正常出图，失败资源以面板右上角黄色警告提示

---

## 二、技术栈与项目结构

- **前端**：TypeScript + React + Grafana SDK（`@grafana/data` `@grafana/runtime` `@grafana/ui`）
- **后端**：Go + grafana-plugin-sdk-go + ucloud-sdk-go（**泛化调用** `GenericInvoke`，由 SDK 处理签名）
- **构建**：webpack（前端）+ mage（后端）

```
src/                                前端
├── components/
│   ├── ConfigEditor.tsx            数据源配置（PublicKey/PrivateKey）
│   ├── QueryEditor.tsx             Query 面板
│   ├── TagsKVEditor.tsx            数据维度 KV 编辑器
│   └── VariableQueryEditor.tsx     模板变量编辑器（JSON 文本输入）
├── config/enums.ts                 常量（资源多选上限）
├── datasource.ts                   DataSourceWithBackend + metricFindQuery
├── module.ts                       插件入口
├── types.ts                        Query/Options/VariableQuery 类型
└── plugin.json                     "backend": true、executable

pkg/                                Go 后端
├── main.go                         入口
└── plugin/
    ├── client.go                   基于 ucloud-sdk-go 的泛化调用封装 + 日志
    ├── datasource.go               NewDatasource、CheckHealth、错误分类
    ├── models.go                   配置 / Query 结构体
    ├── query.go                    QueryData（QueryMetricDataSet）+ 部分失败 Notices
    └── resource.go                 CallResource：projects / products / regions / metrics / resources / aggregations

provisioning/datasources/           开发环境数据源自动注入
.config/                            webpack 与 docker-compose 基础配置
config/                             无（已删除，曾用于 BUILD_ENV 注入，后端接管后废弃）
```

---

## 三、调用的 UCloud API 一览

| 用途 | Action | 必填参数 | 备注 |
|---|---|---|---|
| 项目列表 | `GetProjectList` | 无 | 顶层 `ProjectSet` |
| 产品类型 | `ListMonitorProduct` | 无 | `Data` 直接是数组；label `中文_英文` |
| 地域 | `ListRegions` | 无 | label `地域名-code` |
| 指标 | `GetProductMetrics` | `ProductKey` | label `中文_英文` |
| 资源 | `ListResource` | `Limit/Offset` 必填，可选 `Region/ProjectId/ProductKey` | label `资源名(资源ID)` |
| 聚合方式 | `GetMetricDataAggregationMethod` | 无 | 含 `IsDefault` 标识默认值 |
| 查询数据 | `QueryMetricDataSet` | `Region/ProjectId/ProductKey/StartTime/EndTime/CalcMethod/Period/MetricInfos[]` | Period 由后端按时间范围自动选 |

---

## 四、本地开发

### 4.1 依赖
- Node.js ≥ 18（项目 `.nvmrc` 已固定版本）
- Go ≥ 1.22
- [mage](https://magefile.org/)：`brew install mage`
- Docker & Docker Compose

### 4.2 安装 + 启动开发服务

```bash
npm install      # 装前端依赖
go mod download  # 装后端依赖（首次）

# 终端 1：前端 watch + 后端首次构建
npm run dev

# 终端 2：起 Grafana 容器（挂载 dist/ 为插件目录）
npm run server
```

打开 `http://localhost:3000`（默认账号 admin / admin）。前端代码改动 webpack 自动重建；**Go 代码改动需要手动重建后端**：

```bash
mage -v build:linuxARM64  # 容器是 Linux ARM64（按本机架构选）
docker compose restart    # 让 Grafana 重新加载后端二进制
```

> 容器架构看 `docker exec ucloud-datasource-grafana uname -m`：
> - `aarch64` → `mage -v build:linuxARM64`
> - `x86_64`  → `mage -v build:linux`

### 4.3 常用脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | 前端 watch + 后端首次构建（仅当前架构） |
| `npm run build` | 前端 production 构建 |
| `npm run build:backend` | 后端单平台构建（默认 linux arm64） |
| `npm run build:backend:all` | 后端全平台构建（mage buildAll） |
| `npm run build:all` | 前端 + 后端单平台 |
| `npm run release` | **一键发布**：清理 + 前端构建 + 全平台后端 + 打 zip |
| `npm run server` | docker compose up（前台） |
| `npm run server:dev` | docker compose up（不重新 build 镜像） |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run lint` / `lint:fix` | ESLint 检查 / 自动修复 |
| `npm run test:ci` | jest 跑测试 |

### 4.4 开发期 Grafana 登录

容器默认匿名访问已开启，可直接进 Dashboard。如需登录：用户名密码均为 `admin`，首次登录会要求改密码。

数据源会通过 [provisioning/datasources/datasources.yml](provisioning/datasources/datasources.yml) 自动创建一个空配置实例，登录后填上 PublicKey/PrivateKey 即可。

### 4.5 调试：查看后端日志

```bash
# 跟随实时日志
docker logs -f ucloud-datasource-grafana 2>&1 | grep -E "UCloud API|ucloud-cloudwatch"

# 历史日志（每次 API 请求/响应都有详细记录）
docker logs --tail 200 ucloud-datasource-grafana 2>&1 | grep "UCloud API"
```

`docker-compose-base.yaml` 已设：
```
GF_LOG_FILTERS=plugin.ucloud-cloudwatch-monitor:debug
GF_LOG_LEVEL=debug
```

---

## 五、构建打包

### 5.1 一键构建发布包

```bash
npm run release
```

执行内容：
1. 清理 `dist/` 与 webpack 缓存
2. 前端 production 构建
3. 后端 7 平台构建（darwin/linux/windows × amd64/arm64/arm）
4. 打包成 `ucloud-cloudwatch-monitor-<version>.zip`（自动读取 `package.json` 的 version）

产物：`ucloud-cloudwatch-monitor-1.0.0.zip`（约 50 MB）

### 5.2 单平台构建

按目标部署环境裁剪：
```bash
# 仅 Linux x86_64
npm run build && mage -v build:linux
zip -r ucloud-cloudwatch-monitor-linux-amd64.zip dist/
```

### 5.3 版本号升级

发布新版本：
1. 修改 [package.json](package.json) 的 `version` 字段（如 1.0.0 → 1.1.0）
2. 在 [CHANGELOG.md](CHANGELOG.md) 记录变更
3. `npm run release` 会自动用新版本号命名 zip

---

## 六、客户侧安装

### 6.1 解压到 Grafana 插件目录

```bash
unzip ucloud-cloudwatch-monitor-1.0.0.zip -d /var/lib/grafana/plugins/ucloud-cloudwatch-monitor
chmod +x /var/lib/grafana/plugins/ucloud-cloudwatch-monitor/gpx_ucloud_cloudwatch_*
```

### 6.2 允许加载未签名插件

编辑 `/etc/grafana/grafana.ini`（或 `defaults.ini`）：

```ini
[paths]
plugins = /var/lib/grafana/plugins

[plugins]
allow_loading_unsigned_plugins = ucloud-cloudwatch-monitor
```

### 6.3 重启 Grafana

```bash
systemctl restart grafana-server
# 或 docker：docker restart grafana
```

### 6.4 验证插件加载

```bash
journalctl -u grafana-server -f | grep ucloud
# 应出现：Plugin registered  &  Successfully started backend plugin process
```

---

## 七、配置数据源（Grafana UI）

1. **Connections → Add new connection**，搜 `UCloud-CloudWatch-Monitor`
2. 点 **Add new data source**
3. 填写：
   - **PublicKey**：UCloud API 公钥（[控制台 → UAPI 密钥管理](https://console.ucloud.cn/uapi/apikey)）
   - **PrivateKey**：UCloud API 私钥（加密存储于服务端）
   - **Base URL**：默认 `https://api.ucloud.cn`，专有云可覆盖
4. 点 **Save & Test**

| 反馈 | 含义 |
|---|---|
| ✅ `Data source is working` | 配置成功 |
| ❌ `Invalid Credentials: ...` | PublicKey / PrivateKey 错误 |
| ❌ `Permission Denied: ...` | 密钥有效但账号无权限 |
| ❌ `Network Error: ...` | 网络不通 |

---

## 八、使用 Query 面板

| 字段 | 必填 | 说明 |
|---|---|---|
| 项目 | ✅ | 单选；支持 `$project` 模板变量 |
| 产品类型 | ✅ | 单选，可搜索 |
| 地域 | ✅ | 单选；支持 `$region` 模板变量 |
| 指标 | ✅ | 单选，可搜索；按产品过滤 |
| 资源对象 | ✅ | 多选，最多 20 个；支持 `$resource` 模板变量 |
| 数据维度 | 否 | KV 列表（key + 多 value 逗号分隔） |
| 聚合方式 | 否 | 从 `GetMetricDataAggregationMethod` 动态获取，自动选 `IsDefault` 项 |

**自动查询**：所有必填字段填好后立即出图，切换聚合方式 / 数据维度 / 时间范围都会自动重新查询。

---

## 九、模板变量（高级用法）

Dashboard → Settings → Variables → New variable，类型选 **Query**，数据源选本插件。Query 配置框里**手写 JSON**（参考火山云）：

### 9.1 项目变量

```json
{"type": "project"}
```

### 9.2 地域变量

```json
{"type": "region"}
```

### 9.3 资源变量（依赖其他变量实现联动）

```json
{
  "type": "resource",
  "params": {
    "product": "uhost",
    "region": "${region}",
    "project": "${project}"
  }
}
```

切换顶部 `$region` → 资源候选自动刷新（变量定义中的 `${region}` 会被实时替换）。

### 9.4 在 Query 面板使用

```
项目：$project
产品：uhost
地域：$region
资源：$resource    （Multi-value 多选时，自动展开为多个资源 ID）
```

---

## 十、异常与数据反馈

| 场景 | 后端行为 | 前端表现 |
|---|---|---|
| 完全失败 | `DataResponse.Error` | 面板红框 + 错误文案，不展示旧数据 |
| 部分失败 | 成功 DataFrame + `Frame.Meta.Notices`（warning） | 图表正常出曲线 + 面板右上角黄色图标，hover 显示 `3/5 资源成功，2 个资源不存在或无权限` |
| 无数据 | 返回空 DataFrame | Grafana 自动显示 "No Data" |

部分失败优先使用 UCloud API 返回的 `Data.InvalidResourceIds` 字段判定，缺失时则按 `请求列表 - 成功列表` 计算差集。

---

## 十一、故障排查

### 11.1 Plugin unavailable

最常见原因：

1. **后端二进制架构与容器/服务器不匹配**
   - 检查：`docker exec <container> uname -m`
   - 重新构建对应平台：`mage -v build:linuxARM64` / `build:linux`

2. **plugin.json 没切到 backend: true**
   - 通常由 webpack 缓存的旧 plugin.json 引起
   - 清理：`rm -rf dist node_modules/.cache && npm run build`

3. **未签名插件未在 grafana.ini 配置允许**
   - 加上 `allow_loading_unsigned_plugins = ucloud-cloudwatch-monitor`

### 11.2 下拉无数据

查后端日志找对应 API 的实际返回字段：

```bash
docker logs --tail 200 ucloud-datasource-grafana 2>&1 | grep -E "UCloud API|解析结果"
```

字段名不一致（如 `RegionCode` vs `Region`），调整 [pkg/plugin/resource.go](pkg/plugin/resource.go) 对应 list 解析逻辑。

### 11.3 查询报错 RetCode != 0

错误码与文案在响应里。常见：
- `170 Signature/PublicKey/PrivateKey`：密钥错误
- `230 Permission/Forbidden/Denied`：权限不足
- `219227`：业务错误（资源不存在、字段不合法等），看 Message 详情

### 11.4 模板变量带 `$xxx` 没被替换

- Query 面板：`applyTemplateVariables` 会自动替换
- 下拉接口（CallResource）：[QueryEditor.tsx](src/components/QueryEditor.tsx) 中调用 `getResource` 前用 `getTemplateSrv().replace()` 手动替换
- 模板变量定义里依赖其他变量：[datasource.ts](src/datasource.ts) 中 `metricFindQuery` 已对 `params.product/region/project` 调 `srv.replace`

---

## 十二、常见问题（FAQ）

**Q：为什么不在前端直连 UCloud API？**
A：UCloud OpenAPI 需要 PublicKey + PrivateKey 在请求中签名。前端直连会让私钥进入浏览器；Go 后端进程持有解密后的私钥，前端只通过 Grafana 内部代理与后端通信。

**Q：为什么聚合方式从 API 动态拉取？**
A：保持前后端口径一致：后端 `GetMetricDataAggregationMethod` 维护可选枚举与默认值（`IsDefault`）。

**Q：资源最多只能选 20 个？**
A：PRD 要求。前端 [QueryEditor.tsx](src/components/QueryEditor.tsx) 在 `MAX_RESOURCE_SELECTIONS` 拦截。

**Q：Period（数据周期）怎么决定？**
A：PRD 要求"后端根据时间范围自动返回"。[pkg/plugin/query.go](pkg/plugin/query.go) 的 `pickPeriod`：
- ≤ 1h → 60s
- 1-24h → 300s
- 1-30 天 → 3600s
- > 30 天 → 86400s

**Q：怎么 debug 一个 API 的请求/响应？**
A：[pkg/plugin/client.go](pkg/plugin/client.go) 的 `Invoke` 已对所有调用打日志（请求 payload + 响应 body）。开 `GF_LOG_LEVEL=debug` 即可看到。

---

## 十三、参考资料

- [Grafana 数据源插件开发文档](https://grafana.com/developers/plugin-tools/)
- [grafana-plugin-sdk-go](https://github.com/grafana/grafana-plugin-sdk-go)
- [UCloud OpenAPI Go SDK](https://docs.ucloud.cn/opensdk-go/quickstart)
- [UCloud OpenAPI 公共参数与签名](https://docs.ucloud.cn/api/summary/public)
- [CloudWatch API 列表](https://docs.ucloud.cn/api/cloudwatch-api)
- [QueryMetricDataSet 文档](https://docs.ucloud.cn/api/cloudwatch-api/query_metric_data_set)
