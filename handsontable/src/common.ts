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

// CellCoords and CellRange — use the authoritative class types from walkontable
export type { default as CellCoords } from './3rdparty/walkontable/src/cell/coords';
export type { default as CellRange } from './3rdparty/walkontable/src/cell/range';

// Suppress "unused import" error — IndexMapper is imported for re-use by
// modules that previously got it transitively through common.ts.
// TODO: remove this once all importers have been updated to import IndexMapper
// directly from './translations'.
export { IndexMapper };
