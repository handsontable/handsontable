import { PikadayOptions } from 'pikaday';
import numbro from 'numbro';
import {
  CellType as HyperFormulaCellType,
  ConfigParams,
  HyperFormula,
} from 'hyperformula';
import CellCoords as WoTCellCoords from './3rdparty/walkontable/src/cell/coords';
import CellRange as WoTCellRange from './3rdparty/walkontable/src/cell/range';
import { Events } from './pluginHooks';
import { GridSettings, CellMeta } from './settings';
import { AutoColumnSize as AutoColumnSizePlugin } from './plugins/autoColumnSize';
import { Autofill as AutofillPlugin } from './plugins/autofill';
import { AutoRowSize as AutoRowSizePlugin } from './plugins/autoRowSize';
import { BasePlugin } from './plugins/base';
import { BindRowsWithHeaders as BindRowsWithHeadersPlugin } from './plugins/bindRowsWithHeaders';
import { CollapsibleColumns as CollapsibleColumnsPlugin } from './plugins/collapsibleColumns';
import { ColumnSorting as ColumnSortingPlugin } from './plugins/columnSorting';
import { ColumnSummary as ColumnSummaryPlugin } from './plugins/columnSummary';

/**
 * @internal
 * Omit properties K from T
 */
type Omit<T, K extends keyof T> = Pick<T, ({ [P in keyof T]: P } & { [P in K]: never } & { [x: string]: never, [x: number]: never })[keyof T]>;
// type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>; // TS >= 2.8

declare namespace _Handsontable {
  class Core {
    addHook<K extends keyof Events>(key: K, callback: Events[K] | Events[K][]): void;
    addHookOnce<K extends keyof Events>(key: K, callback: Events[K] | Events[K][]): void;
    alter(action: 'insert_row' | 'insert_col' | 'remove_row' | 'remove_col', index?: number | Array<[number, number]>, amount?: number, source?: string, keepEmptyRows?: boolean): void;
    batch<R>(wrappedOperations: () => R): R;
    batchExecution<R>(wrappedOperations: () => R, forceFlushChanges: boolean): R;
    batchRender<R>(wrappedOperations: () => R): R;
    clear(): void;
    clearUndo(): void;
    colOffset(): number;
    colToProp(col: number): string | number;
    columnIndexMapper: Handsontable.RecordTranslation.IndexMapper;
    constructor(element: Element, options: GridSettings);
    container: HTMLElement;
    countCols(): number;
    countEmptyCols(ending?: boolean): number;
    countEmptyRows(ending?: boolean): number;
    countRenderedCols(): number;
    countRenderedRows(): number;
    countRows(): number;
    countSourceCols(): number;
    countSourceRows(): number;
    countVisibleCols(): number;
    countVisibleRows(): number;
    deselectCell(): void;
    destroy(): void;
    destroyEditor(revertOriginal?: boolean, prepareEditorIfNeeded?: boolean): void;
    emptySelectedCells(): void;
    forceFullRender: boolean;
    getActiveEditor<T extends Handsontable._editors.Base>(): T | undefined;
    getCell(row: number, col: number, topmost?: boolean): HTMLTableCellElement | null;
    getCellEditor<T extends Handsontable._editors.Base>(cellMeta: CellMeta): T;
    getCellEditor<T extends Handsontable._editors.Base>(row: number, col: number): T;
    getCellMeta(row: number, col: number): Handsontable.CellProperties;
    getCellMetaAtRow(row: number): Handsontable.CellProperties[];
    getCellRenderer(cellMeta: CellMeta): Handsontable.renderers.Base;
    getCellRenderer(row: number, col: number): Handsontable.renderers.Base;
    getCellsMeta(): Handsontable.CellProperties[];
    getCellValidator(cellMeta: CellMeta): Handsontable.validators.Base | RegExp | undefined;
    getCellValidator(row: number, col: number): Handsontable.validators.Base | RegExp | undefined;
    getColHeader(): (number | string)[];
    getColHeader(col: number): number | string;
    getColWidth(col: number): number;
    getCoords(elem: Element | null): WoTCellCoords;
    getCopyableData(row: number, column: number): string;
    getCopyableText(startRow: number, startCol: number, endRow: number, endCol: number): string;
    getData(row?: number, column?: number, row2?: number, column2?: number): Handsontable.CellValue[];
    getDataAtCell(row: number, column: number): Handsontable.CellValue;
    getDataAtCol(column: number): Handsontable.CellValue[];
    getDataAtProp(prop: string | number): Handsontable.CellValue[];
    getDataAtRow(row: number): Handsontable.CellValue[];
    getDataAtRowProp(row: number, prop: string): Handsontable.CellValue;
    getDataType(rowFrom: number, columnFrom: number, rowTo: number, columnTo: number): Handsontable.CellType | 'mixed';
    getInstance(): Handsontable;
    getPlugin<T extends keyof Handsontable.PluginsCollection>(pluginName: T): Handsontable.PluginsCollection[T];
    getRowHeader(): (string | number)[];
    getRowHeader(row: number): string | number;
    getRowHeight(row: number): number;
    getSchema(): Handsontable.RowObject;
    getSelected(): Array<[number, number, number, number]> | undefined;
    getSelectedLast(): number[] | undefined;
    getSelectedRange(): WoTCellRange[] | undefined;
    getSelectedRangeLast(): WoTCellRange | undefined;
    getSettings(): GridSettings;
    getSourceData(row?: number, column?: number, row2?: number, column2?: number): Handsontable.CellValue[][] | Handsontable.RowObject[];
    getSourceDataArray(row?: number, column?: number, row2?: number, ccolumn2?: number): Handsontable.CellValue[][];
    getSourceDataAtCell(row: number, column: number): Handsontable.CellValue;
    getSourceDataAtCol(column: number): Handsontable.CellValue[];
    getSourceDataAtRow(row: number): Handsontable.CellValue[] | Handsontable.RowObject;
    getTranslatedPhrase(dictionaryKey: string, extraArguments: any): string | null;
    getValue(): Handsontable.CellValue;
    hasColHeaders(): boolean;
    hasHook(key: keyof Events): boolean;
    hasRowHeaders(): boolean;
    init(): () => void;
    isColumnModificationAllowed(): boolean;
    isDestroyed: boolean
    isEmptyCol(col: number): boolean;
    isEmptyRow(row: number): boolean;
    isExecutionSuspended(): boolean;
    isListening(): boolean;
    isRedoAvailable(): boolean;
    isRenderSuspended(): boolean;
    isUndoAvailable(): boolean;
    listen(): void;
    loadData(data: Handsontable.CellValue[][] | Handsontable.RowObject[], source?: string): void;
    populateFromArray(row: number, col: number, input: Handsontable.CellValue[][], endRow?: number, endCol?: number, source?: string, method?: 'shift_down' | 'shift_right' | 'overwrite', direction?: 'left' | 'right' | 'up' | 'down', deltas?: any[]): void;
    propToCol(prop: string | number): number;
    redo(): void;
    refreshDimensions(): void;
    removeCellMeta(row: number, col: number, key: keyof CellMeta): void;
    removeCellMeta(row: number, col: number, key: string): void;
    removeHook<K extends keyof Events>(key: K, callback: Events[K]): void;
    render(): void;
    renderCall: boolean;
    resumeExecution(): void;
    resumeRender(): void;
    rootDocument: Document;
    rootElement: HTMLElement;
    rootWindow: Window;
    rowIndexMapper: Handsontable.RecordTranslation.IndexMapper;
    rowOffset(): number;
    runHooks(key: keyof Events, p1?: any, p2?: any, p3?: any, p4?: any, p5?: any, p6?: any): any;
    // Requires TS 3.0:
    // runHooks<K extends keyof Handsontable.Events>(key: K, ...params: Parameters<Handsontable.Events[K]>): ReturnType<Handsontable.Events[K]>;
    scrollViewportTo(row?: number, column?: number, snapToBottom?: boolean, snapToRight?: boolean, considerHiddenIndexes?: boolean): boolean;
    selectAll(): void;
    selectCell(row: number, col: number, endRow?: number, endCol?: number, scrollToCell?: boolean, changeListener?: boolean): boolean;
    selectCellByProp(row: number, prop: string, endRow?: number, endProp?: string, scrollToCell?: boolean): boolean;
    selectCells(coords: Array<[number, number | string, number, number | string]> | Array<WoTCellRange>, scrollToCell?: boolean, changeListener?: boolean): boolean;
    selectColumns(startColumn: number | string, endColumn?: number | string): boolean;
    selectRows(startRow: number, endRow?: number): boolean;
    setCellMeta(row: number, col: number, key: string, val: any): void;
    setCellMeta<K extends keyof CellMeta>(row: number, col: number, key: K, val: CellMeta[K]): void;
    setCellMetaObject<T extends CellMeta>(row: number, col: number, prop: T): void;
    setDataAtCell(changes: Array<[number, string | number, Handsontable.CellValue]>, source?: string): void;
    setDataAtCell(row: number, col: string | number, value: Handsontable.CellValue, source?: string): void;
    setDataAtRowProp(changes: Array<[number, string | number, Handsontable.CellValue]>, source?: string): void;
    setDataAtRowProp(row: number, prop: string, value: Handsontable.CellValue, source?: string): void;
    setSourceDataAtCell(changes: [number, string | number, Handsontable.CellValue][]): void;
    setSourceDataAtCell(row: number, column: number | string, value: Handsontable.CellValue, source?: string): void;
    spliceCol(col: number, index: number, amount: number, ...elements: Handsontable.CellValue[]): void;
    spliceRow(row: number, index: number, amount: number, ...elements: Handsontable.CellValue[]): void;
    suspendExecution(): void;
    suspendRender(): void;
    table: HTMLTableElement;
    toHTML(): string;
    toPhysicalColumn(column: number): number;
    toPhysicalRow(row: number): number;
    toTableElement(): HTMLTableElement;
    toVisualColumn(column: number): number;
    toVisualRow(row: number): number;
    undo(): void;
    undoRedo: Handsontable.UndoRedo;
    unlisten(): void;
    updateSettings(settings: GridSettings, init?: boolean): void;
    validateCell(value: any, cellProperties: Handsontable.CellProperties, callback: (valid: boolean) => void, source: string): void;
    validateCells(callback?: (valid: boolean) => void): void;
    validateColumns(columns: number[], callback?: (valid: boolean) => void): void;
    validateRows(rows: number[], callback?: (valid: boolean) => void): void;
  }
}

