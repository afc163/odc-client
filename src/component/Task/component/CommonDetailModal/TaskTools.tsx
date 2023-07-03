import {
  createTask,
  rollbackDataArchiveSubTask,
  startDataArchiveSubTask,
  stopDataArchiveSubTask,
} from '@/common/network/task';
import Action from '@/component/Action';
import {
  ICycleTaskRecord,
  ITaskResult,
  SubTaskStatus,
  TaskDetail,
  TaskRecord,
  TaskRecordParameters,
} from '@/d.ts';
import type { UserStore } from '@/store/login';
import type { ModalStore } from '@/store/modal';
import type { SettingStore } from '@/store/setting';
import type { TaskStore } from '@/store/task';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { message, Modal, Popconfirm, Tooltip } from 'antd';
import { inject, observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';

interface IProps {
  userStore?: UserStore;
  taskStore?: TaskStore;
  settingStore?: SettingStore;
  modalStore?: ModalStore;
  isDetailModal?: boolean;
  taskId: number;
  record: TaskRecord<TaskRecordParameters> | TaskDetail<TaskRecordParameters>;
  disabledSubmit?: boolean;
  result?: ITaskResult;
  onReloadList: () => void;
  onApprovalVisible: (
    task: TaskRecord<TaskRecordParameters> | ICycleTaskRecord,
    status: boolean,
    visible: boolean,
  ) => void;
  onDetailVisible: (record: TaskRecord<TaskRecordParameters>, visible: boolean) => void;
  onClose?: () => void;
}

const ActionBar: React.FC<IProps> = inject(
  'taskStore',
  'userStore',
  'settingStore',
  'modalStore',
)(
  observer((props) => {
    const {
      userStore: { user },
      isDetailModal,
      record,
      taskId,
    } = props;
    // const isOwner = user?.id === task?.creator?.id;
    const isOwner = true;
    const [activeBtnKey, setActiveBtnKey] = useState(null);

    const resetActiveBtnKey = () => {
      setActiveBtnKey(null);
    };

    const _stopTask = async () => {
      setActiveBtnKey('stop');
      const res = await stopDataArchiveSubTask(taskId, record.id);
      if (res) {
        message.success('取消成功');
        props.onReloadList();
      }
    };

    const confirmRollback = async () => {
      setActiveBtnKey('rollback');
      const res = await rollbackDataArchiveSubTask(taskId, record.id);
      if (res) {
        props.onReloadList();
        message.success('回滚成功');
      }
    };

    useEffect(() => {
      if (activeBtnKey) {
        resetActiveBtnKey();
      }
    }, [record?.status]);

    const handleRollback = async () => {
      Modal.confirm({
        title: '确定回滚任务吗？',
        icon: <ExclamationCircleOutlined />,
        content: '任务回滚后已执行的任务将重置',
        okText: '确认',
        cancelText: '取消',
        onOk: confirmRollback,
      });
    };

    const handleExecute = async () => {
      const res = await startDataArchiveSubTask(taskId, record.id);
      if (res) {
        message.success('执行成功');
      }
    };

    const handleReTry = async () => {
      const { type, connection, databaseName, executionStrategy, executionTime, parameters } =
        record;
      const res = await createTask({
        taskType: type,
        connectionId: connection?.id,
        executionStrategy,
        executionTime,
        databaseName,
        parameters,
      });

      if (res) {
        message.success('重试成功');
      }
    };

    const getTaskTools = (_task) => {
      let tools = [];

      if (!_task) {
        return [];
      }
      const { status } = _task;

      const rollbackBtn = {
        key: 'rollback',
        text: '回滚',
        action: handleRollback,
        type: 'button',
      };

      const stopBtn = {
        key: 'stop',
        text: '终止',
        action: _stopTask,
        type: 'button',
      };

      const executeBtn = {
        key: 'execute',
        text: '执行',
        type: 'button',
        action: handleExecute,
        isOpenBtn: true,
        isPrimary: isDetailModal,
        disabled: false,
        tooltip: '',
      };

      const reTryBtn = {
        key: 'reTry',
        text: '再次发起',
        type: 'button',
        action: handleReTry,
      };

      switch (status) {
        case SubTaskStatus.PREPARING: {
          tools = [];
          break;
        }
        case SubTaskStatus.RUNNING: {
          if (isOwner) {
            tools = [stopBtn];
          }
          break;
        }
        case SubTaskStatus.CANCELED: {
          if (isOwner) {
            tools = [executeBtn];
          }
          break;
        }
        case SubTaskStatus.DONE: {
          if (isOwner) {
            tools = [rollbackBtn];
          }
          break;
        }
        case SubTaskStatus.FAILED: {
          if (isOwner) {
            tools = [reTryBtn, rollbackBtn];
          }
          break;
        }
        default:
      }
      return tools;
    };

    const btnTools = getTaskTools(record).filter((item) => item?.type === 'button');

    const renderTool = (tool) => {
      const ActionButton = isDetailModal ? Action.Button : Action.Link;
      const disabled = activeBtnKey === tool?.key || tool?.disabled;
      if (tool.confirmText) {
        return (
          <Popconfirm title={tool.confirmText} onConfirm={tool.action}>
            <ActionButton disabled={disabled}>{tool.text}</ActionButton>
          </Popconfirm>
        );
      }

      if (tool.download) {
        return (
          <ActionButton disabled={disabled} onClick={tool.download}>
            {tool.text}
          </ActionButton>
        );
      }

      return (
        <ActionButton
          type={tool.isPrimary ? 'primary' : 'default'}
          disabled={disabled}
          onClick={tool.action}
          tooltip={isDetailModal ? tool?.tooltip : null}
        >
          <Tooltip placement="topRight" title={tool?.tooltip}>
            {tool.text}
          </Tooltip>
        </ActionButton>
      );
    };

    if (!btnTools?.length) {
      return <span>-</span>;
    }

    return (
      <Action.Group size={!isDetailModal ? 4 : 6}>
        {btnTools?.map((tool) => {
          return renderTool(tool);
        })}
      </Action.Group>
    );
  }),
);

export default ActionBar;