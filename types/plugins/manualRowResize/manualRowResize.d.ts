import Core from '../../core';
import { BasePlugin } from '../base';
import EventManager from '../../eventManager';

export type Settings = boolean | number[];

export class ManualRowResize extends BasePlugin {
  constructor(hotInstance: Core);

  currentTH: HTMLElement;
  currentRow: number | undefined;
  selectedRows: number[];
  currentHeight: number;
  newSize: number | undefined;
  startY: number | undefined;
  startHeight: number;
  startOffset: number;
  handle: HTMLElement;
  guide: HTMLElement;
  eventManager: EventManager;
  pressed: boolean;
  dblclick: number;
  autoresizeTimeout: (() => void) | undefined;

  isEnabled(): boolean;
  saveManualRowHeights(): void;
  loadManualRowHeights(): Array<number | null>;
  setManualSize(row: number, height: number): number;
}
