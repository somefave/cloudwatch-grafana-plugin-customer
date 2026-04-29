import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export type CalcMethod = string;

export interface TagPair {
  key: string;
  values: string[];
}

export interface MyQuery extends DataQuery {
  // 项目（支持 $project 变量）
  projectId?: string;
  // 产品类型
  productKey?: string;
  // 地域（支持 $region 变量）
  region?: string;
  // 指标
  metric?: string;
  // 资源对象（多选，最多 20，支持 $resource 变量）
  resourceIds?: string[];
  // 数据维度（KV 列表）
  tags?: TagPair[];
  // 聚合方式
  calcMethod?: CalcMethod;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  resourceIds: [],
  tags: [],
};

// 模板变量查询
export interface MyVariableQuery {
  type: 'project' | 'region' | 'resource';
  productKey?: string;
  region?: string;
  projectId?: string;
}

export interface DataPoint {
  Time: number;
  Value: number;
}

export interface DataSourceResponse {
  datapoints: DataPoint[];
  RetCode: number;
  Message: string;
}

/**
 * 数据源配置（明文 JSON 字段）
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  publicKey?: string;
  baseUrl?: string;
}

/**
 * 数据源配置（加密字段，仅在后端解密）
 */
export interface MySecureJsonData {
  privateKey?: string;
}