declare namespace Handsontable {

  // These types represent default known values, but users can extend with their own, leading to the need for assertions.
  // Using type arguments (ex `GridSettings<CellValue, CellType, SourceData>`) would solve this and provide very strict
  // type-checking, but adds a lot of noise for no benefit in the most common use cases.

  /**
   * A cell value, which can be anything to support custom cell data types, but by default is `string | number | boolean | undefined`.
   */
  type CellValue = any;


  /**
   * A cell change represented by `[row, column, prevValue, nextValue]`.
   */
  type CellChange = [number, string | number, CellValue, CellValue];

  /**
   * A row object, one of the two ways to supply data to the table, the alternative being an array of values.
   * Row objects can have any data assigned to them, not just column data, and can define a `__children` array for nested rows.
   */
  type RowObject = { [prop: string]: any };

  /**
   * An object containing possible options to use in SelectEditor.
   */
  type SelectOptionsObject = { [prop: string]: string };

  /**
   * A single row of source data, which can be represented as an array of values, or an object with key/value pairs.
   */
  type SourceRowData = RowObject | CellValue[];

  /**
   * The default sources for which the table triggers hooks.
   */
  type ChangeSource = 'auto' | 'edit' | 'loadData' | 'populateFromArray' | 'spliceCol' | 'spliceRow' | 'timeValidate' | 'dateValidate' | 'validateCells' | 'Autofill.fill' | 'ContextMenu.clearColumns' | 'ContextMenu.columnLeft' | 'ContextMenu.columnRight' | 'ContextMenu.removeColumn' | 'ContextMenu.removeRow' | 'ContextMenu.rowAbove' | 'ContextMenu.rowBelow' | 'CopyPaste.paste' | 'UndoRedo.redo' | 'UndoRedo.undo' | 'ColumnSummary.set' | 'ColumnSummary.reset';
  /**
   * The default cell type aliases the table has built-in.
   */
  type CellType = 'autocomplete' | 'checkbox' | 'date' | 'dropdown' | 'handsontable' | 'numeric' | 'password' | 'text' | 'time';

  /**
   * The default editor aliases the table has built-in.
   */
  type EditorType = 'autocomplete' | 'checkbox' | 'date' | 'dropdown' | 'handsontable' | 'mobile' | 'password' | 'select' | 'text';

  /**
   * The default renderer aliases the table has built-in.
   */
  type RendererType = 'autocomplete' | 'checkbox' | 'html' | 'numeric' | 'password' | 'text';

  /**
   * The default validator aliases the table has built-in.
   */
  type ValidatorType = 'autocomplete' | 'date' | 'numeric' | 'time';

  namespace cellTypes {
    interface Autocomplete {
      editor: typeof _editors.Autocomplete;
      renderer: renderers.Autocomplete;
      validator: validators.Autocomplete;
    }

    interface Checkbox {
      editor: typeof _editors.Checkbox;
      renderer: renderers.Checkbox;
    }

    interface Date {
      editor: typeof _editors.Date;
      renderer: renderers.Autocomplete;
      validator: validators.Date
    }

    interface Dropdown {
      editor: typeof _editors.Dropdown;
      renderer: renderers.Autocomplete;
      validator: validators.Autocomplete;
    }

    interface Handsontable {
      editor: typeof _editors.Handsontable;
      renderer: renderers.Autocomplete;
    }

    interface Numeric {
      dataType: string;
      editor: typeof _editors.Numeric;
      renderer: renderers.Numeric;
      validator: validators.Numeric;
    }

    interface Password {
      copyable: boolean;
      editor: typeof _editors.Password;
      renderer: renderers.Password;
    }

    interface Text {
      editor: typeof _editors.Text;
      renderer: renderers.Text;
    }

    interface Time {
      editor: typeof _editors.Text;
      renderer: renderers.Text;
      validator: validators.Time;
    }
  }


  /**
   * The "_editor" namespace is named to avoid circular reference conflict with "Handsontable.editors" namespace.
   * The other namespaces (renderers, validators, etc) don't need this because they don't expose values (classes), just types (interfaces).
   * Note that TS will think it can use the values defined here, ex `new Handsontable._editors.Base()` compiles, but this is wrong.
   * TODO: This would be better solved by moving all types outside the exported namespaces. (Separate type definition from type publication.)
   */
  namespace _editors {
    type EditorState =
      'STATE_VIRGIN' | // before editing
      'STATE_EDITING' |
      'STATE_WAITING' | // waiting for async validation
      'STATE_FINISHED';

    abstract class Base {
      hot: _Handsontable.Core;
      instance: _Handsontable.Core;
      row: number;
      col: number;
      prop: string | number;
      TD: HTMLTableCellElement;
      originalValue: any;
      cellProperties: CellProperties;
      state: EditorState;

      constructor(hotInstance: _Handsontable.Core, row: number, col: number, prop: string | number, TD: HTMLTableCellElement, cellProperties: CellProperties)

      beginEditing(initialValue?: any, event?: Event): void;
      cancelChanges(): void;
      checkEditorSection(): 'top-left-corner' | 'top' | 'bottom-left-corner' | 'bottom' | 'left' | '';
      abstract close(): void;
      discardEditor(validationResult?: boolean): void;
      enableFullEditMode(): void;
      extend<T extends _editors.Base>(): T;
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
      saveValue(val?: any, ctrlDown?: boolean): void;
      abstract setValue(newValue?: any): void;
    }

    class Checkbox extends Base {
      close(): void;
      focus(): void;
      getValue(): any;
      open(): void;
      setValue(newValue?: any): void;
    }

    class Mobile extends Base {
      close(): void;
      focus(): void;
      getValue(): any;
      open(): void;
      setValue(newValue?: any): void;

      hideCellPointer(): void;
      onBeforeKeyDown(event?: KeyboardEvent): void;
      prepareAndSave(): void;
      scrollToView(): void;
      updateEditorData(): void;
      updateEditorPosition(x?: number, y?: number): void;
      valueChanged(): boolean;
    }

    class Select extends Base {
      close(): void;
      focus(): void;
      getValue(): any;
      open(): void;
      setValue(newValue?: any): void;

      prepareOptions(optionsToPrepare?: RowObject | CellValue[]): void;
      refreshDimensions(): void;
      refreshValue(): void;
      registerHooks(): void;
    }

    class Text extends Base {
      close(): void;
      focus(): void;
      getValue(): any;
      open(): void;
      setValue(newValue?: any): void;

      bindEvents(): void;
      createElements(): void;
      destroy(): void;
      hideEditableElement(): void;
      showEditableElement(): void;
      refreshDimensions(force?: boolean): void;
      refreshValue(): void;
      TEXTAREA: HTMLInputElement;
      TEXTAREA_PARENT: HTMLElement;
      textareaStyle: CSSStyleDeclaration;
    }

    class Date extends Text {
      destroyElements(): void;
      getDatePickerConfig(): PikadayOptions;
      hideDatepicker(): void;
      open(event?: Event): void;
      showDatepicker(event?: Event): void;
    }

    class Handsontable extends Text {
      assignHooks(): void;
    }

    class Numeric extends Text { }

    class Password extends Text { }

    class Autocomplete extends Handsontable {
      allowKeyEventPropagation(keyCode?: number): boolean;
      flipDropdown(dropdownHeight?: number): void;
      flipDropdownIfNeeded(): void;
      getDropdownHeight(): number;
      highlightBestMatchingChoice(index?: number): void;
      limitDropdownIfNeeded(spaceAvailable?: number, dropdownHeight?: number): void;
      queryChoices(query?: string): void;
      sortByRelevance(value?: CellValue, choices?: CellValue[], caseSensitive?: boolean): any[];
      setDropdownHeight(height?: number): void;
      updateChoicesList(choices?: CellValue[]): void;
      unflipDropdown(): void;
      updateDropdownHeight(): void;
    }

    class Dropdown extends Autocomplete { }
  }

  namespace plugins {
    // utils for Filters
    namespace FiltersPlugin {
      type OperationType = 'conjunction' | 'disjunction';
      type ConditionName = 'begins_with' | 'between' | 'by_value' | 'contains' | 'empty' | 'ends_with' | 'eq' | 'gt' |
        'gte' | 'lt' | 'lte' | 'not_between' | 'not_contains' | 'not_empty' | 'neq';

      type ColumnConditions = {
        column: number;
        conditions: Handsontable.plugins.FiltersPlugin.ConditionId[];
        operation: Handsontable.plugins.FiltersPlugin.OperationType;
      }

      interface ConditionId {
        args: any[];
        name?: ConditionName;
        command?: {
          key: ConditionName;
        }
      }

      interface Condition {
        name: ConditionName;
        args: any[];
        func: (dataRow: CellValue, values: any[]) => boolean;
      }

      interface CellLikeData {
        meta: {
          row: number;
          col: number;
          visualCol: number;
          visualRow: number;
          type: string;
          instance: _Handsontable.Core;
          dateFormat?: string;
        };
        value: string;
      }

