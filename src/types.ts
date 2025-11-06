import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface MyQuery extends DataQuery {
  queryText?: string;
  requestParam1: string;
  queryType: 'normal' | 'custom';
  ProductKey: { label: string, value: string };
  MetricKey: { label: string, value: string };
  ResourceIds: string;
  Tags: string;
  CalcMethod: { label: string, value: string };
  Region: { label: string, value: string };
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  queryType: 'normal',
  ProductKey: { label: '',value: '' },
  MetricKey: { label: '', value: '' },
  CalcMethod: { label: '', value: '' },
  ResourceIds: '',
  Tags: '',
  Region: { label: '', value: '' },
};

export interface DataPoint {
  Time: number;
  Value: number;
}

export interface DataSourceResponse {
  datapoints: DataPoint[];
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
