package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// QueryData 批量查询入口
func (d *Datasource) QueryData(_ context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	resp := backend.NewQueryDataResponse()
	for _, q := range req.Queries {
		resp.Responses[q.RefID] = d.handleQuery(q)
	}
	return resp, nil
}

func (d *Datasource) handleQuery(q backend.DataQuery) backend.DataResponse {
	var model QueryModel
	if err := json.Unmarshal(q.JSON, &model); err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, "解析查询参数失败: "+err.Error())
	}
	// 必填校验
	if model.ProductKey == "" || model.Metric == "" || model.Region == "" || model.ProjectID == "" {
		return backend.DataResponse{}
	}

	tagsMap, tagsErr := buildTags(model)
	if tagsErr != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, "解析 Tags 失败: "+tagsErr.Error())
	}

	startTime := q.TimeRange.From.Unix()
	endTime := q.TimeRange.To.Unix()
	period := pickPeriod(endTime - startTime)

	calcMethod := model.CalcMethod
	if calcMethod == "" {
		calcMethod = "raw"
	}

	// 构造 MetricInfos：每个资源一条；TagList 在每条 MetricInfo 上挂一份
	tagList := buildTagList(tagsMap)
	resourceIDs := model.ResourceIDs
	if len(resourceIDs) == 0 {
		resourceIDs = []string{""}
	}

	// 嵌套数组结构（JSON body）
	tagListPayload := make([]map[string]interface{}, 0, len(tagList))
	for _, t := range tagList {
		tagListPayload = append(tagListPayload, map[string]interface{}{
			"TagKey":    t.Key,
			"TagValues": t.Values,
		})
	}
	metricInfos := make([]map[string]interface{}, 0, len(resourceIDs))
	for _, rid := range resourceIDs {
		item := map[string]interface{}{
			"Metric":     model.Metric,
			"ResourceId": strings.TrimSpace(rid),
		}
		if len(tagListPayload) > 0 {
			item["TagList"] = tagListPayload
		}
		metricInfos = append(metricInfos, item)
	}

	payload := map[string]interface{}{
		"Action":      "QueryMetricDataSet",
		"Region":      model.Region,
		"ProjectId":   model.ProjectID,
		"ProductKey":  model.ProductKey,
		"StartTime":   startTime,
		"EndTime":     endTime,
		"CalcMethod":  calcMethod,
		"Period":      period,
		"MetricInfos": metricInfos,
	}

	log.DefaultLogger.Info("QueryMetricDataSet 请求摘要",
		"region", model.Region,
		"projectId", model.ProjectID,
		"productKey", model.ProductKey,
		"metric", model.Metric,
		"resourceCount", len(resourceIDs),
		"period", period,
		"calcMethod", calcMethod,
	)

	raw, err := d.uclient.Invoke(payload)
	if err != nil {
		return backend.DataResponse{Error: err}
	}
	if err := checkRetCode(raw, "QueryMetricDataSet"); err != nil {
		return backend.DataResponse{Error: err}
	}

	return buildDataResponse(model, raw)
}

// pickPeriod 按 PRD/文档约定，根据时间范围（秒）选择合适的 Period
func pickPeriod(rangeSec int64) int64 {
	switch {
	case rangeSec <= 3600: // ≤1h
		return 60
	case rangeSec <= 12*3600: // 1h-12h
		return 300
	case rangeSec <= 24*3600: // 12h-24h
		return 300
	case rangeSec <= 30*24*3600: // 1天-30天
		return 3600
	default:
		return 86400
	}
}

type tagListItem struct {
	Key    string
	Values []string
}

// buildTagList 把 map[key]values 平铺为有序 TagList
func buildTagList(m map[string][]string) []tagListItem {
	if len(m) == 0 {
		return nil
	}
	out := make([]tagListItem, 0, len(m))
	for k, vs := range m {
		if strings.TrimSpace(k) == "" {
			continue
		}
		out = append(out, tagListItem{Key: k, Values: vs})
	}
	return out
}

// buildTags 把前端 KV 列表合并为 map 结构
func buildTags(model QueryModel) (map[string][]string, error) {
	if len(model.Tags) == 0 {
		return nil, nil
	}
	out := make(map[string][]string, len(model.Tags))
	for _, pair := range model.Tags {
		if strings.TrimSpace(pair.Key) == "" {
			continue
		}
		out[pair.Key] = append(out[pair.Key], pair.Values...)
	}
	return out, nil
}

