import Core from '../../core';
import { BasePlugin } from '../base';

export type Formats = 'csv';
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
  range?: number[];
}
export type Settings = boolean;

export class ExportFile extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  exportAsString(format: Formats, options?: ExportOptions): string;
  exportAsBlob(format: Formats, options?: ExportOptions): Blob;
  downloadFile(format: Formats, options?: ExportOptions): void;
}