      interface BaseComponent {
        hot: _Handsontable.Core;
        id: string;
        hidden: boolean;
        stateId: string;
        state: RecordTranslation.IndexMap;
        elements: any[];

        restoreState(): void;
        setState(state: any): void;
        saveState(physicalColumn: number): void;
        getState(): any;
        destroy(): boolean;
        hide(): void;
        isHidden(): boolean;
        reset(): void;
        show(): void;
      }
      interface ActionBarComponent extends BaseComponent {
        getMenuItemDescriptor(): object;
        accept(): void;
        cancel(): void;
      }
      interface ConditionComponent extends BaseComponent {
        getInputElement(index?: number): InputUI;
        getInputElements(): InputUI[];
        getMenuItemDescriptor(): object;
        getSelectElement(): SelectUI;
        getState(): object;
        setState(value: object): void;
        updateState(stateInfo: object): void;
      }
      interface ValueComponent extends BaseComponent {
        getMenuItemDescriptor(): object;
        getMultipleSelectElement(): MultipleSelectUI;
        getState(): object;
        setState(value: object): void;
        updateState(stateInfo: object): void;
      }

      interface BaseUI {
        buildState: boolean;
        eventManager: EventManager;
        hot: _Handsontable.Core;
        options: object;

        build(): void;
        destroy(): void;
        element(): Element;
        focus(): void;
        getValue(): any;
        hide(): void;
        isBuilt(): boolean;
        reset(): void;
        setValue(value: any): any;
        show(): void;
        update(): void;
      }
      interface InputUI extends BaseUI { }
      interface MultipleSelectUI extends BaseUI {
        clearAllUI: BaseUI;
        items: any[];
        itemsBox: _Handsontable.Core;
        searchInput: InputUI;
        selectAllUI: BaseUI;

        getItems(): void;
        getValue(): any[];
        isSelectedAllValues(): boolean;
        setItems(items: any[]): void;
      }
      interface SelectUI extends BaseUI {
        menu: Menu | void;
        items: any[];

        setItems(items: any[]): void;
        openOptions(): void;
        closeOptions(): void;
      }

      interface ConditionCollection {
        hot: _Handsontable.Core;
        isMapRegistrable: boolean;
        filteringStates: RecordTranslation.IndexMap;
        addCondition(column: number, conditionDefinition: ConditionId, operation?: OperationType, position?: number): void;
        clean(): void;
        destroy(): void;
        exportAllConditions(): ConditionId[];
        getConditions(column: number): Condition[];
        getFilteredColumns(): number[];
        getColumnStackPosition(column: number): number | void;
        getOperation(column: number): void | OperationType;
        hasConditions(column: number, name: string): boolean;
        isEmpty(): boolean;
        isMatch(value: CellLikeData, column: number): boolean;
        isMatchInConditions(conditions: Condition[], value: CellLikeData, operationType?: OperationType): boolean;
        importAllConditions(conditions: ConditionId[]): void;
        removeConditions(column: number): void;
      }

      interface ConditionUpdateObserver {
        hot: _Handsontable.Core;
        changes: number[];
        columnDataFactory: (column: number) => object[];
        conditionCollection: ConditionCollection;
        grouping: boolean;
        latestEditedColumnPosition: number;
        latestOrderStack: number[];

        destroy(): void;
        flush(): void;
        groupChanges(): void;
        updateStatesAtColumn(column: number, conditionArgsChange: object): void;
      }
    }

    interface BindStrategy {
      klass: () => void;
      strategy: string | void;

      clearMap(): void;
      createMap(length: number): void;
      createRow(params: any): void;
      destroy(): void;
      removeRow(params: any): void;
      setStrategy(name: string): void;
      translate(params: any): void;
    }

    interface CommandExecutor {
      hot: _Handsontable.Core;
      commands: object;
      commonCallback: (() => void) | void;

      registerCommand(name: string, commandDescriptor: object): void;
      setCommonCallback(callback: () => void): void;
      execute(commandName: string, ...params: any[]): void;
    }

    interface Cursor {
      cellHeight: number;
      cellWidth: number;
      left: number;
      leftRelative: number;
      rootWindow: Window;
      scrollLeft: number;
      scrollTop: number;
      top: number;
      topRelative: number;
      type: string;

      fitsAbove(element: HTMLElement): boolean;
      fitsBelow(element: HTMLElement, viewportHeight?: number): boolean;
      fitsOnLeft(element: HTMLElement): boolean;
      fitsOnRight(element: HTMLElement, viewportHeight?: number): boolean;
      getSourceType(object: any): string;
    }

    interface Endpoints {
      plugin: plugins.ColumnSummary;
      hot: _Handsontable.Core;
      endpoints: Endpoint[];
      settings: object | (() => void);
      settingsType: string;
      currentEndpoint: object | void;

      assignSetting(settings: object, endpoint: object, name: string, defaultValue: any): void;
      getAllEndpoints(): any[];
      getEndpoint(index: number): object;
      parseSettings(settings: any[]): void;
      refreshAllEndpoints(init: boolean): void;
      refreshChangedEndpoints(changes: any[]): void;
      refreshEndpoint(endpoint: object): void;
      resetAllEndpoints(endpoints: any[], useOffset?: boolean): void;
      resetEndpointValue(endpoint: object, useOffset?: boolean): void;
      setEndpointValue(endpoint: object, source: string, render?: boolean): void;
    }

    interface Endpoint {
      destinationRow: number;
      destinationColumn: number;
      forceNumeric: boolean;
      reversedRowCoords: boolean;
      suppressDataTypeErrors: boolean;
      readOnly: boolean;
      roundFloat: boolean;
      ranges: number[][];
      sourceColumn: number;
      type: 'sum' | 'min' | 'max' | 'count' | 'average' | 'custom';
      result: number;
      customFunction: ((this: ColumnSummary, endpoint: Endpoint) => number) | null;
    }

    interface EventManager {
      context?: object;

      addEventListener(element: Element, eventName: string, callback: (event: Event) => void): () => void;
      removeEventListener(element: Element, eventName: string, callback: (event: Event) => void): void;
      clearEvents(): void;
      clear(): void;
      destroy(): void;
      fireEvent(element: Element, eventName: string): void;
      extendEvent(context: object, event: Event): any;
    }

    interface GhostTable {
      columns: number[];
      container: HTMLElement | null;
      hot: _Handsontable.Core;
      injected: boolean;
      rows: object[];
      samples: object | null;
      settings: object;

      addRow(row: number, samples: object): void;
      addColumn(column: number, samples: object): void;
      addColumnHeadersRow(samples: object): void;
      clean(): void;
      createCol(column: number): DocumentFragment;
      createColElement(column: number): HTMLElement;
      createColGroupsCol(): DocumentFragment;
      createColumnHeadersRow(): DocumentFragment;
      createContainer(className?: string): object;
      createRow(row: number): DocumentFragment;
      createTable(className?: string): object;
      getHeights(callback: (row: number, height: number) => void): void;
      getWidths(callback: (row: number, height: number) => void): void;
      getSettings(): object | void;
      getSetting(name: string): boolean | void;
      injectTable(parent?: HTMLElement | void): void;
      isHorizontal(): boolean;
      isVertical(): boolean;
      removeTable(): void;
      setSettings(settings: GridSettings): void;
      setSetting(name: string, value: any): void;
    }

    interface ItemsFactory {
      defaultOrderPattern: any[] | void;
      hot: _Handsontable.Core;
      predefinedItems: object;

      getItems(pattern?: any[] | object | boolean): any[];
      setPredefinedItems(predefinedItems: any[]): void;
    }

    interface Menu {
      container: HTMLElement;
      eventManager: EventManager;
      hot: _Handsontable.Core;
      hotMenu: _Handsontable.Core;
      hotSubMenus: object;
      keyEvent: boolean;
      menuItems: any[] | null;
      offset: object;
      options: object;
      origOutsideClickDeselects: boolean | (() => void);
      parentMenu: Menu | null;

      close(closeParent?: boolean): void;
      closeSubMenu(row: number): void;
      closeAllSubMenus(): void;
      destroy(): void;
      executeCommand(event: Event): void;
      isOpened(): boolean;
      isSubMenu(): boolean;
      open(): void;
      openSubMenu(row: number): Menu | boolean;
      setMenuItems(menuItems: any[]): void;
      setOffset(area: string, offset?: number): void;
      selectLastCell(): void;
      selectFirstCell(): void;
      selectPrevCell(row: number, col: number): void;
      selectNextCell(row: number, col: number): void;
      setPosition(coords: Event | object): void;
      setPositionAboveCursor(cursor: Cursor): void;
      setPositionBelowCursor(cursor: Cursor): void;
      setPositionOnLeftOfCursor(cursor: Cursor): void;
      setPositionOnRightOfCursor(cursor: Cursor): void;
    }

    interface SamplesGenerator {
      allowDuplicates: boolean | null;
      customSampleCount: boolean | null;
      dataFactory: () => void;
      samples: object | null;

      generateColumnSamples(colRange: object, rowRange: object): object;
      generateRowSamples(rowRange: object | number, colRange: object): object;
      generateSamples(type: string, range: object, specifierRange: object | number): object;
      generateSample(type: string, range: object, specifierValue: number): object
      getSampleCount(): number;
      setAllowDuplicates(allowDuplicates: boolean): void;
      setSampleCount(sampleCount: number): void;
    }

    class Base {
      pluginName: string;
      pluginsInitializedCallback: any[];
      isPluginsReady: boolean;
      enabled: boolean;
      initialized: boolean;
      hot: _Handsontable.Core;

      constructor(hotInstance?: _Handsontable.Core)

      addHook(name: string, callback: (...args: any[]) => any): void;
      callOnPluginsReady(callback: () => void): void;
      clearHooks(): void;
      destroy(): void;
      isEnabled(): boolean;
      disablePlugin(): void;
      enablePlugin(): void;
      updatePlugin(): void;
      init(): void;
      removeHooks(name: string): void;
    }

