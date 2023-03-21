import { ITypeForm } from '@/d.ts';
import request from '@/util/request';
import { generateDatabaseSid, generateTypeSid } from './pathUtil';

export async function getTypeList() {
  const sid = generateDatabaseSid();
  const res = await request.get(`/api/v1/type/list/${sid}`);
  return res?.data;
}

export async function getType(typeName: string, ignoreError?: boolean) {
  const sid = generateTypeSid(typeName);
  const res = await request.get(`/api/v1/type/${sid}`, {
    params: {
      ignoreError,
    },
  });
  return res?.data;
}

export async function deleteType(typeName: string) {
  const sid = generateTypeSid(typeName);
  const res = await request.delete(`/api/v1/type/${sid}`);
  return !res?.isError;
}

export async function getTypeCreateSQL(typeName: string, type: Partial<ITypeForm>) {
  const sid = generateTypeSid(typeName);
  const res = await request.post(`/api/v1/type/getCreateSql/${sid}`, {
    data: type,
  });
  return res?.data?.sql;
}
