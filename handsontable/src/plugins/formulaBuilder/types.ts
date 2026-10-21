/**
 * The public types of the FormulaBuilder plugin.
 *
 * Nothing here imports `hyperformula-ui`: the package is a devDependency of Handsontable, so a
 * published declaration that named it would fail to resolve (TS2307) in every application that
 * does not install it. The shapes below mirror the package's own types, and
 * `__tests__/formulaBuilder.types.ts` asserts that both directions stay assignable, so a package
 * change that breaks the mirror fails the type tests instead of reaching users.
 */

/**
 * A one-cell step direction (a commit with Enter, Shift+Enter, Tab, or Shift+Tab).
 */
export type FormulaBuilderStepDirection = 'up' | 'down' | 'left' | 'right';

/**
 * The layout direction of the formula editor and its popups.
 */
export type FormulaBuilderLayoutDirection = 'ltr' | 'rtl';

/**
 * Docks a popup into a host container instead of the floating overlay.
 */
export interface FormulaBuilderPopupHostOption {
  /**
   * The host element, or a CSS selector that resolves to it. Omit it to keep the popup floating.
   */
  container?: HTMLElement | string;
}

/**
 * The autocomplete popup options.
 */
export interface FormulaBuilderSuggestionsOptions extends FormulaBuilderPopupHostOption {
  /**
   * Shows the keyboard-hints footer. Defaults to `true`.
   */
  showKeyboardHelp?: boolean;
  /**
   * Shows the close button. Defaults to `false`.
   */
  showClose?: boolean;
  /**
   * Includes named expressions among the suggestions. Defaults to `true`.
   */
  showNamedExpressions?: boolean;
}

/**
 * The function help popup options.
 */
export interface FormulaBuilderFunctionHelpOptions extends FormulaBuilderPopupHostOption {
  /**
   * Shows the close button. Defaults to `false`.
   */
  showClose?: boolean;
}

/**
 * The error popup options.
 */
export interface FormulaBuilderErrorPopupOptions {
  /**
   * Shows the close button. Defaults to `false`.
   */
  showClose?: boolean;
}

/**
 * The `popups` option of the plugin. The top-level `showClose` is the default that each popup
 * can override.
 */
export interface FormulaBuilderPopupsOptions {
  /**
   * Shows the close button on every popup that does not set its own.
   */
  showClose?: boolean;
  /**
   * The autocomplete popup options.
   */
  suggestions?: FormulaBuilderSuggestionsOptions;
  /**
   * The function help popup options.
   */
  fnHelp?: FormulaBuilderFunctionHelpOptions;
  /**
   * The error popup options.
   */
  error?: FormulaBuilderErrorPopupOptions;
}

/**
 * The `formulaBuilder` plugin settings object.
 */
export interface FormulaBuilderPluginSettings {
  /**
   * The `hyperformula-ui` module namespace (`import * as FormulaBuilderModule from 'hyperformula-ui'`).
   */
  builder: unknown;
  /**
   * Renders the formula bar above the grid when `true`.
   */
  showFormulaBar?: boolean;
  /**
   * The popup options forwarded to the formula editor.
   */
  popups?: FormulaBuilderPopupsOptions;
  /**
   * The layout direction of the formula editor and its popups. Defaults to the grid's layout direction.
   */
  direction?: FormulaBuilderLayoutDirection;
}

/**
 * The part of the live formula editor the plugin exposes.
 */
export interface FormulaEditorHandle {
  /**
   * Moves the focus into the editor.
   */
  focus(): void;
  /**
   * Returns the editor text.
   */
  getValue(): string;
  /**
   * Replaces the editor text.
   */
  setValue(value: string): void;
  /**
   * Appends the closing parentheses an unfinished formula is missing.
   */
  closeUnbalancedParens(): void;
}
