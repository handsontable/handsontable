import Core from '../../core';
import { BasePlugin } from '../base';

export type Settings = boolean | number[];

export class TrimRows extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  getTrimmedRows(): number[];
  trimRows(rows: number[]): void;
  trimRow(...row: number[]): void;
  untrimRows(rows: number[]): void;
  untrimRow(...row: number[]): void;
  isTrimmed(physicalRow: number): boolean;
  untrimAll(): void;
  isValidConfig(trimmedRows: number[]): boolean;
}
