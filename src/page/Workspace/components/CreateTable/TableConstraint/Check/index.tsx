/*
 * Copyright 2023 OceanBase
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Toolbar from '@/component/Toolbar';
import { TableConstraintDefer } from '@/d.ts/table';
import { formatMessage } from '@/util/intl';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { DataGridRef } from '@oceanbase-odc/ob-react-data-grid';
import { clone } from 'lodash';
import React, { useContext, useMemo, useRef, useState } from 'react';
import EditableTable from '../../../EditableTable';
import EditToolbar from '../../EditToolbar';
import { removeGridParams } from '../../helper';
import { TableCheckConstraint } from '../../interface';
import TableCardLayout from '../../TableCardLayout';
import TableContext from '../../TableContext';
import { useColumns } from './columns';

const defaultCheckConstraint: TableCheckConstraint = {
  name: null,
  check: '',
  enable: true,
  defer: TableConstraintDefer.NOT,
};

interface IProps {
  modified?: boolean;
}

const CheckConstraint: React.FC<IProps> = function ({ modified }) {
  const tableContext = useContext(TableContext);
  const [selectedRowsIdx, setSelectedRowIdx] = useState<number[]>([]);
  const gridColumns: any[] = useColumns(tableContext?.session?.connection?.dialectType);
  const gridRef = useRef<DataGridRef>();
  const rows = useMemo(() => {
    return tableContext.checkConstraints.map((index, idx) => {
      return {
        ...index,
        key: `${index.name || ''}@@${idx}`,
      };
    });
  }, [tableContext.checkConstraints]);

  return (
    <TableCardLayout
      toolbar={
        <EditToolbar modified={modified}>
          <Toolbar>
            <Toolbar.Button
              text={formatMessage({ id: 'workspace.header.create' })}
              icon={PlusOutlined}
              onClick={() => {
                tableContext.setCheckConstraints(
                  tableContext.checkConstraints.concat(defaultCheckConstraint),
                );
              }}
            />
            <Toolbar.Button
              text={formatMessage({ id: 'odc.TableConstraint.Primary.Delete' })}
              icon={DeleteOutlined}
              disabled={!selectedRowsIdx?.length}
              onClick={() => {
                let newRows = [...rows]?.filter((row, index) => {
                  return !selectedRowsIdx?.includes(index);
                });
                tableContext.setCheckConstraints(removeGridParams(newRows));
              }}
            />
          </Toolbar>
        </EditToolbar>
      }
    >
      <EditableTable
        rowKey="key"
        bordered={false}
        minHeight="100%"
        columns={gridColumns}
        enableFilterRow
        rows={rows as any[]}
        enableRowRecord={true}
        enableColumnRecord={false}
        enableSortRow={false}
        onSelectChange={(keys) => {
          setSelectedRowIdx(
            keys.map((key) => {
              return rows.findIndex((row) => row.key === key);
            }),
          );
        }}
        gridRef={gridRef}
        onRowsChange={(rows, data) => {
          const newRows: any[] = clone(rows);
          tableContext.setCheckConstraints(removeGridParams(newRows));
        }}
      />
    </TableCardLayout>
  );
};

export default CheckConstraint;
