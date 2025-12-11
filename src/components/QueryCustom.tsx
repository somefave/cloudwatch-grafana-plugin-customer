import React, { useEffect, useState } from 'react';
import { Select, InlineField, Stack, TextArea } from '@grafana/ui';
import { MyQuery } from '../types';
import { DataSource } from '../datasource';
import { CalcMethodOptions, DefaultTagsTemplate } from '../config/enums';
interface Props {
    onKeyChange: (key: string, value: any) => void;
    values: MyQuery;
    datasource: DataSource;
}

export function QueryCustom({ onKeyChange, values, datasource }: Props) {
    const { ProductKey, Region, MetricInput, ResourceIds, Tags, CalcMethod } = values;

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
                <Select
                    value={ProductKey}
                    onChange={(e) => onKeyChange('ProductKey', e.value)}
                    options={productOptions}
                    placeholder='请选择产品'
                />
            </InlineField>
            <InlineField label="聚合方式" labelWidth={12}>
                <Select
                    value={CalcMethod}
                    onChange={(e) => onKeyChange('CalcMethod', e.value)}
                    options={CalcMethodOptions}
                    placeholder='请选择聚合方式'
                />
            </InlineField>
            <InlineField label="地域" labelWidth={12}>
                <TextArea
                    value={Region}
                    onChange={(e: any) => onKeyChange('Region', e.target.value)}
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
            <InlineField label="标签" labelWidth={12} tooltip={`请输入规范的json数组格式,参考格式-->  ${DefaultTagsTemplate}`}>
                <TextArea
                    value={Tags}
                    onChange={(e: any) => onKeyChange('Tags', e.target.value)}
                    placeholder={`请输入规范的json数组格式,参考格式-->  ${DefaultTagsTemplate}`}
                    style={{ width: 600, height: 200 }}
                />
            </InlineField>
        </Stack>
    )
}
