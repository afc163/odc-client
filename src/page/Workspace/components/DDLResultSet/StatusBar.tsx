import { ITableColumn, ResultSetColumn } from '@/d.ts';
import { formatMessage } from '@/util/intl';
import { formatTimeTemplate } from '@/util/utils';
import { Divider, Space, Typography } from 'antd';
import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';

interface IProps {
  recordCount: number;
  dbTotalDurationMicroseconds: number;
  columns: Partial<ITableColumn>[];
  fields: ResultSetColumn[];
  selectedColumnKeys: React.Key[];
}

const StatusBar: React.FC<IProps> = function ({
  recordCount,
  dbTotalDurationMicroseconds,
  columns,
  fields,
  selectedColumnKeys,
}) {
  const selectColumns = useMemo(() => {
    if (!columns?.length || !selectedColumnKeys?.length || !fields?.length) {
      return [];
    }
    const selectColumnNames = new Set(
      selectedColumnKeys?.map((key) => fields.find((c) => c.key === key)?.columnName),
    );

    if (!selectColumnNames.size) {
      return [];
    }
    return columns?.filter(Boolean).filter((c) => selectColumnNames.has(c.columnName));
  }, [columns, fields, selectedColumnKeys]);
  const columnText = selectColumns
    .map((column) => {
      return (
        '[' +
        column.columnName +
        '] ' +
        [
          column.primaryKey
            ? formatMessage({
                id: 'odc.components.DDLResultSet.StatusBar.PrimaryKey',
              })
            : //主键
              '',
          `${column.dataType}`,
          column.allowNull
            ? formatMessage({
                id: 'odc.components.DDLResultSet.StatusBar.LeaveThisParameterEmpty',
              })
            : //允许为空
              formatMessage({
                id: 'odc.components.DDLResultSet.StatusBar.NotEmpty',
              }),
          //非空
          column.autoIncreament
            ? formatMessage({
                id: 'odc.components.DDLResultSet.StatusBar.AutoIncrement',
              })
            : //自增
              '',
          // 列注释: comment
          column.comment
            ? `${formatMessage({
                id: 'workspace.window.createView.comment',
              })}: ${column.comment}`
            : '',
        ]
          .filter(Boolean)
          .join(', ')
      );
    })
    .join(' | ');
  const columnInfo = selectColumns?.length ? (
    <Typography.Text title={columnText} style={{ maxWidth: '600px' }} ellipsis={true}>
      {columnText}
    </Typography.Text>
  ) : null;
  return (
    <div
      style={{
        padding: '6px 8px 6px 18px',
        lineHeight: 1,
        color: 'var(--text-color-secondary)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        width: '100%',
        borderTop: '1px solid var(--odc-border-color)',
      }}
    >
      <Space split={<Divider type="vertical" />} size={'middle'} align={'center'}>
        {dbTotalDurationMicroseconds ? (
          <span>
            {
              formatMessage({
                id: 'odc.components.DDLResultSet.StatusBar.DbTimeConsumption',
              }) /*DB 耗时：*/
            }

            {formatTimeTemplate(BigNumber(dbTotalDurationMicroseconds).div(1000000).toNumber())}
          </span>
        ) : null}
        <span>
          {
            formatMessage(
              {
                id: 'odc.components.DDLResultSet.StatusBar.TotalNumberOfEntriesRecordcount',
              },

              { recordCount: recordCount },
            )
            /*总条数：{recordCount} 条*/
          }
        </span>
        {columnInfo}
      </Space>
    </div>
  );
};

export default StatusBar;
