import React, { useState } from 'react';
import { InlineField, TextArea } from '@grafana/ui';
import { MyVariableQuery } from '../types';

interface Props {
  query: MyVariableQuery | string;
  onChange: (query: MyVariableQuery, definition: string) => void;
}

// 模板变量查询编辑器：Dashboard → Variables → Query 时使用
// 用户手写 JSON 配置，参考火山云格式
export function VariableQueryEditor({ query, onChange }: Props) {
  // 兼容旧版本字符串形式或空对象
  const initialStr = typeof query === 'string' ? query : JSON.stringify(query || { type: 'project' }, null, 2);
  const [value, setValue] = useState(initialStr);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    try {
      const parsed = JSON.parse(newValue) as MyVariableQuery;
      onChange(parsed, newValue);
    } catch {
      // 用户输入未完成时可能不是合法 JSON，暂不更新
    }
  };

  return (
    <InlineField
      label="查询配置"
      labelWidth={14}
      grow
      tooltip='手写 JSON 配置。示例：
项目：{"type": "project"}
地域：{"type": "region"}
资源：{"type": "resource", "params": {"product": "uhost", "region": "${region}", "project": "${project}"}}'
    >
      <TextArea
        value={value}
        onChange={(e) => handleChange(e.currentTarget.value)}
        placeholder='{"type": "project"}'
        rows={6}
      />
    </InlineField>
  );
}