// buildDataResponse 把 UCloud 返回解析为 Grafana DataFrame，并处理部分失败 Notices
// 响应结构（QueryMetricDataSet）：
//   Data.List[].Metric, Data.List[].Results[].ResourceId/ResourceName/TagMap/Values[]
//   Data.InvalidResourceIds[]（部分失败的资源）
func buildDataResponse(model QueryModel, raw map[string]interface{}) backend.DataResponse {
	var resp backend.DataResponse

	dataMap, _ := raw["Data"].(map[string]interface{})
	list := toMapSlice(mapGet(dataMap, "List"))
	invalidResourceIDs := toStringSlice(mapGet(dataMap, "InvalidResourceIds"))

	successResourceIDs := map[string]struct{}{}

	for _, item := range list {
		metric := asString(item["Metric"])
		results := toMapSlice(item["Results"])
		for _, result := range results {
			resourceID := asString(result["ResourceId"])
			successResourceIDs[resourceID] = struct{}{}
			values := toMapSlice(result["Values"])
			if len(values) == 0 {
				continue
			}

			times := make([]time.Time, 0, len(values))
			vals := make([]float64, 0, len(values))
			for _, v := range values {
				ts, _ := v["Timestamp"].(float64)
				val, _ := v["Value"].(float64)
				times = append(times, time.Unix(int64(ts), 0))
				vals = append(vals, val)
			}

			frameName := buildFrameName(metric, resourceID, asString(result["ResourceName"]), result["TagMap"])
			frame := data.NewFrame(frameName,
				data.NewField("Time", nil, times),
				data.NewField("Value", nil, vals),
			)
			resp.Frames = append(resp.Frames, frame)
		}
	}

	// 部分失败 Notices
	totalReq := len(model.ResourceIDs)
	if totalReq > 0 {
		success := len(successResourceIDs)
		// 优先用 InvalidResourceIds（API 显式告诉我们哪些坏了）
		var missing []string
		if len(invalidResourceIDs) > 0 {
			missing = invalidResourceIDs
		} else {
			for _, id := range model.ResourceIDs {
				trimmed := strings.TrimSpace(id)
				if trimmed == "" {
					continue
				}
				if _, ok := successResourceIDs[trimmed]; !ok {
					missing = append(missing, trimmed)
				}
			}
		}

		if len(missing) > 0 && success > 0 {
			notice := data.Notice{
				Severity: data.NoticeSeverityWarning,
				Text: fmt.Sprintf("%d/%d 资源成功，%d 个资源不存在或无权限: %s",
					success, totalReq, len(missing), strings.Join(missing, ", ")),
			}
			if len(resp.Frames) == 0 {
				frame := data.NewFrame("notice")
				frame.Meta = &data.FrameMeta{Notices: []data.Notice{notice}}
				resp.Frames = append(resp.Frames, frame)
			} else {
				first := resp.Frames[0]
				if first.Meta == nil {
					first.Meta = &data.FrameMeta{}
				}
				first.Meta.Notices = append(first.Meta.Notices, notice)
			}
		}
	}

	return resp
}

func buildFrameName(metric, resourceID, resourceName string, tagMapRaw interface{}) string {
	name := metric
	if resourceID != "" {
		display := resourceID
		if resourceName != "" {
			display = fmt.Sprintf("%s(%s)", resourceName, resourceID)
		}
		name = metric + "-" + display
	}
	tagMap, ok := tagMapRaw.(map[string]interface{})
	if !ok || len(tagMap) == 0 {
		return name
	}
	parts := make([]string, 0, len(tagMap))
	for k, v := range tagMap {
		if k == "uuid" || k == "skym_namespace" {
			continue
		}
		parts = append(parts, fmt.Sprintf("%s:%s", k, asString(v)))
	}
	if len(parts) == 0 {
		return name
	}
	return name + "-" + strings.Join(parts, "  ")
}

func mapGet(m map[string]interface{}, key string) interface{} {
	if m == nil {
		return nil
	}
	return m[key]
}

func toStringSlice(raw interface{}) []string {
	arr, ok := raw.([]interface{})
	if !ok {
		return nil
	}
	out := make([]string, 0, len(arr))
	for _, v := range arr {
		out = append(out, asString(v))
	}
	return out
}
