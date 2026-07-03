# UCloud CloudWatch Grafana 数据源插件 — 用户使用文档

> 版本：1.0.1 | 适用 Grafana ≥ 10.4.0

---

## 一、安装说明

### 1.1 环境要求

| 项目 | 要求 |
|------|------|
| Grafana 版本 | ≥ 10.4.0（推荐 11.x / 12.x） |
| 操作系统 | Linux（amd64 / arm64）、macOS（amd64 / arm64）、Windows（amd64） |
| 网络 | Grafana 服务器可访问 UCloud OpenAPI（默认 `https://api.ucloud.cn`） |
| API 密钥 | 已在 [UCloud 控制台 → UAPI 密钥管理](https://console.ucloud.cn/uapi/apikey) 获取 PublicKey 和 PrivateKey |

### 1.2 安装步骤

#### 步骤一：解压插件到 Grafana 插件目录

```bash
unzip ucloud-cloudwatch-monitor-1.0.0.zip -d /var/lib/grafana/plugins/ucloud-cloudwatch-monitor
```

> **插件目录说明：**
> - 二进制安装：默认为 `/var/lib/grafana/plugins`
> - Docker 部署：容器内 `/var/lib/grafana/plugins`（需通过 volume 挂载）
> - 自定义路径：查看 `grafana.ini` 中 `[paths] plugins=` 配置

#### 步骤二：赋予后端二进制可执行权限

```bash
chmod +x /var/lib/grafana/plugins/ucloud-cloudwatch-monitor/gpx_ucloud_cloudwatch_*
```

#### 步骤三：允许加载未签名插件

编辑 Grafana 配置文件（`/etc/grafana/grafana.ini`）：

```ini
[plugins]
allow_loading_unsigned_plugins = ucloud-cloudwatch-monitor
```

**Docker 部署**可通过环境变量设置：

```bash
GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=ucloud-cloudwatch-monitor
```

#### 步骤四：重启 Grafana

```bash
# systemd 方式
systemctl restart grafana-server

# Docker 方式
docker restart <grafana-container>
```

#### 步骤五：验证插件加载成功

```bash
# systemd 方式
journalctl -u grafana-server -f | grep ucloud

# Docker 方式
docker logs <grafana-container> 2>&1 | grep ucloud
```

看到 `Plugin registered` 与 `Successfully started backend plugin process` 即表示安装成功。

### 1.3 版本升级

```bash
systemctl stop grafana-server

rm -rf /var/lib/grafana/plugins/ucloud-cloudwatch-monitor
unzip ucloud-cloudwatch-monitor-<新版本>.zip -d /var/lib/grafana/plugins/ucloud-cloudwatch-monitor
chmod +x /var/lib/grafana/plugins/ucloud-cloudwatch-monitor/gpx_ucloud_cloudwatch_*

systemctl start grafana-server
```

> - 升级**不影响已有 Dashboard**，数据源配置、Panel 查询、模板变量全部保留。
> - 升级后请在浏览器**强制刷新**（`Ctrl + Shift + F5` / `Cmd + Shift + R`）以加载新版前端资源。

---

## 二、使用说明

### 2.1 配置数据源

1. 进入 Grafana 左侧菜单 → **Connections** → **Add new connection**
2. 搜索 `UCloud-CloudWatch-Monitor`，点击 **Add new data source**
3. 填写以下配置：

| 字段 | 说明 |
|------|------|
| **PublicKey** | UCloud API 公钥 |
| **PrivateKey** | UCloud API 私钥（加密存储于服务端，不会出现在浏览器请求中） |
| **channel-key** | 专属云渠道 ID，普通账号留空；专属云客户请填写对应渠道 ID，插件会在每次 API 请求中附加该值 |
| **Base URL** | UCloud OpenAPI 入口地址，默认 `https://api.ucloud.cn`；专有云环境请填写实际地址 |

4. 点击 **Save & Test** 验证连通性：

| 反馈信息 | 含义 |
|----------|------|
| ✅ Data source is working | 配置成功 |
| ❌ Invalid Credentials | PublicKey 或 PrivateKey 错误 |
| ❌ Permission Denied | 密钥有效但账号权限不足 |
| ❌ Network Error | 网络不通，请检查 Base URL 或防火墙规则 |

### 2.2 查询监控数据（Query 面板）

在 Dashboard 中添加或编辑 Panel，选择 UCloud-CloudWatch-Monitor 数据源，按以下字段配置查询：

| 字段 | 必填 | 说明 |
|------|------|------|
| **项目** | ✅ | 下拉单选，展示当前账号有权限的项目列表；支持模板变量 |
| **产品类型** | ✅ | 下拉单选，支持搜索（如 UHost、UDB、UFS 等） |
| **地域** | ✅ | 下拉单选；全局产品（如 UCDN）自动隐藏此字段；支持模板变量 |
| **指标** | ✅ | 下拉单选，支持搜索；根据所选产品类型自动过滤指标列表 |
| **资源对象** | ✅ | 下拉多选，最多选择 **20** 个资源；需先选好项目、产品类型和地域 |
| **数据维度** | 否 | Key-Value 键值对列表，用于更细粒度的数据过滤；Value 支持多值逗号分隔 |
| **聚合方式** | 否 | 原始值（默认）、最大值、最小值、平均值、求和值 |

**自动查询：** 填齐所有必填项后自动出图，修改任意字段后自动重新查询，无需手动触发。

**数据周期：** 后端根据 Grafana 时间范围自动选择合适的数据粒度：

| 时间范围 | 数据周期 |
|----------|----------|
| ≤ 1 小时 | 60 秒 |
| 1 小时 ~ 24 小时 | 5分钟 |
| 1 天 ~ 30 天 | 1 小时 |
| > 30 天 | 1 天 |

### 2.3 模板变量

模板变量可以让一个 Dashboard 适配多个项目/地域/资源组合，避免为每种场景重复创建面板。

#### 创建方式

进入 Dashboard → **Settings** → **Variables** → **New variable**：
- **Type**：选择 `Query`
- **Data source**：选择本插件实例
- **Query**：填写 JSON 配置

#### 配置示例

**项目变量（`$project`）：**
```json
{"type": "project"}
```

**地域变量（`$region`）：**
```json
{"type": "region", "params": {"product": "uhost"}}
```

**资源变量（`$resource`），支持联动：**
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

#### 联动效果

当顶部的 `$region` 或 `$project` 下拉切换时，`$resource` 的候选列表会自动刷新，Panel 也会随之重新查询出图。

#### 在 Query 中引用变量

在 Query 面板的下拉列表中，模板变量会出现在选项顶部（如 `$project`、`$region`），直接选择即可。资源对象字段支持 Multi-value 多选变量，自动展开为多个资源 ID。

### 2.4 异常处理说明

| 场景 | Panel 表现 |
|------|------------|
| 必填项未填齐 | 显示警告提示，告知具体缺失的字段（如"请补充必填项：项目、地域"） |
| 查询完全失败 | 面板左上角显示红色错误图标及错误文案 |
| 部分资源失败 | 成功资源正常出图，同时显示黄色警告（标注哪些资源失败及原因） |
| 无数据 | 图表区域显示 "No Data" |

---

## 三、常见问题（FAQ）

**Q：出现 "Plugin unavailable" 错误？**

请依次检查：
1. 后端二进制架构是否与服务器匹配（`uname -m`：`x86_64` → `linux_amd64`，`aarch64` → `linux_arm64`）
2. 是否已配置 `allow_loading_unsigned_plugins = ucloud-cloudwatch-monitor`
3. 二进制文件是否有可执行权限（`chmod +x gpx_ucloud_cloudwatch_*`）

**Q：下拉列表为空？**

- 检查 PublicKey / PrivateKey 是否正确
- 确认账号是否有对应产品/项目的查询权限
- 切换项目或产品类型后，下级下拉列表会自动刷新

**Q：资源对象最多选 20 个能否调整？**

不可调整。这是为避免单次查询数据量过大导致响应缓慢而设置的上限。如需监控更多资源，建议拆分为多个 Panel。

**Q：升级插件后 Dashboard 会丢失吗？**

不会。只要插件 ID 不变（`ucloud-cloudwatch-monitor`），所有已有的数据源配置和 Dashboard 均会保留。

**Q：私钥存储是否安全？**

安全。私钥使用 Grafana 的 secureJsonData 机制加密存储于服务端，所有 UCloud API 请求由后端进程发起，私钥不会出现在浏览器网络请求中。

**Q：模板变量中引用的变量没有被替换？**

- 确认变量引用语法为 `${varname}`（推荐）或 `$varname`
- 确认被引用的变量已在 Dashboard Settings → Variables 中定义

---

## 四、参考资料

- [UCloud CloudWatch 产品文档](https://docs.ucloud.cn/cloudwatch/README)
- [UCloud OpenAPI 文档](https://docs.ucloud.cn/api/)
- [UCloud API 密钥管理](https://console.ucloud.cn/uapi/apikey)
- [Grafana 模板变量文档](https://grafana.com/docs/grafana/latest/dashboards/variables/)
