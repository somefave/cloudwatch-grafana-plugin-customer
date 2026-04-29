import {
  CoreApp,
  DataSourceInstanceSettings,
  MetricFindValue,
  ScopedVars,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { DEFAULT_QUERY, MyDataSourceOptions, MyQuery, MyVariableQuery } from './types';

/**
 * 数据源前端代理：
 * - 查询透传到 Go 后端（由 DataSourceWithBackend 实现）
 * - 下拉数据通过 getResource 调用后端 CallResource
 * - applyTemplateVariables 负责把 $project/$region/$resource 替换为实际值
 */
export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  getDefaultQuery(_: CoreApp): Partial<MyQuery> {
    return DEFAULT_QUERY;
  }

  filterQuery(query: MyQuery): boolean {
    // PRD/API 必填：项目、产品、地域、指标、资源对象
    return Boolean(
      query.projectId &&
        query.productKey &&
        query.region &&
        query.metric &&
        (query.resourceIds?.length ?? 0) > 0
    );
  }

  applyTemplateVariables(query: MyQuery, scopedVars: ScopedVars): MyQuery {
    const srv = getTemplateSrv();
    return {
      ...query,
      projectId: query.projectId ? srv.replace(query.projectId, scopedVars) : query.projectId,
      region: query.region ? srv.replace(query.region, scopedVars) : query.region,
      resourceIds: (query.resourceIds || []).flatMap((id) => {
        const replaced = srv.replace(id, scopedVars);
        // 模板变量可能返回逗号分隔的字符串
        return replaced.split(',').map((s) => s.trim()).filter(Boolean);
      }),
    };
  }

  /**
   * 模板变量查询：type = project / region / resource
   */
  async metricFindQuery(query: MyVariableQuery | string): Promise<MetricFindValue[]> {
    // 兼容旧版本字符串形式，默认按 project
    const q: MyVariableQuery = typeof query === 'string' ? { type: 'project' } : query;

    let path = '';
    const params = new URLSearchParams();
    if (q.type === 'project') {
      path = '/projects';
    } else if (q.type === 'region') {
      path = '/regions';
      if (q.productKey) {
        params.set('productKey', q.productKey);
      }
    } else if (q.type === 'resource') {
      path = '/resources';
      if (q.productKey) {
        params.set('productKey', q.productKey);
      }
      if (q.region) {
        params.set('region', q.region);
      }
      if (q.projectId) {
        params.set('projectId', q.projectId);
      }
    } else {
      return [];
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const list = await this.getResource<Array<{ text?: string; value: string }>>(`${path}${suffix}`);
    return (list || []).map((item) => ({ text: item.text ?? item.value, value: item.value }));
  }
}
