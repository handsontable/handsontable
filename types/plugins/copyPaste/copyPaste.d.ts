import { BasePlugin } from "../base";

export interface Settings {
  pasteMode?: PasteModeType;
  rowsLimit?: number;
  columnsLimit?: number;
}

export type PasteModeType = 'overwrite' | 'shift_down' | 'shift_right';
export type RangeType = {
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
};

export class CopyPaste extends BasePlugin {
  constructor(hotInstance: any);

  columnsLimit: number;
  pasteMode: string;
  rowsLimit: number;

  isEnabled(): boolean;
  copy(): void;
  cut(): void;
  getRangedCopyableData(ranges: RangeType[]): string;
  getRangedData(ranges: RangeType[]): any[][];
  paste(pastableText?: string, pastableHtml?: string): void;
  setCopyableText(): void;
}
