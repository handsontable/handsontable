/**
 * The internal types of the FormulaBuilder plugin. These may name `hyperformula-ui`, because no
 * public declaration reaches this module: the plugin barrel (`index.ts`) does not export it, and no
 * public member of the plugin class uses these types in its signature. Keep it that way - see the
 * header of `types.ts` for why a public declaration must not name the package.
 */

/**
 * The `hyperformula-ui` module namespace, injected through the plugin settings so the
 * Handsontable bundle never imports the package at runtime.
 */
export type CoreModule = typeof import('hyperformula-ui');

/**
 * The module members the plugin calls. The `builder` setting is checked for every one of them
 * before the plugin enables, so a package version that lacks one is reported by name instead of
 * failing later with `X is not a function`.
 */
export const REQUIRED_CORE_MEMBERS = [
  'FormulaBuilder',
  'EventManager',
  'PickEmitter',
  'RangeDragTracker',
  'HeaderDragTracker',
  'armTrailingClickSwallow',
  'expandHeaderSpan',
  'fillColor',
  'findDataEdge',
  'formatRef',
  'normalizeRange',
  'parseCellInput',
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
