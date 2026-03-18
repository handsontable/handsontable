import Core from '../../core';
import { BasePlugin } from '../base';

export type Formats = 'csv' | 'xlsx';

export interface SheetOptions {
  instance: Core;
  name: string;
  columnHeaders?: boolean;
  rowHeaders?: boolean;
  exportHiddenColumns?: boolean;
  exportHiddenRows?: boolean;
  exportFormulas?: boolean;
  range?: number[];
}

export interface ConditionalFormattingDescriptor {
  rows?: [number, number];
  cols?: [number, number];
  rules: object[];
}

export interface ExportOptions {
  mimeType?: string;
  fileExtension?: string;
  filename?: string;
  encoding?: string;
  bom?: boolean;
  columnDelimiter?: string;
  rowDelimiter?: string;
  columnHeaders?: boolean;
  rowHeaders?: boolean;
  exportHiddenColumns?: boolean;
  exportHiddenRows?: boolean;
  exportFormulas?: boolean;
  sheets?: SheetOptions[];
  compression?: boolean;
  conditionalFormatting?: ConditionalFormattingDescriptor[];
  range?: number[];
  sanitizeValues?: boolean | RegExp | ((val: string) => string);
}

export interface ExportFileSettings {
  engine?: object;
  contextMenu?: boolean;
}

export type Settings = ExportFileSettings;

export class ExportFile extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  exportAsString(format: Formats, options?: ExportOptions): string;
  exportAsBlob(format: Formats, options?: ExportOptions): Blob | Promise<Blob>;
  downloadFile(format: Formats, options?: ExportOptions): void | Promise<void>;
}
