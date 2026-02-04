import { QueryEditorProps } from '@grafana/data';
import { InlineField, RadioButtonGroup, Stack } from '@grafana/ui';
import React, { useCallback, useEffect, useState } from 'react';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

import { CloudEagleCustom } from './CloudEagleCustom';
import { CloudEagleNormal } from './CloudEagleNormal';
import { QueryCustom } from './QueryCustom';
import { QueryNormal } from './QueryNormal';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {

  const { queryType, namespaceType } = query;


  const onKeyChange = useCallback((key: string, value: any) => {
    onChange({
      ...query,
      [key]: value,
    });
  }, [query, onChange])

  useEffect(() => {
    if (!queryType) {
      onKeyChange('queryType', 'normal');
    }
    if (!namespaceType) {
      onKeyChange('namespaceType', 'CloudWatch');
    }
  }, [queryType, namespaceType, onKeyChange])

  const [NamespaceOptions, setNamespaceOptions] = useState<any[]>([]);

  useEffect(() => {
    datasource.ListNamespace().then((res) => {
      if (res && res.length > 0) {
        setNamespaceOptions(res.map((item: any) => ({
          label: item.Name + '(' + item.Namespace + ')',
          value: item.Namespace,
        })));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return (
    <Stack gap={1} direction="column">
      <InlineField label="数据源" labelWidth={12}>
        <RadioButtonGroup
          value={namespaceType}
          onChange={(value) => onKeyChange('namespaceType', value)}
          options={[
            { label: 'CloudWatch', value: 'CloudWatch' },
            { label: 'CloudEagle', value: 'CloudEagle' },
          ]}
        />
      </InlineField>

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

      {queryType === 'normal' && namespaceType === 'CloudWatch' ? (
        // 普通查询
        <QueryNormal
          onKeyChange={onKeyChange}
          values={query}
          datasource={datasource}
        />
      ) : null}
      {queryType === 'custom' && namespaceType === 'CloudWatch' ? (
        // 自定义查询
        <QueryCustom
          onKeyChange={onKeyChange}
          values={query}
          datasource={datasource}
        />
      ) : null}
      {queryType === 'normal' && namespaceType === 'CloudEagle' ? (
        // 普通查询
        <CloudEagleNormal
          onKeyChange={onKeyChange}
          values={query}
          NamespaceOptions={NamespaceOptions}
          datasource={datasource}
        />
      ) : null}
      {queryType === 'custom' && namespaceType === 'CloudEagle' ? (
        // 自定义查询
        <CloudEagleCustom
          onKeyChange={onKeyChange}
          NamespaceOptions={NamespaceOptions}
          values={query}
          datasource={datasource}
        />
      ) : null}
    </Stack>
  );
}
