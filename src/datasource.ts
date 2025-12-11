import { getBackendSrv, isFetchError, getTemplateSrv } from '@grafana/runtime';
import {
  CoreApp,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  // createDataFrame,
  FieldType,
} from '@grafana/data';

import { MyQuery, MyDataSourceOptions, DEFAULT_QUERY, DataSourceResponse } from './types';
import { lastValueFrom } from 'rxjs';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  baseUrl: string;
  url: string;
  apiKey: string;
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.baseUrl = instanceSettings.jsonData.baseUrl || 'http://internal-api-test03.service.ucloud.cn';
    this.url = instanceSettings.url!;
    this.apiKey = instanceSettings.jsonData.apiKey || '';
  }

  getDefaultQuery(_: CoreApp): Partial<MyQuery> {
    return DEFAULT_QUERY;
  }

  // 验证查询参数是否有效，如果必要的参数没有填，就不执行查询
  filterQuery(query: MyQuery): boolean {
    // 检查必要的查询参数是否存在
    // if (query.queryType === 'normal') {
    //   return !!(query.ProductKey?.value && query.MetricKey?.value);
    // }
    // return !!query.queryText;
    return true;
  }

  // 真正的查询接口
  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    const templateSrv = getTemplateSrv();

    const { ProductKey, Region, CalcMethod, ResourceIds, MetricKey, MetricInput, queryType, Tags } = options.targets[0];

    // 以下自定义变量，只用在自定义查询中
    // 替换 Region 变量，支持 $region 或 ${region} 语法
    const replacedRegion = Region ? templateSrv.replace(Region) : Region;
    const replacedResourceIds = ResourceIds ? templateSrv.replace(ResourceIds) : ResourceIds;
    const replacedMetricInput = MetricInput ? templateSrv.replace(MetricInput) : MetricInput;
    const replacedTags = Tags ? templateSrv.replace(Tags) : Tags;

    console.log('replacedRegion', replacedRegion);
    console.log('replacedResourceIds', replacedResourceIds);
    console.log('replacedMetricInput', replacedMetricInput);
    console.log('replacedTags', replacedTags);

    let queryParams: any = {};
    let tagsRequest: any = {};

    let ResourceIdList = ResourceIds?.split(',') || [];
    let noResourceId = !Boolean(ResourceIds?.trim());

    // 普通查询
    if (queryType === 'normal') {
      let tags = Tags && JSON.parse(Tags);
      if (tags && Object.keys(tags).length > 0) {
        tagsRequest = tags;
      }
      queryParams = {
        ProductKey: ProductKey,
        Region: replacedRegion,
        CalcMethod: CalcMethod,
        StartTime: Math.floor(from / 1000),
        EndTime: Math.floor(to / 1000),
        Selectors: noResourceId 
        ? [{ ResourceId: '', Metric: MetricKey, Tags: tagsRequest || null }] 
        : ResourceIdList?.map((id: string) => ({
          ResourceId: id,
          Metric: MetricKey,
        })),
        Tags: tagsRequest || null,
      }
    }

    // 自定义查询
    if (queryType === 'custom') {
      let tags = replacedTags && JSON.parse(replacedTags);
      if (tags && Object.keys(tags).length > 0) {
        tagsRequest = tags;
      }
      let selectors: any[] = [];

      replacedMetricInput?.split(',').forEach((metric: string) => {
        if (noResourceId) {
          selectors.push({
            ResourceId: '',
            Metric: metric,
            Tags: tagsRequest || null,
          })
        } else {
          replacedResourceIds?.split(',').forEach((id: string) => {
            selectors.push({
              ResourceId: id,
              Metric: metric,
            })
          })
        }
      })

      queryParams = {
        ProductKey: ProductKey,
        Region: replacedRegion,
        CalcMethod: CalcMethod,
        StartTime: Math.floor(from / 1000),
        EndTime: Math.floor(to / 1000),
        Selectors: selectors,
        Tags: tagsRequest || null,
      }
    }

    if (!queryParams.ProductKey) {
      return { data: [] };
    }

    const data = await this.request('QueryMonitorData', queryParams);

    if (data.data?.RetCode !== 0) {
      throw new Error(data.data?.Message || '查询失败');
    }

    // 处理数据，将数据转换为 Grafana 需要的格式
    const { List } = (data.data as any)?.Data || [];

    let formattedData: any[] = [];

    List?.forEach((item: any) => {
      const { Metric, Results } = item;

      Results.forEach((result: any) => {
        const { ResourceId, Values, TagMap } = result;
        let tagInfos = '';
        Object.keys(TagMap).map((key, index) => {
          const isFirst = index === 0;
          const spacing = isFirst ? '' : '\xa0\xa0';
          if (key !== 'uuid' && key !== 'skym_namespace') {
            // @ts-ignore
            tagInfos += spacing + `${key}:${TagMap[key]}`;
          }
        });

        const basicName = Metric + '-' + ResourceId;
        const actualName = tagInfos ? basicName + '-' + tagInfos : basicName;

        const actualData = {
          name: actualName,
          fields: [
            {
              name: 'Time',
              values: Values.map((value: any) => value.Timestamp * 1000),
              type: FieldType.time,
            },
            {
              name: 'Value',
              values: Values.map((value: any) => value.Value),
              type: FieldType.number,
            },
          ],
        }
        formattedData.push(actualData);
      });
    })

    return { data: formattedData };
  }

  async request(action: string, data?: any) {
    // 构建完整的请求 URL
    // this.url 是 Grafana 的代理路径，例如: /api/datasources/proxy/uid/xxx
    // Grafana 会根据 plugin.json 中的 routes 配置，将请求转发到 baseUrl

    // 使用传入的 action，如果没有则使用默认的 action
    const actionUrl = `${this.url}?Action=${action}`;

    const response = getBackendSrv().fetch<DataSourceResponse>({
      url: actionUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': this.apiKey,
      },
      data: {
        Backend: 'CloudWatchAdmin',
        Action: action,
        ...data,
      },
    });
    return lastValueFrom(response);
  }

  /**
   * Checks whether we can connect to the API.
   */
  async testDatasource() {
    const defaultErrorMessage = 'Cannot connect to API';

    try {
      const response = await this.request('GetProductTypes', {});
      if (response.status === 200) {
        return {
          status: 'success',
          message: 'Success',
        };
      } else {
        return {
          status: 'error',
          message: response.statusText ? response.statusText : defaultErrorMessage,
        };
      }
    } catch (err) {
      let message = '';
      if (typeof err === 'string') {
        message = err;
      } else if (isFetchError(err)) {
        message = 'Fetch error: ' + (err.statusText ? err.statusText : defaultErrorMessage);
        if (err.data && err.data.error && err.data.error.code) {
          message += ': ' + err.data.error.code + '. ' + err.data.error.message;
        }
      }
      return {
        status: 'error',
        message,
      };
    }
  }

  /**
   * 获取所有的产品类型
   */
  async getProductTypes() {
    try {
      const response = await this.request('GetProductTypes', {});
      return (response.data as any)?.Data;
    } catch (error) {
      console.error('GetProductTypes error:', error);
      throw error;
    }
  }


  /**
   * 获取产品下的指标
   */
  async getProductMetrics(productKey: string) {
    try {
      const response = await this.request('GetProductMetrics', { ProductKey: productKey });
      return (response.data as any)?.Data?.List;
    } catch (error) {
      console.error('GetProductMetrics error:', error);
      throw error;
    }
  }


  /**
   * 获取地域列表
   */
  async ListRegion() {
    try {
      const response = await this.request('ListRegion', {});
      return (response.data as any)?.Data?.List;
    } catch (error) {
      console.error('ListRegion error:', error);
      throw error;
    }
  }
}
