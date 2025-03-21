import { Settings } from '../types';
import CellCoords from '../cell/coords';
import CellRange from '../cell/range';
import EventManager from '../../../../eventManager';
import MasterTable from '../table/master';
import Scroll from '../scroll';
import Viewport from '../viewport';
import Overlays from '../overlays';
import { StylesHandler } from '../utils/stylesHandler';
import { SelectionManager } from '../selection/manager';
import Event from '../event';
import { ScrollDao, TableDao, ViewportDao, DomBindings } from '../types';

/**
 * Interface for the extended TableDao with additional properties
 */
export interface ExtendedTableDao extends TableDao {
  startColumnPartiallyVisible: number | null;
  endColumnPartiallyVisible: number | null;
  startRowPartiallyVisible: number | null;
  endRowPartiallyVisible: number | null;
  columnHeaders: any[];
  rowHeaders: any[];
  selectionManager: any;
  stylesHandler: any;
  selections: any;
}

/**
 * Interface for the WalkontableCloneOptions used in Clone class
 */
export interface WalkontableCloneOptions {
  source: CoreAbstract;
  overlay: any;
  viewport: Viewport;
  selections: any;
  selectionManager: any;
  event: Event;
  stylesHandler: StylesHandler;
}

/**
 * Base interface for the Walkontable core classes
 */
export interface CoreAbstract {
  wtTable: any;
  wtScroll: Scroll;
  wtViewport: Viewport;
  wtOverlays: Overlays;
  selectionManager: SelectionManager;
  wtEvent: Event;
  guid: string;
  drawInterrupted: boolean;
  drawn: boolean;
  activeOverlayName: string;
  domBindings: DomBindings;
  wtSettings: Settings;
  eventManager: EventManager;
  stylesHandler: StylesHandler;
  cloneSource?: CoreAbstract;
  cloneOverlay?: any;
  selections: any;

  findOriginalHeaders(): void;
  createCellCoords(row: number, column: number): CellCoords;
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords): CellRange;
  draw(fastDraw?: boolean): CoreAbstract;
  getCell(coords: CellCoords, topmost?: boolean): HTMLElement;
  scrollViewport(coords: CellCoords, horizontalSnap?: 'auto' | 'start' | 'end', verticalSnap?: 'auto' | 'top' | 'bottom'): boolean;
  scrollViewportHorizontally(column: number, snapping?: 'auto' | 'start' | 'end'): boolean;
  scrollViewportVertically(row: number, snapping?: 'auto' | 'top' | 'bottom'): boolean;
  getViewport(): number[];
  destroy(): void;
  createScrollDao(): ScrollDao;
  getTableDao(): ExtendedTableDao;
  getViewportDao?(): ViewportDao;
} 