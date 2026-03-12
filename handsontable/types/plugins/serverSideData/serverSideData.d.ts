import Core from '../../core';
import { BasePlugin } from '../base';
import {
  DataProvider,
  DataProviderResponse,
  QueryParameters,
  OnRowCreate,
  OnRowUpdate,
  OnRowRemove,
} from '../../settings';

export {
  DataProvider,
  DataProviderResponse,
  QueryParameters,
  OnRowCreate,
  OnRowUpdate,
  OnRowRemove,
};

export class ServerSideData extends BasePlugin {
  constructor(hotInstance: Core);

  getQueryParameters(): QueryParameters;
  refreshData(source?: string): Promise<void>;
  createRow(row?: object): Promise<void>;
  updateRow(id: string | number, changes?: object): Promise<void>;
  removeRow(id: string | number): Promise<void>;
}
