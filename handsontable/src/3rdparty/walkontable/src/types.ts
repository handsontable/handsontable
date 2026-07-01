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
import type WalkontableEvent from './event';
import type { GeometryReader } from './geometry/geometryReader';

export interface DomBindings {
  rootDocument: Document;
  rootWindow: Window;
  rootElement: HTMLElement;
  rootTable: HTMLTableElement;
  geometryReader: GeometryReader;
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
  rootWindow: Window;
  eventManager: EventManager;
  activeOverlayName: string;
  wtEvent: WalkontableEvent | Record<string, unknown>;
  drawInterrupted: boolean;
  guid: string;
  createCellCoords(row: number, column: number): CellCoords;
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords): CellRange;
  getSetting(key: string, ...args: unknown[]): unknown;
  update(key: string, value: unknown): void;
  draw(fastDraw?: boolean): void;
  scrollViewport(
    coords: CellCoords | { row: number; col: number },
    snapToTop?: boolean | string, snapToRight?: boolean | string,
    snapToBottom?: boolean, snapToLeft?: boolean): boolean;
  scrollViewportHorizontally(column: number, snapping?: string): boolean;
  scrollViewportVertically(row: number, snapping?: string): boolean;
  getCell(coords: CellCoords | { row: number; col: number }, topmost?: boolean): HTMLTableCellElement | number;
  getOverlayByName(name: string): WalkontableInstance | WalkontableOverlay | null;
  exportSettingsAsClassNames(): void;
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
