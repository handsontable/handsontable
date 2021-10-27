import Core from '../../core';
import { BasePlugin } from '../base';
import EventManager from '../../eventManager';

export type Settings = boolean | number[];

export class ManualColumnResize extends BasePlugin {
  constructor(hotInstance: Core);

  currentTH: HTMLElement | void;
  currentCol: number | void;
  selectedCols: number[];
  currentWidth: number;
  newSize: number | void;
  startX: number | void;
  startWidth: number;
  startOffset: number;
  handle: HTMLElement;
  guide: HTMLElement;
  eventManager: EventManager;
  pressed: boolean;
  dblclick: number;
  autoresizeTimeout: (() => void) | void;

  isEnabled(): boolean;
  saveManualColumnWidths(): void;
  loadManualColumnWidths(): (number | null)[];
  setManualSize(column: number, width: number): number;
  clearManualSize(column: number): void;
}
