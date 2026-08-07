import type { LayoutDirection, PopupsOptions } from '@hfe/core';

/**
 * The `@hfe/core` module namespace, injected through the plugin settings so the
 * Handsontable bundle never imports the package at runtime.
 */
export type CoreModule = typeof import('@hfe/core');

/**
 * Names of the Walkontable overlays probed for frozen-pane highlight stacking.
 */
export type OverlayName =
  | 'top'
  | 'bottom'
  | 'inline_start'
  | 'top_inline_start_corner'
  | 'bottom_inline_start_corner';

/**
 * All overlay names, in probing order.
 */
export const OVERLAY_NAMES: readonly OverlayName[] = [
  'top',
  'bottom',
  'inline_start',
  'top_inline_start_corner',
  'bottom_inline_start_corner',
];

/**
 * Structural shape of a Walkontable overlay as consumed by the adapter.
 */
export interface OverlayLike {
  /**
   * The overlay scroll holder element (`window` for the master overlay of a window-scrolled grid).
   */
  holder: HTMLElement | Window;
  /**
   * The overlay clone giving access to the cloned table root element.
   */
  clone: { wtTable: { wtRootElement: HTMLElement } } | null;
}

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
 * The `formulaBuilder` plugin settings object.
 */
export interface FormulaBuilderPluginSettings {
  /**
   * The `@hfe/core` module namespace (its `FormulaBuilder` class plus runtime utilities).
   */
  builder: unknown;
  /**
   * Renders the formula bar above the grid when `true`.
   */
  showFormulaBar?: boolean;
  /**
   * Popup behavior options forwarded to the formula editor.
   */
  popups?: PopupsOptions;
  /**
   * Layout direction override forwarded to the formula editor.
   */
  direction?: LayoutDirection;
}
