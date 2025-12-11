import React, { useEffect, useState } from 'react';
import { InlineField, Stack, TextArea, Select } from '@grafana/ui';
import { MyQuery } from '../types';
import { DataSource } from '../datasource';
import { CalcMethodOptions, DefaultTagsTemplate } from '../config/enums';

interface Props {
    onKeyChange: (key: string, value: any) => void;
    values: MyQuery;
    datasource: DataSource;
}


export function QueryNormal({ onKeyChange, values, datasource }: Props) {
    const {
        ProductKey,
        MetricKey,
        ResourceIds,
        Tags,
        CalcMethod,
        Region
    } = values;

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
        if (ProductKey) {
            datasource.getProductMetrics(ProductKey).then((res) => {
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
    }, [datasource])


    return (
        <Stack gap={1} direction="column">
            <InlineField label="产品" labelWidth={12}>
                <Select
                    width={40}
                    value={ProductKey}
                    onChange={(e) => onKeyChange('ProductKey', e.value)}
                    options={productOptions}
                    placeholder='请选择产品'
                />
            </InlineField>
            <InlineField label="地域" labelWidth={12}>
                <Select
                    width={40}
                    value={Region}
                    onChange={(e) => onKeyChange('Region', e.value)}
                    options={regionOptions}
                    placeholder='请选择地域'
                />
            </InlineField>
            <InlineField label="指标" labelWidth={12}>
                <Select
                    width={40}
                    value={MetricKey}
                    onChange={(e) => onKeyChange('MetricKey', e.value)}
                    options={metricOptions}
                    placeholder='请选择指标'
                />
            </InlineField>
            <InlineField label="聚合方式" labelWidth={12}>
                <Select
                    width={40}
                    value={CalcMethod}
                    onChange={(e) => onKeyChange('CalcMethod', e.value)}
                    options={CalcMethodOptions}
                    placeholder='请选择聚合方式'
                />
            </InlineField>
            <InlineField label="资源" labelWidth={12}>
                <TextArea
                    value={ResourceIds || ''}
                    onChange={(e: any) => onKeyChange('ResourceIds', e.target.value)}
                    placeholder='请输入短资源ID, 多个ID用逗号分隔'
                    style={{ width: 600, height: 200 }}
                />
            </InlineField>
            <InlineField label="标签" labelWidth={12} tooltip={`请输入规范的json数组格式,参考格式-->  ${DefaultTagsTemplate}`}>
                <TextArea
                    value={Tags || ''}
                    onChange={(e: any) => onKeyChange('Tags', e.target.value)}
                    placeholder={`请输入规范的json数组格式,参考格式-->  ${DefaultTagsTemplate}`}
                    style={{ width: 600, height: 200 }}
                />
            </InlineField>
        </Stack>
    )
}
