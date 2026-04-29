import React, { ChangeEvent } from 'react';
import { InlineField, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions, MySecureJsonData> {}

const DEFAULT_BASE_URL = 'https://api.ucloud.cn';

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;

  const onPublicKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: { ...jsonData, publicKey: event.target.value },
    });
  };

  const onBaseUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: { ...jsonData, baseUrl: event.target.value },
    });
  };

  const onPrivateKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...(secureJsonData ?? {}),
        privateKey: event.target.value,
      },
    });
  };

  const onResetPrivateKey = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...secureJsonFields,
        privateKey: false,
      },
      secureJsonData: {
        ...(secureJsonData ?? {}),
        privateKey: '',
      },
    });
  };

  return (
    <>
      <InlineField
        label="PublicKey"
        labelWidth={14}
        interactive
        tooltip="UCloud API 公钥，可在 UAPI 密钥管理页面获取"
      >
        <Input
          id="config-editor-public-key"
          onChange={onPublicKeyChange}
          value={jsonData.publicKey || ''}
          placeholder="请输入 PublicKey"
          width={60}
        />
      </InlineField>

      <InlineField
        label="PrivateKey"
        labelWidth={14}
        interactive
        tooltip="UCloud API 私钥，加密存储于服务端，不会出现在前端请求中"
      >
        <SecretInput
          id="config-editor-private-key"
          isConfigured={Boolean(secureJsonFields?.privateKey)}
          value={secureJsonData?.privateKey ?? ''}
          placeholder="请输入 PrivateKey"
          width={60}
          onChange={onPrivateKeyChange}
          onReset={onResetPrivateKey}
        />
      </InlineField>

      <InlineField
        label="Base URL"
        labelWidth={14}
        interactive
        tooltip="UCloud OpenAPI 入口地址，默认 https://api.ucloud.cn"
      >
        <Input
          id="config-editor-base-url"
          onChange={onBaseUrlChange}
          value={jsonData.baseUrl || ''}
          placeholder={DEFAULT_BASE_URL}
          width={60}
        />
      </InlineField>
    </>
  );
}
