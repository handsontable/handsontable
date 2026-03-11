import Core from '../../core';
import { BasePlugin } from '../base';

export interface ExportToExcelOptions {
  filename?: string;
  sheetName?: string;
  columnHeaders?: boolean;
  rowHeaders?: boolean;
  exportHiddenRows?: boolean;
  exportHiddenColumns?: boolean;
  range?: number[];
}

export type Settings = boolean;

export class ExportToExcel extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  downloadFile(options?: ExportToExcelOptions): void;
  exportAsBlob(options?: ExportToExcelOptions): Blob;
  exportAsUint8Array(options?: ExportToExcelOptions): Uint8Array;
}
