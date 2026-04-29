package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
)

// Datasource 插件数据源实例
type Datasource struct {
	settings DatasourceSettings
	uclient  *UCloudClient
}

var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ backend.CallResourceHandler   = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

// NewDatasource 由 Grafana SDK 在每个数据源实例创建时调用
func NewDatasource(_ context.Context, s backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	var settings DatasourceSettings
	if len(s.JSONData) > 0 {
		if err := json.Unmarshal(s.JSONData, &settings); err != nil {
			return nil, fmt.Errorf("解析 jsonData 失败: %w", err)
		}
	}
	privateKey := s.DecryptedSecureJSONData["privateKey"]

	cli := NewUCloudClient(settings.PublicKey, privateKey, settings.BaseURL)
	return &Datasource{settings: settings, uclient: cli}, nil
}

func (d *Datasource) Dispose() {}

// CheckHealth 连通性测试
func (d *Datasource) CheckHealth(_ context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	if strings.TrimSpace(d.settings.PublicKey) == "" {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "Invalid Credentials: PublicKey 为空",
		}, nil
	}

	resp, err := d.uclient.Invoke(map[string]interface{}{
		"Action": "GetRegion",
	})
	if err != nil {
		return classifyNetworkError(err), nil
	}

	retCode, _ := resp["RetCode"].(float64)
	message, _ := resp["Message"].(string)
	if retCode != 0 {
		return classifyBizError(int(retCode), message), nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}

// classifyNetworkError 把网络层错误包装为 CheckHealth 错误分类
func classifyNetworkError(err error) *backend.CheckHealthResult {
	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusError,
		Message: "Network Error: " + err.Error(),
	}
}

// classifyBizError 按 UCloud RetCode 区分业务错误
func classifyBizError(retCode int, message string) *backend.CheckHealthResult {
	lower := strings.ToLower(message)
	switch {
	case retCode == 170 || strings.Contains(lower, "signature") || strings.Contains(lower, "publickey") || strings.Contains(lower, "private"):
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "Invalid Credentials: " + message,
		}
	case retCode == 230 || strings.Contains(lower, "permission") || strings.Contains(lower, "forbidden") || strings.Contains(lower, "denied"):
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "Permission Denied: " + message,
		}
	default:
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("RetCode=%d, %s", retCode, message),
		}
	}
}
