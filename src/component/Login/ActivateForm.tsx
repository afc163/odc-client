import { formatMessage } from '@/util/intl';
import { Alert, Button, Form, Input } from 'antd';
import type { FormProps } from 'antd/lib/form';
import { toString } from 'lodash';
import React, { useCallback } from 'react';
import type { LoginLocale } from './index';
import { getPrefix } from './index';
import './index.less';
import { PASSWORD_REGEX } from './RegisterForm';

export interface IActivateFormProps extends FormProps {
  locale?: LoginLocale;
  /**
   * 用户自定义密码规则
   */
  passwordRule?: {
    pattern: RegExp;
    message: string;
  };
  loading?: boolean;
  errorMessage?: React.ReactNode | string;
  goBack?: () => void;
}

const Activate: React.FC<IActivateFormProps> = ({
  locale,
  loading,
  passwordRule,
  errorMessage,
  goBack,
  ...restProps
}) => {
  const [formRef] = Form.useForm();
  const prefix = getPrefix('login');

  const handleValidateConfirmPassword = useCallback(
    (rule, value, callback) => {
      if (!formRef) {
        callback();
        return;
      }
      const pwd = formRef.getFieldValue('password');
      if (toString(value) !== toString(pwd)) {
        callback(
          formatMessage({ id: 'odc.component.Login.ActivateForm.ConfirmPasswordInconsistency' }), //确认密码不一致
        );
        return;
      }
      callback();
    },
    [formRef],
  );

  const passwordRegexpRule = passwordRule || {
    pattern: PASSWORD_REGEX,
    message: formatMessage({
      id: 'odc.component.Login.ActivateForm.ContainsAtLeastDigitsUppercase',
    }), //至少包含 2 位数字、2 位大写字母、2 位小写字母和 2 位特殊字符 (._+@#$%)，长度 8~32 位字符
  };

  return (
    <Form
      layout="vertical"
      requiredMark={false}
      form={formRef}
      {...restProps}
      data-testid="login.register"
    >
      <Form.Item
        name="password"
        label={formatMessage({ id: 'odc.component.Login.ActivateForm.Password' })} /*密码*/
        dependencies={['confirmPassword']}
        help={passwordRegexpRule.message}
        validateFirst
        rules={[
          {
            required: true,
            message: formatMessage({
              id: 'odc.component.Login.ActivateForm.ThePasswordCannotBeEmpty',
            }), //密码不能为空
          },
          passwordRegexpRule,
        ]}
      >
        <Input.Password visibilityToggle={false} autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label={formatMessage({
          id: 'odc.component.Login.ActivateForm.ConfirmPassword',
        })} /*确认密码*/
        dependencies={['password']}
        validateFirst
        rules={[
          {
            required: true,
            message: formatMessage({
              id: 'odc.component.Login.ActivateForm.PleaseEnterThePasswordAgain',
            }), //请再次输入密码
          },
          {
            validator: handleValidateConfirmPassword,
          },
        ]}
      >
        <Input.Password visibilityToggle={false} autoComplete="new-password" />
      </Form.Item>
      <Button
        // 按下回车键，即可触发点击事件
        htmlType="submit"
        loading={loading}
        type="primary"
        block={true}
        className={`${prefix}-submit-btn`}
      >
        {formatMessage({ id: 'odc.component.Login.ActivateForm.Activate' }) /*激活*/}
      </Button>
      <div className={`${prefix}-switch-btn`}>
        <Button type="link" onClick={goBack}>
          {
            formatMessage({
              id: 'odc.component.Login.ActivateForm.ReturnToThePreviousStep',
            }) /*返回上一步*/
          }
        </Button>
      </div>
      {errorMessage && (
        <Alert type="error" showIcon={true} className={`${prefix}-alert`} message={errorMessage} />
      )}
    </Form>
  );
};

export default Activate;
