# UCloud CloudWatch Grafana 插件

为 Grafana 提供 UCloud CloudWatch 监控数据查询能力。安装后可在 Grafana 中直接查询 UCloud 各产品的监控指标，并支持多维度过滤、模板变量、自动联动查询。

> 开发者文档请见 [DEVELOPMENT.md](DEVELOPMENT.md)。

---

## 一、特性

- **多产品支持**：云主机、云数据库、对象存储等所有 UCloud 监控产品
- **多维度筛选**：项目、地域、资源对象、数据维度（KV 标签）多重过滤
- **模板变量**：JSON 形式定义，支持变量间联动（如资源跟随地域刷新）
- **自动查询**：必填项填齐后自动出图，无需手动点按钮
- **部分失败可视化**：多资源查询中部分失败时给出明确提示
- **安全**：PrivateKey 加密存储于服务端，**不会出现在浏览器请求中**

---

## 二、环境要求

- Grafana **≥ 10.4.0**（推荐 11.x / 12.x）
- 已配置 [UCloud API 密钥](https://console.ucloud.cn/uapi/apikey)（PublicKey + PrivateKey）

---

## 三、安装

### 3.1 下载插件压缩包

> 📦 下载地址：**TODO 待补充**

下载 `ucloud-cloudwatch-monitor-<version>.zip` 到本地。

### 3.2 解压到 Grafana 插件目录

```bash
unzip ucloud-cloudwatch-monitor-<version>.zip -d /var/lib/grafana/plugins/ucloud-cloudwatch-monitor
chmod +x /var/lib/grafana/plugins/ucloud-cloudwatch-monitor/gpx_ucloud_cloudwatch_*
```

> Grafana 默认插件目录路径请按你的环境调整：
> - 二进制部署：`/var/lib/grafana/plugins`
> - Docker：`/var/lib/grafana/plugins`（容器内，需 volume 挂载）
> - 自定义：查看 `grafana.ini` 的 `[paths] plugins=` 配置

### 3.3 允许加载未签名插件

编辑 `/etc/grafana/grafana.ini`（或对应路径的配置文件）：

```ini
[plugins]
allow_loading_unsigned_plugins = ucloud-cloudwatch-monitor
```

或通过环境变量（**推荐用于 Docker**）：

```bash
GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=ucloud-cloudwatch-monitor
```

### 3.4 重启 Grafana

```bash
# systemd
systemctl restart grafana-server

# docker
docker restart <grafana-container>
```

### 3.5 验证插件加载

```bash
# systemd
journalctl -u grafana-server -f | grep ucloud

# docker
docker logs <grafana-container> 2>&1 | grep ucloud
```

应出现 `Plugin registered` 与 `Successfully started backend plugin process`。

---

## 四、配置数据源

1. Grafana 左侧菜单 → **Connections** → **Add new connection**
2. 搜索 `UCloud-CloudWatch-Monitor`，点击 **Add new data source**
3. 填写配置：

| 字段 | 说明 |
|---|---|
| **PublicKey** | UCloud API 公钥（[控制台 → UAPI 密钥管理](https://console.ucloud.cn/uapi/apikey)） |
| **PrivateKey** | UCloud API 私钥（加密存储于服务端，浏览器看不到） |
| **Base URL** | UCloud OpenAPI 入口地址，默认 `https://api.ucloud.cn`，专有云请填实际地址 |

4. 点 **Save & Test**

| 反馈 | 含义 |
|---|---|
| ✅ `Data source is working` | 配置成功 |
| ❌ `Invalid Credentials: ...` | PublicKey / PrivateKey 错误 |
| ❌ `Permission Denied: ...` | 密钥有效但账号无权限 |
| ❌ `Network Error: ...` | 网络不通（检查 Base URL 或防火墙） |

---

## 五、Query 面板使用

### 5.1 字段说明

| 字段 | 必填 | 说明 |
|---|---|---|
| **项目** | ✅ | 单选；支持 `$project` 模板变量 |
| **产品类型** | ✅ | 单选，可搜索（如 UHost / UDB / UFS 等） |
| **地域** | ✅ | 单选；支持 `$region` 模板变量；**全局产品自动隐藏** |
| **指标** | ✅ | 单选，可搜索；按产品自动过滤 |
| **资源对象** | ✅ | 多选，最多 20 个；需先选好项目、产品、地域 |
| **数据维度** | 否 | KV 列表（key + 多 value 逗号分隔），用于过滤更细维度 |
| **聚合方式** | 否 | 原始值/最大值/最小值/平均值/求和值；默认为原始值 |

### 5.2 自动查询

填齐所有必填项后**自动出图**，无需手动点按钮。修改任意字段后会自动重新查询。

### 5.3 必填项警告

若必填项未填齐，Panel 上会显示警告提示，告知具体缺失字段（如"请补充必填项：项目、地域"），便于在 Dashboard 视图直接看出问题。

### 5.4 数据周期（Period）

后端按 Grafana 时间范围自动选择合适周期：

| 时间范围 | Period |
|---|---|
| ≤ 1 小时 | 60s |
| 1 小时 - 24 小时 | 300s |
| 1 天 - 30 天 | 1 小时 |
| > 30 天 | 1 天 |

---

## 六、模板变量

变量让一个 Dashboard 适配多个项目/地域/资源，避免重复配置。

### 6.1 创建变量

Dashboard → **Settings** → **Variables** → **New variable**
- **Type**：`Query`
- **Data source**：选择本插件实例
- **Query**：手写 JSON 配置（参考下方示例）

### 6.2 配置示例

**项目变量**
```json
{"type": "project"}
```

**地域变量**
```json
{"type": "region"}
```

**资源变量（依赖其他变量实现联动）**
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

> 切换顶部 `$region` 下拉时，`$resource` 候选列表自动刷新（联动效果）。

### 6.3 在 Query 面板中使用

```
项目：$project
产品：uhost
地域：$region
资源：$resource    （Multi-value 多选时自动展开为多个资源 ID）
```

---

## 七、异常处理

| 场景 | 表现 |
|---|---|
| 查询完全失败 | Panel 左上角红色图标 + 错误文案 |
| 部分资源失败 | 成功资源正常出图 + Panel 显示警告（标注哪些资源不存在/无权限） |
| 无数据 | Grafana 显示 "No Data" |
| 必填项缺失 | Panel 显示警告，告知缺哪些字段 |

---

## 八、版本升级

```bash
systemctl stop grafana-server

# 删除旧目录后重新解压（保持目录名不变）
rm -rf /var/lib/grafana/plugins/ucloud-cloudwatch-monitor
unzip ucloud-cloudwatch-monitor-<新版本>.zip -d /var/lib/grafana/plugins/ucloud-cloudwatch-monitor
chmod +x /var/lib/grafana/plugins/ucloud-cloudwatch-monitor/gpx_ucloud_cloudwatch_*

systemctl start grafana-server
```

**升级不影响已有 Dashboard**：数据源配置、Panel 查询、模板变量全部保留。

> 升级后浏览器请**强制刷新**（`Cmd + Shift + R` / `Ctrl + Shift + F5`），让浏览器加载新版 module.js。

---

## 九、常见问题（FAQ）

**Q：Plugin unavailable 错误？**
1. 后端二进制架构与服务器/容器不匹配。查看架构：`uname -m`（`x86_64` 对应 `linux_amd64`，`aarch64` 对应 `linux_arm64`）
2. 没配置 `allow_loading_unsigned_plugins`
3. 二进制没有可执行权限：`chmod +x gpx_ucloud_cloudwatch_*`

**Q：下拉列表为空？**
- 检查 PublicKey/PrivateKey 是否正确，账号是否有对应产品的查询权限
- 切换项目/地域后下拉会自动刷新

**Q：资源多选最多 20 个的限制能否改？**
- 这是 PRD 要求的上限，避免单次查询过慢

**Q：升级后 Dashboard 会丢失吗？**
- 不会。只要插件 ID 不变（`ucloud-cloudwatch-monitor`），所有 Dashboard 配置都保留

**Q：私钥安全吗？**
- 私钥使用 Grafana 的 secureJsonData 机制加密存储于服务端
- 所有 UCloud API 请求由后端 Go 进程发起，**私钥不会出现在浏览器请求中**
- 浏览器 DevTools 抓包可见的只有 Grafana 内部代理调用，不含敏感信息

**Q：变量定义里依赖的变量没被替换怎么办？**
- 检查变量引用语法：`$varname` 或 `${varname}`（推荐后者）
- 确保被引用的变量在 Dashboard 设置中已经定义

---

## 十、参考资料

- [UCloud CloudWatch 产品文档](https://docs.ucloud.cn/cloudwatch/README)
- [UCloud OpenAPI 文档](https://docs.ucloud.cn/api/)
- [Grafana 模板变量文档](https://grafana.com/docs/grafana/latest/dashboards/variables/)
