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

import { IView } from '@/d.ts';
import { formatMessage } from '@/util/intl';
import { Form, Input, Select } from 'antd';
import { Component } from 'react';
import styles from './index.less';

enum CheckOption {
  NONE = 'NONE',
}

interface IProps {
  model: Partial<IView>;
}

const { Option } = Select;

class ShowViewBaseInfoForm extends Component<IProps> {
  public render() {
    const { viewName, checkOption, definer, comment } = this.props.model ?? {};
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    };

    const initialValues = {
      viewName: viewName,
      checkOption: checkOption || CheckOption.NONE,
      definer: definer,
      comment,
    };

    if (!viewName) {
      return null;
    }

    return (
      <Form {...formItemLayout} className={styles.form} initialValues={initialValues}>
        <Form.Item
          name="viewName"
          label={formatMessage({ id: 'workspace.window.createView.viewName' })}
        >
          <Input
            disabled={true}
            placeholder={formatMessage({
              id: 'workspace.window.createView.viewName.placeholder',
            })}
          />
        </Form.Item>
        <Form.Item
          name="checkOption"
          label={formatMessage({
            id: 'workspace.window.createView.checkOption',
          })}
        >
          <Select disabled={true}>
            <Option value={CheckOption.NONE}>{CheckOption.NONE}</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="definer"
          label={formatMessage({ id: 'workspace.window.createView.definer' })}
        >
          <Input disabled={true} />
        </Form.Item>
        <Form.Item name="comment" label={'注释'}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 3 }} disabled={true} />
        </Form.Item>
      </Form>
    );
  }
}

export default ShowViewBaseInfoForm;
