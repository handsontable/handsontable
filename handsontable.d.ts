import { PikadayOptions } from 'pikaday';

/**
 * @internal
 * Omit properties K from T
 */
type Omit<T, K extends keyof T> = Pick<T, ({ [P in keyof T]: P } & { [P in K]: never } & { [x: string]: never, [x: number]: never })[keyof T]>;
// type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>; // TS >= 2.8

declare namespace _Handsontable {

  class Core {
    constructor(element: Element, options: Handsontable.GridSettings);
    addHook<K extends keyof Handsontable.Hooks.Events>(key: K, callback: Handsontable.Hooks.Events[K] | Handsontable.Hooks.Events[K][]): void;
    addHookOnce<K extends keyof Handsontable.Hooks.Events>(key: K, callback: Handsontable.Hooks.Events[K] | Handsontable.Hooks.Events[K][]): void;
    alter(action: 'insert_row' | 'insert_col' | 'remove_row' | 'remove_col', index?: number | Array<[number, number]>, amount?: number, source?: string, keepEmptyRows?: boolean): void;
    clear(): void;
    colOffset(): number;
    colToProp(col: number): string | number;
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
    getCellEditor<T extends Handsontable._editors.Base>(row: number, col: number): T;
    getCellEditor<T extends Handsontable._editors.Base>(cellMeta: Handsontable.CellMeta): T;
    getCellMeta(row: number, col: number): Handsontable.CellProperties;
    getCellMetaAtRow(row: number): Handsontable.CellProperties[];
    getCellRenderer(row: number, col: number): Handsontable.renderers.Base;
    getCellRenderer(cellMeta: Handsontable.CellMeta): Handsontable.renderers.Base;
    getCellsMeta(): Handsontable.CellProperties[];
    getCellValidator(row: number, col: number): Handsontable.validators.Base | RegExp | undefined;
    getCellValidator(cellMeta: Handsontable.CellMeta): Handsontable.validators.Base | RegExp | undefined;
    getColHeader(): (number | string)[];
    getColHeader(col: number): number | string;
    getColWidth(col: number): number;
    getCoords(elem: Element | null): Handsontable.wot.CellCoords;
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
    getSelectedRange(): Handsontable.wot.CellRange[] | undefined;
    getSelectedRangeLast(): Handsontable.wot.CellRange | undefined;
    getSettings(): Handsontable.GridSettings;
    getSourceData(row?: number, column?: number, row2?: number, column2?: number): Handsontable.CellValue[][] | Handsontable.RowObject[];
    getSourceDataArray(row?: number, column?: number, row2?: number, ccolumn2?: number): Handsontable.CellValue[][];
    getSourceDataAtCell(row: number, column: number): Handsontable.CellValue;
    getSourceDataAtCol(column: number): Handsontable.CellValue[];
    getSourceDataAtRow(row: number): Handsontable.CellValue[] | Handsontable.RowObject;
    getTranslatedPhrase(dictionaryKey: string, extraArguments: any): string | null;
    getValue(): Handsontable.CellValue;
    hasColHeaders(): boolean;
    hasHook(key: keyof Handsontable.Hooks.Events): boolean;
    hasRowHeaders(): boolean;
    init(): () => void;
    isEmptyCol(col: number): boolean;
    isEmptyRow(row: number): boolean;
    isDestroyed: boolean;
    isListening(): boolean;
    isColumnModificationAllowed(): boolean;
    listen(): void;
    loadData(data: Handsontable.CellValue[][] | Handsontable.RowObject[]): void;
    populateFromArray(row: number, col: number, input: Handsontable.CellValue[][], endRow?: number, endCol?: number, source?: string, method?: 'shift_down' | 'shift_right' | 'overwrite', direction?: 'left' | 'right' | 'up' | 'down', deltas?: any[]): void;
    propToCol(prop: string | number): number;
    refreshDimensions(): void;
    removeCellMeta(row: number, col: number, key: string): void;
    removeCellMeta(row: number, col: number, key: keyof Handsontable.CellMeta): void;
    removeHook<K extends keyof Handsontable.Hooks.Events>(key: K, callback: Handsontable.Hooks.Events[K]): void;
    render(): void;
    renderCall: boolean;
    rootDocument: Document;
    rootElement: HTMLElement;
    rootWindow: Window;
    rowOffset(): number;
    runHooks(key: keyof Handsontable.Hooks.Events, p1?: any, p2?: any, p3?: any, p4?: any, p5?: any, p6?: any): any;
    // Requires TS 3.0:
    // runHooks<K extends keyof Handsontable.Events>(key: K, ...params: Parameters<Handsontable.Events[K]>): ReturnType<Handsontable.Events[K]>;
    scrollViewportTo(row?: number, column?: number, snapToBottom?: boolean, snapToRight?: boolean): boolean;
    selectAll(): void;
    selectCell(row: number, col: number, endRow?: number, endCol?: number, scrollToCell?: boolean, changeListener?: boolean): boolean;
    selectCellByProp(row: number, prop: string, endRow?: number, endProp?: string, scrollToCell?: boolean): boolean;
    selectCells(coords: Array<[number, number | string, number, number | string]> | Array<Handsontable.wot.CellRange>, scrollToCell?: boolean, changeListener?: boolean): boolean;
    selectColumns(startColumn: number | string, endColumn?: number | string): boolean;
    selectRows(startRow: number, endRow?: number): boolean;
    setCellMeta(row: number, col: number, key: string, val: any): void;
    setCellMeta<K extends keyof Handsontable.CellMeta>(row: number, col: number, key: K, val: Handsontable.CellMeta[K]): void;
    setCellMetaObject<T extends Handsontable.CellMeta>(row: number, col: number, prop: T): void;
    setDataAtCell(row: number, col: string | number, value: Handsontable.CellValue, source?: string): void;
    setDataAtCell(changes: Array<[number, string | number, Handsontable.CellValue]>, source?: string): void;
    setDataAtRowProp(row: number, prop: string, value: Handsontable.CellValue, source?: string): void;
    setDataAtRowProp(changes: Array<[number, string | number, Handsontable.CellValue]>, source?: string): void;
    spliceCol(col: number, index: number, amount: number, ...elements: Handsontable.CellValue[]): void;
    spliceRow(row: number, index: number, amount: number, ...elements: Handsontable.CellValue[]): void;
    table: HTMLTableElement;
    toHTML(): string;
    toPhysicalColumn(column: number): number;
    toPhysicalRow(row: number): number;
    toVisualColumn(column: number): number;
    toVisualRow(row: number): number;
    toTableElement(): HTMLTableElement;
    unlisten(): void;
    updateSettings(settings: Handsontable.GridSettings, init?: boolean): void;
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
   * A single row of source data, which can be represented as an array of values, or an object with key/value pairs.
   */
  type SourceRowData = RowObject | CellValue[];

