/**
 * Type contract tests for `handsontable/common`.
 *
 * Positive assertions: all curated public symbols must be importable.
 * Negative assertions: removed internal symbols must NOT be importable.
 */

// Positive: curated public types are available from 'handsontable/common'
import type {
  GridSettings,
  Events,
  CellCoords,
  CellRange,
  RangeType,
  OverlayType,
  HotInstance,
  BaseEditorInstance,
  CellValue,
  CellChange,
  RowObject,
  ChangeSource,
  NumericFormatOptions,
  CellMeta,
  CellProperties,
  ColumnSettings,
  SourceRowData,
  IndexMapper,
} from 'handsontable/common';

// Positive: all curated public types are also available from the main entry points
import type {
  GridSettings as GridSettings2,
  Events as Events2,
  CellCoords as CellCoords2,
  CellRange as CellRange2,
  HotInstance as HotInstance2,
  BaseEditorInstance as BaseEditorInstance2,
  SourceRowData as SourceRowData2,
} from 'handsontable';

import type {
  GridSettings as GridSettings3,
  Events as Events3,
  HotInstance as HotInstance3,
  BaseEditorInstance as BaseEditorInstance3,
  SourceRowData as SourceRowData3,
} from 'handsontable/base';

// Ensure the types are structurally usable (not just imported)
type Maybe<T> = NonNullable<T> | void;

declare const settings: GridSettings;
declare const hotInstance: HotInstance;
declare const cellCoords: CellCoords;
declare const cellRange: CellRange;
declare const rangeType: RangeType;
declare const sourceRow: SourceRowData;
declare const indexMapper: IndexMapper;

// Positive: SourceRowData is a union type of RowObject | CellValue[]
const typedRow: SourceRowData = { name: 'test' };
const typedRow2: SourceRowData = ['a', 1];

// Negative: internal symbols must NOT be importable from 'handsontable/common'
// @ts-expect-error SelectionManager is not part of the public API
import type { SelectionManager } from 'handsontable/common';

// @ts-expect-error ViewInstance is not part of the public API
import type { ViewInstance } from 'handsontable/common';

// @ts-expect-error DataAccessObject is not part of the public API
import type { DataAccessObject } from 'handsontable/common';

// @ts-expect-error MetaManagerInstance is not part of the public API
import type { MetaManagerInstance } from 'handsontable/common';

// @ts-expect-error EditorManagerInstance is not part of the public API
import type { EditorManagerInstance } from 'handsontable/common';

// @ts-expect-error ShortcutManager is not part of the public API
import type { ShortcutManager } from 'handsontable/common';

// @ts-expect-error GridHelperInstance is not part of the public API
import type { GridHelperInstance } from 'handsontable/common';

// @ts-expect-error ViewportScrollerInstance is not part of the public API
import type { ViewportScrollerInstance } from 'handsontable/common';
