import React, { ChangeEvent } from 'react';
import { InlineField, Input } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions, MySecureJsonData> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData } = options;

  const onPathChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        path: event.target.value,
      },
    });
  };

  const onBaseURLChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newBaseUrl = event.target.value;
    onOptionsChange({
      ...options,
      url: newBaseUrl, // 同时更新 url 字段
      jsonData: { ...jsonData, baseUrl: newBaseUrl },
    });
  };

  const onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        apiKey: event.target.value,
      },
    });
  };

 

  return (
    <>
      <InlineField label="Base URL" labelWidth={14} interactive tooltip={'Json field returned to frontend'}>
        <Input
          id="config-editor-base-url"
          onChange={onBaseURLChange}
          value={jsonData.baseUrl || ''}
          placeholder="Enter the base URL, e.g. http://internal-api-test03.service.ucloud.cn"
          width={40}
        />
      </InlineField>
      
      <InlineField label="Path" labelWidth={14} interactive tooltip={'Json field returned to frontend'}>
        <Input
          id="config-editor-path"
          onChange={onPathChange}
          value={jsonData.path || ''}
          placeholder="Enter the path, e.g. /api/v1"
          width={40}
        />
      </InlineField>
      
      <InlineField label="API Key" labelWidth={14} interactive tooltip={'API Key for authentication'}>
        <Input
          id="config-editor-api-key"
          value={jsonData.apiKey || ''}
          placeholder="Enter your API key"
          width={40}
          onChange={onAPIKeyChange}
        />
      </InlineField>
    </>
  );
}
