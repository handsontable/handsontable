/**
 * This file contains TypeScript types used across the editors module.
 */

import { Handsontable } from '../core.types';
import EventManager from '../eventManager';

/**
 * Enum for editor state.
 */
export enum EditorState {
  VIRGIN = 'STATE_VIRGIN', // before editing
  EDITING = 'STATE_EDITING',
  WAITING = 'STATE_WAITING', // waiting for async validation
  FINISHED = 'STATE_FINISHED'
}

/**
 * Interface for cell properties objects.
 */
export interface CellProperties {
  readOnly?: boolean;
  allowInvalid?: boolean;
  [key: string]: any;
}

/**
 * Partial interface representing DOMRect with additional 'start' property
 */
export interface CellOffset {
  top: number;
  start: number;
  width: number;
  height: number;
}

/**
 * Interface for editor object.
 */
export interface Editor {
  hot: Handsontable;
  state: EditorState;
  row: number | null;
  col: number | null;
  prop: string | number | null;
  TD: HTMLTableCellElement | null;
  originalValue: any;
  cellProperties: CellProperties;
  
  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement, value: any, cellProperties: CellProperties): void;
  beginEditing(initialValue?: any, event?: Event): void;
  finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: (result: boolean) => void): void;
  cancelChanges(): void;
  isOpened(): boolean;
  open(event?: Event): void;
  close(): void;
  setValue(newValue: any): void;
  getValue(): any;
  focus(): void;
  getEditedCell(): HTMLTableCellElement | null;
  getEditedCellRect(): CellOffset | null;
  isInFullEditMode(): boolean;
  isWaiting(): boolean;
  TEXTAREA?: HTMLTextAreaElement;
  
  addHook(name: string, callback: () => void): void;
  clearHooks(): void;
}

/**
 * Interface specific for TextEditor.
 */
export interface TextEditor extends Editor {
  eventManager: EventManager;
  autoResize: any;
  TEXTAREA: HTMLTextAreaElement;
  textareaStyle: CSSStyleDeclaration;
  TEXTAREA_PARENT: HTMLDivElement;
  textareaParentStyle: CSSStyleDeclaration;
  layerClass: string;
  
  createElements(): void;
  bindEvents(): void;
  hideEditableElement(): void;
  showEditableElement(): void;
  refreshValue(): void;
  refreshDimensions(force?: boolean): void;
  allowKeyEventPropagation(): void;
  destroy(): void;
  registerShortcuts(): void;
  unregisterShortcuts(): void;
}

/**
 * Interface representing a base editor constructor.
 */
export interface BaseEditorConstructor {
  new (hotInstance: Handsontable): Editor;
}

/**
 * Interface for registered editor class.
 */
export interface RegisteredEditorClass {
  EDITOR_TYPE: string;
}

/**
 * Interface for static register.
 */
export interface StaticRegister {
  editors: {
    registeredEditorNames: string[];
    registeredEditorClasses: {[key: string]: BaseEditorConstructor};
  };
  registerEditor(editorName: string, editorClass: BaseEditorConstructor): void;
  getEditor(editorName: string, hotInstance: Handsontable): Editor;
} 