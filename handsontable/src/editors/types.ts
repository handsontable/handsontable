/**
 * This file contains TypeScript types used across the editors module.
 */

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
 * Interface for Handsontable instance.
 */
export interface HotInstance {
  rootDocument: Document;
  rootElement: HTMLElement;
  guid?: string;
  container: HTMLElement;
  countRows(): number;
  listen(): void;
  isRtl(): boolean;
  getSelected(): any;
  getSelectedLast(): number[];
  getSettings(): any;
  getShortcutManager(): any;
  selectCell(row: number, col: number, endRow?: any, endCol?: any, scrollToCell?: any, changeListener?: boolean): boolean;
  isEditorOpened(): boolean;
  getCellValidator(cellProperties: CellProperties | null): any;
  runHooks(hookName: string, ...args: any[]): any;
  populateFromArray(row: number, col: number, value: any, endRow: number | null, endCol: number | null, source?: string): void;
  view: {
    wt: {
      wtOverlays: {
        inlineStartOverlay: {
          clone: {
            wtTable: {
              holder: HTMLElement;
            };
          };
          getScrollableElement(): HTMLElement;
          removeChild(element: HTMLElement): void;
          getScrollPosition(): number;
        };
        topOverlay: {
          getScrollPosition(): number;
        };
      };
    };
    _wt: {
      wtTable: {
        holder: HTMLElement;
      };
    };
    maximumVisibleElementWidth(width: number): number;
    maximumVisibleElementHeight(height: number): number;
    getCellFragmentData(td: HTMLTableCellElement): any;
  };
  toPhysicalRow?(row: number): number;
  getSourceDataAtCell?(row: number, col: number): any;
  addHookOnce(hook: string, callback: (result?: any) => void): void;
  rowIndexMapper: {
    getRenderableFromVisualIndex(index: number): number | null;
  };
  columnIndexMapper: {
    getRenderableFromVisualIndex(index: number): number | null;
  };
}

/**
 * Interface for editor object.
 */
export interface Editor {
  hot: HotInstance;
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
  new (hotInstance: HotInstance): Editor;
}

/**
 * Interface for the BaseEditor class.
 */
export interface BaseEditor extends Editor {
  hot: HotInstance;
  state: EditorState;
  row: number | null;
  col: number | null;
  prop: string | number | null;
  TD: HTMLTableCellElement | null;
  originalValue: any;
  cellProperties: CellProperties;
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
  getEditor(editorName: string, hotInstance: HotInstance): Editor;
} 