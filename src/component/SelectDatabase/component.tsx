import { getConnectionList } from '@/common/network/connection';
import { useRequest } from 'ahooks';
import { Form, Modal, Select } from 'antd';

interface IProps {
  open: boolean;
  onOk: (v: number) => void;
  onClose: () => void;
}

export default function SelectModal({ open, onOk, onClose }: IProps) {
  const { data, loading } = useRequest(getConnectionList, {
    defaultParams: [
      {
        page: 1,
        size: 9999,
      },
    ],
  });
  const [form] = Form.useForm<{ dataSourceId: number }>();

  return (
    <Modal
      title="选择数据源"
      open={open}
      onCancel={onClose}
      onOk={async () => {
        const data = await form.validateFields();
        if (!data?.dataSourceId) {
          return;
        }
        onOk(data?.dataSourceId);
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item name={'dataSourceId'} rules={[{ required: true }]} label="数据源">
          <Select
            showSearch
            optionFilterProp="children"
            loading={loading}
            placeholder="请选择"
            style={{ width: 320 }}
          >
            {data?.contents?.map((item) => {
              return (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}