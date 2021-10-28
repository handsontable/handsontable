import Core from '../../core';
import { BasePlugin } from '../base';
import EventManager from '../../eventManager';
import CellRange from '../../3rdparty/walkontable/src/cell/range';

export type Settings = boolean;

export class MultipleSelectionHandles extends BasePlugin {
  constructor(hotInstance: Core);

  dragged: string[];
  eventManager: EventManager;
  lastSetCell: HTMLElement | undefined;

  isEnabled(): boolean;
  getCurrentRangeCoords(selectedRange: CellRange, currentTouch: CellRange, touchStartDirection: string, currentDirection: string, draggedHandle: string): {
    start: number;
    end: number;
  };
  isDragged(): boolean;
}
