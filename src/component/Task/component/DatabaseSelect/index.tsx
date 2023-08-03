import { listDatabases } from '@/common/network/database';
import login from '@/store/login';
import { formatMessage } from '@/util/intl';
import { Form, Select, Space, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

interface IProps {
  label?: string;
  name?: string;
  projectId?: number;
  onChange?: (v: number) => void;
}

const { Text } = Typography;

const DatabaseSelect: React.FC<IProps> = (props) => {
  const {
    label = formatMessage({ id: 'odc.component.DatabaseSelect.Database' }), //数据库
    name = 'databaseId',
    projectId,
    onChange,
  } = props;
  const [database, setDatabase] = useState([]);
  const form = Form.useFormInstance();
  const databaseId = Form.useWatch(name, form);
  const databaseOptions = database?.map(({ name, id, environment, dataSource }) => ({
    label: (
      <Space size={2} data-label={name}>
        <Tag color={environment?.style?.toLowerCase()}>{environment?.name}</Tag>
        <span>{name}</span>
        <Text type="secondary">{dataSource.name}</Text>
      </Space>
    ),

    value: id,
  }));

  const loadDatabase = async (projectId: number) => {
    const res = await listDatabases(
      projectId,
      null,
      null,
      null,
      null,
      null,
      !!login.isPrivateSpace(),
    );
    setDatabase(res?.contents);
  };

  const handleDatabaseChange = (value) => {
    onChange?.(value);
  };

  const project = useMemo(() => {
    return database?.find((item) => item.id === databaseId)?.project;
  }, [database, databaseId]);

  useEffect(() => {
    loadDatabase(projectId);
  }, []);

  return (
    <Form.Item
      label={label}
      name={name}
      required
      extra={
        project &&
        formatMessage(
          {
            id: 'odc.component.DatabaseSelect.CurrentProjectProjectname',
          },
          { projectName: project.name },
        ) //`当前项目: ${project.name}`
      }
      rules={[
        {
          required: true,
          message: formatMessage({ id: 'odc.component.DatabaseSelect.SelectADatabase' }), //请选择数据库
        },
      ]}
    >
      <Select
        showSearch
        filterOption={(input, option) =>
          (option?.label?.props?.['data-label'] ?? '').toLowerCase().includes(input.toLowerCase())
        }
        placeholder={formatMessage({ id: 'odc.component.DatabaseSelect.PleaseSelect' })} /*请选择*/
        style={{ width: '320px' }}
        options={databaseOptions}
        onChange={handleDatabaseChange}
      />
    </Form.Item>
  );
};

export default DatabaseSelect;