  /**
   * The default sources for which the table triggers hooks.
   */
  type ChangeSource = 'auto' | 'edit' | 'loadData' | 'populateFromArray' | 'spliceCol' | 'spliceRow' | 'timeValidate' | 'dateValidate' | 'validateCells' | 'Autofill.fill' | 'Autofill.fill' | 'ContextMenu.clearColumns' | 'ContextMenu.columnLeft' | 'ContextMenu.columnRight' | 'ContextMenu.removeColumn' | 'ContextMenu.removeRow' | 'ContextMenu.rowAbove' | 'ContextMenu.rowBelow' | 'CopyPaste.paste' | 'ObserveChanges.change' | 'UndoRedo.redo' | 'UndoRedo.undo' | 'GantChart.loadData' | 'ColumnSummary.set' | 'ColumnSummary.reset';

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

  namespace wot {
    interface CellCoords {
      col: number;
      row: number;
    }
    interface CellRange {
      highlight: CellCoords;
      from: CellCoords;
      to: CellCoords;
    }
    type OverlayType = 'top' | 'bottom' | 'left' | 'top_left_corner' | 'bottom_left_corner' | 'debug';
  }

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
        elements: any[];
        hidden: boolean;

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
        conditions: object;
        orderStack: any[];

        addCondition(column: number, conditionDefinition: ConditionId, operation?: OperationType): void;
        clean(): void;
        clearConditions(column: number): void;
        destroy(): void;
        exportAllConditions(): ConditionId[];
        getConditions(column: number): Condition[];
        hasConditions(column: number, name: string): boolean;
        isEmpty(): boolean;
        isMatch(value: CellLikeData, column: number): boolean;
        isMatchInConditions(conditions: Condition[], value: CellLikeData, operationType?: OperationType): boolean;
        importAllConditions(conditions: ConditionId[]): void;
        removeConditions(column: number): void;
      }

      interface ConditionUpdateObserver {
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
      setSettings(settings: DefaultSettings): void;
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
      t: RecordTranslator;

      constructor(hotInstance?: _Handsontable.Core)

      addHook(name: string, callback: (...args: any[]) => any): void;
      callOnPluginsReady(callback: () => void): void;
      clearHooks(): void;
      destroy(): void;
      disablePlugin(): void;
      enablePlugin(): void;
      updatePlugin(): void;
      init(): void;
      removeHooks(name: string): void;
    }

    interface Base {
      new(hotInstance?: _Handsontable.Core): Base;
    }

    interface AutoColumnSize extends Base {
      firstCalculation: boolean;
      ghostTable: GhostTable;
      inProgress: boolean;
      samplesGenerator: SamplesGenerator;
      widths: any[];

      calculateAllColumnsWidth(rowRange?: number | object): void;
      calculateColumnsWidth(colRange?: number | object, rowRange?: number | object, force?: boolean): void;
      clearCache(columns?: any[]): void;
      findColumnsWhereHeaderWasChanged(): any[];
      getColumnWidth(col: number, defaultWidth?: number, keepMinimum?: boolean): number;
      getFirstVisibleColumn(): number;
      getLastVisibleColumn(): number;
      getSyncCalculationLimit(): number;
      isNeedRecalculate(): boolean;
      recalculateAllColumnsWidth(): void;
    }

    interface AutoRowSize extends Base {
      firstCalculation: boolean;
      heights: any[];
      ghostTable: GhostTable;
      inProgress: boolean;
      sampleGenerator: SamplesGenerator;

      calculateAllRowsHeight(colRange?: number | object): void;
      calculateRowsHeight(rowRange?: number | object, colRange?: number | object, force?: boolean): void;
      clearCache(): void;
      clearCacheByRange(range: number | object): void;
      findColumnsWhereHeaderWasChanged(): any[];
      getColumnHeaderHeight(): number | void;
      getFirstVisibleRow(): number;
      getLastVisibleRow(): number;
      getRowHeight(col: number, defaultHeight?: number): number;
      getSyncCalculationLimit(): number;
      isNeedRecalculate(): boolean;
      recalculateAllRowsHeight(): void;
    }

    interface Autofill extends Base {
      addingStarted: boolean;
      autoInsertRow: boolean;
      directions: string[];
      eventManager: EventManager;
      handleDraggedCells: number;
      mouseDownOnCellCorner: boolean;
      mouseDragOutside: boolean;
    }

    interface BindRowsWithHeaders extends Base {
      bindStrategy: BindStrategy;
      removeRows: any[];
    }

    interface CollapsibleColumns extends Base {
      buttonEnabledList: object;
      collapsedSections: object;
      columnHeaderLevelCount: number;
      eventManager: EventManager;
      hiddenColumnsPlugin: object;
      nestedHeadersPlugin: object;
      settings: boolean | any[];

      checkDependencies(): void;
      collapseAll(): void;
      collapseSection(coords: object): void;
      expandAll(): void;
      expandSection(coords: object): void;
      generateIndicator(col: number, TH: HTMLElement): HTMLElement;
      markSectionAs(state: string, row: number, column: number, recursive: boolean): void;
      meetsDependencies(): boolean;
      parseSettings(): void;
      toggleAllCollapsibleSections(action: string): void;
      toggleCollapsibleSection(coords: object, action: string): void;
    }

    interface ColumnSorting extends Base {
      clearSort(): void;
      destroy(): void;
      getSortConfig(column: number): void | columnSorting.Config
      getSortConfig(): Array<columnSorting.Config>
      isSorted(): boolean;
      setSortConfig(sortConfig?: columnSorting.Config | Array<columnSorting.Config>): void;
      sort(sortConfig?: columnSorting.Config): void;
    }

