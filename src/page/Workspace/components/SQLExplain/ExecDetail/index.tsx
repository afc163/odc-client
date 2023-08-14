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

import { formatMessage } from '@/util/intl';
import { getLocalFormatDateTime } from '@/util/utils';
import {
  Card,
  Col,
  Descriptions,
  Drawer,
  message,
  Row,
  Spin,
  Statistic,
  Tooltip as AntdTooltip,
} from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SQLExplain from '../index';

import { getSQLExecuteDetail, getSQLExecuteExplain } from '@/common/network/sql';
import { ISQLExecuteDetail, ISQLExplain } from '@/d.ts';
import SessionStore from '@/store/sessionManager/session';
import styles from './index.less';

interface IProps {
  visible: boolean;
  session: SessionStore;
  sql?: string;
  traceId?: string;
  onClose: () => void;
}

const ExecDetail: React.FC<IProps> = function (props) {
  const { visible, sql, traceId, session, onClose } = props;
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [sqlExecuteExplainToShow, setSqlExecuteExplainToShow] = useState<ISQLExplain | string>(
    null,
  );
  const [sqlExecuteDetailToShow, setSqlExecuteDetailToShow] = useState<ISQLExecuteDetail>(null);
  const stackBarPlot = useRef(null);
  const stackBarBox = useRef<HTMLDivElement>(null);

  const fetchExecDetail = useCallback(
    async function () {
      if (!traceId) {
        message.error(
          formatMessage({ id: 'odc.components.SQLPage.TheTraceIdIsEmpty' }), // TRACE ID 为空，请确保该语句运行时 ob_enable_trace_log 变量已设置为 ON
        );
        return;
      }
      setSqlExecuteDetailToShow(null);
      setSqlExecuteExplainToShow(null);
      setLoadingExplain(true);

      const detail = await getSQLExecuteDetail(
        sql,
        traceId,
        session?.sessionId,
        session?.database?.dbName,
      );
      const sqlId = detail?.sqlId;
      const explain = await getSQLExecuteExplain(
        sql,
        sqlId,
        session?.sessionId,
        session?.database?.dbName,
      );
      setLoadingExplain(false);

      if (explain && detail) {
        setSqlExecuteDetailToShow(detail);
        setSqlExecuteExplainToShow(explain);

        const {
          queueTime = 0,
          execTime = 0,
          totalTime = 0,
        } = detail || {
          queueTime: 0,
          waitTime: 0,
          execTime: 0,
          totalTime: 0,
          sql: '',
        };

        const queueTimeLabel = formatMessage({
          id: 'workspace.window.sql.explain.tab.detail.card.time.label.queueTime',
        });

        const execTimeLabel = formatMessage({
          id: 'workspace.window.sql.explain.tab.detail.card.time.label.execTime',
        });

        const otherTimeLabel = formatMessage({
          id: 'workspace.window.sql.explain.tab.detail.card.time.label.otherTime',
        });

        const data = [
          {
            name: formatMessage({
              id: 'odc.components.SQLPage.TimeConsumptionStatisticsUs',
            }),

            label: otherTimeLabel,
            value: totalTime - queueTime - execTime,
          },

          {
            name: formatMessage({
              id: 'odc.components.SQLPage.TimeConsumptionStatisticsUs',
            }),

            label: execTimeLabel,
            value: execTime,
          },

          {
            name: formatMessage({
              id: 'odc.components.SQLPage.TimeConsumptionStatisticsUs',
            }),

            label: queueTimeLabel,
            value: queueTime,
          },
        ];
        if (!stackBarPlot.current) {
          const StackedBar = (await import('@antv/g2plot')).StackedBar;
          stackBarPlot.current = new StackedBar(stackBarBox.current, {
            forceFit: true,
            height: 140,
            data,
            colorField: 'label',
            color: (label: string) => {
              if (label === queueTimeLabel) {
                return '#EC7F66';
              }
              if (label === execTimeLabel) {
                return '#76DCB3';
              }
              return '#F8C64A';
            },
            barSize: 24,
            yField: 'name',
            xField: 'value',
            stackField: 'label',
            xAxis: {
              visible: false,
              tickLine: {
                visible: false,
              },

              title: {
                visible: false,
              },

              grid: {
                visible: false,
              },
            },

            yAxis: {
              tickLine: {
                visible: false,
              },

              label: {
                visible: false,
              },

              title: {
                visible: false,
              },
            },

            title: {
              visible: false,
              text: '',
            },

            legend: {
              position: 'bottom-center',
            },
          });
          stackBarPlot.current.render();
        } else {
          stackBarPlot.current.changeData(data);
        }
      } else {
        message.error(
          formatMessage({
            id: 'workspace.window.sql.explain.detail.failed',
          }),
        );
      }
    },
    [traceId, sql, stackBarBox, stackBarPlot],
  );

  useEffect(() => {
    if (visible) {
      fetchExecDetail();
    }
    return () => {
      if (stackBarPlot.current) {
        stackBarPlot.current?.destroy();
        stackBarPlot.current = null;
      }
    };
  }, [sql, traceId, visible]);

  return (
    <Drawer
      title={formatMessage({
        id: 'workspace.window.sql.explain.tab.detail.title',
      })}
      placement="right"
      closable
      onClose={() => {
        onClose();
      }}
      destroyOnClose={true}
      width="96vw"
      visible={visible}
      className={styles.explainDrawer}
      bodyStyle={{
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          minWidth: 1280,
        }}
      >
        <Spin spinning={loadingExplain}>
          <Row
            gutter={16}
            justify="space-between"
            style={{
              marginBottom: 16,
            }}
          >
            <Col span={8}>
              <Card
                bodyStyle={{
                  height: 210,
                  padding: 16,
                }}
                className={classNames([styles.card, styles.baseCard])}
              >
                <Descriptions
                  title={formatMessage({
                    id: 'workspace.window.sql.explain.tab.detail.card.base.title',
                  })}
                  column={1}
                >
                  <Descriptions.Item
                    label={formatMessage({
                      id: 'workspace.window.sql.explain.tab.detail.card.base.sqlID',
                    })}
                  >
                    {sqlExecuteDetailToShow?.sqlId}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={formatMessage({
                      id: 'workspace.window.sql.explain.tab.detail.card.base.sql',
                    })}
                  >
                    <AntdTooltip title={sqlExecuteDetailToShow?.sql ?? ''}>
                      <div
                        style={{
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          maxWidth: 300,
                        }}
                      >
                        {sqlExecuteDetailToShow?.sql}
                      </div>
                    </AntdTooltip>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={formatMessage({
                      id: 'workspace.window.sql.explain.tab.detail.card.base.traceID',
                    })}
                  >
                    {sqlExecuteDetailToShow?.traceId}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={formatMessage({
                      id: 'workspace.window.sql.explain.tab.detail.card.base.reqTime',
                    })}
                  >
                    {getLocalFormatDateTime(sqlExecuteDetailToShow?.reqTime)}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={formatMessage({
                      id: 'workspace.window.sql.explain.tab.detail.card.base.planType',
                    })}
                  >
                    {sqlExecuteDetailToShow?.planType}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={formatMessage({
                      id: 'workspace.window.sql.explain.tab.detail.card.base.hitPlanCache',
                    })}
                  >
                    {sqlExecuteDetailToShow?.hitPlanCache
                      ? formatMessage({
                          id: 'odc.components.SQLPage.Is',
                        })
                      : formatMessage({
                          id: 'odc.components.SQLPage.No',
                        })}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={8}>
              <Card
                title={formatMessage({
                  id: 'workspace.window.sql.explain.tab.detail.card.time.title',
                })}
                headStyle={{
                  padding: '0 16px',
                  fontSize: 14,
                  border: 'none',
                }}
                bodyStyle={{
                  height: 158,
                  padding: 16,
                }}
                className={styles.card}
              >
                <div
                  ref={stackBarBox}
                  style={{
                    marginTop: -30,
                  }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card
                title={formatMessage({
                  id: 'workspace.window.sql.explain.tab.detail.card.io.title',
                })}
                headStyle={{
                  padding: '0 16px',
                  fontSize: 14,
                  border: 'none',
                }}
                bodyStyle={{
                  height: 158,
                  padding: 16,
                }}
                className={classNames([styles.card, styles.ioCard])}
              >
                <Row>
                  <Col span={8}>
                    <Statistic
                      title={formatMessage({
                        id: 'workspace.window.sql.explain.tab.detail.card.io.rpcCount',
                      })}
                      value={sqlExecuteDetailToShow?.rpcCount}
                      valueStyle={{ fontSize: '24px' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title={formatMessage({
                        id: 'workspace.window.sql.explain.tab.detail.card.io.physicalRead',
                      })}
                      value={sqlExecuteDetailToShow?.physicalRead}
                      valueStyle={{ fontSize: '24px' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title={formatMessage({
                        id: 'workspace.window.sql.explain.tab.detail.card.io.ssstoreRead',
                      })}
                      value={sqlExecuteDetailToShow?.ssstoreRead}
                      valueStyle={{ fontSize: '24px' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Spin>
        <Spin spinning={loadingExplain}>
          <SQLExplain
            tableHeight={300}
            sql={sqlExecuteDetailToShow?.sql ?? sql}
            explain={sqlExecuteExplainToShow}
            session={session}
            traceId={traceId}
          />
        </Spin>
      </div>
    </Drawer>
  );
};

export default ExecDetail;
