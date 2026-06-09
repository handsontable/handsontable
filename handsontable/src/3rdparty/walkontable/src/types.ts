/**
 * Internal type definitions for the Walkontable rendering engine.
 * These are NOT part of the public Handsontable API.
 */
import type CellCoords from './cell/coords';
import type CellRange from './cell/range';
import type { default as WalkontableSettings } from './settings';
import type { default as WalkontableTable } from './table';
import type { default as WalkontableViewport } from './viewport';
import type { default as WalkontableScroll } from './scroll';
import type { default as WalkontableOverlays } from './overlays';
import type { SelectionManager as WalkontableSelectionManager } from './selection/manager';
import type { Overlay as WalkontableOverlay } from './overlay/_base';
import type EventManager from '../../../eventManager';

export interface DomBindings {
  rootDocument: Document;
  rootWindow: Window;
  rootElement: HTMLElement;
  rootTable: HTMLTableElement;
  [key: string]: unknown;
}

export interface WalkontableInstance {
  wtTable: WalkontableTable;
  wtViewport: WalkontableViewport;
  wtOverlays: WalkontableOverlays;
  wtSettings: WalkontableSettings;
  selectionManager: WalkontableSelectionManager;
  cloneSource: WalkontableInstance;
  drawn: boolean;
  domBindings: DomBindings;
  rootDocument: Document;
  rootWindow: Window & typeof globalThis;
  eventManager: EventManager;
  activeOverlayName: string;
  wtEvent: Record<string, unknown>;
  drawInterrupted: boolean;
  guid: string;
  createCellCoords(row: number, column: number): CellCoords;
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords): CellRange;
  getSetting(key: string, ...args: unknown[]): unknown;
  update(key: string, value: unknown): WalkontableInstance;
  draw(fastDraw?: boolean): WalkontableInstance;
  scrollViewport(
    coords: CellCoords | { row: number; col: number },
    snapToTop?: boolean | string, snapToRight?: boolean | string,
    snapToBottom?: boolean, snapToLeft?: boolean): boolean;
  scrollViewportHorizontally(column: number, snapping?: string): boolean;
  scrollViewportVertically(row: number, snapping?: string): boolean;
  getCell(coords: CellCoords | { row: number; col: number }, topmost?: boolean): HTMLTableCellElement | number;
  getOverlayName(): string;
  getOverlayByName(name: string): WalkontableInstance | null;
  exportSettingsAsClassNames(): string[];
  hasSetting(key: string): boolean;
  destroy(): void;
  wtScroll: WalkontableScroll;
  [key: string]: unknown;
}

/**
 * Overlay type names used by Walkontable.
 */
export type OverlayType = 'inline_start' | 'top' | 'top_inline_start_corner' | 'bottom' |
  'bottom_inline_start_corner' | 'master';

/**
 * Minimal interface for the StylesHandler used inside Walkontable.
 * The full class lives in src/utils/stylesHandler.ts.
 */
export interface StylesHandler {
  getCSSVariableValue(variableName: string): string | number;
  getDefaultRowHeight(visualRowIndex?: number): number;
  areCellsBorderBox(): boolean;
  [key: string]: unknown;
}

/**
 * Data access object passed to Walkontable table/viewport/scroll subsystems.
 */
export interface DataAccessObject {
  wot: WalkontableInstance;
  wtTable: WalkontableTable;
  wtViewport: WalkontableViewport;
  wtOverlays: WalkontableOverlays;
  domBindings: DomBindings;
  cloneSource: WalkontableInstance;
  selectionManager: WalkontableSelectionManager;
  drawn: boolean;
  parentTableOffset: { top: number; left: number } | number;
  topOverlayTrimmingContainer: HTMLElement | Window;
  inlineStartOverlayTrimmingContainer: HTMLElement | Window;
  topScrollPosition: number;
  topParentOffset: number;
  inlineStartScrollPosition: number;
  inlineStartParentOffset: number;
  topOverlay: WalkontableOverlay;
  bottomOverlay: WalkontableOverlay;
  inlineStartOverlay: WalkontableOverlay;
  workspaceWidth: number;
  startColumnRendered: number | null;
  startColumnVisible: number | null;
  startColumnPartiallyVisible: number | null;
  endColumnRendered: number | null;
  endColumnVisible: number | null;
  endColumnPartiallyVisible: number | null;
  countColumnsRendered: number;
  countColumnsVisible: number;
  startRowRendered: number | null;
  startRowVisible: number | null;
  startRowPartiallyVisible: number | null;
  endRowRendered: number | null;
  endRowVisible: number | null;
  endRowPartiallyVisible: number | null;
  countRowsRendered: number;
  countRowsVisible: number;
  columnHeaders: Function[];
  rowHeaders: Function[];
  [key: string]: unknown;
}

/**
 * Scroll data access object passed to the Walkontable scroll module.
 */
export interface ScrollDao {
  drawn: boolean;
  topOverlay: WalkontableOverlay;
  inlineStartOverlay: WalkontableOverlay;
  wtTable: WalkontableTable;
  wtViewport: WalkontableViewport;
  wtSettings: WalkontableSettings;
  rootWindow: Window & typeof globalThis;
  totalRows: number;
  totalColumns: number;
  fixedRowsTop: number;
  fixedRowsBottom: number;
  fixedColumnsStart: number;
  [key: string]: unknown;
}
