/**
 * The internal types of the FormulaBuilder plugin. No emitted declaration may name
 * `hyperformula-ui` (see `gridContract.ts`), so the package's module type stays private here.
 */

/**
 * The `hyperformula-ui` module namespace. Not exported: an exported alias would put the package
 * in this file's declaration, and every emitted declaration is compiled without the package
 * (see `gridContract.ts`). Each module that needs it for a `#` field declares its own.
 */
type CoreModule = typeof import('hyperformula-ui');

/**
 * The module members the plugin calls. The `builder` setting is checked for every one of them
 * before the plugin enables, so a package version that lacks one is reported by name instead of
 * failing later with `X is not a function`.
 */
export const REQUIRED_CORE_MEMBERS = [
  'FormulaBuilder',
  'PickEmitter',
  'RangeDragTracker',
  'HeaderDragTracker',
  'armTrailingClickSwallow',
  'expandHeaderSpan',
  'fillColor',
  'findDataEdge',
  'formatRef',
  'normalizeRange',
  'readCellText',
  'stepCell',
] as const satisfies readonly (keyof CoreModule)[];

/**
 * Bidirectional index translation between the visual grid space and the
 * HyperFormula (source) space, built from the Formulas plugin axis syncers.
 */
export interface VisualHfIndexMapping {
  /**
   * Maps a visual row index to its HyperFormula row index (`-1` when unresolvable).
   *
   * @param {number} visualRow The visual row index.
   * @returns {number}
   */
  visualToHfRow(visualRow: number): number;
  /**
   * Maps a visual column index to its HyperFormula column index (`-1` when unresolvable).
   *
   * @param {number} visualCol The visual column index.
   * @returns {number}
   */
  visualToHfCol(visualCol: number): number;
  /**
   * Maps a HyperFormula row index to its visual row index (`-1` when trimmed).
   *
   * @param {number} hfRow The HyperFormula row index.
   * @returns {number}
   */
  hfToVisualRow(hfRow: number): number;
  /**
   * Maps a HyperFormula column index to its visual column index (`-1` when trimmed).
   *
   * @param {number} hfCol The HyperFormula column index.
   * @returns {number}
   */
  hfToVisualCol(hfCol: number): number;
}

/**
 * The members of a scroll container the package's edge auto-scroller reads: its rectangle for the
 * edge zones, its client box to clamp the pointer, and its scroll offsets to step. An `HTMLElement`
 * has them all; the window's viewport stands in through an object with the same members.
 */
export interface AutoScrollTarget {
  /**
   * The container's box in viewport coordinates.
   */
  getBoundingClientRect(): { left: number; top: number; right: number; bottom: number };
  scrollLeft: number;
  scrollTop: number;
  readonly clientLeft: number;
  readonly clientTop: number;
  readonly clientWidth: number;
  readonly clientHeight: number;
}
