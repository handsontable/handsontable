import Core from '../../core';
import { BasePlugin } from '../base';

export interface ExportOptions {
  mimeType?: string;
  fileExtension?: string;
  filename?: string;
  columnHeaders?: boolean;
  rowHeaders?: boolean;
  exportHiddenColumns?: boolean;
  exportHiddenRows?: boolean;
  range?: number[];
  formulas?: boolean;
  sheetName?: string;
}

export type Settings = boolean;

export class ExportExcel extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  exportAsString(options?: ExportOptions): string;
  exportAsBlob(options?: ExportOptions): Blob;
  downloadFile(options?: ExportOptions): void;
}
