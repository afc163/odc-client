import { ConnectType } from '@/d.ts';
import { ClusterStore } from '@/store/cluster';
import { formatMessage } from '@/util/intl';
import { Cascader, Form, Input, Space, Typography } from 'antd';
import { inject, observer } from 'mobx-react';
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

interface IProps {
  disabled?: boolean;
  clusterStore?: ClusterStore;
  handleChangeFormData: (values: Record<string, any>) => void;
}

const RefInput = forwardRef<any, any>(function ({ value, onChange }, ref) {
  useImperativeHandle(
    ref,
    () => {
      return {
        onChange(v) {
          return onChange?.(v);
        },
      };
    },
    [onChange],
  );

  return <Input disabled style={{ display: 'none' }} value={value} onChange={onChange} />;
});

const InstanceSelect: React.FC<IProps> = function ({
  clusterStore,
  disabled,
  handleChangeFormData,
}) {
  const { clusterList, tenantListMap } = clusterStore;
  const clusterRef = useRef<any>();
  const tenantRef = useRef<any>();

  const options = useMemo(() => {
    let result = [];

    clusterList
      .filter((c) => c.status === 'ONLINE')
      .forEach((cluster) => {
        const tenants = tenantListMap[cluster.instanceId];
        if (cluster.type !== 'CLUSTER') {
          result.push({
            value: cluster.instanceId,
            label: cluster.instanceName,
            isLeaf: true,
          });
        } else {
          result.push({
            value: cluster.instanceId,
            label: cluster.instanceName,
            isLeaf: false,
            children: tenants?.map((tenant) => ({
              value: tenant.tenantId,
              label: tenant.tenantName,
            })),
          });
        }
      });
    return result;
  }, [clusterList, tenantListMap]);

  return (
    <>
      <Form.Item noStyle shouldUpdate>
        {({ getFieldValue }) => {
          const mode = getFieldValue('type');
          const clusterName = getFieldValue('clusterName');
          let modeText = '';
          if (clusterName) {
            modeText =
              formatMessage({ id: 'odc.cloud.InstanceSelect.Mode' }) + //`模式：`
              (mode === ConnectType.OB_MYSQL ? 'MySQL' : 'Oracle');
          }
          return (
            <Form.Item help={modeText} shouldUpdate>
              {({ getFieldValue, getFieldsError }) => {
                const cluster = getFieldValue('clusterName');
                const tenant = getFieldValue('tenantName');
                const haveError = !!getFieldsError(['clusterName', 'tenantName'])
                  ?.map((e) => e.errors?.length)
                  .filter(Boolean)?.length;
                let innerValue = [];
                if (clusterList.find((c) => c.instanceId === tenant)) {
                  /**
                   * 租户实例的情况下，去除cluster
                   */
                  innerValue = [tenant].filter(Boolean);
                } else {
                  innerValue = [cluster, tenant].filter(Boolean);
                }
                function onChange({ tenantId, cluster }) {
                  const tenantMode = tenantListMap[cluster]?.find(
                    (t) => t.tenantId === tenantId,
                  )?.tenantMode;
                  handleChangeFormData({
                    clusterName: cluster,
                    tenantName: tenantId,
                    type: tenantMode === 'MySQL' ? ConnectType.OB_MYSQL : ConnectType.OB_ORACLE,
                    username: null,
                    readonlyUsername: null,
                  });

                  new Promise((resolve) => {
                    clusterRef.current?.onChange?.(cluster);
                    resolve(true);
                  }).then(() => {
                    tenantRef.current?.onChange?.(tenantId);
                  });
                }
                return (
                  <Space style={{ width: '100%' }} direction="vertical">
                    <Cascader
                      showSearch={{
                        filter: (inputValue, path) => {
                          return path.some(
                            (option) =>
                              (option.label as string)
                                .toLowerCase()
                                .indexOf(inputValue.toLowerCase()) > -1,
                          );
                        },
                      }}
                      options={options}
                      disabled={disabled}
                      value={innerValue}
                      loadData={(selectedOptions) => {
                        const clusterId = selectedOptions?.[0]?.value as string;
                        if (clusterId) {
                          clusterStore.loadClusterTenants(clusterId);
                        }
                      }}
                      onChange={(v) => {
                        if (!v) {
                          onChange({
                            tenantId: null,
                            cluster: null,
                          });

                          return;
                        }
                        let cluster, tenant;
                        if (v.length === 1) {
                          cluster = v[0];
                          tenant = v[0];
                        } else {
                          cluster = v[0];
                          tenant = v[1];
                        }
                        onChange({
                          cluster,
                          tenantId: tenant,
                        });

                        clusterStore.loadTenantDBUsers(cluster, tenant);
                      }}
                    />

                    {haveError ? (
                      <Typography.Text type="danger">
                        {
                          formatMessage({
                            id: 'odc.cloud.InstanceSelect.SelectAConnectionInstance',
                          }) /*请选择连接实例*/
                        }
                      </Typography.Text>
                    ) : null}
                  </Space>
                );
              }}
            </Form.Item>
          );
        }}
      </Form.Item>
      <Form.Item rules={[{ required: true, message: '' }]} name="clusterName" noStyle>
        <RefInput ref={clusterRef} />
      </Form.Item>
      <Form.Item rules={[{ required: true, message: '' }]} name="tenantName" noStyle>
        <RefInput ref={tenantRef} />
      </Form.Item>
    </>
  );
};

export default inject('clusterStore')(observer(InstanceSelect));
