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
  static factory : <T>(params: {
    prepare?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.prepare>) => void;
    beginEditing?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.beginEditing>) => void;
    finishEditing?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.finishEditing>) => void;
    discardEditor?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.discardEditor>) => void;
    saveValue?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.saveValue>) => void;
    getValue?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.getValue>) => any;
    setValue?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.saveValue>) => void;
    open?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.open>) => void;
    close?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.close>) => void;
    focus?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.focus>) => void;
    cancelChanges?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.cancelChanges>) => void;
    checkEditorSection?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.checkEditorSection>) => "top-left-corner" | "top" | "bottom-left-corner" | "bottom" | "left" | "";
    enableFullEditMode?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.enableFullEditMode>) => void;
    extend?(...args: Parameters<typeof BaseEditor.prototype.extend>): BaseEditor;
    getEditedCell?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.getEditedCell>) => HTMLTableCellElement | null;
    getEditedCellRect?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.getEditedCellRect>) => {
        top: number;
        start: number;
        width: number;
        maxWidth: number;
        height: number;
        maxHeight: number;
    } | undefined;
    getEditedCellsZIndex?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.getEditedCellsZIndex>) => string;
    init?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.init>) => void;
    isInFullEditMode?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.isInFullEditMode>) => boolean;
    isOpened?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.isOpened>) => boolean;
    isWaiting?: (editor: BaseEditor & T, ...args: Parameters<typeof BaseEditor.prototype.isWaiting>) => boolean;
  } & Record<string, (editor: BaseEditor & T, ...args: any[]) => void>) => BaseEditor;
}
