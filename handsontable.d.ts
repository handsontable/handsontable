
declare namespace _Handsontable {
  namespace wot {
    interface CellCoords {
      col: number,
      row: number
    }
    interface CellRange {
      highlight: CellCoords;
      from: CellCoords;
      to: CellCoords;
    }
  }

  namespace cellTypes {
    interface Autocomplete {
      editor: editors.Autocomplete;
      renderer: renderers.Autocomplete;
      validator: (value: any, callback: () => void) => boolean;
    }

    interface Checkbox {
      editor: editors.Checkbox;
      renderer: renderers.Checkbox;
    }

    interface Date {
      editor: editors.Date;
      renderer: renderers.Autocomplete;
      validator: (value: any, callback: () => void) => boolean;
    }

    interface Dropdown {
      editor: editors.Dropdown;
      renderer: renderers.Autocomplete;
      validator: (value: any, callback: () => void) => boolean;
    }

    interface Handsontable {
      editor: editors.Handsontable;
      renderer: renderers.Autocomplete;
    }

    interface Numeric {
      dataType: string;
      editor: editors.Numeric;
      renderer: renderers.Numeric;
      validator: (value: any, callback: () => void) => boolean;
    }

    interface Password {
      copyable: boolean;
      editor: editors.Password;
      renderer: renderers.Password;
    }

    interface Text {
      editor: editors.Text;
      renderer: renderers.Text;
    }

    interface Time {
      editor: editors.Text;
      renderer: renderers.Text;
      validator: (value: any, callback: () => void) => boolean;
    }
  }

  namespace editors {
    class Base {
      instance: Core;
      row: number;
      col: number;
      prop: string | number;
      TD: HTMLElement;
      cellProperties: object;

      constructor (hotInstance: Core, row: number, col: number, prop: string | number, TD: HTMLElement, cellProperties: object)

      beginEditing(initialValue?: string): void;
      cancelChanges(): void;
      checkEditorSection(): void;
      close(): void;
      discardEditor(validationResult?: boolean): void;
      enableFullEditMode(): void;
      extend(): void;
      finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: () => void): void;
      getValue(): void;
      init(): void;
      isInFullEditMode(): void;
      isOpened(): boolean;
      isWaiting(): boolean;
      open(): void;
      prepare(row: number, col: number, prop: string | number, TD: HTMLElement, originalValue: any, cellProperties: object): void;
      saveValue(val?: any, ctrlDown?: boolean): void;
      setValue(newValue?: any): void;
    }

    class Checkbox extends Base { }

    class Mobile extends Base {
      hideCellPointer(): void;
      onBeforeKeyDown(event?: Event): void;
      prepareAndSave(): void;
      scrollToView(): void;
      updateEditorData(): void;
      updateEditorPosition(x?: number, y?: number): void;
      valueChanged(): void;
    }

    class Select extends Base {
      focus(): void;
      getEditedCell(): void;
      prepareOptions(optionsToPrepare?: object | any[]): void;
      refreshDimensions(): void;
      refreshValue(): void;
      registerHooks(): void;
    }

    class Text extends Base {
      bindEvents(): void;
      close(tdOutside?: HTMLElement): void;
      createElements(): void;
      destroy(): void;
      focus(): void;
      getEditedCell(): void;
      refreshDimensions(): void;
      refreshValue():void;
    }

    class Date extends Text {
      close(): void;
      destroyElements(): void;
      finishEditing(isCancelled?: boolean, ctrlDown?: boolean): void;
      getDatePickerConfig(): object;
      hideDatepicker(): void;
      open(event?: Event): void;
      showDatepicker(event?: Event): void;
    }

    class Handsontable extends Text {
      assignHooks(): void;
      beginEditing(initialValue?: any): void;
      close(): void;
      finishEditing(isCancelled?: boolean, ctrlDown?: boolean): void;
      focus(): void;
      open(): void;
    }

    class Numeric extends Text { }

    class Password extends Text { }

    class Autocomplete extends Handsontable {
      allowKeyEventPropagation(keyCode?: number): void;
      finishEditing(restoreOriginalValue?: boolean): void;
      flipDropdown(dropdownHeight?: number): void;
      flipDropdownIfNeeded(): void;
      getDropdownHeight(): void;
      highlightBestMatchingChoice(index?: number): void;
      limitDropdownIfNeeded(spaceAvailable?: number, dropdownHeight?: number): void;
      queryChoices(query?: any): void;
      sortByRelevance(value?: any, choices?: any[], caseSensitive?: boolean): any[];
      setDropdownHeight(height?: number): void;
      updateChoicesList(choices?: any[]): void;
      unflipDropdown(): void;
      updateDropdownHeight(): void;
    }

