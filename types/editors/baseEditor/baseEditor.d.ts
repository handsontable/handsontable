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
  getEditedCellsZIndex(): string;
  abstract getValue(): any;
  init(): void;
  isInFullEditMode(): boolean;
  isOpened(): boolean;
  isWaiting(): boolean;
  abstract open(event?: Event): void;
  prepare(row: number, col: number, prop: string | number, TD: HTMLTableCellElement, originalValue: any, cellProperties: CellProperties): void;
  saveValue(value?: any, ctrlDown?: boolean): void;
  abstract setValue(newValue?: any): void;
}
