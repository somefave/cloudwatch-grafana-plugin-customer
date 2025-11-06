import React, { useEffect, useState } from 'react';
import { InlineField, Combobox, Stack, TextArea } from '@grafana/ui';
import { MyQuery } from '../types';
import { DataSource } from '../datasource';

interface Props {
    onKeyChange: (key: string, value: any) => void;
    values: MyQuery;
    datasource: DataSource;
}

const calcMethodOptions = [
    { label: '原始值', value: 'raw' },
    { label: '平均值', value: 'avg' },
    { label: '最大值', value: 'max' },
    { label: '最小值', value: 'min' },
    { label: '求和值', value: 'sum' },
];

export function QueryNormal({ onKeyChange, values, datasource }: Props) {
    const { ProductKey, MetricKey, ResourceIds, Tags, CalcMethod, Region } = values;

    const [productOptions, setProductOptions] = useState<any[]>([]);
    const [metricOptions, setMetricOptions] = useState<any[]>([]);
    const [regionOptions, setRegionOptions] = useState<any[]>([]);

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

    useEffect(() => {
        if (ProductKey && ProductKey?.value) {
            datasource.getProductMetrics(ProductKey.value).then((res) => {
                if (res && res.length > 0) {
                    let result = res.map((item: any) => {
                        return {
                            label: item.Name?.EN + '(' + item.Name?.CN + ')',
                            value: item.Metric,
                        }
                    });
                    setMetricOptions(result);
                }
            });
        }
    }, [datasource, ProductKey]);

    useEffect(() => {
        datasource.ListRegion().then((res) => {
            if (res && res.length > 0) {
                let result = res.map((item: any) => {
                    return {
                        label: item.RegionCode + '(' + item.RegionName + ')',
                        value: item.RegionCode,
                    }
                });
                setRegionOptions(result);
            }
        });
    },[datasource])


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
            <InlineField label="地域" labelWidth={12}>
                <Combobox
                    value={Region}
                    onChange={(value) => onKeyChange('Region', value)}
                    options={regionOptions}
                    placeholder='请选择地域'
                />
            </InlineField>
            <InlineField label="指标" labelWidth={12}>
                <Combobox
                    value={MetricKey}
                    onChange={(value) => onKeyChange('MetricKey', value)}
                    options={metricOptions}
                    placeholder='请选择指标'
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