    interface Base {
      new(hotInstance?: _Handsontable.Core): Base;
    }

    export class AutoColumnSize extends AutoColumnSizePlugin {}
    export class Autofill extends AutofillPlugin {}
    export class AutoRowSize extends AutoRowSizePlugin {}
    // export class Base extends BasePlugin {}
    export class BindRowsWithHeaders extends BindRowsWithHeadersPlugin {}
    export class CollapsibleColumns extends CollapsibleColumnsPlugin {}
    export class ColumnSorting extends ColumnSortingPlugin {}
    export class ColumnSummary extends ColumnSummaryPlugin {}

    interface CommentEditor {
      editor: HTMLElement;
      editorStyle: CSSStyleDeclaration;
      hidden: boolean;
      rootDocument: Document;

      setPosition(x: number, y: number): void;
      setSize(width: number, height: number): void;
      resetSize(): void;
      setReadOnlyState(state: boolean): void;
      show(): void;
      hide(): void;
      isVisible(): boolean;
      setValue(value?: string): void;
      getValue(): string;
      isFocused(): boolean;
      focus(): void;
      createEditor(): HTMLElement;
      getInputElement(): HTMLElement;
      destroy(): void;
    }

    interface ContextMenu extends Base {
      DEFAULT_ITEMS: contextMenu.PredefinedMenuItemKey[];
      SEPARATOR: SeparatorObject;
      eventManager: EventManager;
      commandExecutor: CommandExecutor;
      itemsFactory: ItemsFactory | void;
      menu: Menu | void;

      close(): void;
      executeCommand(commandName: string, ...params: any[]): void;
      open(event: Event): void;
    }

    interface FocusableWrapper {
      eventManager: EventManager;
      listenersCount: WeakSet<HTMLElement>;
      mainElement: HTMLElement;
      rootDocument: Document;

      useSecondaryElement(): void;
      setFocusableElement(element: HTMLElement): void;
      getFocusableElement(): HTMLElement;
      focus(): void;
    }

    type PasteModeType = 'overwrite' | 'shift_down' | 'shift_right';
    type RangeType = { startRow: number, startCol: number, endRow: number, endCol: number };

    interface CopyPaste extends Base {
      columnsLimit: number;
      copyableRanges: any[];
      focusableElement: FocusableWrapper;
      pasteMode: PasteModeType;
      rowsLimit: number;
      uiContainer: HTMLElement;

      copy(): void;
      cut(): void;
      getRangedCopyableData(ranges: RangeType[]): string;
      getRangedData(ranges: RangeType[]): any[];
      paste(pastableText?: string, pastableHtml?: string): void;
      setCopyableText(): void;
    }

    interface CustomBorders extends Base {
      savedBorderSettings: any[];

      setBorders(selection: Range[] | Array<[number, number, number, number]>, borderObject: object): void;
      getBorders(selection: Range[] | Array<[number, number, number, number]>): Array<[object]>;
      clearBorders(selection: Range[] | Array<[number, number, number, number]>): void;
    }

    interface DragToScroll extends Base {
      boundaries: object | void;
      callback: (() => void) | void;

      check(x: number, y: number): void;
      setBoundaries(boundaries: object): void;
      setCallback(callback: () => void): void;
    }

    type SeparatorObject = {
      name: string;
    }

    interface DropdownMenu extends Base {
      eventManager: EventManager;
      commandExecutor: CommandExecutor;
      itemsFactory: ItemsFactory | void;
      menu: Menu | void;
      SEPARATOR: SeparatorObject

      close(): void;
      executeCommand(commandName: string, ...params: any[]): void;
      open(event: Event): void;
    }

    interface ExportFile extends Base {
      downloadFile(format: string, options: object): void;
      exportAsString(format: string, options?: object): string;
      exportAsBlob(format: string, options?: object): Blob;
    }

    interface Filters extends Base {
      actionBarComponent: FiltersPlugin.ActionBarComponent | void;
      dropdownMenuPlugin: DropdownMenu | void;
      eventManager: EventManager;
      conditionComponent: FiltersPlugin.ConditionComponent | void;
      conditionCollection: FiltersPlugin.ConditionCollection | void;
      conditionUpdateObserver: FiltersPlugin.ConditionUpdateObserver | void;
      lastSelectedColumn?: number | void;
      trimRowsPlugin: TrimRows | void;
      valueComponent: FiltersPlugin.ValueComponent | void;

      addCondition(column: number, name: string, args: any[], operationId?: FiltersPlugin.OperationType): void;
      clearColumnSelection(): void;
      clearConditions(column?: number | void): void;
      getDataMapAtColumn(column: number): FiltersPlugin.CellLikeData[];
      getSelectedColumn(): number | void;
      filter(): void;
      removeConditions(column: number): void;
    }

    interface DataProvider {
      changes: object;
      hot: _Handsontable.Core;

      clearChanges(): void;
      collectChanges(row: number, column: number, value: any): void;
      destroy(): void;
      getDataAtCell(row: number, column: number): any;
      getDataByRange(row1: number, column1: number, row2: number, column2: number): any[];
      getRawDataAtCell(row: number, column: number): any;
      getRawDataByRange(row1: number, column1: number, row2: number, column2: number): any[];
      getSourceDataByRange(row1: number, column1: number, row2: number, column2: number): any[];
      getSourceDataAtCell(row: number, column: number): any;
      isInDataRange(row: number, column: number): boolean;
      updateSourceData(row: number, column: number, value: any): void;
    }

    interface AlterManager {
      sheet: Sheet;
      hot: _Handsontable.Core;
      dataProvider: DataProvider;
      matrix: Matrix;

      prepareAlter(action: string, args: any): void;
      triggerAlter(action: string, args: any): void;
      destroy(): void;
    }

    interface Matrix {
      data: any[];
      cellReferences: any[];

      getCellAt(row: number, column: number): CellValue | void;
      getOutOfDateCells(): any[];
      add(cellValue: CellValue | object): void;
      remove(cellValue: CellValue | object | any[]): void;
      getDependencies(cellCoord: object): void;
      registerCellRef(cellReference: CellReference | object): void;
      removeCellRefsAtRange(start: object, end: object): any[];
      reset(): void;
    }

    interface BaseCell {
      columnAbsolute: boolean;
      columnOffset: number;
      rowAbsolute: boolean;
      rowOffset: number;

      isEqual(cell: BaseCell): boolean;
      toString(): string;
      translateTo(rowOffset: number, columnOffset: number): void;
    }

    interface CellReference extends BaseCell { }

    interface CellValue extends BaseCell {
      error: string | void;
      precedents: any[];
      state: string;
      value: any;

      addPrecedent(cellReference: CellReference): void;
      clearPrecedents(): void;
      getError(): string | void;
      getPrecedents(): any[];
      getValue(): any;
      hasError(): boolean;
      hasPrecedent(cellReference: CellReference): boolean;
      hasPrecedents(): boolean;
      isState(state: number): boolean;
      removePrecedent(cellReference: CellReference): void;
      setError(error: string): void;
      setState(state: number): void;
      setValue(value: any): void;
    }

    type Parser = {};

    interface Sheet {
      alterManager: AlterManager
      dataProvider: DataProvider;
      hot: _Handsontable.Core;
      matrix: Matrix;
      parser: Parser;

      applyChanges(row: number, column: number, newValue: any): void;
      destroy(): void;
      getCellAt(row: number, column: number): CellValue | void;
      getCellDependencies(row: number, column: number): any[];
      getVariable(name: string): any;
      parseExpression(cellValue: CellValue | object, formula: string): void;
      recalculate(): void;
      recalculateFull(): void;
      recalculateOptimized(): void;
      setVariable(name: string, value: any): void;
    }

    interface Stack {
      items: any[];

      isEmpty(): boolean;
      peek(): any;
      pop(): any;
      push(items: any): void;
      size(): number;
    }

    interface UndoRedoSnapshot {
      sheet: Sheet;
      stack: Stack;

      destroy(): void;
      restore(): void;
      save(axis: string, index: number, amount: number): void;
    }

    namespace UndoRedoAction {
      type Change = {
        actionType: 'change';
        changes: CellChange[];
        selected: [number, number][]
      };
      type InsertRow = {
        actionType: 'insert_row';
        amount: number;
        index: number;
      }
      type RemoveRow = {
        actionType: 'remove_row';
        index: number;
        data: CellValue[][];
      }
      type InsertCol = {
        actionType: 'insert_col';
        amount: number;
        index: number;
      }
      type RemoveCol = {
        actionType: 'remove_col';
        amount: number;
        columnPositions: number[];
        index: number;
        indexes: number[];
        headers: string[];
        data: CellValue[][];
      }
      type Filter = {
        actionType: 'filter';
        conditionsStack: FiltersPlugin.ColumnConditions[];
      }
    }

    type UndoRedoAction = UndoRedoAction.Change | UndoRedoAction.InsertRow | UndoRedoAction.RemoveRow | UndoRedoAction.InsertCol | UndoRedoAction.RemoveCol | UndoRedoAction.Filter;

    interface Formulas extends Base {
      engine: HyperFormula | null;
      sheetName: string | null;
      sheetId: number | null;

      addSheet(sheetName?: string | null, sheetData?: CellValue[][]): boolean | string;
      getCellType(row: number, col: number, sheet?: number): HyperFormulaCellType;
      switchSheet(sheetName: string): void;
    }

    interface HiddenColumns extends Base {
      isHidden(column: number): boolean;
      hideColumn(column: number): void;
      hideColumns(columns: number[]): void;
      showColumn(column: number): void;
      showColumns(columns: number[]): void;
      getHiddenColumns(): number[];
      isValidConfig(hiddenColumns: number[]): boolean;
    }

