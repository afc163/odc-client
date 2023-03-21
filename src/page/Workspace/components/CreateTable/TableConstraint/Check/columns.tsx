import { formatMessage } from '@/util/intl';
import { Column } from '@alipay/ob-react-data-grid';
import { TextEditor } from '../../../EditableTable/Editors/TextEditor';
import { TableCheckConstraint } from '../../interface';
import { useDeferColumn, useEnableColumn } from '../baseColumn';

export function useColumns(): Column<TableCheckConstraint, TableCheckConstraint>[] {
  const enableColumn = useEnableColumn();
  const deferColumn = useDeferColumn();
  return [
    {
      key: 'name',
      name: formatMessage({
        id: 'odc.CreateTable.Columns.columns.Name',
      }), //名称
      resizable: true,
      editable: true,
      editor: TextEditor,
    },

    {
      key: 'check',
      name: formatMessage({
        id: 'odc.TableConstraint.Check.columns.CheckConditions',
      }), //检查条件
      resizable: true,
      filterable: false,
      editable: true,
      editor: TextEditor,
    },

    enableColumn,
    deferColumn,
  ].filter(Boolean);
}
