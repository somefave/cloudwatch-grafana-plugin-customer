package plugin

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	uhttp "github.com/ucloud/ucloud-sdk-go/private/protocol/http"
	"github.com/ucloud/ucloud-sdk-go/ucloud"
	"github.com/ucloud/ucloud-sdk-go/ucloud/auth"
	"github.com/ucloud/ucloud-sdk-go/ucloud/request"
)

// UCloudClient 封装 UCloud SDK 的泛化调用
type UCloudClient struct {
	client     *ucloud.Client
	cfg        *ucloud.Config
	credential *auth.Credential
	channelKey string
}

// NewUCloudClient 创建一个基于 PublicKey/PrivateKey 的 UCloud Client
// baseURL 允许为空，使用 SDK 默认入口 https://api.ucloud.cn
func NewUCloudClient(publicKey, privateKey, baseURL, channelKey string) *UCloudClient {
	cfg := ucloud.NewConfig()
	if baseURL != "" {
		cfg.BaseUrl = baseURL
	}
	cred := auth.NewCredential()
	cred.PublicKey = publicKey
	cred.PrivateKey = privateKey

	cli := ucloud.NewClient(&cfg, &cred)
	trimmedChannelKey := strings.TrimSpace(channelKey)
	_ = cli.AddHttpRequestHandler(func(_ *ucloud.Client, req *uhttp.HttpRequest) (*uhttp.HttpRequest, error) {
		if trimmedChannelKey != "" {
			_ = req.SetHeader("channel-key", trimmedChannelKey)
		}
		logFullHTTPRequest(req)
		return req, nil
	})
	return &UCloudClient{client: cli, cfg: &cfg, credential: &cred, channelKey: trimmedChannelKey}
}

func logFullHTTPRequest(req *uhttp.HttpRequest) {
	url := req.GetURL()
	if qs, err := req.BuildQueryString(); err == nil && qs != "" {
		url += "?" + qs
	}

	headers := req.GetHeaderMap()
	log.DefaultLogger.Info("UCloud API 完整 HTTP 请求",
		"method", req.GetMethod(),
		"url", url,
		"channel-key", headers["channel-key"],
		"headers", headers,
		"body", string(req.GetRequestBody()),
	)
}

// Invoke 发起一次 UCloud OpenAPI 泛化调用
// payload 中必须包含 "Action"；SDK 会自动注入 PublicKey 与签名。
// 默认使用 JSONEncoder（POST + JSON body），保留参数原始类型（int 不会被转 string）。
// 返回值：(响应 payload, X-UCLOUD-REQUEST-UUID, error)
func (c *UCloudClient) Invoke(payload map[string]interface{}) (map[string]interface{}, string, error) {
	if _, ok := payload["Action"]; !ok {
		return nil, "", fmt.Errorf("payload 缺少必需字段 Action")
	}

	action, _ := payload["Action"].(string)
	reqBytes, _ := json.Marshal(payload)
	log.DefaultLogger.Info("UCloud API 请求",
		"action", action,
		"baseUrl", c.cfg.BaseUrl,
		"payload", string(reqBytes),
	)

	req := c.client.NewGenericRequest()
	// 使用 JSON Encoder：POST + application/json body，保留 int/bool 等原始类型
	req.SetEncoder(request.NewJSONEncoder(c.cfg, c.credential))

	if err := req.SetPayload(payload); err != nil {
		log.DefaultLogger.Error("UCloud API SetPayload 失败", "action", action, "error", err)
		return nil, "", fmt.Errorf("SetPayload 失败: %w", err)
	}
	resp, err := c.client.GenericInvoke(req)
	if err != nil {
		log.DefaultLogger.Error("UCloud API 调用失败", "action", action, "error", err)
		return nil, "", err
	}

	traceID := resp.GetRequestUUID()
	result := resp.GetPayload()
	respBytes, _ := json.Marshal(result)
	log.DefaultLogger.Info("UCloud API 响应", "action", action, "traceId", traceID, "body", string(respBytes))

	return result, traceID, nil
}
