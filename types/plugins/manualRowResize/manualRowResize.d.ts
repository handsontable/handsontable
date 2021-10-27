import Core from '../../core';
import { BasePlugin } from '../base';
import EventManager from '../../eventManager';

export type Settings = boolean | number[];

export class ManualRowResize extends BasePlugin {
  constructor(hotInstance: Core);

  currentTH: HTMLElement;
  currentRow: number | void;
  selectedRows: number[];
  currentHeight: number;
  newSize: number | void;
  startY: number | void;
  startHeight: number;
  startOffset: number;
  handle: HTMLElement;
  guide: HTMLElement;
  eventManager: EventManager;
  pressed: boolean;
  dblclick: number;
  autoresizeTimeout: (() => void) | void;

  isEnabled(): boolean;
  saveManualRowHeights(): void;
  loadManualRowHeights(): (number|null)[];
  setManualSize(row: number, height: number): number;
}