    interface HiddenRows extends Base {
      isHidden(row: number): boolean;
      hideRow(row: number): void;
      hideRows(rows: number[]): void;
      showRow(row: number): void;
      showRows(rows: number[]): void;
      getHiddenRows(): number[];
      isValidConfig(hiddenRows: number[]): boolean;
    }

    interface ManualColumnFreeze extends Base {
      freezeColumn(column: number): void;
      unfreezeColumn(column: number): void;
    }

    interface MultiColumnSorting extends Base {
      clearSort(): void;
      destroy(): void;
      getSortConfig(column: number): void | columnSorting.Config;
      getSortConfig(): Array<columnSorting.Config>;
      isSorted(): boolean;
      setSortConfig(sortConfig?: columnSorting.Config | Array<columnSorting.Config>): void;
      sort(sortConfig?: columnSorting.Config | Array<columnSorting.Config>): void;
    }

    namespace moveUI {
      interface BaseUI {
        hot: _Handsontable.Core;
        state: number;

        appendTo(wrapper: HTMLElement): void;
        build(): void;
        destroy(): void;
        getOffset(): object;
        getPosition(): object;
        getSize(): object;
        isAppended(): boolean;
        isBuilt(): boolean;
        setOffset(top: number, left: number): void;
        setPosition(top: number, left: number): void;
        setSize(width: number, height: number): void;
      }

      interface BacklightUI extends BaseUI { }
      interface GuidelineUI extends BaseUI { }
    }

    interface MergeCells extends Base {
      mergedCellsCollection: MergeCellsPlugin.MergedCellsCollection;
      autofillCalculations: MergeCellsPlugin.AutofillCalculations;
      selectionCalculations: MergeCellsPlugin.SelectionCalculations;

      clearCollections(): void;
      mergeSelection(cellRange: WoTCellRange): void;
      merge(startRow: number, startColumn: number, endRow: number, endColumn: number): void;
      unmerge(startRow: number, startColumn: number, endRow: number, endColumn: number): void;
    }

    namespace MergeCellsPlugin {
      interface AutofillCalculations {
        plugin: MergeCells;
        mergedCellsCollection: MergeCellsPlugin.MergedCellsCollection;
        currentFillData: object;

        correctSelectionAreaSize(selectionArea: number[]): void;
        getDirection(selectionArea: number[], finalArea: number[]): string;
        snapDragArea(baseArea: number[], dragArea: number[], dragDirection: string, foundMergedCells: MergeCellsPlugin.MergedCellCoords[]): number[];
        recreateAfterDataPopulation(changes: any[]): void;
        dragAreaOverlapsCollections(baseArea: number[], fullArea: number[], direction: string): boolean;
      }

      interface SelectionCalculations {
        snapDelta(delta: object, selectionRange: WoTCellRange, mergedCell: MergeCellsPlugin.MergedCellCoords): void;
        getUpdatedSelectionRange(oldSelectionRange: WoTCellRange, delta: object): WoTCellRange;
      }

      interface MergedCellCoords {
        row: number;
        col: number;
        rowspan: number;
        colspan: number;
        removed: boolean;

        normalize(hotInstance: _Handsontable.Core): void;
        includes(row: number, column: number): boolean;
        includesHorizontally(column: number): boolean;
        includesVertically(row: number): boolean;
        shift(shiftVector: number[], indexOfChange: number): boolean;
        isFarther(mergedCell: MergeCellsPlugin.MergedCellCoords, direction: string): boolean | void;
        getLastRow(): number;
        getLastColumn(): number;
        getRange(): WoTCellRange;
      }

      interface MergedCellsCollection {
        plugin: MergeCells;
        mergedCells: MergeCellsPlugin.MergedCellCoords[];
        hot: _Handsontable.Core;

        get(row: number, column: number): MergeCellsPlugin.MergedCellCoords | boolean;
        getByRange(range: WoTCellRange | object): MergeCellsPlugin.MergedCellCoords | boolean;
        getWithinRange(range: WoTCellRange | object, countPartials: boolean): MergeCellsPlugin.MergedCellCoords[] | boolean;
        add(mergedCellInfo: object): MergeCellsPlugin.MergedCellCoords | boolean;
        remove(row: number, column: number): MergeCellsPlugin.MergedCellCoords | boolean;
        clear(): void;
        isOverlapping(mergedCell: MergeCellsPlugin.MergedCellCoords): boolean;
        isFirstRenderableMergedCell(row: number, column: number): boolean;
        shiftCollections(direction: string, index: number, count: number): void;
      }
    }

    interface ManualColumnMove extends Base {
      backlight: moveUI.BacklightUI;
      eventManager: EventManager;
      guideline: moveUI.GuidelineUI;

      moveColumn(column: number, finalIndex: number): boolean;
      moveColumns(columns: number[], finalIndex: number): boolean;
      dragColumn(column: number, dropIndex: number): boolean;
      dragColumns(columns: number[], dropIndex: number): boolean;
      isMovePossible(columns: number[], finalIndex: number): boolean;
    }

    interface ManualColumnResize extends Base {
      autoresizeTimeout: (() => void) | void;
      currentCol: number | void;
      currentTH: HTMLElement | void;
      currentWidth: number | void;
      dblclick: number;
      eventManager: EventManager;
      guide: HTMLElement;
      handle: HTMLElement;
      manualColumnWidths: any[];
      newSize: number | void;
      pressed: _Handsontable.Core | void;
      selectedCols: any[];
      startOffset: number | void;
      startWidth: number | void;
      startY: number | void;

      checkIfColumnHeader(element: HTMLElement): boolean;
      clearManualSize(column: number): void;
      getClosestTHParent(element: HTMLElement): HTMLElement;
      hideHandleAndGuide(): void;
      loadManualColumnWidths(): (number | null)[];
      refreshGuidePosition(): void;
      refreshHandlePosition(): void;
      saveManualColumnWidths(): void;
      setManualSize(column: number, width: number): number;
      setupGuidePosition(): void;
      setupHandlePosition(TH: HTMLElement): boolean | void;
    }

    interface ManualRowMove extends Base {
      backlight: moveUI.BacklightUI;
      eventManager: EventManager;
      guideline: moveUI.GuidelineUI;

      moveRow(row: number, finalIndex: number): boolean;
      moveRows(rows: number[], finalIndex: number): boolean;
      dragRow(row: number, dropIndex: number): boolean;
      dragRows(rows: number[], dropIndex: number): boolean;
      isMovePossible(rows: number[], finalIndex: number): boolean;
    }

    interface ManualRowResize extends Base {
      autoresizeTimeout: (() => void) | void;
      currentRow: number | void;
      currentTH: HTMLElement | void;
      currentWidth: number | void;
      dblclick: number;
      eventManager: EventManager;
      guide: HTMLElement;
      handle: HTMLElement;
      manualRowHeights: any[];
      newSize: number | void;
      pressed: _Handsontable.Core | void;
      selectedRows: any[];
      startOffset: number | void;
      startWidth: number | void;
      startY: number | void;

      checkIfRowHeader(element: HTMLElement): boolean;
      clearManualSize(column: number): void;
      getClosestTHParent(element: HTMLElement): HTMLElement;
      hideHandleAndGuide(): void;
      loadManualRowHeights(): (number|null)[];
      refreshGuidePosition(): void;
      refreshHandlePosition(): void;
      saveManualRowHeights(): void;
      setManualSize(column: number, width: number): number;
      setupGuidePosition(): void;
      setupHandlePosition(TH: HTMLElement): boolean | void;
    }

    interface MultipleSelectionHandles extends Base {
      dragged: any[];
      eventManager: EventManager;
      lastSetCell: HTMLElement | void;

      getCurrentRangeCoords(selectedRange: WoTCellRange, currentTouch: WoTCellCoords, touchStartDirection: string, currentDirection: string, draggedHandle: string): object;
      isDragged(): boolean;
    }

    interface NestedHeaders extends Base {
      detectedOverlappedHeaders: boolean;
    }

    interface DataManager {
      cache: object;
      data: object;
      hot: _Handsontable.Core;
      parentReference: any; //WeakMap
      plugin: NestedRows;

      addChild(parent: object, element?: object): void;
      addChildAtIndex(parent: object, index: number, element?: object, globalIndex?: number): void;
      addSibling(index: number, where?: string): void;
      countAllRows(): number;
      countChildren(parent: object | number): number;
      detachFromParent(elements: object | any[], forceRender?: boolean): void;
      getDataObject(row: number): any | void;
      getRowIndex(rowObj: object): number | void;
      getRowIndexWithinParent(row: number | object): number;
      getRowLevel(row: number): number | void;
      getRowParent(row: number | object): object | void;
      hasChildren(row: number | object): boolean;
      isParent(row: number | object): boolean;
      moveRow(fromIndex: number, toIndex: number): void;
      rewriteCache(): void;
    }

    interface NestedRows extends Base {
      bindRowsWithHeadersPlugin: BindRowsWithHeaders | void;
      dataManager: DataManager | void;
      headersUI: object | void;
      collapsingUI: object | void;
      sourceData: object | void;
      trimRowsPlugin: TrimRows | void;
    }

    interface DataObserver {
      observedData: any[];
      observer: object;
      paused: boolean;

      destroy(): void;
      isPaused(): boolean;
      pause(): void;
      resume(): void;
      setObservedData(observedData: any): void;
    }

    interface TouchScroll extends Base {
      clones: any[];
      lockedCollection: boolean;
      scrollbars: any[];
    }

    interface TrimRows extends Base {
      trimmedRows: any[];
      removedRows: any[];

