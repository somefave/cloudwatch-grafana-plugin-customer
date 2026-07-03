package plugin

// 数据源 JSON 配置（明文）
type DatasourceSettings struct {
	PublicKey  string `json:"publicKey"`
	BaseURL    string `json:"baseUrl"`
	ChannelKey string `json:"channelKey"`
}

// QueryModel 与前端 src/types.ts 的 MyQuery 对齐
type QueryModel struct {
	ProjectID       string    `json:"projectId"`
	ProductKey      string    `json:"productKey"`
	IsGlobalProduct bool      `json:"isGlobalProduct"`
	Region          string    `json:"region"`
	Metric          string    `json:"metric"`
	ResourceIDs     []string  `json:"resourceIds"`
	Tags            []TagPair `json:"tags"`
	CalcMethod      string    `json:"calcMethod"`
}

type TagPair struct {
	Key    string   `json:"key"`
	Values []string `json:"values"`
}

// UCloud 通用响应壳
type ucloudResponse struct {
	Action     string                 `json:"Action"`
	RetCode    int                    `json:"RetCode"`
	Message    string                 `json:"Message"`
	TotalCount int                    `json:"TotalCount"`
	Data       map[string]interface{} `json:"Data"`
	// 某些接口直接把 List 放在顶层，兼容处理
	List []map[string]interface{} `json:"List,omitempty"`
}
