import Core from '../../core';
import { CellProperties } from '../../settings';

export const EDITOR_TYPE: 'base';
export const EDITOR_STATE: Readonly<{
  VIRGIN: string;
  EDITING: string;
  WAITING: string;
  FINISHED: string;
}>;

export abstract class BaseEditor {
  constructor(instance: Core);

  hot: Core;
  instance: Core;
  state: string;
  TD: HTMLTableCellElement;
  row: number;
  col: number;
  prop: number | string;
  originalValue: any;
  cellProperties: CellProperties;

  beginEditing(initialValue?: any, event?: Event): void;
  cancelChanges(): void;
  checkEditorSection(): 'top-left-corner' | 'top' | 'bottom-left-corner' | 'bottom' | 'left' | '';
  abstract close(): void;
  discardEditor(validationResult?: boolean): void;
  enableFullEditMode(): void;
  extend(): BaseEditor;
  finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: () => void): void;
  abstract focus(): void;
  getEditedCell(): HTMLTableCellElement | null;
  getEditedCellRect(): { top: number, start: number, width: number, maxWidth: number, height: number, maxHeight: number } | undefined;
  getEditedCellsZIndex(): string;
  abstract getValue(): any;
  init(): void;
  isInFullEditMode(): boolean;
  isOpened(): boolean;
  isWaiting(): boolean;
  abstract open(event?: Event): void;
  prepare(row: number, column: number, prop: string | number, TD: HTMLTableCellElement, originalValue: any, cellProperties: CellProperties): void;
  saveValue(value?: any, ctrlDown?: boolean): void;
  abstract setValue(newValue?: any): void;
}

/**
 * Factory function for creating custom Handsontable editors by extending BaseEditor.
 *
 * This factory allows you to create custom editors by providing implementations for various
 * editor lifecycle methods. It handles the prototype chain setup and method delegation to
 * the BaseEditor superclass automatically.
 *
 * @template T - Additional custom properties and methods to add to the editor instance.
 *
 * @param {object} params - Configuration object containing editor lifecycle methods and custom methods.
 * @param {Function} params.prepare - Called before editing begins to initialize the editor.
 * @param {Function} params.beginEditing - Called when editing starts.
 * @param {Function} params.finishEditing - Called when editing ends.
 * @param {Function} params.discardEditor - Called to discard editor changes.
 * @param {Function} params.saveValue - Called to save the edited value.
 * @param {Function} params.getValue - Called to retrieve the current editor value.
 * @param {Function} params.setValue - Called to set the editor value.
 * @param {Function} params.open - Called to open/show the editor UI.
 * @param {Function} params.close - Called to close/hide the editor UI.
 * @param {Function} params.focus - Called to focus the editor.
 * @param {Function} params.cancelChanges - Called to cancel editing changes.
 * @param {Function} params.checkEditorSection - Called to determine which section the editor belongs to.
 * @param {Function} params.enableFullEditMode - Called to enable full edit mode.
 * @param {Function} params.extend - Called to extend the editor class.
 * @param {Function} params.getEditedCell - Called to get the currently edited cell element.
 * @param {Function} params.getEditedCellRect - Called to get the edited cell's position and dimensions.
 * @param {Function} params.getEditedCellsZIndex - Called to get the z-index for the edited cell.
 * @param {Function} params.init - Called during editor initialization.
 * @param {Function} params.isInFullEditMode - Called to check if editor is in full edit mode.
 * @param {Function} params.isOpened - Called to check if editor is currently open.
 * @param {Function} params.isWaiting - Called to check if editor is waiting for input.
 *
 * @returns {Function} A custom editor class extending Handsontable's BaseEditor.
 *
 * @example
 * ```typescript
 * const MyEditor = editorBaseFactory({
 *   prepare(editor, row, col, prop, td, originalValue, cellProperties) {
 *     // Initialize your editor
 *   },
 *   open(editor) {
 *     // Show your editor UI
 *   },
 *   close(editor) {
 *     // Hide your editor UI
 *   },
 *   getValue(editor) {
 *     return editor.customValue;
 *   }
 * });
 * ```
 */
BaseEditor.factory = <T>(params: {
  prepare?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.prepare>) => void;
  beginEditing?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.beginEditing>) => void;
  finishEditing?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.finishEditing>) => void;
  discardEditor?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.discardEditor>) => void;
  saveValue?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.saveValue>) => void;
  getValue?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.getValue>) => any;
  setValue?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.saveValue>) => void;
  open?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.open>) => void;
  close?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.close>) => void;
  focus?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.focus>) => void;
  cancelChanges?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.cancelChanges>) => void;
  checkEditorSection?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.checkEditorSection>) => "top-left-corner" | "top" | "bottom-left-corner" | "bottom" | "left" | "";
  enableFullEditMode?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.enableFullEditMode>) => void;
  extend?(...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.extend>): BaseEditor;
  getEditedCell?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.getEditedCell>) => HTMLTableCellElement | null;
  getEditedCellRect?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.getEditedCellRect>) => {
      top: number;
      start: number;
      width: number;
      maxWidth: number;
      height: number;
      maxHeight: number;
  } | undefined;
  getEditedCellsZIndex?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.getEditedCellsZIndex>) => string;
  init?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.init>) => void;
  isInFullEditMode?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.isInFullEditMode>) => boolean;
  isOpened?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.isOpened>) => boolean;
  isWaiting?: (editor: BaseEditor & T, ...args: Parameters<typeof Handsontable.editors.BaseEditor.prototype.isWaiting>) => boolean;
} & Record<string, (editor: BaseEditor & T, ...args: any[]) => void>) => BaseEditor;