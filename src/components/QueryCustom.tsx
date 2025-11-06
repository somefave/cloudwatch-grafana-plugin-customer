import React from 'react';
import { Stack } from '@grafana/ui';
import { MyQuery } from '../types';


interface Props {
    onKeyChange: (key: string, value: any) => void;
    values: MyQuery;
  }

export function QueryCustom({ onKeyChange, values }: Props) {
    return (
        <Stack gap={1} direction="column">
            <span>自定义查询</span>
        </Stack>
    )
}