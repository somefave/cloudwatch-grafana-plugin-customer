import { InlineField, Select, Stack, TextArea } from '@grafana/ui';
import React, { useCallback, useEffect, useState } from 'react';
import { CalcMethodOptions, DefaultTagsTemplate } from '../config/enums';
import { DataSource } from '../datasource';
import { MyQuery } from '../types';

interface Props {
    onKeyChange: (key: string, value: any) => void;
    values: MyQuery;
    datasource: DataSource;
    NamespaceOptions: any[];
}


export function CloudEagleNormal({ onKeyChange, values, datasource, NamespaceOptions }: Props) {
    const {
        MetricKey,
        Tags,
        CalcMethod,
        Namespace,
        Cluster,
        CategoryKey,
        ResourceUuid
    } = values;

    React.useEffect(() => {
        if (CalcMethod) { return; }
        onKeyChange('CalcMethod', 'raw');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [datasource, CalcMethod]);


    const [clusterOptions, setClusterOptions] = useState<any[]>([]);
    useEffect(() => {
        datasource.ListCluster().then((res) => {
            if (res && res.length > 0) {
                let result = res.map((item: any) => {
                    return {
                        label: item.ClusterName + '(' + item.Cluster + ')',
                        value: item.Cluster,
                    }
                });
                setClusterOptions(result);
            }
        });

    }, [datasource]);


    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
    const getCategoryOptions = useCallback(() => {
        if (!values.Namespace) {
            return;
        }
        datasource.ListResourceCategory({ Namespace: values.Namespace }).then((res) => {
            if (res && res.length > 0) {
                let result = res.map((item: any) => {
                    return {
                        label: item.Name + '(' + item.CategoryKey + ')',
                        value: item.CategoryKey,
                    }
                });
                setCategoryOptions(result);

            }
        });
    }, [datasource, values.Namespace]);

    // 命名空间变化时，清空对象类型，重新获取对象类型
    useEffect(() => {
        if (Namespace) {
            getCategoryOptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [datasource, Namespace])

    const [metricListOptions, setMetricListOptions] = useState<any[]>([]);
    const getMetricOptions = useCallback(() => {
        if (!values.CategoryKey || !values.Namespace) {
            return;
        }
        datasource.ListMetric({ filter: { CategoryKeys: [values.CategoryKey], Namespaces: [values.Namespace] } }).then((res) => {
            if (res && res.length > 0) {
                let result = res.map((item: any) => {
                    return {
                        label: item.Name + '(' + item.Metric + ')',
                        value: item.Metric,
                    }
                });
                setMetricListOptions(result);

            }
        });
    }, [datasource, values]);

    useEffect(() => {
        // onKeyChange('MetricKey', '');
        if (values.CategoryKey && values.Namespace) {
            getMetricOptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [datasource, values.CategoryKey, values.Namespace])



    return (
        <Stack gap={1} direction="column">
            <InlineField label="命名空间" labelWidth={12}>
                <Select
                    value={Namespace}
                    onChange={(e) => onKeyChange('Namespace', e.value)}
                    options={NamespaceOptions}
                    placeholder='请选择命名空间'
                />
            </InlineField>
            <InlineField label="数据集群" labelWidth={12}>
                <Select
                    value={Cluster}
                    onChange={(e) => onKeyChange('Cluster', e.value)}
                    options={clusterOptions}
                    placeholder='请选择数据集群'
                />
            </InlineField>
            <InlineField label="对象类型" labelWidth={12}>
                <Select
                    value={CategoryKey}
                    onChange={(e) => onKeyChange('CategoryKey', e.value)}
                    options={categoryOptions}
                    placeholder='请选择对象类型'
                />
            </InlineField>
            <InlineField key="CloudEagle" label="指标" labelWidth={12}>
                <Select
                    width={40}
                    value={MetricKey}
                    onChange={(e) => onKeyChange('MetricKey', e.value)}
                    options={metricListOptions}
                    placeholder='请选择指标'
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
            <InlineField label="监控对象" labelWidth={12}>
                <TextArea
                    value={ResourceUuid}
                    onChange={(e: any) => onKeyChange('ResourceUuid', e.target.value)}
                    placeholder='请输入对象Id，多个对象用英文逗号分隔'
                    style={{ width: 600, height: 200 }}
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
        </Stack>
    )
}
