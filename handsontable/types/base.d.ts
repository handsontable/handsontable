/**
 * Type declarations for handsontable/base.
 *
 * These declarations provide type information for the angular-wrapper
 * and other wrappers to use handsontable's TypeScript classes and interfaces.
 */

export class CellCoords {
  row: number;
  col: number;
  constructor(row: number, col: number);
}

export class CellRange {
  highlight: CellCoords;
  from: CellCoords;
  to: CellCoords;
  constructor(highlight: CellCoords, from?: CellCoords, to?: CellCoords);
  getTopStartCorner(): CellCoords;
  getBottomEndCorner(): CellCoords;
}

/**
 * The Handsontable default export is usable as:
 * - A constructor: `new Handsontable.Core(el, opts)` or `new Handsontable(el, opts)`
 * - A type: `instance: Handsontable` (refers to Handsontable.Core)
 * - A namespace: `Handsontable.GridSettings`, `Handsontable.editors.BaseEditor`, etc.
 */
declare class Handsontable {
  constructor(rootElement: HTMLElement, userSettings?: Record<string, unknown>);

  isDestroyed: boolean;
  rootElement: HTMLElement;
  rootWindow: Window;
  rootDocument: Document;

  init(): void;
  destroy(): void;
  getSettings(): Record<string, any>;
  updateSettings(settings: Handsontable.GridSettings, init?: boolean): void;
  updateData(data: any): void;
  getColumnMeta(column: number): Record<string, unknown>;
  getCell(
    row: number,
    column: number,
    topmost?: boolean
  ): HTMLTableCellElement | null;
  getShortcutManager(): { setActiveContextName(name: string): void };
  selectCell(row: number, col: number, ...args: any[]): boolean;
  addHook(key: string, callback: Function): void;
  addHookOnce(key: string, callback: Function): void;
  removeHook(key: string, callback: Function): void;
  runHooks(key: string, ...params: any[]): any;
  countRows(): number;
  countCols(): number;
  hasColHeaders(): boolean;
  isRtl(): boolean;
  getSelectedRangeActive(): CellRange;
  populateFromArray(
    row: number,
    column: number,
    input: unknown[][],
    endRow?: number,
    endCol?: number,
    source?: string,
    method?: string
  ): object | undefined;
  getCellValidator(
    rowOrMeta: number | Record<string, unknown>,
    column?: number
  ): Function | RegExp | undefined;
  rowIndexMapper: {
    getRenderableFromVisualIndex(index: number): number;
    getRenderableIndexesLength(): number;
  };
  columnIndexMapper: {
    getRenderableFromVisualIndex(index: number): number;
  };
  view: any;
  stylesHandler: { getDefaultRowHeight(): number };
  _createCellCoords(row: number, column: number): CellCoords;
  _registerTimeout(callback: Function): void;
  [key: string]: any;
}

declare namespace Handsontable {
  interface GridSettings {
    [key: string]: any;
  }

  interface ColumnSettings {
    [key: string]: any;
  }

  type CellProperties = Record<string, unknown>;

  type Core = Handsontable;

  const Core: {
    new (
      rootElement: HTMLElement,
      userSettings?: Record<string, unknown>
    ): Handsontable;
  };

  interface Hooks {
    getRegistered(): string[];
    getSingleton(): Hooks;
  }

  const DefaultSettings: Record<string, unknown>;
  const hooks: Hooks;
  const packageName: string;
  const buildDate: string | undefined;
  const version: string | undefined;
  const languages: Record<string, unknown>;
  const themes: Record<string, unknown>;
  const CellCoords: typeof import('./base').CellCoords;
  const CellRange: typeof import('./base').CellRange;

  class BaseEditor {
    static readonly EDITOR_TYPE: string;

    hot: Handsontable;
    state: string;
    _opened: boolean;
    _fullEditMode: boolean;
    _closeCallback: ((result: boolean) => void) | null;
    TD: HTMLTableCellElement | null;
    row: number | null;
    col: number | null;
    prop: number | string | null;
    originalValue: unknown;
    cellProperties: Record<string, unknown>;

    constructor(hotInstance: Handsontable);

    init(): void;
    getValue(): unknown;
    setValue(value?: unknown): void;
    open(event?: Event): void;
    close(): void;
    focus(): void;
    prepare(
      row: number,
      col: number,
      prop: string | number,
      td: HTMLTableCellElement,
      value: unknown,
      cellProperties: Record<string, unknown>
    ): void;
    extend(): unknown;
    saveValue(value: unknown, ctrlDown?: boolean): void;
    beginEditing(newInitialValue?: unknown, event?: Event): void;
    finishEditing(
      restoreOriginalValue?: boolean,
      ctrlDown?: boolean,
      callback?: Function
    ): void;
    cancelChanges(): void;
    discardEditor(result?: boolean): void;
    enableFullEditMode(): void;
    isInFullEditMode(): boolean;
    isOpened(): boolean;
    isWaiting(): boolean;
    getEditedCellRect():
      | {
          top: number;
          start: number;
          width: number;
          maxWidth: number;
          height: number;
          maxHeight: number;
        }
      | undefined;
    getEditedCellsLayerClass(): string;
    getEditedCell(): HTMLTableCellElement | null;
    checkEditorSection(): string;
    addHook(key: string, callback: Function): void;
  }

  namespace editors {
    export { BaseEditor };
  }

  namespace renderers {
    function registerRenderer(name: string, renderer: any): void;
  }
}

export default Handsontable;
