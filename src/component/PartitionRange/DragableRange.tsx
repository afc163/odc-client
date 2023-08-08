import Icon, { DeleteOutlined } from '@ant-design/icons';
import { Col, Input, Row } from 'antd';
import React from 'react';
import { FormattedMessage } from '@umijs/max';
// @ts-ignore
import classNames from 'classnames';
import { ISinglePartitionRule } from '.';
import Dragable, { IDragable } from '../Dragable';
import styles from './index.less';
// @ts-ignore
import DragSvg from '@/svgr/drag.svg';
import PartitionValueInput from './PartitionValueInput';

export interface IDragableParamProps extends IDragable {
  deletable: boolean;
  rule: Partial<ISinglePartitionRule>;
  partitionType: string;
  selectColums?: Array<any>;
  partitionValueLabel: string;
  partitionValuePlaceholder: string;
  handleDelete: (idx: number) => void;
  handleEdit: (idx: number, rule: Partial<ISinglePartitionRule>) => void;
}

const Types = {
  CARD: 'range',
};

class DragableRule extends React.PureComponent<{ props: IDragableParamProps }> {
  state = {
    rangeColums: {},
    listColumValues: [],
  };

  handleRangeColumnValueChange = (params) => {
    const { index, handleEdit, selectColums } = this.props.props;
    const { columnName, value } = params;
    this.setState(
      {
        rangeColums: {
          ...this.state.rangeColums,
          [columnName]: value,
        },
      },
      () => {
        const value = selectColums.map((col) => this.state.rangeColums[col.columnName]).join(',');
        handleEdit(index, { value });
      },
    );
  };

  renderRangeColumsValues = () => {
    const { index, selectColums } = this.props.props;
    const { rangeColums } = this.state;
    return (
      <>
        {selectColums.map((col, index) => {
          const { columnName } = col;
          return (
            <Input
              key={`${columnName}-${index}`}
              value={rangeColums[columnName] || ''}
              style={{ width: '192px' }}
              onChange={(e) => {
                this.handleRangeColumnValueChange({
                  rangeIndex: index,
                  columnName: columnName,
                  value: e.target.value,
                });
              }}
              addonBefore={columnName}
            />
          );
        })}
      </>
    );
  };

  renderListColumsValues = () => {};

  render() {
    const {
      index,
      rule,
      deletable,
      partitionValueLabel,
      partitionValuePlaceholder,
      handleDelete,
      handleEdit,
      isDragging,
      connectDragSource,
      partitionType,
      selectColums,
    } = this.props.props;

    return connectDragSource(
      <div>
        <Row className={classNames(styles.row, isDragging ? styles.dragging : null)}>
          <Col
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              fontSize: 12,
            }}
          >
            <span style={{ marginRight: 8 }}>
              <Icon component={DragSvg} className={styles.dragHandler} />
            </span>
            <span className="ant-form-item-required">
              <FormattedMessage id="workspace.window.createTable.partition.name" />：
            </span>
            <Input
              value={rule.name}
              style={{ width: 160 }}
              onChange={(e) => handleEdit(index, { name: e.target.value })}
            />
            <span className="ant-form-item-required" style={{ marginLeft: 16 }}>
              {partitionValueLabel}：
            </span>
            {/* <Input
              value={rule.value}
              style={{ flex: 1 }}
              placeholder={partitionValuePlaceholder}
              onChange={e => handleEdit(index, { value: e.target.value })}
            /> */}
            <PartitionValueInput
              index={index}
              partitionType={partitionType}
              selectColums={selectColums}
              value={rule.value}
              style={{ flex: 1 }}
              placeholder={partitionValuePlaceholder}
              handleEdit={handleEdit}
            />
          </Col>
          {deletable && (
            <DeleteOutlined className={styles.close} onClick={() => handleDelete(index)} />
          )}
        </Row>
      </div>,
    );
  }
}

export default Dragable<IDragableParamProps>(DragableRule, Types.CARD);
