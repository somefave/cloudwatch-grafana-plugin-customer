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

  filterQuery(_query: MyQuery): boolean {
    // 始终允许发送查询，由后端统一返回必填项缺失的 Notice，
    // 让 Panel 能看到警告而非空白
    return true;
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

    const srv = getTemplateSrv();
    let path = '';
    const params = new URLSearchParams();

    if (q.type === 'project') {
      path = '/projects';
    } else if (q.type === 'region') {
      path = '/regions';
      if (q.params?.product) {
        params.set('productKey', srv.replace(q.params.product));
      }
    } else if (q.type === 'resource') {
      path = '/resources';
      if (q.params?.product) {
        params.set('productKey', srv.replace(q.params.product));
      }
      if (q.params?.region) {
        params.set('region', srv.replace(q.params.region));
      }
      if (q.params?.project) {
        params.set('projectId', srv.replace(q.params.project));
      }
    } else {
      return [];
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const list = await this.getResource<Array<{ text?: string; value: string }>>(`${path}${suffix}`);
    return (list || []).map((item) => ({ text: item.text ?? item.value, value: item.value }));
  }
}
