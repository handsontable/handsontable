/**
 * The `hyperformula-ui` grid-adapter contract, restated for the plugin's own declarations.
 *
 * Every `.d.ts` Handsontable publishes is compiled by the `Emitted Types` check without the package
 * installed (it is a devDependency), so no emitted declaration may import it, internal ones
 * included: a deep import resolves them too. The shapes below are the package's, and
 * `__tests__/formulaBuilder.types.ts` asserts each of them against the package in both directions
 * plus the key sets, and that `HandsontableAdapter` satisfies the package's `IGridAdapter`. A type
 * that only a `#` field uses may keep importing the package: a private field emits as `#private`.
 */
import type { FormulaBuilderStepDirection } from './types';

/**
 * A one-cell step direction.
 */
export type GridDirection = FormulaBuilderStepDirection;

/**
 * The grid size, in HyperFormula space.
 */
export interface GridSize {
  /**
   * The number of rows.
   */
  rows: number;
  /**
   * The number of columns.
   */
  cols: number;
}

/**
 * A cell address, in HyperFormula space.
 */
export interface CellAddress {
  /**
   * The sheet name (`''` for the grid's own sheet).
   */
  sheet: string;
  /**
   * The column index.
   */
  col: number;
  /**
   * The row index.
   */
  row: number;
}

/**
 * A cell range, in HyperFormula space.
 */
export interface CellRange {
  /**
   * The first corner.
   */
  start: CellAddress;
  /**
   * The second corner.
   */
  end: CellAddress;
}

/**
 * A grid selection: the active cell and the selected range.
 */
export interface GridSelection {
  /**
   * The active cell.
   */
  active: CellAddress;
  /**
   * The selected range.
   */
  range: CellRange;
}

/**
 * Removes a subscription.
 */
export type Unsubscribe = () => void;

/**
 * An axis of a whole-row or whole-column reference.
 */
export type HeaderAxis = 'column' | 'row';

/**
 * Resolves the color of a reference that ref-selection is about to insert.
 */
export type RefSelectionColorResolver = (range: CellRange, append: boolean, wholeAxis?: HeaderAxis) => string;

/**
 * A persistent reference highlight.
 */
export interface RangeHighlight {
  /**
   * The highlighted range.
   */
  range: CellRange;
  /**
   * The border (and fill) color.
   */
  color: string;
  /**
   * Whether the cells get a translucent fill.
   */
  fill?: boolean;
  /**
   * The axis of a whole-column or whole-row reference.
   */
  whole?: 'column' | 'row';
}

/**
 * A single-cell pick.
 */
export interface CellPick {
  /**
   * The picked cell.
   */
  ref: CellAddress;
  /**
   * Whether the pick appends a reference (Ctrl/Cmd held).
   */
  append: boolean;
}

/**
 * A range pick.
 */
export interface RangePick {
  /**
   * The picked range.
   */
  ref: CellRange;
  /**
   * Whether the pick appends a reference (Ctrl/Cmd held).
   */
  append: boolean;
}

/**
 * A whole-row or whole-column pick.
 */
export interface HeaderPick {
  /**
   * The picked axis.
   */
  axis: HeaderAxis;
  /**
   * The sheet name.
   */
  sheet: string;
  /**
   * The first picked index.
   */
  start: number;
  /**
   * The last picked index.
   */
  end: number;
  /**
   * Whether the pick appends a reference (Ctrl/Cmd held).
   */
  append: boolean;
}

/**
 * Receives a single-cell pick.
 */
export type CellPickListener = (pick: CellPick) => void;

/**
 * Receives a range pick.
 */
export type RangePickListener = (pick: RangePick) => void;

/**
 * Receives a header pick.
 */
export type HeaderPickListener = (pick: HeaderPick) => void;

/**
 * Who commits an edit when the user clicks outside the grid.
 */
export type OutsideClickCommitMode = 'emitted' | 'native';

/**
 * The part of the package's formula editor the reference picker calls.
 */
export interface PickingEditor {
  /**
   * Whether the editor holds a formula.
   */
  isFormula(): boolean;
  /**
   * Whether a click or drag would insert a reference now.
   */
  isRefSelectionActive(): boolean;
  /**
   * Appends the closing parentheses an unfinished formula is missing.
   */
  closeUnbalancedParens(): void;
  /**
   * The editor text, in storage form.
   */
  getValue(): string;
  /**
   * The caret offset in the editor text.
   */
  getCaretOffset(): number;
  /**
   * The color the reference about to be inserted gets.
   */
  getRefPreviewColor(range: CellRange, append: boolean, wholeAxis?: HeaderAxis): string;
}
