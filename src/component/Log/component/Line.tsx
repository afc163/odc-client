import { getPrefixCls } from '@/util/utils';
import classNames from 'classnames';
import React from 'react';
import { renderHightlight } from '../languageHighlight';
import type { LineProps } from '../typings';

const Line: React.FC<LineProps> = ({
  data,
  current,
  style,
  searchData,
  enableHighLight,
  language,
}) => {
  let content: React.ReactNode = data?.content;
  const prefixCls = getPrefixCls('log');
  const lineSearchData = searchData[data.rowIndex];

  const renderContent = (param: string) => {
    return enableHighLight ? renderHightlight(language, param).value : param;
  };

  if (lineSearchData) {
    const splitContent: string[] = data.textArr;
    /** 当前关键字current是否在关键字数据里 */
    const keyIndex = lineSearchData.indexOf(current);

    content = splitContent.map((item, index) => {
      return (
        <>
          <span
            dangerouslySetInnerHTML={{
              __html: renderContent(item),
            }}
          />
          {index < splitContent.length - 1 && (
            /** 当前行 此关键词索引与current在searchData索引相同 */
            <mark
              className={classNames(`${prefixCls}-mark`, {
                [`${prefixCls}-active-mark`]: index === keyIndex,
              })}
            >
              {data.keywords?.[index]}
            </mark>
          )}
        </>
      );
    });
  }

  return (
    <div style={style}>
      {data.brokenMark ? (
        <div className={`${prefixCls}-ellipsis`}>...</div>
      ) : (
        <div className={`${prefixCls}-line-wrap`}>
          <span className={`${prefixCls}-linenumber`}>{data.rowIndex}</span>
          {lineSearchData ? (
            <span className={`${prefixCls}-line-content`}>{content}</span>
          ) : (
            <span
              className={`${prefixCls}-line-content`}
              dangerouslySetInnerHTML={{ __html: renderContent(content as string) }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Line;