    interface ColumnSummary extends Base {
      endpoints: Endpoints | void;

      calculate(endpoint: Endpoints): void;
      calculateAverage(endpoint: Endpoints): number;
      calculateMinMax(endpoint: Endpoints, type: string): number;
      calculateSum(endpoint: Endpoints): void;
      countEmpty(rowRange: any[], col: number): number;
      countEntries(endpoint: Endpoints): number;
      getCellValue(row: number, col: number): string;
      getPartialMinMax(rowRange: any[], col: number, type: string): number;
      getPartialSum(rowRange: any[], col: number): number;
    }

    type CommentsRangeObject = {
      from: wot.CellCoords;
      to?: wot.CellCoords;
    }
    interface Comments extends Base {
      contextMenuEvent: boolean;
      displayDelay: number;
      editor: CommentEditor;
      eventManager: EventManager;
      mouseDown: boolean;
      range: CommentsRangeObject;
      timer: any;

      clearRange(): void;
      getComment(): string;
      getCommentAtCell(row: number, column: number): string | undefined;
      getCommentMeta(row: number, column: number, property: string): any;
      hide(): void;
      refreshEditor(force?: boolean): void;
      removeComment(forceRender?: boolean): void;
      removeCommentAtCell(row: number, col: number, forceRender?: boolean): void;
      setComment(value: string): void;
      setCommentAtCell(row: number, col: number, value: string): void;
      setRange(range: CommentsRangeObject): void;
      show(): boolean;
      showAtCell(row: number, col: number): boolean;
      targetIsCellWithComment(event: Event): boolean;
      targetIsCommentTextArea(event: Event): boolean;
      updateCommentMeta(row: number, column: number, metaObject: object): void;
    }

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

