/**
 * Public TypeScript API for Handsontable — the `handsontable/common` subpath.
 *
 * Contains only types intended for external consumers.
 * All entries are derived from their canonical sources; no hand-written mirrors.
 *
 * To add a new hook:
 *   1. Add the callback signature to `GridSettings` in `src/core/settings.ts`.
 *   2. Register the hook name in `src/core/hooks/index.ts`.
 */

// Configuration & hooks
export type { GridSettings, Events } from './core/settings';
export type {
  CellValue, CellChange, RowObject, ChangeSource,
  NumericFormatOptions, CellMeta, CellProperties,
  ColumnSettings, SourceRowData,
} from './settings';

// Coordinates / ranges
export type { default as CellCoords } from './3rdparty/walkontable/src/cell/coords';
export type { default as CellRange } from './3rdparty/walkontable/src/cell/range';
export type { RangeType } from './core/types';
export type { OverlayType } from './3rdparty/walkontable/src/types';

// Instance typing for the grid (the `hot` variable)
export type { HotInstance } from './core/types';

// Public class type needed for custom editor authors
export type { BaseEditor as BaseEditorInstance } from './editors/baseEditor/baseEditor';

// Index mapping (public, documented API)
export { IndexMapper } from './translations';
