import Core from '../../core';
import { CellValue } from '../../common';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  pasteMode?: PasteModeType;
  rowsLimit?: number;
  columnsLimit?: number;
  copyColumnHeaders?: boolean;
  copyColumnGroupHeaders?: boolean;
  copyColumnHeadersOnly?: boolean;
  uiContainer?: HTMLElement;
}

export type Settings = boolean | DetailedSettings;
export type PasteModeType = 'overwrite' | 'shift_down' | 'shift_right';
export type CopyModeType = 'cells-only' | 'column-headers-only' | 'with-all-column-headers' | 'with-column-headers';

export interface RangeType {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export class CopyPaste extends BasePlugin {
  constructor(hotInstance: Core);

  columnsLimit: number;
  rowsLimit: number;
  pasteMode: string;

  isEnabled(): boolean;
  copy(copyMode?: CopyModeType): void;
  copyCellsOnly(): void;
  copyColumnHeadersOnly(): void;
  copyWithAllColumnHeaders(): void;
  copyWithColumnHeaders(): void;
  cut(): void;
  getRangedCopyableData(ranges: RangeType[]): string;
  getRangedData(ranges: RangeType[]): CellValue[][];
  paste(pastableText?: string, pastableHtml?: string): void;
  setCopyableText(): void;
}
