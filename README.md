# UCloud CloudWatch 数据源插件（客户版）

为 Grafana 提供 UCloud CloudWatch 监控数据查询能力。本插件是 **datasource 数据源插件 + 启用 Go 后端**：前端负责面板/配置 UI，后端负责使用 PublicKey/PrivateKey 签名调用 UCloud OpenAPI。私钥通过 Grafana `secureJsonFields` 加密存储，**不会出现在浏览器请求中**。

PRD：需求单 #49376（cloudwatch 提供 grafana 插件获取监控数据）

---

## 功能概览

- 配置页：PublicKey + PrivateKey + Base URL（默认 `https://api.ucloud.cn`）
- Save & Test 错误分类：`Invalid Credentials` / `Permission Denied` / `Network Error`
- Query 面板字段：项目、产品类型（可搜索）、地域、指标（可搜索）、资源对象（多选 ≤20）、数据维度（KV / 高级 JSON）、聚合方式（动态从 API 拉取，按 `IsDefault` 设默认）
- 模板变量：支持 `$project` / `$region` / `$resource` 三种 Query 类型变量
- 部分失败：成功资源正常出图，失败资源以面板右上角黄色警告提示

---

## 开发与构建

### 依赖

- Node.js ≥ 18
- Go ≥ 1.22
- [mage](https://magefile.org/) (`brew install mage`)

### 本地构建

```bash
# 安装前端依赖
npm install

# 构建前端
npm run build

# 构建后端（当前平台）
mage -v build:darwinARM64   # M 系列 Mac
mage -v build:linux         # Linux x86_64
mage -v build:linuxARM64    # Linux ARM64

# 一键构建全部平台
mage -v buildAll

# 前端 + 当前平台后端
npm run build:all
```

构建产物输出到 `dist/`：

- `module.js` / `plugin.json` / `README.md` 等前端资源
- `gpx_ucloud_cloudwatch_<os>_<arch>` 后端可执行文件

---

## 安装到 Grafana

### 1. 拷贝插件

将 `dist/` 目录改名为 `ucloud-cloudwatch-datasource` 拷贝到 Grafana 插件目录：

```bash
cp -r dist /path/to/grafana/data/plugins/ucloud-cloudwatch-datasource
```

### 2. 允许加载未签名插件

编辑 `defaults.ini`（或 `custom.ini`）：

```ini
[paths]
plugins = data/plugins

[plugins]
allow_loading_unsigned_plugins = ucloud-cloudwatch-datasource
```

### 3. 重启 Grafana

```bash
systemctl restart grafana
```

### 4. 配置数据源

1. 在 Grafana 「Connections → Add new connection」中搜索 **UCloud-CloudWatch-Monitor**
2. 填写：
   - **PublicKey**：UCloud API 公钥（控制台 → UAPI 密钥管理）
   - **PrivateKey**：UCloud API 私钥（加密存储）
   - **Base URL**：默认 `https://api.ucloud.cn`，专有云可覆盖
3. 点击 **Save & Test**：
   - ✅ 成功：`Data source is working`
   - ❌ `Invalid Credentials`：PublicKey/PrivateKey 错误
   - ❌ `Permission Denied`：账号无权限
   - ❌ `Network Error`：网络不通

---

## 使用 Query 面板

| 字段 | 说明 |
| --- | --- |
| 项目 | 单选；支持 `$project` 模板变量 |
| 产品类型 | 单选，必填，支持搜索 |
| 地域 | 单选；全局产品忽略；支持 `$region` 模板变量；展示 `地域名称-code` |
| 指标 | 单选，必填，支持搜索；按产品过滤 |
| 资源对象 | 多选，最多 **20** 个；支持 `$resource` 模板变量；展示 `资源名(ID)` |
| 数据维度 | 默认 KV 列表（key + 多个 value）；可切换"高级模式"粘贴 JSON |
| 聚合方式 | 从 `GetMetricDataAggregationMethod` 动态拉取；自动选中 `IsDefault` |

### 模板变量

Dashboard → Settings → Variables → New variable，类型选 **Query**：
- 数据源选本插件
- 查询类型选择 `project` / `region` / `resource`
- 选择 `region` / `resource` 时还需选产品类型

---

## 项目结构

```
src/                      前端
├── components/
│   ├── ConfigEditor.tsx       PublicKey/PrivateKey 配置
│   ├── QueryEditor.tsx        查询面板
│   ├── TagsKVEditor.tsx       数据维度 KV 编辑器
│   └── VariableQueryEditor.tsx 模板变量编辑器
├── datasource.ts              DataSourceWithBackend，metricFindQuery
├── module.ts                  插件注册
├── types.ts                   Query/Options 类型
└── plugin.json                backend: true

pkg/                      Go 后端
├── main.go                    入口
└── plugin/
    ├── client.go              基于 ucloud-sdk-go 的泛化调用
    ├── datasource.go          NewDatasource / CheckHealth
    ├── models.go              配置 & Query 结构
    ├── query.go               QueryData + 部分失败 Notices
    └── resource.go            CallResource (projects/regions/...)
```

---

## 常见问题

**Q：为什么不在前端直连 UCloud API？**
A：UCloud OpenAPI 需要 PublicKey + PrivateKey 在请求中签名。前端直连会让私钥进入浏览器；Go 后端进程持有解密后的私钥，前端只通过 Grafana 内部代理与后端通信。

**Q：为什么聚合方式是动态拉取的？**
A：CloudWatch 的聚合方式由后端 `GetMetricDataAggregationMethod` 维护并标记默认值（`IsDefault`），保持前端与服务端口径一致。

**Q：部分资源没数据是为什么？**
A：插件通过 `Frame.Meta.Notices` 在面板右上角显示黄色警告，hover 可看 "X/Y 资源成功，N 个资源不存在或无权限"。
