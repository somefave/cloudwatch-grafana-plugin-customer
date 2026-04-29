//go:build mage
// +build mage

package main

// Grafana 官方标准构建目标：
// mage -l 查看全部目标；常用：buildAll / build:linux / build:darwin / build:windows
// 通过空白导入让 SDK 注册其 mage 目标
import (
	// mage:import
	build "github.com/grafana/grafana-plugin-sdk-go/build"
)

// Default 默认目标：构建所有平台
var Default = build.BuildAll
