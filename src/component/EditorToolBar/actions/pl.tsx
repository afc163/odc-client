import { formatMessage } from '@/util/intl';
import { message, Modal } from 'antd';

import {
  BugOutlined,
  CheckOutlined,
  LogoutOutlined,
  RedoOutlined,
  SaveOutlined,
} from '@ant-design/icons';

import { IConStatus } from '@/component/Toolbar/statefulIcon';
import plType from '@/constant/plType';
import { ConnectionMode } from '@/d.ts';
import PLPage from '@/page/Workspace/components/PLPage';
import connection from '@/store/connection';
import { DebugStatus } from '@/store/debug/type';
import schemaStore from '@/store/schema';
import sqlStore from '@/store/sql';
import { ToolBarActions } from '..';

const { confirm } = Modal;

export const getStatus = (ctx: any) => {
  const isMySQL = connection.connection.dbMode === ConnectionMode.OB_MYSQL;
  const plSchema = ctx.getFormatPLSchema && ctx.getFormatPLSchema();
  return [plType.PROCEDURE, plType.FUNCTION].includes(plSchema?.plType) && isMySQL
    ? IConStatus.DISABLE
    : IConStatus.INIT;
};

const plActions: ToolBarActions = {
  PL_SAVE: {
    isShowText: true,
    name: formatMessage({
      id: 'odc.EditorToolBar.actions.pl.ConfirmModification',
    }),
    icon: CheckOutlined,
    statusFunc: getStatus,
    async action(ctx: any) {
      await ctx.savePL();
    },
  },

  PL_TRIGGER_TYPE_SAVE: {
    name: formatMessage({
      id: 'odc.EditorToolBar.actions.pl.ConfirmModification',
    }),
    type: 'BUTTON_PRIMARY',
    async action(ctx: any) {
      await ctx.savePL();
    },
  },

  PL_SCRIPT_SAVE: {
    name: formatMessage({ id: 'odc.component.SaveSQLModal.SaveScript' }),
    icon: SaveOutlined,
    statusFunc: (ctx) => {
      const { pageKey } = ctx.props;
      if (ctx.state.isSavingScript) {
        return IConStatus.RUNNING;
      }
      return IConStatus.INIT;
    },
    async action(ctx: any) {
      ctx.saveScript();
    },
  },

  PL_COMPILE: {
    name: formatMessage({ id: 'odc.EditorToolBar.actions.pl.Compile' }),
    icon: 'PL_COMPILE',
    statusFunc: (ctx) => {
      if (sqlStore.runningPageKey.has(ctx.props.pageKey) && sqlStore.isCompiling) {
        return IConStatus.RUNNING;
      }
      return IConStatus.INIT;
    },
    // 非匿名块编译才展现
    isVisible(ctx: any) {
      const plSchema = ctx.getFormatPLSchema();
      const isMySQL = connection.connection.dbMode === ConnectionMode.OB_MYSQL;
      if (isMySQL) {
        return false;
      }
      if ([plType.PKG_HEAD].indexOf(plSchema.plType) > -1) {
        /**
         * 程序包头禁止编译
         */
        return false;
      }
      if (
        plSchema.packageName &&
        (plSchema.plType == plType.FUNCTION || plSchema.plType == plType.PROCEDURE)
      ) {
        /**
         * 程序包的子程序禁用编译
         */
        return false;
      }
      // 触发器 编译功能支持有版本差异
      if (plSchema.plType === plType.TRIGGER) {
        return !!schemaStore?.enableTriggerCompile;
      }

      if (plSchema.plType === plType.TYPE) {
        // 当前版本 不支持"类型编译功能"
        return false;
      }

      return !!plSchema.plName;
    },
    async action(ctx: PLPage) {
      const { sqlStore, pageStore, pageKey } = ctx.props;
      const plSchema = ctx.getFormatPLSchema();
      const { plName, plType } = plSchema;
      if (plName && !pageStore.activePage.isSaved) {
        message.warn(
          formatMessage({
            id: 'odc.EditorToolBar.actions.pl.ThereAreUnsavedContentsPlease',
          }),
        );
        return;
      }
      sqlStore.runningPageKey.add(pageKey);
      sqlStore.isCompiling = true;
      ctx.setState({
        plAction: 'COMPILE',
        statusBar: {
          type: 'COMPILE',
          status: 'RUNNING',
          startTime: Date.now(),
          endTime: null,
        },
      });

      const r = {
        type: '',
        data: null,
      };

      const compilePlName = plSchema.packageName || plName;
      const compilePlType = plSchema.packageName ? 'PACKAGE' : plType;
      const res = await sqlStore.compilePL(compilePlName, compilePlType);
      if (res) {
        (r.type = 'COMPILE'),
          (r.data = {
            COMPILE: res,
          });
        switch (compilePlType) {
          case 'PACKAGE': {
            schemaStore.getPackageList();
            break;
          }
          case 'FUNCTION': {
            schemaStore.refreshFunctionList();
            break;
          }
          case 'PROCEDURE': {
            schemaStore.refreshProcedureList();
            break;
          }
        }
      }
      sqlStore.runningPageKey.delete(pageKey);
      sqlStore.isCompiling = false;
      ctx.setState({
        statusBar: {
          ...ctx.state.statusBar,
          status: res && res?.status ? 'SUCCESS' : 'FAIL',
          endTime: Date.now(),
        },

        result: r as any,
      });
    },
  },

  PL_EXEC: {
    name: formatMessage({ id: 'odc.EditorToolBar.actions.pl.RunF' }),
    icon: 'SQL_RUN',
    statusFunc: (ctx: PLPage) => {
      const { sqlStore } = ctx.props;
      if (sqlStore.runningPageKey.has(ctx.props.pageKey) && !sqlStore.isCompiling) {
        return IConStatus.RUNNING;
      }
      return IConStatus.INIT;
    },
    isVisible(ctx: any) {
      const plSchema = ctx.getFormatPLSchema();
      return plSchema.plType != plType.PKG_HEAD && plSchema.plType != plType.PKG_BODY;
    },
    async action(ctx: any) {
      const { pageStore, sqlStore } = ctx.props;
      const plSchema = ctx.getFormatPLSchema();
      const { plName } = plSchema;
      if (plName && !pageStore.activePage.isSaved) {
        message.warn(
          formatMessage({
            id: 'odc.EditorToolBar.actions.pl.ThereAreUnsavedContentsPlease',
          }),
        );
        return;
      }

      // 匿名块运行前先执行格式校验
      if (!plName) {
        const resParse = await sqlStore.parsePL(plSchema.ddl);
        const { obDbObjectType } = resParse || {};
        if (obDbObjectType !== 'ANONYMOUS_BLOCK') {
          message.warn(
            formatMessage({
              id: 'odc.EditorToolBar.actions.pl.TheWindowContentDoesNot',
            }),
          );
          return;
        }
      }

      await ctx.checkAndFillPLINParams('EXEC');
    },
  },

  PL_DEBUG: {
    name: formatMessage({ id: 'odc.EditorToolBar.actions.pl.Debugging' }),
    icon: BugOutlined,
    statusFunc: (ctx: PLPage) => {
      const { pageKey, debugStore } = ctx.props;
      if (debugStore.debugLoading[pageKey]) {
        return IConStatus.RUNNING;
      }
      return IConStatus.INIT;
    },
    isVisible(ctx: any) {
      const { schemaStore } = ctx.props;
      const plSchema = ctx.getFormatPLSchema();
      return (
        ![plType.PKG_HEAD, plType.PKG_BODY, plType.TRIGGER].includes(plSchema?.plType) &&
        schemaStore.enablePLDebug
      );
    },
    async action(ctx: any) {
      const { pageStore, sqlStore } = ctx.props;
      const plSchema = ctx.getFormatPLSchema();
      const { plName } = plSchema;
      if (plName && !pageStore.activePage.isSaved) {
        message.warn(
          formatMessage({
            id: 'odc.EditorToolBar.actions.pl.ThereAreUnsavedContentsPlease',
          }),
        );
        return;
      }

      // 匿名块调试前先执行格式校验
      if (!plName) {
        const resParse = await sqlStore.parsePL(plSchema.ddl);
        const { obDbObjectType } = resParse || {};
        if (obDbObjectType !== 'ANONYMOUS_BLOCK') {
          message.warn(
            formatMessage({
              id: 'odc.EditorToolBar.actions.pl.TheWindowContentDoesNot',
            }),
          );
          return;
        }
      }

      await ctx.checkAndFillPLINParams('DEBUG');
    },
  },

  PL_DEBUG_AUTO: {
    name: formatMessage({
      id: 'odc.EditorToolBar.actions.pl.BatchExecution',
    }),
    icon: 'PL_AUTO_RUN',
    statusFunc: (ctx: PLPage) => {
      const debug = ctx.getDebug();
      if (debug?.status === DebugStatus.RESUME) {
        return IConStatus.RUNNING;
      } else if (debug?.status === DebugStatus.INIT) {
        return IConStatus.INIT;
      }
      return IConStatus.DISABLE;
    },
    async action(ctx: PLPage) {
      ctx.getDebug().executeResume();
    },
  },

  PL_DEBUG_STEP_IN: {
    name: formatMessage({ id: 'odc.EditorToolBar.actions.pl.Jump' }) + ' Ctrl/Cmd + I',
    icon: 'PL_STEP_IN',
    statusFunc: (ctx: PLPage) => {
      const debug = ctx.getDebug();
      if (debug?.status === DebugStatus.STEP_IN) {
        return IConStatus.RUNNING;
      } else if (debug?.status === DebugStatus.INIT) {
        return IConStatus.INIT;
      }
      return IConStatus.DISABLE;
    },
    async action(ctx: PLPage) {
      ctx.getDebug().executeSetpIn();
    },
  },

  PL_DEBUG_STEP_OUT: {
    name: formatMessage({ id: 'odc.EditorToolBar.actions.pl.JumpOut' }) + ' Ctrl/Cmd + O',
    icon: 'PL_STEP_OUT',
    statusFunc: (ctx: PLPage) => {
      const debug = ctx.getDebug();
      if (debug?.status === DebugStatus.STEP_OUT) {
        return IConStatus.RUNNING;
      } else if (debug?.status === DebugStatus.INIT) {
        return IConStatus.INIT;
      }
      return IConStatus.DISABLE;
    },
    async action(ctx: PLPage) {
      ctx.getDebug().executeStepOut();
    },
  },

  PL_DEBUG_STEP_SKIP: {
    name:
      formatMessage({
        id: 'odc.EditorToolBar.actions.pl.SingleStepExecution',
      }) + ' Ctrl/Cmd + P',
    icon: 'PL_STEP_SKIP',
    statusFunc: (ctx: PLPage) => {
      const debug = ctx.getDebug();
      if (debug?.status === DebugStatus.STEP_OVER) {
        return IConStatus.RUNNING;
      } else if (debug?.status === DebugStatus.INIT) {
        return IConStatus.INIT;
      }
      return IConStatus.DISABLE;
    },
    async action(ctx: PLPage) {
      ctx.getDebug().executeStepOver();
    },
  },

  PL_DEBUG_END: {
    name: formatMessage({
      id: 'odc.EditorToolBar.actions.pl.TerminateDebugging',
    }),
    icon: 'SQL_STOP',
    statusFunc: (ctx: PLPage) => {
      const debug = ctx.getDebug();
      if (debug?.status === DebugStatus.EXITING) {
        return IConStatus.RUNNING;
      } else if (debug?.status === DebugStatus.INIT) {
        return IConStatus.INIT;
      }
      return IConStatus.DISABLE;
    },
    async action(ctx: PLPage) {
      ctx.getDebug().executeExit();
    },
  },

  PL_DEBUG_RETRY: {
    isShowText: true,
    name: formatMessage({ id: 'odc.EditorToolBar.actions.pl.ReDebug' }),
    statusFunc: (ctx: PLPage) => {
      const debug = ctx.getDebug();
      if (debug.status === DebugStatus.RECOVER) {
        return IConStatus.RUNNING;
      }
      return debug?.isDebugEnd() ? IConStatus.INIT : IConStatus.DISABLE;
    },
    icon: RedoOutlined,

    async action(ctx: PLPage) {
      const debug = ctx.getDebug();
      if (debug.status === DebugStatus.RECOVER) {
        return;
      }
      confirm({
        title: formatMessage({
          id: 'odc.EditorToolBar.actions.pl.AreYouSureToRe',
        }),
        async onOk() {
          await ctx.checkAndFillPLINParams('DEBUG');
        },
      });
    },
  },

  PL_DEBUG_EXIT: {
    isShowText: true,
    name: formatMessage({ id: 'odc.EditorToolBar.actions.pl.ExitDebugging' }),
    icon: LogoutOutlined,

    // confirmConfig: {
    //   title: formatMessage({
    //     id: 'odc.EditorToolBar.actions.pl.AreYouSureYouWant',
    //   }),
    // },
    statusFunc: (ctx: PLPage) => {
      const debug = ctx.getDebug();
      return debug?.isDebugEnd() ? IConStatus.INIT : IConStatus.DISABLE;
    },
    async action(ctx: PLPage) {
      const { pageKey, params, debugStore } = ctx.props;
      debugStore?.removeDebug(pageKey);
      ctx.debugMode?.set(false);
      ctx.setState({
        debug: false,
        currentDebugObj: {
          packageName: '',
          plName: '',
          plType: null,
        },
        result: {
          type: '',
          data: null,
        },
      });
      const codeEditor = ctx.editor.UNSAFE_getCodeEditor();
      codeEditor.setValue(params.scriptText);
      ctx.clearBreakPoints();
      ctx.clearHighLightLine();
    },
  },
};
export default plActions;
