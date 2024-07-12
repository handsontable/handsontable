import Core from '../../core';
import { BasePlugin } from '../base';
import EventManager from '../../eventManager';
import CellRange from '../../3rdparty/walkontable/src/cell/range';
import CellCoords from '../../3rdparty/walkontable/src/cell/coords';

export type Settings = boolean;

export class MultipleSelectionHandles extends BasePlugin {
  constructor(hotInstance: Core);

  dragged: string[];
  eventManager: EventManager;
  lastSetCell: HTMLElement | undefined;

  isEnabled(): boolean;
  getCurrentRangeCoords(
    selectedRange: CellRange,
    currentTouch: CellCoords,
    touchStartDirection: 'NE-SW' | 'NW-SE' | 'SW-NE' | 'SE-NW',
    currentDirection: 'NE-SW' | 'NW-SE' | 'SW-NE' | 'SE-NW',
    draggedHandle: 'top' | 'bottom',
  ): {
    start: number;
    end: number;
  };
  isDragged(): boolean;
}
