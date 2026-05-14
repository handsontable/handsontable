/**
 * Common interfaces used across the Handsontable codebase.
 * These interfaces provide type-safe access to Core and Walkontable instances
 * without requiring circular imports.
 */

import { IndexMapper } from './translations';

// ---------------------------------------------------------------------------
// Re-exports — types have moved to their canonical homes
// ---------------------------------------------------------------------------

export type { GridSettings, Events } from './core/settings';
export type { RangeType, HotInstance, GridHelperInstance, ViewportScrollerInstance } from './core/types';
export type { OverlayType } from './3rdparty/walkontable/src/types';
export type { SelectionTableProps } from './selection/types';
export type { DataAccessObject, ScrollDao } from './tableView';

// Class-mirror re-exports (the interface was just a hand-written duplicate of
// an existing TypeScript class/interface; use the authoritative type directly)
export type { default as HighlightInstance } from './selection/highlight/highlight';
export type { default as HighlightSelection } from './selection/highlight/visualSelection';
export type { default as SelectionRangeContainer } from './selection/range';
export type { default as SelectionManager } from './selection/selection';
export type { default as ViewInstance } from './tableView';
export type { Context as ShortcutContext } from './shortcuts/context';
export type { ShortcutManager } from './shortcuts/manager';
export type { StylesHandler } from './utils/stylesHandler';
export type { BaseEditor as BaseEditorInstance } from './editors/baseEditor/baseEditor';
export type { FocusGridManager as FocusManagerInstance } from './focusManager/grid';
export type { FocusScopeManager as FocusScopeManagerInstance } from './focusManager/scopeManager';
export type { default as EditorManagerInstance } from './editorManager';
export type { default as MetaManagerInstance } from './dataMap/metaManager';
export type { default as DataMapInstance } from './dataMap/dataMap';
export type { default as DataSourceInstance } from './dataMap/dataSource';

// ---------------------------------------------------------------------------
// CellCoords / CellRange — still hand-written interfaces (Step 6 will replace
// them with the walkontable class types; kept here to avoid a big-bang diff)
// ---------------------------------------------------------------------------

/**
 * Represents a cell coordinates object.
 */
export interface CellCoords {
  row: number;
  col: number;
  assign(coords: CellCoords | { row?: number; col?: number }): CellCoords;
  clone(): CellCoords;
  isEqual(coords: CellCoords): boolean;
  isSouthEastOf(testedCoords: CellCoords): boolean;
  isSouthWestOf(testedCoords: CellCoords): boolean;
  isNorthWestOf(testedCoords: CellCoords): boolean;
  isNorthEastOf(testedCoords: CellCoords): boolean;
  normalize(): CellCoords;
  isHeader(): boolean;
  isCell(): boolean;
  add(coords: CellCoords | { row?: number; col?: number }): CellCoords;
  toObject(): { row: number; col: number };
  [key: string]: unknown;
}

/**
 * Represents a cell range object.
 */
export interface CellRange {
  highlight: CellCoords;
  from: CellCoords;
  to: CellCoords;
  getTopStartCorner(): CellCoords;
  getTopEndCorner(): CellCoords;
  getBottomStartCorner(): CellCoords;
  getBottomEndCorner(): CellCoords;
  getTopLeftCorner(): CellCoords;
  getTopRightCorner(): CellCoords;
  getBottomLeftCorner(): CellCoords;
  getBottomRightCorner(): CellCoords;
  getOuterTopStartCorner(): CellCoords;
  getOuterTopEndCorner(): CellCoords;
  getOuterBottomStartCorner(): CellCoords;
  getOuterBottomEndCorner(): CellCoords;
  isValid(wot: object): boolean;
  isSingle(): boolean;
  isSingleCell(): boolean;
  isSingleHeader(): boolean;
  getWidth(): number;
  getHeight(): number;
  getCellsCount(): number;
  includes(cellCoords: CellCoords): boolean;
  includesRange(cellRange: CellRange): boolean;
  isOverlappingHorizontally(cellRange: CellRange): boolean;
  isOverlappingVertically(cellRange: CellRange): boolean;
  isNorthWestOf(cellRange: CellRange | CellCoords): boolean;
  isSouthEastOf(cellRange: CellRange | CellCoords): boolean;
  getDirection(): string;
  setDirection(direction: string): void;
  setHighlight(coords: CellCoords): CellRange;
  setFrom(coords: CellCoords): CellRange;
  setTo(coords: CellCoords): CellRange;
  getHorizontalDirection(): string;
  getVerticalDirection(): string;
  getInlineDirection(): string;
  containsHeaders(): boolean;
  isHeader(): boolean;
  expand(cellCoords: CellCoords): boolean;
  expandByRange(expandingRange: CellRange, insertionDirection?: string | boolean): boolean;
  forAll(callback: (row: number, column: number) => boolean | void): void;
  isEqual(cellRange: CellRange): boolean;
  normalize(): CellRange;
  clone(): CellRange;
  toObject(): { from: { row: number; col: number }; to: { row: number; col: number } };
  [key: string]: unknown;
}

// Suppress "unused import" error — IndexMapper is imported for re-use by
// modules that previously got it transitively through common.ts.
// TODO: remove this once all importers have been updated to import IndexMapper
// directly from './translations'.
export { IndexMapper };
