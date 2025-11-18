import { getBackendSrv, isFetchError } from '@grafana/runtime';
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

    // 并行处理所有查询目标
    // const promises = options.targets.map(async (target) => {
    //   // 如果查询类型是普通查询
    //   if (target.queryType === 'normal') {
    //     try {
    //       // 准备查询参数
    //       const queryParams: any = {
    //         ProductKey: target.ProductKey?.value,
    //         Metric: target.MetricKey?.value,
    //         Region: target.Region?.value,
    //         BeginTime: Math.floor(from / 1000), // 转换为秒
    //         EndTime: Math.floor(to / 1000), // 转换为秒
    //       };

    //       // 如果有聚合方式
    //       if (target.CalcMethod?.value) {
    //         queryParams.CalcMethod = target.CalcMethod.value;
    //       }

    //       // 如果有资源ID
    //       if (target.ResourceIds) {
    //         // 将逗号分隔的字符串转换为数组
    //         queryParams.ResourceIds = target.ResourceIds.split(',').map((id: string) => id.trim()).filter((id: string) => id);
    //       }

    //       // 如果有标签
    //       if (target.Tags) {
    //         // 将逗号分隔的字符串转换为数组
    //         queryParams.Tags = target.Tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
    //       }

    //       // 调用查询接口
    //       const response = await this.request('QueryMonitorData', queryParams);
    //       const dataPoints = (response.data as any)?.Data || [];

    //       // 将数据转换为 Grafana 需要的格式
    //       const times: number[] = [];
    //       const values: number[] = [];

    //       dataPoints.forEach((point: any) => {
    //         times.push(point.Time * 1000); // 转换为毫秒
    //         values.push(point.Value);
    //       });

    //       return createDataFrame({
    //         refId: target.refId,
    //         fields: [
    //           { name: 'Time', values: times, type: FieldType.time },
    //           { name: 'Value', values: values, type: FieldType.number },
    //         ],
    //       });
    //     } catch (error) {
    //       console.error('Query error:', error);
    //       // 如果查询失败，返回空数据
    //       return createDataFrame({
    //         refId: target.refId,
    //         fields: [
    //           { name: 'Time', values: [], type: FieldType.time },
    //           { name: 'Value', values: [], type: FieldType.number },
    //         ],
    //       });
    //     }
    //   }

    //   // 如果是自定义查询或其他类型，返回模拟数据
    //   return createDataFrame({
    //     refId: target.refId,
    //     fields: [
    //       { name: 'Time', values: [from, to], type: FieldType.time },
    //       { name: 'Value', values: [6.5, 6.5], type: FieldType.number },
    //     ],
    //   });
    // });

    // let Selectors: any = [];

    // options.targets.forEach((target) => {
    //   const { ResourceIds } = target;
    //   let ResourceIdsArray = ResourceIds.split(',').map((id: string) => id.trim()).filter((id: string) => id);
    //   ResourceIdsArray.forEach((id: string) => {
    //     Selectors.push({
    //       ResourceId: id,
    //       Metric: target.MetricKey?.value,
    //     });
    //   });
    // });

    const { ProductKey, Region, CalcMethod, ResourceIds, MetricKey, MetricInput, RegionInput, queryType } = options.targets[0];

    let queryParams: any = {};

    if (queryType == 'normal') {
      queryParams = {
        ProductKey: ProductKey?.value,
        Region: Region?.value,
        CalcMethod: CalcMethod?.value,
        StartTime: Math.floor(from / 1000),
        EndTime: Math.floor(to / 1000),
        Selectors: ResourceIds?.split(',')?.map((id: string) => ({
          ResourceId: id,
          Metric: MetricKey?.value,
        })),
      }
    }

    if (queryType == 'custom') {
      
      let selectors: any[] = [];

      MetricInput?.split(',').forEach((metric: string) => {
        ResourceIds.split(',').forEach((id: string) => {
          selectors.push({
            ResourceId: id,
            Metric: metric,
          })
        })
      })

      queryParams = {
        ProductKey: ProductKey?.value,
        Region: RegionInput,
        CalcMethod: CalcMethod?.value,
        StartTime: Math.floor(from / 1000),
        EndTime: Math.floor(to / 1000),
        Selectors: selectors,
      }
    }

    console.log('queryParams:', queryParams);

    if (!queryParams.ProductKey) {
      return { data: [] };
    }

    // const data = await Promise.all([]);
    const data = await this.request('QueryMonitorData', queryParams);

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
