# UCloud CloudWatch 数据源插件

Grafana 的 UCloud CloudWatch 数据源插件安装和配置指南。

---

## 📦 安装步骤

### 1. 安装插件

执行以下命令安装插件：

```bash
grafana-cli --pluginUrl https://git.ucloudadmin.com/console/cloudwatch-grafana-plugin/-/archive/main/ucloud-cloudwatch-datasource.zip\?path\=dist plugins install ucloud-cloudwatch-datasource
```

### 2. 配置 Grafana

#### 2.1 进入配置目录

```bash
cd /data/self-monitor/grafana/conf
```

配置文件名称：`defaults.ini`

#### 2.2 修改 `[paths]` 配置

找到 `[paths]` 部分，设置插件路径：

```ini
[paths]
plugins = /data/self-monitor/grafana/data/plugins
```

#### 2.3 修改 `[plugins]` 配置

找到 `[plugins]` 部分，添加以下配置：

```ini
[plugins]
allow_loading_unsigned_plugins = ucloud-cloudwatch-datasource
plugin_admin_enabled = true
```

#### 2.4 保存配置

在 vim 编辑器中按 `:wq` 保存并退出。

### 3. 重启 Grafana 服务

```bash
systemctl restart grafana
```

---

## ✅ 验证配置

执行以下命令检查配置是否正确：

```bash
# 检查 paths 配置
cat /data/self-monitor/grafana/conf/defaults.ini | grep -A 3 "\[paths\]"

# 检查 plugins 配置
cat /data/self-monitor/grafana/conf/defaults.ini | grep -A 3 "\[plugins\]"
```

**预期输出：**

```ini
[paths]
plugins = /data/self-monitor/grafana/data/plugins

[plugins]
allow_loading_unsigned_plugins = ucloud-cloudwatch-datasource
plugin_admin_enabled = true
```

---

## 📝 注意事项

- 确保 Grafana 服务有权限访问插件目录
- 重启服务后，在 Grafana 管理界面的数据源列表中应该能看到 UCloud CloudWatch 数据源
- 如遇问题，请检查 Grafana 日志：`journalctl -u grafana -f`
