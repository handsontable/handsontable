import Core from '../../core';
import { BasePlugin } from '../base';

export interface ExportExcelDependency {
  Workbook: new () => {
    addWorksheet(name?: string): {
      addRow(values: unknown[]): void;
    };
    xlsx: {
      writeBuffer(): Promise<ArrayBuffer>;
    };
  };
}

export interface ExportOptions {
  mimeType?: string;
  fileExtension?: string;
  filename?: string;
  sheetName?: string;
  columnHeaders?: boolean;
  rowHeaders?: boolean;
  exportHiddenColumns?: boolean;
  exportHiddenRows?: boolean;
  formulas?: boolean;
  range?: number[];
}

export interface Settings {
  exceljs: ExportExcelDependency;
}

export class ExportExcel extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  exportAsBuffer(options?: ExportOptions): Promise<ArrayBuffer>;
  exportAsBlob(options?: ExportOptions): Promise<Blob>;
  downloadFile(options?: ExportOptions): Promise<void>;
}
