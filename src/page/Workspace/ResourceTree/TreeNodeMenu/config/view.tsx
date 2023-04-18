import { deleteView, getView } from '@/common/network/view';
import { actionTypes } from '@/component/Acess';
import { copyObj } from '@/component/TemplateInsertModal';
import { DbObjectType, DragInsertType, IView, ResourceTreeNodeMenuKeys } from '@/d.ts';
import { TopTab } from '@/page/Workspace/components/ViewPage';
import { openCreateViewPage, openViewViewPage } from '@/store/helper/page';
import modal from '@/store/modal';
import page from '@/store/page';
import { formatMessage } from '@/util/intl';
import { downloadPLDDL } from '@/util/sqlExport';
import { QuestionCircleFilled } from '@ant-design/icons';
import { message, Modal } from 'antd';
import { ResourceNodeType } from '../../type';
import { IMenuItemConfig } from '../type';

export const viewMenusConfig: Partial<Record<ResourceNodeType, IMenuItemConfig[]>> = {
  [ResourceNodeType.View]: [
    {
      key: ResourceTreeNodeMenuKeys.BROWSER_SCHEMA,
      text: [formatMessage({ id: 'odc.TreeNodeMenu.config.view.ViewViewProperties' })],
      run(session, node) {
        const view = node.data as IView;
        openViewViewPage(view.viewName, TopTab.PROPS);
      },
    },

    {
      key: ResourceTreeNodeMenuKeys.BROWSER_DATA,
      text: [formatMessage({ id: 'odc.TreeNodeMenu.config.view.ViewViewData' })],
      hasDivider: true,
      run(session, node) {
        const view = node.data as IView;
        openViewViewPage(view.viewName, TopTab.DATA);
      },
    },

    {
      key: ResourceTreeNodeMenuKeys.CREATE_VIEW,
      text: [formatMessage({ id: 'odc.TreeNodeMenu.config.view.CreateAView' })],
      hasDivider: true,
      actionType: actionTypes.create,
      run(session, node) {
        openCreateViewPage();
      },
    },

    {
      key: ResourceTreeNodeMenuKeys.EXPORT_TABLE,
      text: formatMessage({ id: 'odc.TreeNodeMenu.config.view.Export' }), //导出
      run(session, node) {
        const view = node.data as IView;
        modal.changeExportModal(true, {
          type: DbObjectType.view,
          name: view.viewName,
        });
      },
    },
    {
      key: ResourceTreeNodeMenuKeys.DOWNLOAD,
      text: formatMessage({ id: 'odc.TreeNodeMenu.config.view.Download' }), //下载
      async run(session, node) {
        const view = node.data as IView;
        const viewObj = await getView(view.viewName, session.sessionId, session.database?.dbName);
        if (viewObj) {
          downloadPLDDL(view.viewName, 'VIEW', viewObj.ddl, session?.database?.dbName);
        }
      },
    },
    {
      key: ResourceTreeNodeMenuKeys.COPY,
      text: [
        formatMessage({ id: 'odc.TreeNodeMenu.config.view.Copy' }), //复制
      ],
      hasDivider: true,
      children: [
        {
          key: ResourceTreeNodeMenuKeys.COPY_NAME,
          text: [
            formatMessage({ id: 'odc.TreeNodeMenu.config.view.ObjectName' }), //对象名
          ],
          async run(session, node) {
            const view = node.data as IView;
            copyObj(view?.viewName, DbObjectType.view, DragInsertType.NAME, session.sessionId);
          },
        },

        {
          key: ResourceTreeNodeMenuKeys.COPY_SELECT,
          text: [
            formatMessage({
              id: 'odc.TreeNodeMenu.config.view.SelectStatement',
            }),

            //SELECT 语句
          ],
          async run(session, node) {
            const view = node.data as IView;
            copyObj(view?.viewName, DbObjectType.view, DragInsertType.SELECT, session.sessionId);
          },
        },

        {
          key: ResourceTreeNodeMenuKeys.COPY_INSERT,
          text: [
            formatMessage({
              id: 'odc.TreeNodeMenu.config.view.InsertStatement',
            }),

            //INSERT 语句
          ],
          async run(session, node) {
            const view = node.data as IView;
            copyObj(view?.viewName, DbObjectType.view, DragInsertType.INSERT, session.sessionId);
          },
        },

        {
          key: ResourceTreeNodeMenuKeys.COPY_UPDATE,
          text: [
            formatMessage({
              id: 'odc.TreeNodeMenu.config.view.UpdateStatement',
            }),

            //UPDATE 语句
          ],
          async run(session, node) {
            const view = node.data as IView;
            copyObj(view?.viewName, DbObjectType.view, DragInsertType.UPDATE, session.sessionId);
          },
        },

        {
          key: ResourceTreeNodeMenuKeys.COPY_DELETE,
          text: [
            formatMessage({
              id: 'odc.TreeNodeMenu.config.view.DeleteStatement',
            }),

            //DELETE 语句
          ],
          async run(session, node) {
            const view = node.data as IView;
            copyObj(view?.viewName, DbObjectType.view, DragInsertType.DELETE, session.sessionId);
          },
        },
      ],
    },

    {
      key: ResourceTreeNodeMenuKeys.DELETE_TABLE,
      text: [formatMessage({ id: 'odc.TreeNodeMenu.config.view.Delete' })],
      actionType: actionTypes.delete,
      run(session, node) {
        const view = node.data as IView;
        Modal.confirm({
          title: formatMessage(
            { id: 'workspace.window.createView.model.delete' },
            { name: view.viewName },
          ),
          okText: formatMessage({ id: 'app.button.ok' }),
          cancelText: formatMessage({ id: 'app.button.cancel' }),
          icon: <QuestionCircleFilled />,
          centered: true,
          onOk: async () => {
            const isSuccess = await deleteView(
              view.viewName,
              session.sessionId,
              session?.database?.dbName,
            );
            if (!isSuccess) {
              return;
            }
            await session.database.getViewList();
            message.success(
              formatMessage({
                id: 'odc.components.ResourceTree.ViewTree.TheViewHasBeenDeleted',
              }),
            );

            // TODO：如果当前有视图详情页面，需要关闭
            const openedPage = page!.pages.find((p) => p.params.viewName === view.viewName);
            if (openedPage) {
              page!.close(openedPage.key);
            }
          },
        });
      },
    },
  ],
};
