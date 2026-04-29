import React, { useEffect, useState } from 'react';
import { InlineField, Select, Stack } from '@grafana/ui';
import { DataSource } from '../datasource';
import { MyVariableQuery } from '../types';

interface Props {
  query: MyVariableQuery;
  onChange: (query: MyVariableQuery, definition: string) => void;
  datasource: DataSource;
}

type Option = { text: string; value: string };

const TYPE_OPTIONS = [
  { label: '项目（project）', value: 'project' },
  { label: '地域（region）', value: 'region' },
  { label: '资源（resource）', value: 'resource' },
] as const;

// 模板变量查询编辑器：Dashboard → Variables → Query 时使用
export function VariableQueryEditor({ query, onChange, datasource }: Props) {
  const q: MyVariableQuery = { ...query, type: query?.type ?? 'project' };

  const [productOptions, setProductOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (q.type === 'region' || q.type === 'resource') {
      datasource.getResource<Option[]>('/products').then(setProductOptions).catch(() => setProductOptions([]));
    }
  }, [q.type, datasource]);

  const update = (patch: Partial<MyVariableQuery>) => {
    const next = { ...q, ...patch };
    onChange(next, `${next.type}${next.productKey ? `:${next.productKey}` : ''}`);
  };

  return (
    <Stack gap={1} direction="column">
      <InlineField label="查询类型" labelWidth={14}>
        <Select
          width={30}
          value={q.type}
          options={TYPE_OPTIONS as unknown as Array<{ label: string; value: MyVariableQuery['type'] }>}
          onChange={(e) =>
            update({
              type: (e.value ?? 'project') as MyVariableQuery['type'],
              productKey: undefined,
              region: undefined,
            })
          }
        />
      </InlineField>

      {(q.type === 'region' || q.type === 'resource') && (
        <InlineField label="产品类型" labelWidth={14}>
          <Select
            width={40}
            value={q.productKey}
            options={productOptions.map((it) => ({ label: it.text, value: it.value }))}
            onChange={(e) => update({ productKey: e?.value })}
            isSearchable
            placeholder="请选择产品类型"
          />
        </InlineField>
      )}

      {q.type === 'resource' && (
        <InlineField label="地域" labelWidth={14}>
          <Select
            width={40}
            value={q.region}
            options={[]}
            onChange={(e) => update({ region: e?.value })}
            placeholder="可选，填写后按地域过滤"
            allowCustomValue
          />
        </InlineField>
      )}
    </Stack>
  );
}