    class Dropdown extends Autocomplete { }

    class CommentEditor {
      editor: HTMLElement;
      editorStyle: CSSStyleDeclaration;
      hidden: boolean;

      setPosition(x: number, y: number): void;
      setSize(width: number, height: number): void;
      resetSize(): void;
      setReadOnlyState(state: boolean): void;
      show(): void;
      hide(): void;
      isVisible(): void;
      setValue(value?: string): void;
      getValue(): string;
      isFocused(): boolean;
      focus(): void;
      createEditor(): HTMLElement;
      getInputElement(): HTMLElement;
      destroy(): void;
    }
  }

  namespace plugins {
    // utils for Filters
    namespace FiltersPlugin {
      type OperationType = 'conjunction' | 'disjunction';
      type ConditionName = 'begins_with' | 'between' | 'by_value' | 'contains' | 'empty' | 'ends_with' | 'eq' | 'gt' |
        'gte' | 'lt' | 'lte' | 'not_between' | 'not_contains' | 'not_empty' | 'neq';

      interface ConditionId {
        args: any[];
        name?: ConditionName
        command?: {
          key: ConditionName
        }
      }

      interface Condition {
        name: ConditionName,
        args: any[];
        func: (dataRow: CellValue, values: any[]) => boolean
      }

      interface CellLikeData {
        meta: {
          row: number,
          col: number,
          visualCol: number,
          visualRow: number,
          type: string,
          instance: Core,
          dateFormat?: string
        },
        value: string
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
        getInputElements(): any[];
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
        hot: Core;
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
        itemsBox: Core;
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
      hot: Core;
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
      hot: Core;
      endpoints: any[];
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

    interface EventManager {
      context?: object;

      addEventListener(element: Element, eventName: string, callback: () => void): () => void;
      removeEventListener(element: Element, eventName: string, callback: () => void): void;
      clearEvents(): void;
      clear(): void;
      destroy(): void;
      fireEvent(element: Element, eventName: string): void;
      extendEvent(context: object, event: Event): any;
    }

    interface GhostTable {
      columns: number[];
      container: HTMLElement | null;
      hot: Core;
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
      setSettings(settings: object): void;
      setSetting(name: string, value: any): void;
    }

    interface ItemsFactory {
      defaultOrderPattern: any[] | void;
      hot: Core;
      predefinedItems: object;

      getItems(pattern?: any[] | object | boolean): any[];
      setPredefinedItems(predefinedItems: any[]): void;
    }

    interface Menu {
      container: HTMLElement;
      eventManager: EventManager;
      hot: Core;
      hotMenu: Core;
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

      constructor(hotInstance?: Core);

      addHook(name: string, callback: () => void): void;
      callOnPluginsReady(callback: () => void): void;
      clearHooks(): void;
      destroy(): void;
      disablePlugin(): void;
      enablePlugin(): void;
      init(): void;
      removeHook(name: string): void;
    }

    interface AutoColumnSize extends Base {
      firstCalculation: boolean;
      ghostTable: GhostTable;
      inProgress: boolean;
      sampleGenerator: SamplesGenerator;
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
      handleDraggedCells: boolean;
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
      lastSortedColumn: number;
      sortEmptyCells: boolean;
      sortIndicators: any[];

      dateSort(sortOrder: boolean, columnMeta: object): (a: any, b: any) => boolean;
      defaultSort(sortOrder: boolean, columnMeta: object): (a: any, b: any) => boolean;
      enableObserveChangesPlugin(): void;
      getColHeader(col: number, TH: HTMLElement): void;
      isSorted(): boolean;
      loadSortingState(): any;
      numericSort(sortOrder: boolean, columnMeta: object): (a: any, b: any) => boolean;
      saveSortingState(): void;
      setSortingColumn(col: number, order: boolean | void): void;
      sort(): void;
      sortBySettings(): void;
      sortByColumn(col: number, order: boolean | void): void;
      translateRow(row: number): number;
      untranslateRow(row: number): number;
      updateOrderClass(): void;
      updateSortIndicator(): void;
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
      from: wot.CellCoords,
      to?: wot.CellCoords
    }
    interface Comments extends Base {
      contextMenuEvent: boolean;
      displayDelay: number;
      editor: editors.CommentEditor;
      eventManager: EventManager;
      mouseDown: boolean;
      range: CommentsRangeObject;
      timer: any;

      clearRange(): void;
      getComment(): object;
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

    interface ContextMenu extends Base {
      eventManager: EventManager;
      commandExecutor: CommandExecutor;
      itemsFactory: ItemsFactory | void;
      menu: Menu | void;

      close(): void;
      executeCommand(commandName: string, ...params: any[]): void;
      open(event: Event): void;
    }

    interface Textarea {
      element: HTMLElement;
      isAppended: boolean;
      refCounter: number;

      append(): void;
      create(): void;
      deselect(): void;
      destroy(): void;
      getValue(): string;
      hasBeenDestroyed(): boolean;
      isActive(): boolean;
      select(): void;
      setValue(data: string): void;
    }

    type PasteModeType = 'overwrite' | 'shift_down' | 'shift_right';
    type RangeType = {startRow: number, startCol: number, endRow: number, endCol: number};
    interface CopyPaste extends Base {
      eventManager: EventManager;
      columnsLimit: number;
      copyableRanges: any[];
      pasteMode: PasteModeType;
      rowsLimit: number;
      textarea: Textarea;

      setCopyableText(): void;
      getRangedCopyableData(ranges: RangeType[]): string;
      getRangedData(ranges: RangeType[]): any[];
      copy(triggeredByClick?: boolean): void;
      cut(triggeredByClick?: boolean): void;
      paste(triggeredByClick?: boolean): void;
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
      hot: Core;

      toPhysical(row: number | object, column?: number): object | any[];
      toPhysicalColumn(column: number): number;
      toPhysicalRow(row: number): number;
      toVisual(row: number | object, column?: number): object | any[];
      toVisualColumn(column: number): number;
      toVisualRow(row: number): number;
    }

    interface DataProvider {
      changes: object;
      hot: Core;
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
      hot: Core;
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
      remove(cellValue: CellValue | object| any[]): void;
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
      hot: Core;
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
      hotSource: Core | void;
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
      uniformBackgroundRenderer(instance: Core, TD: HTMLElement, row: number, col: number, prop: string | number, value: string | number, cellProperties: object): void;
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

    interface TrimRowsMapper extends arrayMapper {
      trimRows: TrimRows;

      createMap(length?: number): void;
      destroy(): void;
    }

    namespace moveUI {
      interface BaseUI {
        hot: Core;
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

    interface ManualColumnMove extends Base {
      backlight: moveUI.BacklightUI;
      columnsMapper: MoveColumnsMapper;
      eventManager: EventManager;
      guideline: moveUI.GuidelineUI;
      removedColumns: any[];

      moveColumn(column: number, target: number): void;
      moveColumns(columns: number[], target: number): void;
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
      pressed: Core | void;
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
      pressed: Core | void;
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
      hot: Core;
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
  }

  namespace renderers {
    interface Base {
      (instance: Core, TD: HTMLElement, row: number, col: number, prop: string | number, value: any, cellProperties: GridSettings): HTMLElement;
    }

    interface Autocomplete extends Base { }

    interface Checkbox extends Base { }

    interface Html extends Base { }

    interface Numeric extends Base { }

    interface Password extends Base { }

    interface Text extends Base { }
  }

  interface DefaultSettings extends GridSettings { }
  interface DefaultSettings extends Hooks { }

  interface GridSettings {
    allowEmpty?: boolean;
    allowHtml?: boolean;
    allowInsertColumn?: boolean;
    allowInsertRow?: boolean;
    allowInvalid?: boolean;
    allowRemoveColumn?: boolean;
    allowRemoveRow?: boolean;
    autoColumnSize?: object | boolean;
    autoComplete?: any[];
    autoRowSize?: object | boolean;
    autoWrapCol?: boolean;
    autoWrapRow?: boolean;
    bindRowsWithHeaders?: boolean | string; // pro
    cell?: any[];
    cells?: (row?: number, col?: number, prop?: object) => GridSettings;
    checkedTemplate?: boolean | string;
    className?: string | any[];
    colHeaders?: ((index?: number) => void) | boolean | any[];
    collapsibleColumns?: boolean | any[]; // pro
    columnHeaderHeight?: number | any[];
    columns?: ((index?: number) => void) | any[];
    columnSorting?: boolean | object;
    columnSummary?: object; // pro
    colWidths?: ((index?: number) => void) | number | string | any[];
    commentedCellClassName?: string;
    comments?: boolean | CommentObject[];
    contextMenu?: boolean | any[] | contextMenu.Settings;
    contextMenuCopyPaste?: object;
    copyable?: boolean;
    copyColsLimit?: number;
    copyPaste?: boolean;
    copyRowsLimit?: number;
    correctFormat?: boolean;
    currentColClassName?: string;
    currentHeaderClassName?: string;
    currentRowClassName?: string;
    customBorders?: boolean | any[];
    data?: any | any[];
    dataSchema?: object;
    dateFormat?: string;
    debug?: boolean;
    defaultDate?: string;
    disableVisualSelection?: boolean | string | any[];
    dropdownMenu?: boolean | object | any[]; // pro
    editor?: string | (() => void) | boolean;
    enterBeginsEditing?: boolean;
    enterMoves?: object | (() => void);
    fillHandle?: boolean | string | object;
    filter?: boolean;
    filteringCaseSensitive?: boolean;
    filters?: boolean; // pro
    fixedColumnsLeft?: number;
    fixedRowsBottom?: number; // pro
    fixedRowsTop?: number;
    format?: string;
    fragmentSelection?: boolean | string;
    ganttChart?: object; // pro
    headerTooltips?: boolean | object; // pro
    height?: number | (() => void);
    hiddenColumns?: boolean | object; // pro
    hiddenRows?: boolean | object; // pro
    invalidCellClassName?: string;
    isEmptyCol?: (col: number) => boolean;
    isEmptyRow?: (row: number) => boolean;
    label?: object;
    language?: string;
    manualColumnFreeze?: boolean;
    manualColumnMove?: boolean | any[];
    manualColumnResize?: boolean | any[];
    manualRowMove?: boolean | any[ ];
    manualRowResize?: boolean | any[];
    maxCols?: number;
    maxRows?: number;
    mergeCells?: boolean | any[];
    minCols?: number;
    minRows?: number;
    minSpareCols?: number;
    minSpareRows?: number;
    multiSelect?: boolean;
    nestedHeaders?: any[]; // pro
    noWordWrapClassName?: string;
    observeChanges?: boolean;
    observeDOMVisibility?: boolean;
    outsideClickDeselects?: boolean;
    pasteMode?: string;
    persistentState?: boolean;
    placeholder?: any;
    placeholderCellClassName?: string;
    preventOverflow?: string | boolean;
    readOnly?: boolean;
    readOnlyCellClassName?: string;
    renderAllRows?: boolean;
    renderer?: string | (() => void);
    rowHeaders?: boolean | any[] | (() => void);
    rowHeaderWidth?: number | any[];
    rowHeights?: any[] | (() => void) | number | string;
    search?: boolean;
    selectOptions?: any[];
    skipColumnOnPaste?: boolean;
    sortByRelevance?: boolean;
    sortFunction?: () => void;
    sortIndicator?: boolean;
    source?: any[] | (() => void);
    startCols?: number;
    startRows?: number;
    stretchH?: string;
    strict?: boolean;
    tableClassName?: string | any[];
    tabMoves?: object;
    title?: string;
    trimDropdown?: boolean;
    trimRows?: boolean; // pro
    trimWhitespace?: boolean;
    type?: string;
    uncheckedTemplate?: boolean | string;
    undo?: boolean;
    validator?: (() => void) | RegExp;
    viewportColumnRenderingOffset?: number | string;
    viewportRowRenderingOffset?: number | string;
    visibleRows?: number;
    width?: number | (() => void);
    wordWrap?: boolean;
  }

  interface Hooks {
    afterAddChild?: (parent: object, element: object | void, index: number | void) => void;
    afterBeginEdting?: (row: number, column: number) => void;
    afterCellMetaReset?: () => void;
    afterChange?: (changes: any[], source: string) => void;
    afterChangesObserved?: () => void;
    afterColumnMove?: (startColumn: number, endColumn: number) => void;
    afterColumnResize?: (currentColumn: number, newSize: number, isDoubleClick: boolean) => void;
    afterColumnSort?: (column: number, order: boolean) => void;
    afterContextMenuDefaultOptions?: (predefinedItems: any[]) => void;
    afterContextMenuHide?: (context: object) => void;
    afterContextMenuShow?: (context: object) => void;
    afterCopy?: (data: any[], coords: any[]) => void;
    afterCopyLimit?: (selectedRows: number, selectedColumnds: number, copyRowsLimit: number, copyColumnsLimit: number) => void;
    afterCreateCol?: (index: number, amount: number) => void;
    afterCreateRow?: (index: number, amount: number) => void;
    afterCut?: (data: any[], coords: any[]) => void;
    afterDeselect?: () => void;
    afterDestroy?: () => void;
    afterDetachChild?: (parent: object, element: object) => void;
    afterDocumentKeyDown?: (event: Event) => void;
    afterDropdownMenuDefaultOptions?: (predefinedItems: any[]) => void;
    afterDropdownMenuHide?: (instance: any) => void;
    afterDropdownMenuShow?: (instance: any) => void;
    afterFilter?: (formulasStack: any[]) => void;
    afterGetCellMeta?: (row: number, col: number, cellProperties: object) => void;
    afterGetColHeader?: (col: number, TH: Element) => void;
    afterGetColumnHeaderRenderers?: (array: any[]) => void;
    afterGetRowHeader?: (row: number, TH: Element) => void;
    afterGetRowHeaderRenderers?: (array: any[]) => void;
    afterInit?: () => void;
    afterLoadData?: (firstTime: boolean) => void;
    afterModifyTransformEnd?: (coords: wot.CellCoords, rowTransformDir: number, colTransformDir: number) => void;
    afterModifyTransformStart?: (coords: wot.CellCoords, rowTransformDir: number, colTransformDir: number) => void;
    afterMomentumScroll?: () => void;
    afterOnCellCornerDblClick?: (event: object) => void;
    afterOnCellCornerMouseDown?: (event: object) => void;
    afterOnCellMouseDown?: (event: object, coords: object, TD: Element) => void;
    afterOnCellMouseOver?: (event: object, coords: object, TD: Element) => void;
    afterOnCellMouseOut?: (event: object, coords: object, TD: Element) => void;
    afterPaste?: (data: any[], coords: any[]) => void;
    afterPluginsInitialized?: () => void;
    afterRedo?: (action: object) => void;
    afterRemoveCol?: (index: number, amount: number) => void;
    afterRemoveRow?: (index: number, amount: number) => void;
    afterRender?: (isForced: boolean) => void;
    afterRenderer?: (TD: Element, row: number, col: number, prop: string|number, value: string, cellProperties: object) => void;
    afterRowMove?: (startRow: number, endRow: number) => void;
    afterRowResize?: (currentRow: number, newSize: number, isDoubleClick: boolean) => void;
    afterScrollHorizontally?: () => void;
    afterScrollVertically?: () => void;
    afterSelection?: (r: number, c: number, r2: number, c2: number) => void;
    afterSelectionByProp?: (r: number, p: string, r2: number, p2: string) => void;
    afterSelectionEnd?: (r: number, c: number, r2: number, c2: number) => void;
    afterSelectionEndByProp?: (r: number, p: string, r2: number, p2: string) => void;
    afterSetCellMeta?: (row: number, col: number, key: string, value: any) => void;
    afterSetDataAtCell?: (changes: any[], source?: string) => void;
    afterSetDataAtRowProp?: (changes: any[], source?: string) => void;
    afterTrimRow?: (rows: any[]) => void;
    afterUndo?: (action: object) => void;
    afterUntrimRow?: (rows: any[]) => void;
    afterUpdateSettings?: () => void;
    afterValidate?: (isValid: boolean, value: any, row: number, prop: string|number, source: string) => void|boolean;
    afterViewportColumnCalculatorOverride?: (calc: object) => void;
    afterViewportRowCalculatorOverride?: (calc: object) => void;
    beforeAddChild?: (parent: object, element: object | void, index: number | void) => void;
    beforeAutofill?: (start: object, end: object, data: any[]) => void;
    beforeAutofillInsidePopulate?: (index: object, direction: string, input: any[], deltas: any[]) => void;
    beforeCellAlignment?: (stateBefore: any, range: any, type: string, alignmentClass: string) => void;
    beforeChange?: (changes: any[], source: string) => void;
    beforeChangeRender?: (changes: any[], source: string) => void;
    beforeColumnMove?: (startColumn: number, endColumn: number) => void;
    beforeColumnResize?: (currentColumn: number, newSize: number, isDoubleClick: boolean) => void;
    beforeColumnSort?: (column: number, order: boolean) => void;
    beforeContextMenuSetItems?: (menuItems: any[]) => void;
    beforeCopy?: (data: any[], coords: any[]) => any;
    beforeCreateCol?: (index: number, amount: number, source?: string) => void;
    beforeCreateRow?: (index: number, amount: number, source?: string) => void;
    beforeCut?: (data: any[], coords: any[]) => any;
    beforeDetachChild?: (parent: object, element: object) => void;
    beforeDrawBorders?: (corners: any[], borderClassName: string) => void;
    beforeDropdownMenuSetItems?: (menuItems: any[]) => void;
    beforeFilter?: (formulasStack: any[]) => void;
    beforeGetCellMeta?: (row: number, col: number, cellProperties: object) => void;
    beforeInit?: () => void;
    beforeInitWalkontable?: (walkontableConfig: object) => void;
    beforeKeyDown?: (event: Event) => void;
    beforeOnCellMouseDown?: (event: Event, coords: object, TD: Element) => void;
    beforeOnCellMouseOut?: (event: Event, coords: wot.CellCoords, TD: Element) => void;
    beforeOnCellMouseOver?: (event: Event, coords: wot.CellCoords, TD: Element, blockCalculations: object) => void;
    beforePaste?: (data: any[], coords: any[]) => any;
    beforeRedo?: (action: object) => void;
    beforeRemoveCol?: (index: number, amount: number, logicalCols?: any[]) => void;
    beforeRemoveRow?: (index: number, amount: number, logicalRows?: any[]) => void;
    beforeRender?: (isForced: boolean, skipRender: object) => void;
    beforeRenderer?: (TD: Element, row: number, col: number, prop: string|number, value: string, cellProperties: object) => void;
    beforeRowMove?: (startRow: number, endRow: number) => void;
    beforeRowResize?: (currentRow: number, newSize: number, isDoubleClick: boolean) => any;
    beforeSetRangeEnd?: (coords: any[]) => void;
    beforeSetRangeStart?: (coords: any[]) => void;
    beforeStretchingColumnWidth?: (stretchedWidth: number, column: number) => void;
    beforeTouchScroll?: () => void;
    beforeUndo?: (action: object) => void;
    beforeValidate?: (value: any, row: number, prop: string | number, source?: string) => void;
    beforeValueRender?: (value: any) => void;
    construct?: () => void;
    hiddenColumn?: (column: number) => void;
    hiddenRow?: (row: number) => void;
    init?: () => void;
    manualRowHeights?: (state: any[]) => void;
    modifyAutofillRange?: (startArea: any[], entireArea: any[]) => void;
    modifyCol?: (col: number) => void;
    modifyColHeader?: (column: number) => void;
    modifyColWidth?: (width: number, col: number) => void;
    modifyCopyableRange?: (copyableRanges: any[]) => void;
    modifyData?: (row: number, column: number, valueHolder: object, ioMode: string) => void;
    modifyRow?: (row: number) => void;
    modifyRowHeader?: (row: number) => void;
    modifyRowHeaderWidth?: (rowHeaderWidth: number) => void;
    modifyRowHeight?: (height: number, row: number) => void;
    modifyRowSourceData?: (row: number) => void;
    modifyTransformEnd?: (delta: wot.CellCoords) => void;
    modifyTransformStart?: (delta: wot.CellCoords) => void;
    persistentStateLoad?: (key: string, valuePlaceholder: object) => void;
    persistentStateReset?: (key: string) => void;
    persistentStateSave?: (key: string, value: any) => void;
    skipLengthCache?: (delay: number) => void;
    unmodifyCol?: (col: number) => void;
    unmodifyRow?: (row: number) => void;
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
  }

  interface Editors {
    AutocompleteEditor: editors.Autocomplete;
    BaseEditor: editors.Base;
    CheckboxEditor: editors.Checkbox;
    DateEditor: editors.Date;
    DropdownEditor: editors.Dropdown;
    HandsontableEditor: editors.Handsontable;
    MobileEditor: editors.Mobile;
    NumericEditor: editors.Numeric;
    PasswordEditor: editors.Password;
    SelectEditor: editors.Select;
    TextEditor: editors.Text | editors.Mobile;
    getEditor: (editorName: string, hotInstance: Core) => any;
    registerEditor: (editorName: string, editorClass: any) => void;
  }

  interface Renderers {
    AutocompleteRenderer: renderers.Autocomplete;
    BaseRenderer: renderers.Base;
    CheckboxRenderer: renderers.Checkbox;
    HtmlRenderer: renderers.Html;
    NumericRenderer: renderers.Numeric;
    PasswordRenderer: renderers.Password;
    TextRenderer: renderers.Text;
  }

  class Core {
    constructor(element: Element, options: DefaultSettings);
    addHook(key: string, callback: (() => void) | any[]): void;
    addHookOnce(key: string, callback: (() => void) | any[]): void;
    alter(action: string, index: number, amount?: number, source?: string, keepEmptyRows?: boolean): void;
    clear(): void;
    colOffset(): number;
    colToProp(col: number): string | number;
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
    destroyEditor(revertOriginal?: boolean): void;
    getActiveEditor(): object;
    getCell(row: number, col: number, topmost?: boolean): Element;
    getCellEditor(row: number, col: number): object;
    getCellMeta(row: number, col: number): object;
    getCellMetaAtRow(row: number): any[];
    getCellRenderer(row: number, col: number): () => void;
    getCellValidator(row: number, col: number): any;
    getColHeader(col?: number): any[] | string;
    getColWidth(col: number): number;
    getCoords(elem: Element): object;
    getCopyableData(row: number, column: number): string;
    getCopyableText(startRow: number, startCol: number, endRow: number, endCol: number): string;
    getData(r?: number, c?: number, r2?: number, c2?: number): any[];
    getDataAtCell(row: number, col: number): any;
    getDataAtCol(col: number): any[];
    getDataAtProp(prop: string | number): any[];
    getDataAtRow(row: number): any[];
    getDataAtRowProp(row: number, prop: string): any;
    getDataType(rowFrom: number, columnFrom: number, rowTo: number, columnTo: number): string;
    getInstance(): any;
    getPlugin(pluginName: string): any;
    getRowHeader(row?: number): any[]|string;
    getRowHeight(row: number): number;
    getSchema(): object;
    getSelected(): any[];
    getSelectedRange(): Range;
    getSettings(): object;
    getSourceData(r?: number, c?: number, r2?: number, c2?: number): any[];
    getSourceDataArray(r?: number, c?: number, r2?: number, c2?: number): any[];
    getSourceDataAtCell(row: number, column: number): any;
    getSourceDataAtCol(column: number): any[];
    getSourceDataAtRow(row: number): any[] | object;
    getValue(): any;
    hasColHeaders(): boolean;
    hasHook(key: string): boolean;
    hasRowHeaders(): boolean;
    isEmptyCol(col: number): boolean;
    isEmptyRow(row: number): boolean;
    isListening(): boolean;
    listen(): void;
    loadData(data: any[]): void;
    populateFromArray(row: number, col: number, input: any[], endRow?: number, endCol?: number, source?: string, method?: string, direction?: string, deltas?: any[]): any;
    propToCol(prop: string | number): number;
    removeCellMeta(row: number, col: number, key: string): void;
    removeHook(key: string, callback: () => void): void;
    render(): void;
    rowOffset(): number;
    runHooks(key: string, p1?: any, p2?: any, p3?: any, p4?: any, p5?: any, p6?: any): any;
    scrollViewportTo(row?: number, column?: number, snapToBottom?: boolean, snapToRight?: boolean): boolean;
    selectCell(row: number, col: number, endRow?: number, endCol?: number, scrollToCell?: boolean, changeListener?: boolean): boolean;
    selectCellByProp(row: number, prop: string, endRow?: number, endProp?: string, scrollToCell?: boolean): boolean;
    setCellMeta(row: number, col: number, key: string, val: string): void;
    setCellMetaObject(row: number, col: number, prop: object): void;
    setDataAtCell(row: number | any[], col: number, value: string, source?: string): void;
    setDataAtRowProp(row: number | any[], prop: string, value: string, source?: string): void;
    spliceCol(col: number, index: number, amount: number, elements?: any): void;
    spliceRow(row: number, index: number, amount: number, elements?: any): void;
    toPhysicalColumn(column: number): number;
    toPhysicalRow(row: number): number;
    toVisualColumn(column: number): number;
    toVisualRow(row: number): number;
    unlisten(): void;
    updateSettings(settings: object, init: boolean): void;
    validateCells(callback: () => void): void;
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
    inherit(Child: object, Parent: object): object,
    isChrome(): boolean,
    isCtrlKey(keyCode: number): boolean,
    isDefined(variable: any): boolean,
    isEmpty(variable: any): boolean,
    isFunction(func: any): boolean,
    isIE8(): boolean,
    isIE9(): boolean,
    isKey(keyCode: number, baseCode: string): boolean
    isMetaKey(keyCode: number): boolean,
    isMobileBrowser(userAgent?: string): boolean,
    isNumeric(n: any): boolean,
    isObject(obj: any): boolean,
    isObjectEquals(object1: object | any[], object2: object | any[]): boolean,
    isPercentValue(value: string): boolean,
    isPrintableChar(keyCode: number): boolean,
    isSafari(): boolean,
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
    HTML_CHARACTERS: RegExp,
    addClass: (element: HTMLElement, className: string | any[]) => void;
    addEvent: (element: HTMLElement, event: string, callback: () => void) => void;
    closest: (element: HTMLElement, nodes: any[], until?: HTMLElement) => HTMLElement | void;
    closestDown: (element: HTMLElement, nodes: any[], until?: HTMLElement) => HTMLElement | void;
    empty: (element: HTMLElement) => void;
    fastInnerHTML: (element: HTMLElement, content: string) => void;
    fastInnerText: (element: HTMLElement, content: string) => void;
    getCaretPosition: (el: HTMLElement) => number;
    getComputedStyle: (element: HTMLElement) => CSSStyleDeclaration | object;
    getCssTransform: (element: HTMLElement) => number | void;
    getParent: (element: HTMLElement, level?: number) => HTMLElement | void;
    getScrollLeft: (element: HTMLElement) => number;
    getScrollTop: (element: HTMLElement) => number;
    getScrollableElement: (element: HTMLElement) => HTMLElement;
    getScrollbarWidth: () => number;
    getSelectionEndPosition: (el: HTMLElement) => number;
    getSelectionText: () => string;
    getStyle: (element: HTMLElement, prop: string) => string;
    getTrimmingContainer: (base: HTMLElement) => HTMLElement;
    getWindowScrollLeft: () => number;
    getWindowScrollTop: () => number;
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
    offset: (elem: HTMLElement) => object;
    outerHeight: (elem: HTMLElement) => number;
    outerWidth: (element: HTMLElement) => number;
    overlayContainsElement: (overlayType: string, element: HTMLElement) => boolean;
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
    AutoColumnSize: plugins.AutoColumnSize,
    AutoRowSize: plugins.AutoRowSize,
    Autofill: plugins.Autofill,
    BasePlugin: plugins.Base,
    BindRowsWithHeaders: plugins.BindRowsWithHeaders,
    CollapsibleColumns: plugins.CollapsibleColumns,
    ColumnSorting: plugins.ColumnSorting,
    ColumnSummary: plugins.ColumnSummary,
    Comments: plugins.Comments,
    ContextMenu: plugins.ContextMenu,
    CopyPaste: plugins.CopyPaste,
    DragToScroll: plugins.DragToScroll,
    DropdownMenu: plugins.DropdownMenu,
    ExportFile: plugins.ExportFile,
    Filters: plugins.Filters,
    Formulas: plugins.Formulas,
    GanttChart: plugins.GanttChart,
    HeaderTooltips: plugins.HeaderTooltips,
    HiddenColumns: plugins.HiddenColumns,
    HiddenRows: plugins.HiddenRows,
    ManualColumnFreeze: plugins.ManualColumnFreeze,
    ManualColumnMove: plugins.ManualColumnMove,
    ManualColumnResize: plugins.ManualColumnResize,
    ManualRowMove: plugins.ManualRowMove,
    ManualRowResize: plugins.ManualRowResize;
    MultipleSelectionHandles: plugins.MultipleSelectionHandles,
    NestedHeaders: plugins.NestedHeaders,
    NestedRows: plugins.NestedRows,
    ObserveChanges: plugins.ObserveChanges,
    TouchScroll: plugins.TouchScroll,
    TrimRows: plugins.TrimRows,
    registerPlugin: () => void
  }

  // plugins
  // Comments
  interface CommentObject {
    row: number,
    col: number,
    comment?: {
      value?: string,
      readOnly?: boolean,
      style?: {
        height?: number,
        width?: number
      }
    }
  }
  // ContextMenu
  namespace contextMenu {
    interface Options {
      start: wot.CellCoords,
      end: wot.CellCoords
    }
    interface Settings {
      callback: (key: string, options: contextMenu.Options) => void;
      items: any;
    }
  }
}


export default class Handsontable extends _Handsontable.Core {
  static baseVersion: string;
  static buildDate: string;
  static cellTypes: _Handsontable.CellTypes;
  static Core: _Handsontable.Core;
  static dom: _Handsontable.Dom;
  static editors: _Handsontable.Editors;
  static helper: _Handsontable.Helper;
  static hooks: _Handsontable.Hooks;
  static plugins: _Handsontable.Plugins;
  static renderers: _Handsontable.Renderers;
  static version: string;
}
