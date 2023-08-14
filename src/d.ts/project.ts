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

export enum ProjectRole {
  DEVELOPER = 'DEVELOPER',
  DBA = 'DBA',
  OWNER = 'OWNER',
}

export interface ProjectUser {
  id: number;
  name: string;
  accountName: string;
  roleNames: string[];
}

export interface IProject {
  id: number;
  name: string;
  description: string;
  archived: boolean;
  members: {
    id: number;
    accountName: string;
    name: string;
    role: ProjectRole;
  }[];
  currentUserResourceRoles: ProjectRole[];
  builtin: boolean;
  organizationId: number;
  createTime: number;
  updateTime: number;
  creator: ProjectUser;
  lastModifier: ProjectUser;
}
