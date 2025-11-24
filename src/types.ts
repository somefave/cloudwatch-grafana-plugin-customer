import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface MyQuery extends DataQuery {
  queryText?: string;
  requestParam1?: string;
  queryType?: 'normal' | 'custom';
  ProductKey?: string;
  MetricKey?: string;
  ResourceIds?: string;
  Tags?: string;
  CalcMethod?: string;
  Region?: string;
  RegionInput?: string;
  MetricInput?: string;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  queryType: 'normal',
  ProductKey: '',
  MetricKey: '',
  CalcMethod: '',
  ResourceIds: '',
  Tags: '',
  Region: '',
  RegionInput: '',
  MetricInput: '',
};

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
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  baseUrl?: string;
  path?: string;
  apiKey?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}
