import { InlineField, Select, Stack, TextArea } from '@grafana/ui';
import React from 'react';
import { CalcMethodOptions, DefaultTagsTemplate } from '../config/enums';
import { DataSource } from '../datasource';
import { MyQuery } from '../types';
interface Props {
    onKeyChange: (key: string, value: any) => void;
    values: MyQuery;
    datasource: DataSource;
    NamespaceOptions: any[];
}

export function CloudEagleCustom({ onKeyChange, values, datasource, NamespaceOptions }: Props) {
    const { MetricInput, Tags, CalcMethod, Namespace, Cluster, ResourceUuid } = values;

    React.useEffect(() => {
        if (CalcMethod) { return; }
        onKeyChange('CalcMethod', 'raw');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [datasource, CalcMethod]);

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
                <TextArea
                    value={Cluster}
                    onChange={(e: any) => onKeyChange('Cluster', e.target.value)}
                    placeholder='请输入单个数据集群'
                />
            </InlineField>
            <InlineField label="指标" labelWidth={12}>
                <TextArea
                    value={MetricInput}
                    onChange={(e: any) => onKeyChange('MetricInput', e.target.value)}
                    placeholder='请输入指标唯一标识，多个指标用英文逗号分隔'
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
                    value={CalcMethod}
                    onChange={(e) => onKeyChange('CalcMethod', e.value)}
                    options={CalcMethodOptions}
                    placeholder='请选择聚合方式'
                />
            </InlineField>
        </Stack>
    )
}
