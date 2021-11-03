import Core from '../../core';
import { BasePlugin } from '../base';
import EventManager from '../../eventManager';

export type Settings = boolean | number[];

export class ManualColumnResize extends BasePlugin {
  constructor(hotInstance: Core);

  currentTH: HTMLElement | undefined;
  currentCol: number | undefined;
  selectedCols: number[];
  currentWidth: number;
  newSize: number | undefined;
  startX: number | undefined;
  startWidth: number;
  startOffset: number;
  handle: HTMLElement;
  guide: HTMLElement;
  eventManager: EventManager;
  pressed: boolean;
  dblclick: number;
  autoresizeTimeout: (() => void) | undefined;

  isEnabled(): boolean;
  saveManualColumnWidths(): void;
  loadManualColumnWidths(): Array<number | null>;
  setManualSize(column: number, width: number): number;
  clearManualSize(column: number): void;
}
