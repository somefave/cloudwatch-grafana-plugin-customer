package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"github.com/ucloud/cloudwatch-grafana-plugin-customer/pkg/plugin"
)

// 插件入口
func main() {
	if err := datasource.Manage(
		"ucloud-cloudwatch-monitor",
		plugin.NewDatasource,
		datasource.ManageOpts{},
	); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
