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
  // 是否全局产品（前端从 ListMonitorProduct 的 GlobalService 字段推导，传给后端用于跳过 region 必填校验）
  isGlobalProduct?: boolean;
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
  // 查询类型：project（项目）、region（地域）、resource（资源）
  type: 'project' | 'region' | 'resource';
  // 参数对象（依赖其他变量时填写）
  params?: {
    product?: string;   // 产品类型（如 "uhost"）
    region?: string;    // 地域（可以是变量 "${region}"）
    project?: string;   // 项目（可以是变量 "${project}"）
  };
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
