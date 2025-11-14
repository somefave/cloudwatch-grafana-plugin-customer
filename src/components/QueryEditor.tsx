import React from 'react';
import { InlineField, Stack, RadioButtonGroup } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

import { QueryNormal } from './QueryNormal';
import { QueryCustom } from './QueryCustom';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const { queryType = 'normal' } = query;

  const onKeyChange = (key: string, value: any) => {
    onChange({
      ...query,
      [key]: value,
    });
  }

  return (
    <Stack gap={1} direction="column">
      <InlineField label="查询类型" labelWidth={12}>
        <RadioButtonGroup
          value={queryType}
          onChange={(value) => onKeyChange('queryType', value)}
          options={[
            { label: '普通查询', value: 'normal' },
            { label: '自定义查询', value: 'custom' },
          ]}
        />
      </InlineField>
      {queryType === 'normal' ? <QueryNormal onKeyChange={onKeyChange} values={query} datasource={datasource} /> : <QueryCustom onKeyChange={onKeyChange} values={query} datasource={datasource} />}
    </Stack>
  );
}
