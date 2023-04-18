import { deleteSynonym, getSynonym } from '@/common/network/synonym';
import { actionTypes } from '@/component/Acess';
import { PLType } from '@/constant/plType';
import { DbObjectType, ISynonym, ResourceTreeNodeMenuKeys, SynonymType } from '@/d.ts';
import { openSynonymViewPage } from '@/store/helper/page';
import modal from '@/store/modal';
import page from '@/store/page';
import { formatMessage } from '@/util/intl';
import { downloadPLDDL } from '@/util/sqlExport';
import { QuestionCircleFilled } from '@ant-design/icons';
import { message, Modal } from 'antd';
import { ResourceNodeType } from '../../type';
import { IMenuItemConfig } from '../type';
function getMenu(synonymType: SynonymType): IMenuItemConfig[] {
  return [
    {
      key: ResourceTreeNodeMenuKeys.BROWSER_SCHEMA,
      text: [
        formatMessage({ id: 'odc.TreeNodeMenu.config.synonym.ViewSynonyms' }), //查看同义词
      ],
      run(session, node) {
        const synonym: Partial<ISynonym> = node.data;
        openSynonymViewPage(synonym.synonymName, synonymType);
      },
    },

    {
      key: ResourceTreeNodeMenuKeys.CREATE_SYNONYM,
      text: [
        formatMessage({ id: 'odc.TreeNodeMenu.config.synonym.CreateSynonym' }), //新建同义词
      ],
      actionType: actionTypes.create,
      hasDivider: true,
      run(session, node) {},
    },

    {
      key: ResourceTreeNodeMenuKeys.DELETE_SYNONYM,
      text: [
        formatMessage({
          id: 'odc.TreeNodeMenu.config.sequence.Delete',
        }),
      ],

      actionType: actionTypes.delete,
      hasDivider: true,
      async run(session, node) {
        const synonym: Partial<ISynonym> = node.data;
        Modal.confirm({
          title: formatMessage(
            {
              id: 'odc.components.ResourceTree.SynonymTree.AreYouSureYouWant',
            },
            { synonymName: synonym?.synonymName },
          ), // `确定要删除同义词${synonymName}吗？`
          okText: formatMessage({ id: 'app.button.ok' }),

          cancelText: formatMessage({
            id: 'app.button.cancel',
          }),

          centered: true,
          icon: <QuestionCircleFilled />,
          onOk: async () => {
            const isSuccess = await deleteSynonym(
              synonym?.synonymName,
              synonymType,
              session?.sessionId,
              session?.database?.dbName,
            );
            if (!isSuccess) {
              return;
            }
            synonymType === SynonymType.COMMON
              ? await session.database?.getSynonymList()
              : await session.database?.getPublicSynonymList();

            message.success(
              formatMessage({
                id: 'odc.components.ResourceTree.SynonymTree.SynonymDeletedSuccessfully',
              }),
              // 删除同义词成功
            );
            // TODO：如果当前有视图详情页面，需要关闭

            const openedPage = page?.pages.find(
              (p) => p.params.synonymName === synonym?.synonymName,
            );

            if (openedPage) {
              page?.close(openedPage.key);
            }
          },
        });
      },
    },

    {
      key: ResourceTreeNodeMenuKeys.EXPORT_TABLE,
      text: formatMessage({ id: 'odc.TreeNodeMenu.config.synonym.Export' }), //导出
      run(session, node) {
        const synonym: Partial<ISynonym> = node.data;
        modal.changeExportModal(true, {
          type:
            synonymType === SynonymType.PUBLIC ? DbObjectType.public_synonym : DbObjectType.synonym,
          name: synonym?.synonymName,
        });
      },
    },
    {
      key: ResourceTreeNodeMenuKeys.DOWNLOAD,
      text: formatMessage({ id: 'odc.TreeNodeMenu.config.synonym.Download' }), //下载
      hasDivider: true,
      async run(session, node) {
        const synonym: Partial<ISynonym> = node.data;
        const obj = await getSynonym(
          synonym?.synonymName,
          synonymType,
          session.sessionId,
          session?.database?.dbName,
        );
        if (obj) {
          downloadPLDDL(synonym?.synonymName, PLType.SYNONYM, obj.ddl, session?.database?.dbName);
        }
      },
    },

    {
      key: ResourceTreeNodeMenuKeys.REFRESH_SYNONYM,
      text: [
        formatMessage({
          id: 'odc.TreeNodeMenu.config.sequence.Refresh',
        }),
      ],
      async run(session, node) {
        synonymType === SynonymType.COMMON
          ? await session.database?.getSynonymList()
          : await session.database?.getPublicSynonymList();
      },
    },
  ];
}
export const synonymMenusConfig: Partial<Record<ResourceNodeType, IMenuItemConfig[]>> = {
  [ResourceNodeType.Synonym]: getMenu(SynonymType.COMMON),
  [ResourceNodeType.PublicSynonym]: getMenu(SynonymType.PUBLIC),
};
