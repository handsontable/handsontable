import Core from '../../core';
import { BasePlugin } from '../base';

export type Formats = 'csv' | 'xlsx';

export interface SheetOptions {
  instance: Core;
  name?: string;
  colHeaders?: boolean;
  /** @deprecated Use `colHeaders` instead. */
  columnHeaders?: boolean;
  rowHeaders?: boolean;
  exportHiddenColumns?: boolean | 'hide';
  exportHiddenRows?: boolean | 'hide';
  exportFormulas?: boolean;
  range?: number[];
}

export interface ConditionalFormattingDescriptor {
  rows?: [number, number];
  cols?: [number, number];
  rules: object[];
}

export interface HeaderStyleBorder {
  style?: string;
  color?: string;
}

export interface HeaderStyle {
  backgroundColor?: string;
  border?: HeaderStyleBorder | null;
}

export interface ExportOptions {
  mimeType?: string;
  fileExtension?: string;
  filename?: string;
  encoding?: string;
  bom?: boolean;
  columnDelimiter?: string;
  rowDelimiter?: string;
  colHeaders?: boolean;
  /** @deprecated Use `colHeaders` instead. */
  columnHeaders?: boolean;
  rowHeaders?: boolean;
  exportHiddenColumns?: boolean | 'hide';
  exportHiddenRows?: boolean | 'hide';
  exportFormulas?: boolean;
  sheets?: SheetOptions[];
  /**
   * Enable DEFLATE compression. Pass `true` for level 6 (library default), or a number 1–9 for
   * a specific level. Omit or pass a falsy value to use no compression (XLSX only).
   */
  compression?: boolean | number;
  conditionalFormatting?: ConditionalFormattingDescriptor[];
  range?: number[];
  sanitizeValues?: boolean | RegExp | ((val: string) => string);
  /**
   * Style applied to column and row header cells (XLSX only).
   * Set to `null` to export headers with no styling.
   */
  headerStyle?: HeaderStyle | null;
  /**
   * ExcelJS library instance. Can be supplied per-call to override the engine set in plugin settings (XLSX only).
   */
  engine?: object;
}

export interface ExportFileSettings {
  engines?: Record<string, object>;
}

export type Settings = ExportFileSettings;

export class ExportFile extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  supportsExportFormat(format: Formats): boolean;
  exportAsString(format: Formats, options?: ExportOptions): string;
  exportAsBlob(format: Formats, options?: ExportOptions): Blob;
  exportAsBlobAsync(format: Formats, options?: ExportOptions): Promise<Blob>;
  downloadFile(format: Formats, options?: ExportOptions): void;
  downloadFileAsync(format: Formats, options?: ExportOptions): Promise<void>;
}