      addCondition(column: number, name: string, args: any[], operationId: FiltersPlugin.OperationType): void;
      clearColumnSelection(): void;
      clearConditions(column?: number | void): void;
      getDataMapAtColumn(column: number): FiltersPlugin.CellLikeData[];
      getSelectedColumn(): number | void;
      filter(): void;
      removeConditions(column: number): void;
    }

    interface RecordTranslator {
      hot: _Handsontable.Core;

      toPhysical(row: number | object, column?: number): object | any[];
      toPhysicalColumn(column: number): number;
      toPhysicalRow(row: number): number;
      toVisual(row: number | object, column?: number): object | any[];
      toVisualColumn(column: number): number;
      toVisualRow(row: number): number;
    }

    interface DataProvider {
      changes: object;
      hot: _Handsontable.Core;
      t: RecordTranslator;

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
      t: RecordTranslator;
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
      t: RecordTranslator;

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
      dataProvider: DataProvider;
      eventManager: EventManager;
      sheet: Sheet;
      undoRedoSnapshot: UndoRedoSnapshot;

      getCellValue(row: number, column: number): any;
      getVariable(name: string): any;
      hasComputedCellValue(row: number, column: number): boolean;
      recalculate(): void;
      recalculateFull(): void;
      recalculateOptimized(): void;
      setVariable(name: string, value: any): void;
    }

    interface GanttChart extends Base {
      colorData: object;
      currentYear: number | void;
      dateCalculator: object | void;
      dataFeed: object | void;
      hotSource: _Handsontable.Core | void;
      initialSettings: object | void;
      monthHeadersArray: any[];
      monthList: any[];
      nestedHeadersPlugin: NestedHeaders | void;
      overallWeekSectionCount: number | void;
      rangeBarMeta: object | void;
      rangeBars: object;
      rangeList: object;
      settings: object;
      weekHeadersArray: any[];

      addRangeBar(row: number, startDate: Date | string, endDate: Date | string, additionalData: object): boolean | any[];
      applyRangeBarMetaCache(): void;
      cacheRangeBarMeta(row: number, col: number, key: string, value: any | any[]): void;
      checkDependencies(): void;
      getRangeBarCoordinates(row: number): object;
      getRangeBarData(row: number, column: number): object | boolean;
      renderRangeBar(row: number, startDateColumn: number, endDateColumn: number, additionalData: object): void;
      removeRangeBarByDate(row: number, startDate: Date | string): void;
      removeRangeBarByColumn(row: number, startDateColumn: number): void;
      removeAllRangeBars(): void;
      setRangeBarColors(rows: object): void;
      setYear(year: number): void;
      uniformBackgroundRenderer(instance: _Handsontable.Core, TD: HTMLElement, row: number, col: number, prop: string | number, value: string | number, cellProperties: CellProperties): void;
      unrenderRangeBar(row: number, startDateColumn: number, endDateColumn: number): void;
      updateRangeBarData(row: number, column: number, data: object): void;
    }

    interface HeaderTooltips extends Base {
      settings: boolean | object;

      parseSettings(): void;
    }

    interface HiddenColumns extends Base {
      hiddenColumns: boolean | any[];
      lastSelectedColumn: number;
      settings: object | void;

      isHidden(column: number, isLogicIndex?: boolean): boolean;
      hideColumn(column: number): void;
      hideColumns(columns: any[]): void;
      showColumn(column: number): void;
      showColumns(columns: any[]): void;
    }

    interface HiddenRows extends Base {
      hiddenRows: boolean | any[];
      lastSelectedRow: number;
      settings: object | void;

      isHidden(row: number, isLogicIndex?: boolean): boolean;
      hideRow(row: number): void;
      hideRows(rows: any[]): void;
      showRow(row: number): void;
      showRows(rows: any[]): void;
    }

    interface ManualColumnFreeze extends Base {
      frozenColumnsBasePositions: any[];
      manualColumnMovePlugin: ManualColumnMove;

      freezeColumn(column: number): void;
      unfreezeColumn(column: number): void;
    }

    interface arrayMapper {
      getValueByIndex(index: number): any;
      getIndexByValue(value: any): number;
      insertItems(index: number, amount?: number): any[];
      removeItems(index: number, amount?: number): any[];
      shiftItems(index: number, amount?: number): void;
      unshiftItems(index: number, amount?: number): void;
    }

    interface MoveColumnsMapper extends arrayMapper {
      manualColumnMove: ManualColumnMove;

      clearNull(): void;
      createMap(length?: number): void;
      destroy(): void;
      moveColumn(from: number, to: number): void;
    }

    interface MoveRowsMapper extends arrayMapper {
      manualRowMove: ManualRowMove;

      clearNull(): void;
      createMap(length?: number): void;
      destroy(): void;
      moveColumn(from: number, to: number): void;
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

    interface TrimRowsMapper extends arrayMapper {
      trimRows: TrimRows;

      createMap(length?: number): void;
      destroy(): void;
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
      mergeSelection(cellRange: wot.CellRange): void;
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
        snapDelta(delta: object, selectionRange: wot.CellRange, mergedCell: MergeCellsPlugin.MergedCellCoords): void;
        getUpdatedSelectionRange(oldSelectionRange: wot.CellRange, delta: object): wot.CellRange;
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
        getRange(): wot.CellRange;
      }

      interface MergedCellsCollection {
        plugin: MergeCells;
        mergedCells: MergeCellsPlugin.MergedCellCoords[];
        hot: _Handsontable.Core;

        get(row: number, column: number): MergeCellsPlugin.MergedCellCoords | boolean;
        getByRange(range: wot.CellRange | object): MergeCellsPlugin.MergedCellCoords | boolean;
        getWithinRange(range: wot.CellRange | object, countPartials: boolean): MergeCellsPlugin.MergedCellCoords[] | boolean;
        add(mergedCellInfo: object): MergeCellsPlugin.MergedCellCoords | boolean;
        remove(row: number, column: number): MergeCellsPlugin.MergedCellCoords | boolean;
        clear(): void;
        isOverlapping(mergedCell: MergeCellsPlugin.MergedCellCoords): boolean;
        isMergedParent(row: number, column: number): boolean;
        shiftCollections(direction: string, index: number, count: number): void;
      }
    }

    interface ManualColumnMove extends Base {
      backlight: moveUI.BacklightUI;
      columnsMapper: MoveColumnsMapper;
      eventManager: EventManager;
      guideline: moveUI.GuidelineUI;
      removedColumns: any[];

      moveColumn(column: number, target: number): void;
      moveColumns(columns: number[], target: number): void;
      persistentStateLoad(): void;
      persistentStateSave(): void;
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
      getTHFromTargetElement(element: HTMLElement): HTMLElement;
      hideHandleAndGuide(): void;
      loadManualColumnWidths(): void;
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
      removedRows: any[];
      rowsMapper: MoveRowsMapper;

      moveRow(row: number, target: number): void;
      moveRows(rows: number[], target: number): void;
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
      getTHFromTargetElement(element: HTMLElement): HTMLElement;
      hideHandleAndGuide(): void;
      loadManualRowHeights(): void;
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

      getCurrentRangeCoords(selectedRange: wot.CellRange, currentTouch: wot.CellCoords, touchStartDirection: string, currentDirection: string, draggedHandle: string): object;
      isDragged(): boolean;
    }

    interface GhostTableNestedHeaders {
      container: any;
      nestedHeaders: NestedHeaders;
      widthsCache: any[];

      clear(): void;
    }

    interface NestedHeaders extends Base {
      colspanArray: any[];
      columnHeaderLevelCount: number;
      ghostTable: GhostTableNestedHeaders;
      settings: any[];

      checkForFixedColumnsCollision(): void;
      checkForOverlappingHeaders(): void;
      getChildHeaders(row: number, column: number): any[];
      fillColspanArrayWithDummies(colspan: number, level: number): void;
      fillTheRemainingColspans(): void;
      getColspan(row: number, column: number): number;
      getNestedParent(level: number, column: number): any;
      headerRendererFactory(headerRow: number): () => void;
      levelToRowCoords(level: number): number;
      rowCoordsToLevel(row: number): number;
      setupColspanArray(): void;
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
    interface ObserveChanges extends Base {
      observer: DataObserver | void;
    }

    interface TouchScroll extends Base {
      clones: any[];
      lockedCollection: boolean;
      scrollbars: any[];
    }

    interface TrimRows extends Base {
      trimmedRows: any[];
      removedRows: any[];
      rowsMapper: TrimRowsMapper;

      isTrimmed(row: number): boolean;
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

  interface DefaultSettings {
    new(): GridSettings;
  }

  interface EventManager {
    new(context: object): plugins.EventManager;
  }

  /**
   * A rendered cell object with computed properties.
   */
  interface CellProperties extends CellMeta {
    row: number;
    col: number;
    instance: Handsontable;
    visualRow: number;
    visualCol: number;
    prop: string | number;
  }

  /**
   * Additional cell-specific meta data.
   */
  interface CellMeta extends ColumnSettings {
    valid?: boolean;
    comment?: comments.CommentObject;
    isSearchResult?: boolean;
    hidden?: boolean;
    skipRowOnPaste?: boolean;
  }

  /**
   * Column settings inherit grid settings but overload the meaning of `data` to be specific to each column.
   */
  interface ColumnSettings extends Omit<GridSettings, "data"> {
    data?: string | number | ColumnDataGetterSetterFunction;
    /**
     * Column and cell meta data is extensible, developers can add any properties they want.
     */
    [key: string]: any;
  }

  interface ColumnDataGetterSetterFunction {
    (row: RowObject | CellValue[]): CellValue;
    (row: RowObject | CellValue[], value: CellValue): void;
  }

  /**
   * Base table settings that will cascade to columns and cells.
   */
  interface GridSettings extends Hooks.Events {
    activeHeaderClassName?: string;
    allowEmpty?: boolean;
    allowHtml?: boolean;
    allowInsertColumn?: boolean;
    allowInsertRow?: boolean;
    allowInvalid?: boolean;
    allowRemoveColumn?: boolean;
    allowRemoveRow?: boolean;
    autoColumnSize?: autoColumnSize.Settings | boolean;
    autoRowSize?: autoRowSize.Settings | boolean;
    autoWrapCol?: boolean;
    autoWrapRow?: boolean;
    bindRowsWithHeaders?: boolean | 'loose' | 'strict';
    cell?: CellSettings[];
    cells?: (this: CellProperties, row: number, col: number, prop: string | number) => CellMeta;
    checkedTemplate?: boolean | string | number;
    className?: string | string[];
    colHeaders?: boolean | string[] | ((index: number) => string);
    collapsibleColumns?: boolean | collapsibleColumns.Settings[];
    columnHeaderHeight?: number | (number | undefined)[];
    columns?: ColumnSettings[] | ((index: number) => ColumnSettings);
    columnSorting?: boolean | columnSorting.Settings;
    columnSummary?: columnSummary.Settings[] | (() => columnSummary.Settings[]);
    colWidths?: number | number[] | string | string[] | ((index: number) => string | number);
    commentedCellClassName?: string;
    comments?: boolean | comments.Settings | comments.CommentConfig[];
    contextMenu?: boolean | contextMenu.PredefinedMenuItemKey[] | contextMenu.Settings;
    copyable?: boolean;
    copyPaste?: boolean | copyPaste.Settings;
    correctFormat?: boolean;
    currentColClassName?: string;
    currentHeaderClassName?: string;
    currentRowClassName?: string;
    customBorders?: boolean | customBorders.Settings[];
    data?: CellValue[][] | RowObject[];
    dataSchema?: RowObject | CellValue[] | ((row: number) => RowObject | CellValue[]);
    dateFormat?: string;
    datePickerConfig?: PikadayOptions;
    debug?: boolean;
    defaultDate?: string;
    disableVisualSelection?: boolean | 'current' | 'area' | 'header' | ('current' | 'area' | 'header')[];
    dragToScroll?: boolean;
    dropdownMenu?: boolean | contextMenu.PredefinedMenuItemKey[] | contextMenu.Settings;
    editor?: EditorType | typeof _editors.Base | boolean | string;
    enterBeginsEditing?: boolean;
    enterMoves?: wot.CellCoords | ((event: KeyboardEvent) => wot.CellCoords);
    fillHandle?: boolean | 'vertical' | 'horizontal' | autoFill.Settings;
    filter?: boolean;
    filteringCaseSensitive?: boolean;
    filters?: boolean;
    fixedColumnsLeft?: number;
    fixedRowsBottom?: number;
    fixedRowsTop?: number;
    formulas?: boolean | formulas.Settings;
    fragmentSelection?: boolean | 'cell';
    ganttChart?: ganttChart.Settings;
    headerTooltips?: boolean | headerTooltips.Settings;
    height?: number | string | (() => number | string);
    hiddenColumns?: boolean | hiddenColumns.Settings;
    hiddenRows?: boolean | hiddenRows.Settings;
    invalidCellClassName?: string;
    isEmptyCol?: (this: _Handsontable.Core, col: number) => boolean;
    isEmptyRow?: (this: _Handsontable.Core, row: number) => boolean;
    label?: LabelOptions;
    language?: string;
    licenseKey?: string | 'non-commercial-and-evaluation';
    manualColumnFreeze?: boolean;
    manualColumnMove?: boolean | number[];
    manualColumnResize?: boolean | number[];
    manualRowMove?: boolean | number[];
    manualRowResize?: boolean | number[];
    maxCols?: number;
    maxRows?: number;
    mergeCells?: boolean | mergeCells.Settings[];
    minCols?: number;
    minRows?: number;
    minSpareCols?: number;
    minSpareRows?: number;
    multiColumnSorting?: boolean | multiColumnSorting.Settings;
    nestedHeaders?: (string | nestedHeaders.NestedHeader)[][];
    nestedRows?: boolean;
    noWordWrapClassName?: string;
    numericFormat?: NumericFormatOptions;
    observeChanges?: boolean;
    observeDOMVisibility?: boolean;
    outsideClickDeselects?: boolean | ((target: HTMLElement) => boolean);
    persistentState?: boolean;
    placeholder?: string;
    placeholderCellClassName?: string;
    preventOverflow?: boolean | 'vertical' | 'horizontal';
    preventWheel?: boolean;
    readOnly?: boolean;
    readOnlyCellClassName?: string;
    renderAllRows?: boolean;
    renderer?: RendererType | string | renderers.Base;
    rowHeaders?: boolean | string[] | ((index: number) => string);
    rowHeaderWidth?: number | number[];
    rowHeights?: number | number[] | string | string[] | ((index: number) => string | number);
    search?: boolean | search.Settings;
    selectionMode?: 'single' | 'range' | 'multiple';
    selectOptions?: string[];
    skipColumnOnPaste?: boolean;
    sortByRelevance?: boolean;
    source?: string[] | number[] | ((this: CellProperties, query: string, callback: (items: string[]) => void) => void);
    startCols?: number;
    startRows?: number;
    stretchH?: 'none' | 'all' | 'last';
    strict?: boolean;
    tableClassName?: string | string[];
    tabMoves?: wot.CellCoords | ((event: KeyboardEvent) => wot.CellCoords);
    title?: string;
    trimDropdown?: boolean;
    trimRows?: boolean | number[];
    trimWhitespace?: boolean;
    type?: CellType | string;
    uncheckedTemplate?: boolean | string | number;
    undo?: boolean;
    validator?: validators.Base | RegExp | ValidatorType | string;
    viewportColumnRenderingOffset?: number | 'auto';
    viewportRowRenderingOffset?: number | 'auto';
    visibleRows?: number;
    width?: number | string | (() => number | string);
    wordWrap?: boolean;
  }

  namespace Hooks {
    interface Events {
      afterAddChild?: (parent: RowObject, element: RowObject | void, index: number | void) => void;
      afterBeginEditing?: (row: number, column: number) => void;
      afterCellMetaReset?: () => void;
      afterChange?: (changes: CellChange[] | null, source: ChangeSource) => void;
      afterChangesObserved?: () => void;
      afterColumnMove?: (columns: number[], target: number) => void;
      afterColumnResize?: (currentColumn: number, newSize: number, isDoubleClick: boolean) => void;
      afterColumnSort?: (currentSortConfig: columnSorting.Config[], destinationSortConfigs: columnSorting.Config[]) => void;
      afterContextMenuDefaultOptions?: (predefinedItems: (contextMenu.PredefinedMenuItemKey | contextMenu.MenuItemConfig)[]) => void;
      afterContextMenuHide?: (context: plugins.ContextMenu) => void;
      afterContextMenuShow?: (context: plugins.ContextMenu) => void;
      afterCopy?: (data: CellValue[][], coords: plugins.RangeType[]) => void;
      afterCopyLimit?: (selectedRows: number, selectedColumnds: number, copyRowsLimit: number, copyColumnsLimit: number) => void;
      afterCreateCol?: (index: number, amount: number, source?: ChangeSource) => void;
      afterCreateRow?: (index: number, amount: number, source?: ChangeSource) => void;
      afterCut?: (data: CellValue[][], coords: plugins.RangeType[]) => void;
      afterDeselect?: () => void;
      afterDestroy?: () => void;
      afterDetachChild?: (parent: RowObject, element: RowObject) => void;
      afterDocumentKeyDown?: (event: KeyboardEvent) => void;
      afterDrawSelection?: (currentRow: number, currentColumn: number, cornersOfSelection: number[], layerLevel: number | void) => string | void
      afterDropdownMenuDefaultOptions?: (predefinedItems: (contextMenu.PredefinedMenuItemKey | contextMenu.MenuItemConfig)[]) => void;
      afterDropdownMenuHide?: (instance: plugins.DropdownMenu) => void;
      afterDropdownMenuShow?: (instance: plugins.DropdownMenu) => void;
      afterFilter?: (conditionsStack: plugins.FiltersPlugin.ColumnConditions[]) => void;
      afterGetCellMeta?: (row: number, col: number, cellProperties: CellProperties) => void;
      afterGetColHeader?: (col: number, TH: HTMLTableHeaderCellElement) => void;
      afterGetColumnHeaderRenderers?: (renderers: ((col: number, TH: HTMLTableHeaderCellElement) => void)[]) => void;
      afterGetRowHeader?: (row: number, TH: HTMLTableHeaderCellElement) => void;
      afterGetRowHeaderRenderers?: (renderers: ((row: number, TH: HTMLTableHeaderCellElement) => void)[]) => void;
      afterHideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
      afterHideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
      afterInit?: () => void;
      afterLanguageChange?: (languageCode: string) => void;
      afterListen?: () => void;
      afterLoadData?: (initialLoad: boolean) => void;
      afterMergeCells?: (cellRange: wot.CellRange, mergeParent: mergeCells.Settings, auto: boolean) => void;
      afterModifyTransformEnd?: (coords: wot.CellCoords, rowTransformDir: -1 | 0, colTransformDir: -1 | 0) => void;
      afterModifyTransformStart?: (coords: wot.CellCoords, rowTransformDir: -1 | 0, colTransformDir: -1 | 0) => void;
      afterMomentumScroll?: () => void;
      afterOnCellContextMenu?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement) => void;
      afterOnCellCornerDblClick?: (event: MouseEvent) => void;
      afterOnCellCornerMouseDown?: (event: MouseEvent) => void;
      afterOnCellMouseDown?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement) => void;
      afterOnCellMouseOver?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement) => void;
      afterOnCellMouseOut?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement) => void;
      afterOnCellMouseUp?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement) => void;
      afterPaste?: (data: CellValue[][], coords: plugins.RangeType[]) => void;
      afterPluginsInitialized?: () => void;
      afterRedo?: (action: plugins.UndoRedoAction) => void;
      afterRefreshDimensions?: (previousDimensions: object, currentDimensions: object, stateChanged: boolean) => void;
      afterRemoveCellMeta?: (row: number, column: number, key: string, value: any) => void;
      afterRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
      afterRemoveRow?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
      afterRender?: (isForced: boolean) => void;
      afterRenderer?: (TD: HTMLTableCellElement, row: number, col: number, prop: string | number, value: string, cellProperties: CellProperties) => void;
      afterRowMove?: (startRow: number, endRow: number) => void;
      afterRowResize?: (currentRow: number, newSize: number, isDoubleClick: boolean) => void;
      afterScrollHorizontally?: () => void;
      afterScrollVertically?: () => void;
      afterSelection?: (row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
      afterSelectionByProp?: (row: number, prop: string, row2: number, prop2: string, preventScrolling: { value: boolean }, selectionLayerLevel: number) => void;
      afterSelectionEnd?: (row: number, column: number, row2: number, column2: number, selectionLayerLevel: number) => void;
      afterSelectionEndByProp?: (row: number, prop: string, row2: number, prop2: string, selectionLayerLevel: number) => void;
      afterSetCellMeta?: (row: number, col: number, key: string, value: any) => void;
      afterSetDataAtCell?: (changes: CellChange[], source?: ChangeSource) => void;
      afterSetDataAtRowProp?: (changes: CellChange[], source?: ChangeSource) => void;
      afterTrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
      afterUndo?: (action: plugins.UndoRedoAction) => void;
      afterUnlisten?: () => void;
      afterUnhideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
      afterUnhideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
      afterUnmergeCells?: (cellRange: wot.CellRange, auto: boolean) => void;
      afterUntrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean, stateChanged: boolean) => void;
      afterUpdateSettings?: (newSettings: GridSettings) => void;
      afterValidate?: (isValid: boolean, value: CellValue, row: number, prop: string | number, source: ChangeSource) => void | boolean;
      afterViewportColumnCalculatorOverride?: (calc: ViewportColumnsCalculator) => void;
      afterViewportRowCalculatorOverride?: (calc: ViewportColumnsCalculator) => void;
      beforeAddChild?: (parent: RowObject, element: RowObject | void, index: number | void) => void;
      beforeAutofill?: (start: wot.CellCoords, end: wot.CellCoords, data: CellValue[][]) => void;
      beforeAutofillInsidePopulate?: (index: wot.CellCoords, direction: 'up' | 'down' | 'left' | 'right', input: CellValue[][], deltas: any[]) => void;
      beforeCellAlignment?: (stateBefore: { [row: number]: string[] }, range: wot.CellRange[], type: 'horizontal' | 'vertical', alignmentClass: 'htLeft' | 'htCenter' | 'htRight' | 'htJustify' | 'htTop' | 'htMiddle' | 'htBottom') => void;
      beforeChange?: (changes: CellChange[], source: ChangeSource) => void | boolean;
      beforeChangeRender?: (changes: CellChange[], source: ChangeSource) => void;
      beforeColumnMove?: (columns: number[], target: number) => void | boolean;
      beforeColumnResize?: (currentColumn: number, newSize: number, isDoubleClick: boolean) => void | number;
      beforeColumnSort?: (currentSortConfig: columnSorting.Config[], destinationSortConfigs: columnSorting.Config[]) => void | boolean;
      beforeContextMenuSetItems?: (menuItems: contextMenu.MenuItemConfig[]) => void;
      beforeContextMenuShow?: (context: plugins.ContextMenu) => void;
      beforeCopy?: (data: CellValue[][], coords: plugins.RangeType[]) => void | boolean;
      beforeCreateCol?: (index: number, amount: number, source?: ChangeSource) => void | boolean;
      beforeCreateRow?: (index: number, amount: number, source?: ChangeSource) => void;
      beforeCut?: (data: CellValue[][], coords: plugins.RangeType[]) => void | boolean;
      beforeDetachChild?: (parent: RowObject, element: RowObject) => void;
      beforeDrawBorders?: (corners: number[], borderClassName: 'current' | 'area' | 'highlight' | undefined) => void;
      beforeDropdownMenuSetItems?: (menuItems: contextMenu.MenuItemConfig[]) => void;
      beforeDropdownMenuShow?: (instance: plugins.DropdownMenu) => void;
      beforeFilter?: (conditionsStack: plugins.FiltersPlugin.ColumnConditions[]) => void | boolean;
      beforeGetCellMeta?: (row: number, col: number, cellProperties: CellProperties) => void;
      beforeHideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void;
      beforeHideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void;
      beforeInit?: () => void;
      beforeInitWalkontable?: (walkontableConfig: object) => void;
      beforeKeyDown?: (event: KeyboardEvent) => void;
      beforeLanguageChange?: (languageCode: string) => void;
      beforeMergeCells?: (cellRange: wot.CellRange, auto: boolean) => void;
      beforeOnCellContextMenu?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement) => void;
      beforeOnCellMouseDown?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement, controller: SelectionController) => void;
      beforeOnCellMouseOut?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement) => void;
      beforeOnCellMouseOver?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement, controller: SelectionController) => void;
      beforeOnCellMouseUp?: (event: MouseEvent, coords: wot.CellCoords, TD: HTMLTableCellElement, controller: SelectionController) => void;
      beforePaste?: (data: CellValue[][], coords: plugins.RangeType[]) => void | boolean;
      beforeRemoveCellClassNames?: () => string[] | void;
      beforeRemoveCellMeta?: (row: number, column: number, key: string, value: any) => void;
      beforeRedo?: (action: plugins.UndoRedoAction) => void;
      beforeRefreshDimensions?: (previousDimensions: object, currentDimensions: object, actionPossible: boolean) => boolean | void;
      beforeRemoveCol?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
      beforeRemoveRow?: (index: number, amount: number, physicalColumns: number[], source?: ChangeSource) => void;
      beforeRender?: (isForced: boolean, skipRender: { skipRender?: boolean }) => void;
      beforeRenderer?: (TD: HTMLTableCellElement, row: number, col: number, prop: string | number, value: CellValue, cellProperties: CellProperties) => void;
      beforeRowMove?: (columns: number[], target: number) => void;
      beforeRowResize?: (currentRow: number, newSize: number, isDoubleClick: boolean) => number | void;
      beforeSetRangeEnd?: (coords: wot.CellCoords) => void;
      beforeSetRangeStart?: (coords: wot.CellCoords) => void;
      beforeSetRangeStartOnly?: (coords: wot.CellCoords) => void;
      beforeStretchingColumnWidth?: (stretchedWidth: number, column: number) => void | number;
      beforeTouchScroll?: () => void;
      beforeTrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean) => void;
      beforeUndo?: (action: plugins.UndoRedoAction) => void;
      beforeUnhideColumns?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void;
      beforeUnhideRows?: (currentHideConfig: number[], destinationHideConfig: number[], actionPossible: boolean) => void;
      beforeUnmergeCells?: (cellRange: wot.CellRange, auto: boolean) => void;
      beforeUntrimRow?: (currentTrimConfig: number[], destinationTrimConfig: number[], actionPossible: boolean) => void;
      beforeValidate?: (value: CellValue, row: number, prop: string | number, source?: ChangeSource) => void;
      beforeValueRender?: (value: CellValue, cellProperties: CellProperties) => void;
      construct?: () => void;
      hiddenColumn?: (column: number) => void;
      hiddenRow?: (row: number) => void;
      init?: () => void;
      modifyAutofillRange?: (startArea: [number, number, number, number][], entireArea: [number, number, number, number][]) => void;
      modifyCol?: (col: number) => void;
      modifyColHeader?: (column: number) => void;
      modifyColumnHeaderHeight?: () => void;
      modifyColWidth?: (width: number, col: number) => void;
      modifyCopyableRange?: (copyableRanges: plugins.RangeType[]) => void;
      modifyData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
      modifyGetCellCoords?: (row: number, column: number, topmost: boolean) => void | [number, number] | [number, number, number, number];
      modifyRow?: (row: number) => void;
      modifyRowData?: (row: number) => void;
      modifyRowHeader?: (row: number) => void;
      modifyRowHeaderWidth?: (rowHeaderWidth: number) => void;
      modifyRowHeight?: (height: number, row: number) => void;
      modifyRowSourceData?: (row: number) => void;
      modifyTransformEnd?: (delta: wot.CellCoords) => void;
      modifyTransformStart?: (delta: wot.CellCoords) => void;
      persistentStateLoad?: (key: string, valuePlaceholder: { value: any }) => void;
      persistentStateReset?: (key: string) => void;
      persistentStateSave?: (key: string, value: any) => void;
      skipLengthCache?: (delay: number) => void;
      unmodifyCol?: (col: number) => void;
      unmodifyRow?: (row: number) => void;
    }
    interface Methods {
      add<K extends keyof Hooks.Events>(key: K, callback: Hooks.Events[K] | Hooks.Events[K][], context?: Handsontable): Hooks.Methods;
      createEmptyBucket(): Bucket;
      deregister(key: string): void;
      destroy(context?: Handsontable): void;
      getBucket(context?: Handsontable): Bucket;
      getRegistered(): (keyof Hooks.Events)[];
      has(key: keyof Hooks.Events, context?: Handsontable): boolean;
      isRegistered(key: keyof Hooks.Events): boolean;
      once<K extends keyof Hooks.Events>(key: K, callback: Hooks.Events[K] | Hooks.Events[K][], context?: Handsontable): void;
      register(key: string): void;
      remove(key: keyof Hooks.Events, callback: Function, context?: Handsontable): boolean;
      run(context: Handsontable, key: keyof Hooks.Events, p1?: any, p2?: any, p3?: any, p4?: any, p5?: any, p6?: any): any;
      // Requires TS 3.0:
      // run<K extends keyof Events>(context: Handsontable, key: K, ...params: Parameters<Events[K]>): ReturnType<Events[K]>;
    }
  }

  type Bucket = {
    [P in keyof Hooks.Events]: Hooks.Events[P][];
  };

  interface NumericFormatOptions {
    pattern: string;
    culture?: string;
  }

  interface CellSettings extends CellMeta {
    row: number;
    col: number;
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
    startPosition: number | number;
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
    cells: boolean;
  }

  namespace I18n {
    type LanguageDictionary = {
      [phraseKey: string]: string | string[];
      languageCode: string;
    };
    interface Internationalization {
      dictionaryKeys: I18n.LanguageDictionary;
      registerLanguageDictionary: (languageCodeOrDictionary: LanguageDictionary | string, dictionary?: LanguageDictionary) => LanguageDictionary;
      getTranslatedPhrase: (dictionaryKey: string, extraArguments?: any) => string | null;
      getLanguagesDictionaries: () => LanguageDictionary[];
      getLanguageDictionary: (languageCode: string) => LanguageDictionary;
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
    createEmptySpreadsheetData(rows: number, columns: number): any[],
    createObjectPropListener(defaultValue?: any, propertyToListen?: string): object,
    createSpreadsheetData(rows?: number, columns?: number): any[],
    createSpreadsheetObjectData(rows?: number, colCount?: number): any[],
    curry(func: () => void): () => void,
    curryRight(func: () => void): () => void,
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
    getNormalizedDate(dateString: string): Date,
    getProperty(object: object, name: string): any | void,
    getPrototypeOf(obj: object): any | void,
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
    isIE8(): boolean,
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
    isWebComponentSupportedNatively(): boolean,
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
    isChildOfWebComponentTable: (element: Element) => boolean;
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
    pageX: (event: Event) => number;
    pageY: (event: Event) => number;
    polymerUnwrap: (element: HTMLElement) => any | void;
    polymerWrap: (element: HTMLElement) => any | void;
    removeClass: (element: HTMLElement, className: string | any[]) => void;
    removeEvent: (element: HTMLElement, event: string, callback: () => void) => void;
    removeTextNodes: (element: HTMLElement, parent: HTMLElement) => void;
    resetCssTransform: (element: HTMLElement) => void;
    setCaretPosition: (element: HTMLElement, pos: number, endPos: number) => void;
    setOverlayPosition: (overlayElem: HTMLElement, left: number, top: number) => void;
    stopImmediatePropagation: (event: Event) => void;
    stopPropagation: (event: Event) => void;
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
    DragToScroll: plugins.DragToScroll;
    DropdownMenu: plugins.DropdownMenu;
    ExportFile: plugins.ExportFile;
    Filters: plugins.Filters;
    Formulas: plugins.Formulas;
    GanttChart: plugins.GanttChart;
    HeaderTooltips: plugins.HeaderTooltips;
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
    ObserveChanges: plugins.ObserveChanges;
    Search: plugins.Search;
    TouchScroll: plugins.TouchScroll;
    TrimRows: plugins.TrimRows;
    registerPlugin(pluginName: string, pluginClass: { new(hotInstance?: _Handsontable.Core): plugins.Base }): void;
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
    dragToScroll: plugins.DragToScroll;
    dropdownMenu: plugins.DropdownMenu;
    exportFile: plugins.ExportFile;
    filters: plugins.Filters;
    formulas: plugins.Formulas;
    ganttChart: plugins.GanttChart;
    headerTooltips: plugins.HeaderTooltips;
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
    observeChanges: plugins.ObserveChanges;
    persistentState: plugins.PersistenState;
    search: plugins.Search;
    touchScroll: plugins.TouchScroll;
    trimRows: plugins.TrimRows;
  }

  // Plugin options
  namespace comments {
    interface CommentObject {
      value?: string;
      readOnly?: boolean;
      style?: {
        height?: number;
        width?: number;
      }
    }
    interface Settings {
      displayDelay?: number;
    }
    interface CommentConfig {
      row: number,
      col: number,
      comment: CommentObject
    }
  }

  namespace contextMenu {
    interface Selection {
      start: wot.CellCoords;
      end: wot.CellCoords;
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
      style?: string;
    }
    type BorderRange = {
      range: {
        from: wot.CellCoords;
        to: wot.CellCoords;
      }
    }
    type Settings = (wot.CellCoords | BorderRange) & {
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
    interface Settings {
      variables?: {
        [key: string]: any;
      }
    }
  }

  namespace ganttChart {
    interface Settings {
      dataSource: HandsontableBindingInformation | DataObject[];
      firstWeekDay: 'monday' | 'sunday';
      startYear: number;
      weekHeaderGenerator?: (start: number, end: number) => string;
      allowSplitWeeks?: boolean;
      hideDaysBeforeFullWeeks?: boolean;
      hideDaysAfterFullWeeks?: boolean;
    }

    interface HandsontableBindingInformation {
      instance: Handsontable;
      startDateColumn: number;
      endDateColumn: number;
      additionalData: {
        label: number;
        quantity: number;
      }
      asyncUpdates?: boolean;
    }

    interface DataObject {
      additionalData: {
        label: string;
        quantity: string;
      }
      startDate: string | number | Date;
      endDate: string | number | Date;
    }
  }

  namespace headerTooltips {
    interface Settings {
      rows?: boolean;
      columns?: boolean;
      onlyTrimmed?: boolean;
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
  static DefaultSettings: Handsontable.DefaultSettings;
}

export default Handsontable;
