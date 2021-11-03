import Core from '../../core';
import { CellValue } from '../../common';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  pasteMode?: PasteModeType;
  rowsLimit?: number;
  columnsLimit?: number;
}

export type Settings = boolean | DetailedSettings;
export type PasteModeType = 'overwrite' | 'shift_down' | 'shift_right';

export interface RangeType {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export class CopyPaste extends BasePlugin {
  constructor(hotInstance: Core);

  columnsLimit: number;
  pasteMode: string;
  rowsLimit: number;

  isEnabled(): boolean;
  copy(): void;
  cut(): void;
  getRangedCopyableData(ranges: RangeType[]): string;
  getRangedData(ranges: RangeType[]): CellValue[][];
  paste(pastableText?: string, pastableHtml?: string): void;
  setCopyableText(): void;
}
