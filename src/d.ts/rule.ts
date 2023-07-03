import type { ProjectUser } from './project';

export enum RuleType {
  SQL_CHECK = 'SQL_CHECK',
  SQL_CONSOLE = 'SQL_CONSOLE',
}

export interface IRule {
  id: number;
  metadata: Metadata;
  rulesetId: number;
  level: number;
  appliedDialectTypes: DialectType[];
  properties: {
    [key in string]: any;
  };
  enabled: boolean;
  organizationId: number;
  createTime: number;
  updateTime: number;
}

export interface IRuleSet {
  id: number;
  name: string;
  description: string;
  rules: IRule[];
  organizationId: number;
  createTime: number;
  updateTime: number;
  creator: ProjectUser;
  lastModifier: ProjectUser;
}

export enum DialectType {
  OB_MYSQL = 'OB_MYSQL',
  OB_ORACLE = 'OB_ORACLE',
  ORACLE = 'ORACLE',
  MYSQL = 'MYSQL',
  UNKNOWN = 'UNKNOWN',
}

export enum PropertyMetadataType {
  BOOLEAN = 'BOOLEAN',
  INTEGER = 'INTEGER',
  STRING = 'STRING',
  STRING_LIST = 'STRING_LIST',
  INTEGER_LIST = 'INTEGER_LIST',
}
export enum ComponentType {
  INPUT_STRING = 'INPUT_STRING',
  INPUT_NUMBER = 'INPUT_NUMBER',
  RADIO = 'RADIO',
  SELECT_SINGLE = 'SELECT_SINGLE',
  SELECT_MULTIPLE = 'SELECT_MULTIPLE',
  SELECT_TAGS = 'SELECT_TAGS',
}

export type PropertyMetadata = {
  name: string;
  description: string;
  type: PropertyMetadataType;
  componentType: ComponentType;
  defaultValue: any;
  candidates: any[];
  displayName: string;
};

export type Metadata = {
  id: number;
  name: string;
  description: string;
  type: RuleType;
  subTypes: string[];
  supportedDialectTypes: DialectType[];
  propertyMetadatas: PropertyMetadata[];
  builtIn: boolean;
};