      isTrimmed(row: number): boolean;
      getTrimmedRows(): number[];
      trimRow(row: number): void;
      trimRows(rows: number[]): void;
      untrimAll(): void;
      untrimRow(row: number): void;
      untrimRows(rows: number[]): void;
    }

    interface Storage {
      prefix: string;
      rootWindow: Window;
      savedKeys: string[];

      clearSavedKeys(): void;
      loadSavedKeys(): void;
      loadValue(key: string, defaultValue: object): any;
      resetAll(): void;
      saveSavedKeys(): void;
      saveValue(key: string, value: any): void;
    }

    interface PersistenState extends Base {
      storage: Storage;

      loadValue(key: string, saveTo: object): void;
      saveValue(key: string, value: any): void;
      resetValue(key: string): void;
    }

    interface Search extends Base {
      callback: search.SearchCallback;
      queryMethod: search.SearchQueryMethod;
      searchResultClass: string;

      query(queryStr: string, callback?: search.SearchCallback, queryMethod?: search.SearchQueryMethod): SearchResult[];
      getCallback(): search.SearchCallback;
      setCallback(newCallback: search.SearchCallback): void;
      getQueryMethod(): search.SearchQueryMethod;
      setQueryMethod(newQueryMethod: search.SearchQueryMethod): void;
      getSearchResultClass(): string;
      setSearchResultClass(newElementClass: string): void;
    }

    type SearchResult = { row: number; col: number; data: CellValue };
  }

  namespace renderers {
    interface Base {
      (instance: _Handsontable.Core, TD: HTMLTableCellElement, row: number, col: number, prop: string | number, value: CellValue, cellProperties: CellProperties): HTMLTableCellElement | void;
    }

    interface Autocomplete extends Base { }

    interface Checkbox extends Base { }

    interface Html extends Base { }

    interface Numeric extends Base { }

    interface Password extends Base { }

    interface Text extends Base { }
  }

  namespace validators {
    interface Base {
      (this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void;
    }

    interface Autocomplete extends Base { }

    interface Date extends Base { }

    interface Numeric extends Base { }

    interface Time extends Base { }
  }

  interface EventManager {
    new(context: object): plugins.EventManager;
  }

  interface ColumnDataGetterSetterFunction {
    (row: RowObject | CellValue[]): CellValue;
    (row: RowObject | CellValue[], value: CellValue): void;
  }

  interface UndoRedo {
    doneActions: plugins.UndoRedoAction[];
    instance: Handsontable;
    ignoreNewActions: boolean;
    undoneActions: plugins.UndoRedoAction[];

    clear(): void;
    done(action: plugins.UndoRedoAction): void;
    isRedoAvailable(): boolean;
    isUndoAvailable(): boolean;
    redo(): void;
    undo(): void;
  }

  interface NumericFormatOptions {
    pattern: string | numbro.Format;
    culture?: string;
  }

  interface LabelOptions {
    property?: string;
    position?: 'before' | 'after';
    value?: string | (() => string);
  }

  interface ViewportColumnsCalculator {
    count: number;
    startColumn: number | null;
    endColumn: number | null;
    startPosition: number | null;
    startRow?: number;
    endRow?: number;
    stretchAllRatio: number;
    stretchLastWidth: number;
    stretch: 'none' | 'all' | 'last';
    totalTargetWidth: number;
    needVerifyLastColumnWidth: boolean;
    stretchAllColumnsWidth: number[];
    calculate(): void;
    refreshStretching(totalWidth: number): void;
    getStretchedColumnWidth(column: number, baseWidth: number): number | null;
  }

  interface SelectionController {
    row: boolean;
    column: boolean;
    cell: boolean;
  }

  namespace RecordTranslation {
    interface IndexMap {
      getValues(): any[],
      getValueAtIndex(i: number): any;
      setValues(v: any[]): void;
      setValueAtIndex(i: number, value: any): boolean;
      clear(): void;
      getLength(): number;
    }

    interface ChangesEventData {
      op: 'replace' | 'insert' | 'remove';
      index: number;
      oldValue: any;
      newValue: any;
    }

    interface ChangesObserver {
      subscribe(callback: (changes: ChangesEventData[]) => void): ChangesObserver;
      unsubscribe(): ChangesObserver;
    }

    type MapTypes = 'hidden' | 'index' | 'linkedPhysicalIndexToValue' | 'physicalIndexToValue' | 'trimming';

    interface IndexMapper {
      suspendOperations(): void;
      resumeOperations(): void;
      createChangesObserver(indexMapType: 'hiding'): ChangesObserver;
      createAndRegisterIndexMap(indexName: string, mapType: MapTypes, initValueOrFn?: any): IndexMap;
      registerMap(uniqueName: string, indexMap: IndexMap): IndexMap;
      unregisterMap(name: string): void;
      unregisterAll(): void;
      getPhysicalFromVisualIndex(visualIndex: number): number | null;
      getPhysicalFromRenderableIndex(renderableIndex: number): number | null;
      getVisualFromPhysicalIndex(physicalIndex: number): number | null;
      getVisualFromRenderableIndex(renderableIndex: number): number | null;
      getRenderableFromVisualIndex(visualIndex: number): number | null;
      getFirstNotHiddenIndex(fromVisualIndex: number, incrementBy: number, searchAlsoOtherWayAround?: boolean, indexForNextSearch?: number): number | null;
      initToLength(length?: number): void;
      getIndexesSequence(): number[];
      setIndexesSequence(indexes: number[]): void;
      getNotTrimmedIndexes(readFromCache?: boolean): number[];
      getNotTrimmedIndexesLength(): number;
      getNotHiddenIndexes(readFromCache?: boolean): number[];
      getNotHiddenIndexesLength(): number;
      getRenderableIndexes(readFromCache?: boolean): number[];
      getRenderableIndexesLength(): number;
      getNumberOfIndexes(): number;
      moveIndexes(movedIndexes: number | number[], finalIndex: number): void;
      isTrimmed(physicalIndex: number): boolean;
      isHidden(physicalIndex: number): boolean;
    }
  }

  namespace I18n {
    type LanguageDictionary = {
      [phraseKey: string]: string | string[];
      languageCode: string;
    };
    interface Internationalization {
      dictionaryKeys: I18n.LanguageDictionary;
      registerLanguageDictionary(languageCodeOrDictionary: LanguageDictionary | string, dictionary?: LanguageDictionary): LanguageDictionary;
      getTranslatedPhrase(dictionaryKey: string, extraArguments?: any): string | null;
      getLanguagesDictionaries(): LanguageDictionary[];
      getLanguageDictionary(languageCode: string): LanguageDictionary;
    }
  }

  interface CellTypes {
    autocomplete: cellTypes.Autocomplete;
    checkbox: cellTypes.Checkbox;
    date: cellTypes.Date;
    dropdown: cellTypes.Dropdown;
    handsontable: cellTypes.Handsontable;
    numeric: cellTypes.Numeric;
    password: cellTypes.Password;
    text: cellTypes.Text;
    time: cellTypes.Time;
    getCellType(name: string): CellTypeObject;
    registerCellType(name: string, type: CellTypeObject): void;
  }

  interface CellTypeObject extends GridSettings {
    renderer?: renderers.Base;
    editor?: typeof _editors.Base;
    validator?: validators.Base;
    /**
     * Custom properties which will be accessible in `cellProperties`
     */
    [key: string]: any;
  }

  interface Editors {
    AutocompleteEditor: typeof _editors.Autocomplete;
    BaseEditor: typeof _editors.Base;
    CheckboxEditor: typeof _editors.Checkbox;
    DateEditor: typeof _editors.Date;
    DropdownEditor: typeof _editors.Dropdown;
    HandsontableEditor: typeof _editors.Handsontable;
    MobileEditor: typeof _editors.Mobile;
    NumericEditor: typeof _editors.Numeric;
    PasswordEditor: typeof _editors.Password;
    SelectEditor: typeof _editors.Select;
    TextEditor: typeof _editors.Text;
    TimeEditor: typeof _editors.Text;
    getEditor(editorName: string): typeof _editors.Base;
    registerEditor(editorName: string, editorClass: typeof _editors.Base): void;
  }

  interface Renderers {
    AutocompleteRenderer: renderers.Autocomplete;
    BaseRenderer: renderers.Base;
    CheckboxRenderer: renderers.Checkbox;
    DateRenderer: renderers.Autocomplete;
    DropdownRenderer: renderers.Autocomplete;
    HandsontableRenderer: renderers.Autocomplete;
    HtmlRenderer: renderers.Html;
    NumericRenderer: renderers.Numeric;
    PasswordRenderer: renderers.Password;
    TextRenderer: renderers.Text;
    TimeRenderer: renderers.Text;
    getRenderer(name: string): renderers.Base;
    registerRenderer(name: string, renderer: renderers.Base): void;
  }

  interface Validators {
    AutocompleteValidator: validators.Autocomplete;
    DateValidator: validators.Date;
    DropdownValidator: validators.Autocomplete;
    NumericValidator: validators.Numeric;
    TimeValidator: validators.Time;
    getValidator(name: string): validators.Base;
    registerValidator(name: string, validatotr: validators.Base): void;
  }

