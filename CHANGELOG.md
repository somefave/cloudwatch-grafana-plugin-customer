# Changelog

## 1.0.2 (2026-05-11)

- 必填项未填写时，在 Panel 上显示警告提示（Notice），告知具体缺失字段
- 后端按是否全局产品决定是否要求 region（全局产品免地域）
- 任何字段变化都触发查询，由后端统一返回校验结果

## 1.0.1 (2026-05-08)

- 插件 ID 统一为 `ucloud-cloudwatch-monitor`
- 后端 API 适配最新文档：
  - 产品类型：`GetProductTypes` → `ListMonitorProduct`，新增 `GlobalService` 字段
  - 地域：`ListRegion` → `ListRegions`
  - 资源：`DescribeResource` → `ListResource`，必填 `Limit/Offset`
  - 查询：`QueryMonitorData` → `QueryMetricDataSet`（请求结构改为 `MetricInfos[]`）
- 产品/指标 label 展示格式：`中文_英文`
- Query 面板：必填字段填满后自动查询；移除"运行查询"按钮
- 全局产品（GlobalService=1）自动隐藏地域字段
- 资源对象多选必须先选项目+产品+地域才可用
- 模板变量配置改为火山云 JSON 格式：`{"type":"resource","params":{...}}`，支持变量联动
- 部分失败仍通过 `Frame.Meta.Notices` 暴露给 Grafana 自带的 Warning 渲染

## 1.0.0

Initial release.
