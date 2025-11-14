import React, { useEffect, useState } from 'react';
import { Combobox, InlineField, Stack, TextArea } from '@grafana/ui';
import { MyQuery } from '../types';
import { DataSource } from '../datasource';

const calcMethodOptions = [
    { label: '原始值', value: 'raw' },
    { label: '平均值', value: 'avg' },
    { label: '最大值', value: 'max' },
    { label: '最小值', value: 'min' },
    { label: '求和值', value: 'sum' },
];
interface Props {
    onKeyChange: (key: string, value: any) => void;
    values: MyQuery;
    datasource: DataSource;
  }

export function QueryCustom({ onKeyChange, values, datasource }: Props) {
    const { ProductKey, RegionInput, MetricInput, ResourceIds, Tags, CalcMethod } = values;

    const [productOptions, setProductOptions] = useState<any[]>([]);

    useEffect(() => {
        datasource.getProductTypes().then((res) => {
            if (res && res.length > 0) {
                let result = res.map((item: any) => {
                    return {
                        label: item.ProductName + '(' + item.ProductCnName + ')',
                        value: item.ProductKey,
                    }
                });
                setProductOptions(result);
            }
        });
    }, [datasource]);
    
    return (
        <Stack gap={1} direction="column">
            <InlineField label="产品" labelWidth={12}>
                <Combobox
                    value={ProductKey}
                    onChange={(value) => onKeyChange('ProductKey', value)}
                    options={productOptions}
                    placeholder='请选择产品'
                />
            </InlineField>
            <InlineField label="聚合方式" labelWidth={12}>
                <Combobox
                    value={CalcMethod}
                    onChange={(value) => onKeyChange('CalcMethod', value)}
                    options={calcMethodOptions}
                    placeholder='请选择聚合方式'
                />
            </InlineField>
            <InlineField label="地域" labelWidth={12}>
                <TextArea
                    value={RegionInput}
                    onChange={(e: any) => onKeyChange('RegionInput', e.target.value)}
                    placeholder='请输入单个地域'
                    style={{ width: 200, height: 50 }}
                />
            </InlineField>
            <InlineField label="指标" labelWidth={12}>
                <TextArea
                    value={MetricInput}
                    onChange={(e: any) => onKeyChange('MetricInput', e.target.value)}
                    placeholder='请输入指标, 多个指标用逗号分隔'
                    style={{ width: 600, height: 200 }}
                />
            </InlineField>
            <InlineField label="资源" labelWidth={12}>
                <TextArea
                    value={ResourceIds}
                    onChange={(e: any) => onKeyChange('ResourceIds', e.target.value)}
                    placeholder='请输入短资源ID, 多个ID用逗号分隔'
                    style={{ width: 600, height: 200 }}
                />
            </InlineField>
            <InlineField label="标签" labelWidth={12}>
                <TextArea
                    value={Tags}
                    onChange={(e: any) => onKeyChange('Tags', e.target.value)}
                    placeholder='请输入标签, 多个标签用逗号分隔'
                    style={{ width: 600, height: 200 }}
                />
            </InlineField>
        </Stack>
    )
}