  interface Helper {
    readonly KEY_CODES: {
      A: number,
      ALT: number,
      ARROW_DOWN: number,
      ARROW_LEFT: number,
      ARROW_RIGHT: number,
      ARROW_UP: number,
      BACKSPACE: number,
      C: number,
      CAPS_LOCK: number,
      COMMA: number,
      COMMAND_LEFT: number,
      COMMAND_RIGHT: number,
      CONTROL_LEFT: number,
      DELETE: number,
      END: number,
      ENTER: number,
      ESCAPE: number,
      F1: number,
      F2: number,
      F3: number,
      F4: number,
      F5: number,
      F6: number,
      F7: number,
      F8: number,
      F9: number,
      F10: number,
      F11: number,
      F12: number,
      HOME: number,
      INSERT: number,
      MOUSE_LEFT: number,
      MOUSE_MIDDLE: number,
      MOUSE_RIGHT: number,
      PAGE_DOWN: number,
      PAGE_UP: number,
      PERIOD: number,
      SHIFT: number,
      SPACE: number,
      TAB: number,
      V: number,
      X: number
    },
    arrayAvg(array: any[]): number,
    arrayEach(array: any[], iteratee: (value: any, index: number, array: any[]) => void): any[],
    arrayFilter(array: any[], predicate: (value: any, index: number, array: any[]) => void): any[],
    arrayFlatten(array: any[]): any[],
    arrayIncludes(array: any[], searchElement: any, fromIndex: number): any[],
    arrayMap(array: any[], iteratee: (value: any, index: number, array: any[]) => void): any[],
    arrayMax(array: any[]): number,
    arrayMin(array: any[]): number,
    arrayReduce(array: any[], iteratee: (value: any, index: number, array: any[]) => void, accumulator: any, initFromArray: boolean): any,
    arraySum(array: any[]): number,
    arrayUnique(array: any[]): any[],
    cancelAnimationFrame(id: number): void,
    cellMethodLookupFactory(methodName: string, allowUndefined: boolean): void,
    clone(object: object): object,
    columnFactory(GridSettings: GridSettings, conflictList: any[]): object,
    stringToArray(value: string): string[],
    countFirstRowKeys(data: Handsontable.CellValue[][] | object[]): number,
    createEmptySpreadsheetData(rows: number, columns: number): any[],
    createObjectPropListener(defaultValue?: any, propertyToListen?: string): object,
    createSpreadsheetData(rows?: number, columns?: number): any[],
    createSpreadsheetObjectData(rows?: number, colCount?: number): any[],
    curry(func: () => void): () => void,
    curryRight(func: () => void): () => void,
    dataRowToChangesArray(dataRow: Handsontable.CellValue[] | object, rowOffset?: number): [number, number | string, Handsontable.CellValue][]
    debounce(func: () => void, wait?: number): () => void,
    deepClone(obj: object): object,
    deepExtend(target: object, extension: object): void,
    deepObjectSize(object: object): number,
    defineGetter(object: object, property: any, value: any, options: object): void,
    duckSchema(object: any[] | object): any[] | object,
    endsWith(string: string, needle: string): boolean,
    equalsIgnoreCase(...string: string[]): boolean,
    extend(target: object, extension: object): void,
    extendArray(arr: any[], extension: any[]): void,
    getComparisonFunction(language: string, options?: object): any | void,
    getDifferenceOfArrays(...arrays: (string | number)[][]): string[] | number[],
    getIntersectionOfArrays(...arrays: (string | number)[][]): string[] | number[],
    getNormalizedDate(dateString: string): Date,
    getProperty(object: object, name: string): any | void,
    getPrototypeOf(obj: object): any | void,
    getUnionOfArrays(...arrays: (string | number)[][]): string[] | number[],
    hasCaptionProblem(): boolean | void,
    htmlToGridSettings(element: HTMLTableElement | string, rootDocument?: Document): GridSettings,
    inherit(Child: object, Parent: object): object,
    instanceToHTML(instance: _Handsontable.Core): string,
    isChrome(): boolean,
    isClassListSupported(): boolean;
    isCtrlKey(keyCode: number): boolean,
    isDefined(variable: any): boolean,
    isEdge(): boolean,
    isEmpty(variable: any): boolean,
    isFirefox(): boolean,
    isFunction(func: any): boolean,
    isGetComputedStyleSupported(): boolean,
    isIE(): boolean,
    isIE9(): boolean,
    isKey(keyCode: number, baseCode: string): boolean
    isMetaKey(keyCode: number): boolean,
    isMobileBrowser(): boolean,
    isMSBrowser(): boolean,
    isNumeric(n: any): boolean,
    isObject(obj: any): boolean,
    isObjectEqual(object1: object | any[], object2: object | any[]): boolean,
    isPercentValue(value: string): boolean,
    isPrintableChar(keyCode: number): boolean,
    isSafari(): boolean,
    isTextContentSupported(): boolean,
    isTouchSupported(): boolean,
    isUndefined(variable: any): boolean,
    mixin(Base: object, ...mixins: object[]): object,
    objectEach(object: object, iteratee: (value: any, key: any, object: object) => void): object,
    padStart(string: string, maxLength: number, fillString?: string): string,
    partial(func: () => void, ...params: any[]): () => void,
    pipe(...functions: (() => void)[]): () => void,
    pivot(arr: any[]): any[],
    randomString(): string,
    rangeEach(rangeFrom: number, rangeTo: number, iteratee: (index: number) => void): void,
    rangeEachReverse(rangeFrom: number, rangeTo: number, iteratee: (index: number) => void): void,
    requestAnimationFrame(callback: () => void): number,
    setProperty(object: object, name: string, value: any): void,
    spreadsheetColumnIndex(label: string): number,
    spreadsheetColumnLabel(index: number): string,
    startsWith(string: string, needle: string): boolean,
    stringify(value: any): string,
    stripTags(string: string): string,
    substitute(template: string, variables?: object): string,
    throttle(func: () => void, wait?: number): () => void,
    throttleAfterHits(func: () => void, wait?: number, hits?: number): () => void,
    to2dArray(arr: any[]): void,
    toUpperCaseFirst(string: string): string,
    translateRowsToColumns(input: any[]): any[],
    valueAccordingPercent(value: number, percent: string | number): number
  }

  interface Dom {
    HTML_CHARACTERS: RegExp;
    addClass: (element: HTMLElement, className: string | any[]) => void;
    addEvent: (element: HTMLElement, event: string, callback: (event: Event) => void) => void;
    clearTextSelection: (rootWindow?: Window) => void;
    closest: (element: HTMLElement, nodes: any[], until?: HTMLElement) => HTMLElement | void;
    closestDown: (element: HTMLElement, nodes: any[], until?: HTMLElement) => HTMLElement | void;
    empty: (element: HTMLElement) => void;
    fastInnerHTML: (element: HTMLElement, content: string) => void;
    fastInnerText: (element: HTMLElement, content: string) => void;
    getCaretPosition: (el: HTMLElement) => number;
    getComputedStyle: (element: HTMLElement, rootWindow?: Window) => CSSStyleDeclaration | object;
    getCssTransform: (element: HTMLElement) => number | void;
    getFrameElement: (frame: Window) => HTMLIFrameElement | null;
    getParent: (element: HTMLElement, level?: number) => HTMLElement | void;
    getParentWindow: (frame: Window) => Window | null;
    getScrollLeft: (element: HTMLElement, rootWindow?: Window) => number;
    getScrollTop: (element: HTMLElement, rootWindow?: Window) => number;
    getScrollableElement: (element: HTMLElement) => HTMLElement;
    getScrollbarWidth: (rootDocument?: Document) => number;
    getSelectionEndPosition: (el: HTMLElement) => number;
    getSelectionText: (rootWindow?: Window) => string;
    getStyle: (element: HTMLElement, prop: string, rootWindow?: Window) => string;
    getTrimmingContainer: (base: HTMLElement) => HTMLElement;
    getWindowScrollLeft: (rootWindow?: Window) => number;
    getWindowScrollTop: (rootWindow?: Window) => number;
    hasAccessToParentWindow: (frame: Window) => boolean;
    hasClass: (element: HTMLElement, className: string) => boolean;
    hasHorizontalScrollbar: (element: HTMLElement) => boolean;
    hasVerticalScrollbar: (element: HTMLElement) => boolean;
    index: (element: Element) => number;
    innerHeight: (element: HTMLElement) => number;
    innerWidth: (element: HTMLElement) => number;
    isChildOf: (child: HTMLElement, parent: object | string) => boolean;
    isDetached: (element: HTMLElement) => boolean;
    isImmediatePropagationStopped: (event: Event) => boolean;
    isInput: (element: HTMLElement) => boolean;
    isLeftClick: (event: Event) => boolean;
    isOutsideInput: (element: HTMLElement) => boolean;
    isRightClick: (event: Event) => boolean;
    isVisible: (elem: HTMLElement) => boolean;
    matchesCSSRules: (elem: HTMLElement, rule: CSSRule) => boolean;
    offset: (elem: HTMLElement) => object;
    outerHeight: (elem: HTMLElement) => number;
    outerWidth: (element: HTMLElement) => number;
    overlayContainsElement: (overlayType: wot.OverlayType, element: HTMLElement, root: HTMLElement) => boolean;
    removeClass: (element: HTMLElement, className: string | any[]) => void;
    removeEvent: (element: HTMLElement, event: string, callback: () => void) => void;
    removeTextNodes: (element: HTMLElement, parent: HTMLElement) => void;
    resetCssTransform: (element: HTMLElement) => void;
    setCaretPosition: (element: HTMLElement, pos: number, endPos: number) => void;
    selectElementIfAllowed: (element: HTMLElement) => void;
    setOverlayPosition: (overlayElem: HTMLElement, left: number, top: number) => void;
    stopImmediatePropagation: (event: Event) => void;
  }

