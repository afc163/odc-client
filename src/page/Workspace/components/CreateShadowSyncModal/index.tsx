import { ModalStore } from '@/store/modal';
import schema from '@/store/schema';
import { formatMessage } from '@/util/intl';
import { Button, Drawer, Modal, Space } from 'antd';
import { inject, observer } from 'mobx-react';
import React, { useMemo, useRef, useState } from 'react';
import { ErrorStrategy, IShaodwSyncData } from './interface';
import SelectPanel from './SelectPanel';
import StructConfigPanel from './StructConfigPanel';

import { createTask } from '@/common/network/task';
import { TaskExecStrategy, TaskPageScope, TaskPageType, TaskType } from '@/d.ts';
import connection from '@/store/connection';
import { openTasksPage } from '@/store/helper/page';
import styles from './index.less';

interface IProps {
  modalStore?: ModalStore;
}

enum StepKeys {
  SELECT,
  CONFIG,
}

const steps = [
  {
    key: StepKeys.SELECT,
    name: formatMessage({
      id: 'odc.components.CreateShadowSyncModal.SelectObject',
    }), //选择对象
    Component: SelectPanel,
  },

  {
    key: StepKeys.CONFIG,
    name: formatMessage({
      id: 'odc.components.CreateShadowSyncModal.StructuralAnalysis',
    }), //结构分析
    Component: StructConfigPanel,
  },
];

const defaultData: IShaodwSyncData = {
  schemaName: '',
  syncAll: false,
  prefix: true,
  name: '_test_',
  originTableNames: new Set(),
  executionStrategy: TaskExecStrategy.AUTO,
  executionTime: null,
  errorStrategy: ErrorStrategy.ABORT,
};

const CreateShadowSyncModal: React.FC<IProps> = function ({ modalStore }) {
  const [isChanged, setIsChanged] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [nextLoading, setNextLoading] = useState(false);
  const [data, _setData] = useState({
    ...defaultData,
    schemaName: schema.database?.name,
  });
  function setData(v) {
    _setData(v);
    if (!isChanged) {
      setIsChanged(true);
    }
  }
  const contentRef = useRef<{
    next: () => Promise<boolean>;
  }>();

  const [prevStep, currentStep, nextStep] = useMemo(() => {
    return [steps[stepIdx - 1], steps[stepIdx], steps[stepIdx + 1]];
  }, [stepIdx]);
  const Content = currentStep?.Component;
  const nextStepName = nextStep?.name;
  const prevStepName = prevStep?.name;

  function close(force: boolean = false) {
    if (isChanged && !force) {
      Modal.confirm({
        title: formatMessage({
          id: 'odc.components.CreateShadowSyncModal.AreYouSureYouWant',
        }), //确认取消影子表同步吗？
        centered: true,
        onOk: () => {
          modalStore.changeShadowSyncVisible(false);
        },
      });
    } else {
      modalStore.changeShadowSyncVisible(false);
    }
  }
  async function submit() {
    const taskId = data.shadowAnalysisData?.id;
    if (!taskId) {
      return false;
    }
    const isSuccess = await createTask({
      taskType: TaskType.SHADOW,
      executionStrategy: data.executionStrategy,
      executionTime:
        data.executionStrategy === TaskExecStrategy.TIMER ? data.executionTime : undefined,
      databaseName: data.schemaName,
      connectionId: connection?.connection?.id,
      description: data.description,
      parameters: {
        errorStrategy: data.errorStrategy,
        connectionId: connection?.connection?.id,
        schemaName: data.schemaName,
        comparingTaskId: data.shadowAnalysisData?.id,
      },
    });

    if (!isSuccess) {
      return;
    }
    close(true);
    openTasksPage(TaskPageType.SHADOW, TaskPageScope.CREATED_BY_CURRENT_USER);
  }
  return (
    <Drawer
      className={styles.drawer}
      visible={modalStore.addShadowSyncVisible}
      onClose={() => close()}
      width={720}
      title={formatMessage({
        id: 'odc.components.CreateShadowSyncModal.CreateAShadowTableSynchronization',
      })} /*新建影子表同步*/
      footer={
        <Space>
          <Button
            onClick={() => {
              if (prevStep) {
                setStepIdx(stepIdx - 1);
              } else {
                close();
              }
            }}
          >
            {
              prevStep
                ? formatMessage(
                    {
                      id: 'odc.components.CreateShadowSyncModal.PreviousStepPrevstepname',
                    },
                    { prevStepName: prevStepName },
                  ) //`上一步: ${prevStepName}`
                : formatMessage({
                    id: 'odc.components.CreateShadowSyncModal.Cancel',
                  }) //取消
            }
          </Button>
          <Button
            type="primary"
            loading={nextLoading}
            onClick={async () => {
              setNextLoading(true);
              try {
                const isSuccess = await contentRef.current.next();
                if (!isSuccess) {
                  return;
                }
                if (nextStep) {
                  setStepIdx(stepIdx + 1);
                } else {
                  submit();
                }
              } catch (e) {
                console.error(e);
              } finally {
                setNextLoading(false);
              }
            }}
          >
            {
              nextStep
                ? formatMessage(
                    {
                      id: 'odc.components.CreateShadowSyncModal.NextStepNextstepname',
                    },
                    { nextStepName: nextStepName },
                  ) //`下一步: ${nextStepName}`
                : formatMessage({
                    id: 'odc.components.CreateShadowSyncModal.Submit',
                  }) //提交
            }
          </Button>
        </Space>
      }
    >
      <Content data={data} setData={setData} ref={contentRef} />
    </Drawer>
  );
};

export default inject('modalStore')(observer(CreateShadowSyncModal));
