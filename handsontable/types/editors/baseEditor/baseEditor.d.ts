import Core from '../../core';
import { CellProperties } from '../../settings';
import { Context } from '../../shortcuts/context';
import { CellProperties } from '../../settings';

type Shortcut = Parameters<Context['addShortcut']>[0];

type ExtendedEditor<T> = BaseEditor & {
  render: (editor: ExtendedEditor<T>) => void;
  value?: T extends {
    value: any;
  } ? T["value"] : any;
  config?: T extends {
      config: any;
  } ? T["config"] : any;
  container: HTMLDivElement;
} & T;

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

export declare const editorFactory: <TProperties, TMethods = {}>({ init, afterOpen, afterInit, afterClose, beforeOpen, getValue, setValue, onFocus, shortcuts, value, render, config, shortcutsGroup, ...args }: {static factory: <TProperties, TMethods = {}>({ init, afterOpen, afterInit, afterClose, beforeOpen, getValue, setValue, onFocus, shortcuts, value, render, config, shortcutsGroup, ...args }: {
  value?: TProperties extends {
      value: any;
  } ? TProperties["value"] : any;
  config?: TProperties extends {
      config: any;
  } ? TProperties["config"] : any;
  render?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
  init: (editor: ExtendedEditor<TProperties & TMethods>) => void;
  afterOpen?: (editor: ExtendedEditor<TProperties & TMethods>, event?: Event) => void;
  afterClose?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
  afterInit?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
  beforeOpen?: (editor: ExtendedEditor<TProperties & TMethods>, { row, col, prop, td, originalValue, cellProperties, }: {
      row: number;
      col: number;
      prop: string | number;
      td: HTMLTableCellElement;
      originalValue: any;
      cellProperties: CellProperties;
  }) => void;
  getValue?: (editor: ExtendedEditor<TProperties & TMethods>) => any;
  setValue?: (editor: ExtendedEditor<TProperties & TMethods>, value: any) => void;
  onFocus?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
  shortcutsGroup?: string;
  shortcuts?: (Omit<Shortcut, 'callback' | 'group'> & { 
    callback: (editor: ExtendedEditor<TProperties & TMethods>, event: Event) => boolean | void; 
    group?: string;
  })[];
  position?: 'container' | 'portal';
} & TMethods & Record<string, any>) => ExtendedEditor<TProperties>;