  interface Plugins {
    AutoColumnSize: plugins.AutoColumnSize;
    Autofill: plugins.Autofill;
    AutoRowSize: plugins.AutoRowSize;
    BasePlugin: plugins.Base;
    BindRowsWithHeaders: plugins.BindRowsWithHeaders;
    CollapsibleColumns: plugins.CollapsibleColumns;
    ColumnSorting: plugins.ColumnSorting;
    ColumnSummary: plugins.ColumnSummary;
    Comments: plugins.Comments;
    ContextMenu: plugins.ContextMenu;
    CopyPaste: plugins.CopyPaste;
    CustomBorders: plugins.CustomBorders;
    DragToScroll: plugins.DragToScroll;
    DropdownMenu: plugins.DropdownMenu;
    ExportFile: plugins.ExportFile;
    Filters: plugins.Filters;
    Formulas: plugins.Formulas;
    HiddenColumns: plugins.HiddenColumns;
    HiddenRows: plugins.HiddenRows;
    ManualColumnFreeze: plugins.ManualColumnFreeze;
    ManualColumnMove: plugins.ManualColumnMove;
    ManualColumnResize: plugins.ManualColumnResize;
    ManualRowMove: plugins.ManualRowMove;
    ManualRowResize: plugins.ManualRowResize;
    MergeCells: plugins.MergeCells;
    MultiColumnSorting: plugins.MultiColumnSorting;
    MultipleSelectionHandles: plugins.MultipleSelectionHandles;
    NestedHeaders: plugins.NestedHeaders;
    NestedRows: plugins.NestedRows;
    Search: plugins.Search;
    TouchScroll: plugins.TouchScroll;
    TrimRows: plugins.TrimRows;
    getPlugin<T extends keyof PluginsCollection>(pluginName: T): PluginsCollection[T];
    registerPlugin(pluginName: string, pluginClass: { new(hotInstance?: _Handsontable.Core): plugins.Base }): void;
    registerPlugin(pluginClass: { new(hotInstance?: _Handsontable.Core): plugins.Base }): void;
  }

  // Plugin collection, map for getPlugin method
  interface PluginsCollection {
    autoColumnSize: plugins.AutoColumnSize;
    autofill: plugins.Autofill;
    autoRowSize: plugins.AutoRowSize;
    basePlugin: plugins.Base;
    bindRowsWithHeaders: plugins.BindRowsWithHeaders;
    collapsibleColumns: plugins.CollapsibleColumns;
    columnSorting: plugins.ColumnSorting;
    columnSummary: plugins.ColumnSummary;
    comments: plugins.Comments;
    contextMenu: plugins.ContextMenu;
    copyPaste: plugins.CopyPaste;
    customBorders: plugins.CustomBorders;
    dragToScroll: plugins.DragToScroll;
    dropdownMenu: plugins.DropdownMenu;
    exportFile: plugins.ExportFile;
    filters: plugins.Filters;
    formulas: plugins.Formulas;
    hiddenColumns: plugins.HiddenColumns;
    hiddenRows: plugins.HiddenRows;
    manualColumnFreeze: plugins.ManualColumnFreeze;
    manualColumnMove: plugins.ManualColumnMove;
    manualColumnResize: plugins.ManualColumnResize;
    manualRowMove: plugins.ManualRowMove;
    manualRowResize: plugins.ManualRowResize;
    mergeCells: plugins.MergeCells;
    multiColumnSorting: plugins.MultiColumnSorting;
    multipleSelectionHandles: plugins.MultipleSelectionHandles;
    nestedHeaders: plugins.NestedHeaders;
    nestedRows: plugins.NestedRows;
    persistentState: plugins.PersistenState;
    search: plugins.Search;
    touchScroll: plugins.TouchScroll;
    trimRows: plugins.TrimRows;
  }

  namespace contextMenu {
    interface Selection {
      start: WoTCellCoords;
      end: WoTCellCoords;
    }
    interface Settings {
      callback?: (key: string, selection: Selection[], clickEvent: MouseEvent) => void;
      items: PredefinedMenuItemKey[] | MenuConfig;
    }
    type PredefinedMenuItemKey = 'row_above' | 'row_below' | 'col_left' | 'col_right' | '---------' | 'remove_row' | 'remove_col' | 'clear_column' | 'undo' | 'redo' | 'make_read_only' | 'alignment' | 'cut' | 'copy' | 'freeze_column' | 'unfreeze_column' | 'borders' | 'commentsAddEdit' | 'commentsRemove' | 'commentsReadOnly' | 'mergeCells' | 'add_child' | 'detach_from_parent' | 'hidden_columns_hide' | 'hidden_columns_show' | 'hidden_rows_hide' | 'hidden_rows_show' | 'filter_by_condition' | 'filter_operators' | 'filter_by_condition2' | 'filter_by_value' | 'filter_action_bar';

    interface MenuConfig {
      [key: string]: MenuItemConfig;
    }

    interface MenuItemConfig {
      name?: string | ((this: _Handsontable.Core) => string);
      key?: string;
      hidden?: boolean | ((this: _Handsontable.Core) => boolean | void);
      disabled?: boolean | ((this: _Handsontable.Core) => boolean | void);
      disableSelection?: boolean;
      isCommand?: boolean;
      callback?(this: _Handsontable.Core, key: string, selection: Selection[], clickEvent: MouseEvent): void;
      renderer?(this: MenuItemConfig, hot: _Handsontable.Core, wrapper: HTMLElement, row: number, col: number, prop: number | string, itemValue: string): HTMLElement;
      submenu?: SubmenuConfig;
    }

    interface SubmenuConfig {
      items: SubmenuItemConfig[];
    }

    interface SubmenuItemConfig extends Omit<MenuItemConfig, "key"> {
      /**
       * Submenu item `key` must be defined as "parent_key:sub_key" where "parent_key" is the parent MenuItemConfig key.
       */
      key: string;
    }
  }

  namespace columnSorting {
    type SortOrderType = 'asc' | 'desc';
    type Config = { column: number; sortOrder: SortOrderType }

    interface Settings {
      initialConfig?: Config;
      sortEmptyCells?: boolean;
      indicator?: boolean;
      headerAction?: boolean;
      compareFunctionFactory?: ((sortOrder: SortOrderType, columnMeta: GridSettings) =>
        (value: any, nextValue: any) => -1 | 0 | 1);
    }
  }

  namespace multiColumnSorting {
    interface Settings {
      initialConfig?: columnSorting.Config | Array<columnSorting.Config>;
      sortEmptyCells?: boolean;
      indicator?: boolean;
      headerAction?: boolean;
      compareFunctionFactory?: ((sortOrder: columnSorting.SortOrderType, columnMeta: GridSettings) =>
        (value: any, nextValue: any) => -1 | 0 | 1);
    }
  }

  namespace search {
    interface Settings {
      callback?: SearchCallback;
      queryMethod?: SearchQueryMethod;
      searchResultClass?: string;
    }

    type SearchCallback = (instance: Handsontable, row: number, column: number, value: CellValue, result: boolean) => void;

    type SearchQueryMethod = (queryStr: string, value: CellValue, cellProperties: CellProperties) => boolean;
  }

  namespace autoColumnSize {
    interface Settings {
      syncLimit?: string | number;
      useHeaders?: boolean;
    }
  }

  namespace autoRowSize {
    interface Settings {
      syncLimit?: string | number;
    }
  }

  namespace collapsibleColumns {
    interface Settings {
      row: number;
      col: number;
      collapsible: boolean;
    }
  }

  namespace columnSummary {
    type Settings = {
      destinationRow: number;
      destinationColumn: number;
      forceNumeric?: boolean;
      reversedRowCoords?: boolean;
      suppressDataTypeErrors?: boolean;
      readOnly?: boolean;
      roundFloat?: boolean;
      ranges?: number[][];
      sourceColumn?: number;
    } & ({
      type: 'sum' | 'min' | 'max' | 'count' | 'average';
    } | {
      type: 'custom';
      customFunction: (this: plugins.ColumnSummary, endpoint: plugins.Endpoint) => number;
    });
  }

  namespace copyPaste {
    interface Settings {
      pasteMode?: plugins.PasteModeType;
      rowsLimit?: number;
      columnsLimit?: number;
    }
  }

  namespace customBorders {
    type BorderOptions = {
      width?: number;
      color?: string;
      hide?: boolean;
    }
    type BorderRange = {
      range: {
        from: WoTCellCoords;
        to: WoTCellCoords;
      }
    }
    type Settings = (WoTCellCoords | BorderRange) & {
      left?: BorderOptions | string;
      right?: BorderOptions | string;
      top?: BorderOptions | string;
      bottom?: BorderOptions | string;
    }
  }

  namespace autoFill {
    interface Settings {
      autoInsertRow?: boolean;
      direction?: 'vertical' | 'horizontal';
    }
  }

  namespace formulas {
    interface HyperFormulaSettings extends Partial<ConfigParams> {
      hyperformula: typeof HyperFormula | HyperFormula
    }
    interface Settings {
      engine: typeof HyperFormula | HyperFormula | HyperFormulaSettings
    }
  }

  namespace hiddenColumns {
    interface Settings {
      columns?: number[];
      indicators?: boolean;
    }
  }

  namespace hiddenRows {
    interface Settings {
      rows?: number[];
      indicators?: boolean;
    }
  }

  namespace mergeCells {
    interface Settings {
      row: number;
      col: number;
      rowspan: number;
      colspan: number;
    }
  }

  namespace nestedHeaders {
    interface NestedHeader {
      label: string;
      colspan: number;
    }
  }
}


declare class Handsontable extends _Handsontable.Core {
  static baseVersion: string;
  static buildDate: string;
  static packageName: 'handsontable';
  static version: string;
  static cellTypes: Handsontable.CellTypes;
  static languages: Handsontable.I18n.Internationalization;
  static dom: Handsontable.Dom;
  static editors: Handsontable.Editors;
  static helper: Handsontable.Helper;
  static hooks: Handsontable.Hooks.Methods;
  static plugins: Handsontable.Plugins;
  static renderers: Handsontable.Renderers;
  static validators: Handsontable.Validators;
  static Core: typeof _Handsontable.Core;
  static EventManager: Handsontable.EventManager;
  static DefaultSettings: GridSettings;
}

export default Handsontable;
