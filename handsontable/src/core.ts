import { addClass, empty, observeVisibilityChangeOnce, removeClass } from './helpers/dom/element';
import { isFunction } from './helpers/function';
import { isDefined, isUndefined, isRegExp, isEmpty } from './helpers/mixed';
import { isMobileBrowser, isIpadOS } from './helpers/browser';
import EditorManager from './editorManager';
import EventManager from './eventManager';
import {
  deepClone,
  duckSchema,
  isObjectEqual,
  isObject,
  deepObjectSize,
  hasOwnProperty,
  createObjectPropListener,
  objectEach
} from './helpers/object';
import { arrayMap, arrayEach, arrayReduce, getDifferenceOfArrays, stringToArray, pivot } from './helpers/array';
import { instanceToHTML } from './utils/parseTable';
import { staticRegister } from './utils/staticRegister';
import { getPlugin, getPluginsNames } from './plugins/registry';
import type { BasePlugin } from './plugins/base/base';
import { getRenderer } from './renderers/registry';
import type { BaseRenderer } from './renderers/baseRenderer';
import { getEditor } from './editors/registry';
import { getValidator } from './validators/registry';
import { randomString, toUpperCaseFirst } from './helpers/string';
import { rangeEach, rangeEachReverse } from './helpers/number';
import TableView from './tableView';
import { spreadsheetColumnLabel, hasChangeForCell } from './helpers/data';
import { IndexMapper } from './translations';
import { registerAsRootInstance, hasValidParameter, isRootInstance } from './utils/rootInstance';
import { DEFAULT_COLUMN_WIDTH } from './3rdparty/walkontable/src';
import { hasLanguageDictionary, getValidLanguageCode, getTranslatedPhrase } from './i18n/registry';
import { warnUserAboutLanguageRegistration, normalizeLanguageCode } from './i18n/utils';
import { Selection } from './selection';
import {
  DataSource,
  MetaManager,
  DynamicCellMetaMod,
  ExtendMetaPropertiesMod,
  replaceData,
  runSourceDataValidator,
  runSourceDataValidators,
} from './dataMap';
import {
  createViewportScroller,
  Hooks,
  CellRangeToRenderableMapper,
} from './core/index';
import type { HookCallback } from './core/hooks/bucket';
import type { GridSettings } from './core/settings';
import {
  FocusGridManager,
  createFocusScopeManager,
  registerAllFocusScopes
} from './focusManager';
import { createUniqueMap } from './utils/dataStructures/uniqueMap';
import { createShortcutManager } from './shortcuts';
import type { ShortcutManager } from './shortcuts';
import { registerAllShortcutContexts } from './shortcuts/contexts';
import { getThemeClassName } from './helpers/themes';
import { StylesHandler } from './utils/stylesHandler';
import { warn } from './helpers/console';
import { throwWithCause } from './helpers/errors';
import {
  install as installAccessibilityAnnouncer,
  uninstall as uninstallAccessibilityAnnouncer,
} from './utils/a11yAnnouncer';
import { initLicenseNotification } from './utils/licenseNotification';
import { getValueSetterValue } from './utils/valueAccessors';
import { createThemeManager } from './themes/engine';
import { LayoutManager, type LayoutConfig } from './core/layout';
import { getTheme, hasTheme, registerTheme, mainTheme } from './themes';
import type { ThemeBuilder } from './themes/engine/builder';
import type { default as CellCoords } from './3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from './3rdparty/walkontable/src/cell/range';
import type { CellChange } from './settings';
import type { GridHelperInstance, HotInstance, ViewportScrollerInstance } from './core/types';
import type { FocusScopeManager } from './focusManager/scopeManager';
import type { SelectionTableProps } from './selection/types';
import type { default as DataMapInstance } from './dataMap/dataMap';
import type { default as DataSourceInstance } from './dataMap/dataSource';
import type { default as EditorManagerInstance } from './editorManager';
import type { BaseEditor } from './editors/baseEditor';
import type { default as MetaManagerInstance } from './dataMap/metaManager';
import DataMap from './dataMap/dataMap';

let activeGuid: string | null = null;

/**
 * Normalizes an array of `[index, amount]` pairs by merging overlapping or adjacent groups
 * into the smallest set of non-overlapping groups, sorted in ascending order.
 *
 * @param {number[][]} indexes Array of `[index, amount]` pairs to normalize.
 * @returns {number[][]} Normalized array of `[index, amount]` pairs.
 */
function normalizeIndexesGroup(indexes: number[][]): number[][] {
  if (indexes.length === 0) {
    return [];
  }

  const sortedIndexes = [...indexes];

  // Sort the indexes in ascending order.
  sortedIndexes.sort(([indexA], [indexB]) => {
    if (indexA === indexB) {
      return 0;
    }

    return indexA > indexB ? 1 : -1;
  });

  // Normalize the {index, amount} groups into bigger groups.
  const normalizedIndexes = arrayReduce(sortedIndexes, (acc: number[][], [groupIndex, groupAmount]: number[]) => {
    const previousItem = acc[acc.length - 1];
    const [prevIndex, prevAmount] = previousItem;
    const prevLastIndex = prevIndex + prevAmount;

    if (groupIndex <= prevLastIndex) {
      const amountToAdd = Math.max(groupAmount - (prevLastIndex - groupIndex), 0);

      previousItem[1] += amountToAdd;
    } else {
      acc.push([groupIndex, groupAmount]);
    }

    return acc;
  }, [sortedIndexes[0]]);

  return normalizedIndexes;
}

/**
 * Keeps the collection of the all Handsontable instances created on the same page. The
 * list is then used to trigger the "afterUnlisten" hook when the "listen()" method was
 * called on another instance.
 *
 * @type {Map<string, Core>}
 */
const foreignHotInstances = new Map();

/**
 * A set of deprecated feature names.
 *
 * @type {Set<string>}
 */

const deprecationWarns = new Set();

/**
 * Internal Core properties not exposed in HotInstance but accessed by constructor-assigned
 * function expressions. These are implementation details of the Core constructor that
 * cannot be part of the public HotInstance interface.
 *
 * @private
 */
interface CoreInternals {
  renderSuspendedCounter: number;
  executionSuspendedCounter: number;
  isExecutionSuspended(): boolean;
  timeouts: ReturnType<typeof setTimeout>[];
  microtasks: Array<{ cancelled: boolean }>;
  _validateCells(callback?: (valid: boolean) => void, rows?: number[], columns?: number[]): void;
  selectAll(includeRowHeaders?: boolean, includeColumnHeaders?: boolean, options?: Record<string, unknown>): void;
}

/**
 * Handsontable constructor.
 *
 * @core
 * @class Core
 * @description
 *
 * The `Handsontable` class (known as the `Core`) lets you modify the grid's behavior by using Handsontable's public API methods.
 *
 * ::: only-for react
 * To use these methods, associate a Handsontable instance with your instance
 * of the [`HotTable` component](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component),
 * by using React's `ref` feature (read more on the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page).
 * :::
 *
 * ::: only-for angular
 * To use these methods, associate a Handsontable instance with your instance
 * of the [`HotTable` component](@/guides/getting-started/installation/installation.md#5-use-the-hottable-component),
 * by using `@ViewChild` decorator (read more on the [Instance access](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md) page).
 * :::
 *
 * ## How to call a method
 *
 * ::: only-for javascript
 * ```js
 * // create a Handsontable instance
 * const hot = new Handsontable(document.getElementById('example'), options);
 *
 * // call a method
 * hot.setDataAtCell(0, 0, 'new value');
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * import { useRef } from 'react';
 *
 * const hotTableComponent = useRef(null);
 *
 * <HotTable
 *   // associate your `HotTable` component with a Handsontable instance
 *   ref={hotTableComponent}
 *   settings={options}
 * />
 *
 * // access the Handsontable instance, under the `.current.hotInstance` property
 * // call a method
 * hotTableComponent.current.hotInstance.setDataAtCell(0, 0, 'new value');
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * import { Component, ViewChild, AfterViewInit } from "@angular/core";
 * import {
 *   GridSettings,
 *   HotTableComponent,
 *   HotTableModule,
 * } from "@handsontable/angular-wrapper";
 *
 * `@Component`({
 *   standalone: true,
 *   imports: [HotTableModule],
 *   template: ` <div>
 *     <hot-table [settings]="gridSettings" />
 *   </div>`,
 * })
 * export class ExampleComponent implements AfterViewInit {
 *   `@ViewChild`(HotTableComponent, { static: false })
 *   readonly hotTable!: HotTableComponent;
 *
 *   readonly gridSettings = <GridSettings>{
 *     columns: [{}],
 *   };
 *
 *   ngAfterViewInit(): void {
 *     // Access the Handsontable instance
 *     // Call a method
 *     this.hotTable?.hotInstance?.setDataAtCell(0, 0, "new value");
 *   }
 * }
 * ```
 * :::
 *
 * @param {HTMLElement} rootContainer The element to which the Handsontable instance is injected.
 * @param {object} userSettings The user defined options.
 * @param {boolean} [rootInstanceSymbol=false] Indicates if the instance is root of all later instances created.
 */
export default function Core(
  this: HotInstance,
  rootContainer: HTMLElement,
  userSettings: Record<string, unknown> & { initialState?: Record<string, unknown> },
  rootInstanceSymbol: symbol | boolean = false
) {
  let instance: HotInstance = this;

  const eventManager = new EventManager(instance);
  let datamap: DataMapInstance;
  let dataSource: DataSourceInstance;
  let grid: GridHelperInstance;
  let editorManager: EditorManagerInstance;
  let focusGridManager: FocusGridManager;
  let viewportScroller: ViewportScrollerInstance;
  let firstRun: boolean | [null, string] = true;

  const mergedUserSettings: GridSettings = {
    ...userSettings.initialState,
    ...userSettings,
  } as GridSettings;

  if (hasValidParameter(rootInstanceSymbol)) {
    registerAsRootInstance(this);
  }

  /**
   * Reference to the root container.
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootContainer = rootContainer;

  /**
   * Reference to the wrapper element.
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootWrapperElement = null!;

  /**
   * Reference to the grid element.
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootGridElement = null!;

  /**
   * Reference to the grid content element. Wraps the grid (table) together with the grid focus-scope
   * tab-catchers, so siblings of this element inside `ht-grid` (e.g. the empty-data-state) stay
   * outside the grid focus scope.
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootGridContentElement = null!;

  /**
   * Reference to the top slot element. A wrapper slot rendered above the grid for plugin UI
   * (for example toolbars). Ordered through the layout manager.
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootSlotTopElement = null!;

  /**
   * Reference to the bottom slot element (pagination, license notification).
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootSlotBottomElement = null!;

  /**
   * Reference to the overlays element (dialog). Note: the empty-data-state lives inside the grid
   * element (`ht-grid`), not here.
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootOverlaysElement = null!;

  /**
   * Reference to the portal element.
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootPortalElement = null!;

  // TODO: check if references to DOM elements should be move to UI layer (Walkontable)
  /**
   * Reference to the container element.
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootElement = isRootInstance(this) ? rootContainer.ownerDocument.createElement('div') : rootContainer;

  /**
   * The nearest document over container.
   *
   * @private
   * @type {Document}
   */
  this.rootDocument = rootContainer.ownerDocument;

  /**
   * Window object over container's document.
   *
   * @private
   * @type {Window}
   */
  this.rootWindow = this.rootDocument.defaultView!;

  if (isRootInstance(this)) {

    this.rootWrapperElement = this.rootDocument.createElement('div');

    this.rootSlotTopElement = this.rootDocument.createElement('div');
    this.rootGridElement = this.rootDocument.createElement('div');
    this.rootGridContentElement = this.rootDocument.createElement('div');
    this.rootOverlaysElement = this.rootDocument.createElement('div');
    this.rootSlotBottomElement = this.rootDocument.createElement('div');
    this.rootPortalElement = this.rootDocument.createElement('div');

    addClass(this.rootElement, ['ht-wrapper', 'handsontable']);
    addClass(this.rootWrapperElement, 'ht-root-wrapper');
    addClass(this.rootSlotTopElement, 'ht-slot-top');
    addClass(this.rootGridElement, 'ht-grid');
    addClass(this.rootGridContentElement, 'ht-grid-content');
    addClass(this.rootOverlaysElement, 'ht-overlay');
    addClass(this.rootSlotBottomElement, 'ht-slot-bottom');

    this.rootGridContentElement.appendChild(this.rootElement);
    this.rootGridElement.appendChild(this.rootGridContentElement);
    this.rootWrapperElement.appendChild(this.rootSlotTopElement);
    this.rootWrapperElement.appendChild(this.rootGridElement);
    this.rootWrapperElement.appendChild(this.rootSlotBottomElement);
    this.rootWrapperElement.appendChild(this.rootOverlaysElement);
    this.rootContainer.appendChild(this.rootWrapperElement);
    (this.rootWrapperElement as HTMLElement & { __hotInstance: HotInstance }).__hotInstance = this;

    addClass(this.rootPortalElement, 'ht-portal');

    this.rootDocument.body.appendChild(this.rootPortalElement);
  }

  /**
   * A boolean to tell if the Handsontable has been fully destroyed. This is set to `true`
   * after `afterDestroy` hook is called.
   *
   * @memberof Core#
   * @member isDestroyed
   * @type {boolean}
   */
  this.isDestroyed = false;

  /**
   * The counter determines how many times the render suspending was called. It allows
   * tracking the nested suspending calls. For each render suspend resuming call the
   * counter is decremented. The value equal to 0 means the render suspending feature
   * is disabled.
   *
   * @private
   * @type {number}
   */
  this.renderSuspendedCounter = 0;

  /**
   * The counter determines how many times the execution suspending was called. It allows
   * tracking the nested suspending calls. For each execution suspend resuming call the
   * counter is decremented. The value equal to 0 means the execution suspending feature
   * is disabled.
   *
   * @private
   * @type {number}
   */
  this.executionSuspendedCounter = 0;

  const layoutDirection = mergedUserSettings?.layoutDirection ?? 'inherit';

  const rootElementDirection = ['rtl', 'ltr'].includes(layoutDirection) ?
    layoutDirection : this.rootWindow.getComputedStyle(this.rootElement).direction;

  this.rootElement.setAttribute('dir', rootElementDirection);
  this.rootWrapperElement?.setAttribute('dir', rootElementDirection);

  /**
   * Checks if the grid is rendered using the right-to-left layout direction.
   *
   * @since 12.0.0
   * @memberof Core#
   * @function isRtl
   * @returns {boolean} True if RTL.
   */
  this.isRtl = function() {
    return rootElementDirection === 'rtl';
  };

  /**
   * Checks if the grid is rendered using the left-to-right layout direction.
   *
   * @since 12.0.0
   * @memberof Core#
   * @function isLtr
   * @returns {boolean} True if LTR.
   */
  this.isLtr = function() {
    return !instance.isRtl();
  };

  /**
   * Returns 1 for LTR; -1 for RTL. Useful for calculations.
   *
   * @since 12.0.0
   * @memberof Core#
   * @function getDirectionFactor
   * @returns {number} Returns 1 for LTR; -1 for RTL.
   */
  this.getDirectionFactor = function() {
    return instance.isLtr() ? 1 : -1;
  };

  /**
   * Styles handler instance.
   *
   * @private
   * @type {StylesHandler}
   */
  this.stylesHandler = new StylesHandler({
    hot: instance,

    rootElement: instance.rootElement,

    rootDocument: instance.rootDocument,
    onThemeChange: (themeName: string) => {
      if (isRootInstance(this)) {
        removeClass(this.rootWrapperElement, /ht-theme-.*/g);
        removeClass(this.rootPortalElement, /ht-theme-.*/g);

        if (themeName) {
          addClass(this.rootWrapperElement, themeName);
          addClass(this.rootPortalElement, themeName);

          if (!getComputedStyle(this.rootWrapperElement).getPropertyValue('--ht-line-height')) {
            warn(`The "${themeName}" theme is enabled, but its stylesheets are missing` +
              ' or not imported correctly. Import the correct CSS files in order to use that theme.');
          }
        }

        this.view?._wt?.selectionManager?.refreshAllBorderHandleStyles();
      }
    },
    injectCoreCss: typeof userSettings?.injectCoreCss === 'boolean' ? userSettings.injectCoreCss : true,
  });

  /**
   * ThemeManager instance.
   *
   * @private
   * @type {ThemeManager|null}
   */
  this.themeManager = null;

  mergedUserSettings.language = getValidLanguageCode(mergedUserSettings.language as string);

  const settingsWithoutHooks = Object.fromEntries(
    Object.entries(mergedUserSettings).filter(([key]) => {
      return !(Hooks.getSingleton().isRegistered(key) || Hooks.getSingleton().isDeprecated(key));
    })
  );

  const metaManager = new MetaManager(instance, settingsWithoutHooks, [
    DynamicCellMetaMod,
    ExtendMetaPropertiesMod,
  ]);
  const tableMeta = metaManager.getTableMeta() as Record<string, unknown> & {
    fixedRowsTop: number;
    fixedRowsBottom: number;
    fixedColumnsStart: number;
    maxRows: number;
    maxCols: number;
    minRows: number;
    minSpareRows: number;
    minCols: number;
    minSpareCols: number;
    minRowHeights: number;
    allowInsertRow: boolean;
    allowInsertColumn: boolean;
    columns: (Function & ((...args: unknown[]) => Record<string, unknown>)) | Record<string, unknown>[] | null;
    colHeaders: boolean | unknown[] | Function | null;
    rowHeaders: boolean | unknown[] | Function | null;
    data: unknown[];
    dataSchema: unknown;
    getValue: Function | string | null;
    language: string;
    colWidths: unknown;
    rowHeights: unknown;
    width: unknown;
    themeName: string | undefined;
    isEmptyRow: Function;
    isEmptyCol: Function;
  };

  const globalMeta = metaManager.getGlobalMeta();
  const pluginsRegistry = createUniqueMap();

  this.container = this.rootDocument.createElement('div');

  this.rootElement.insertBefore(this.container, this.rootElement.firstChild);

  this.guid = `ht_${randomString()}`; // this is the namespace for global events

  foreignHotInstances.set(this.guid, this);

  /**
   * Instance of index mapper which is responsible for managing the column indexes.
   *
   * @memberof Core#
   * @member columnIndexMapper
   * @type {IndexMapper}
   */
  this.columnIndexMapper = new IndexMapper();

  /**
   * Instance of index mapper which is responsible for managing the row indexes.
   *
   * @memberof Core#
   * @member rowIndexMapper
   * @type {IndexMapper}
   */
  this.rowIndexMapper = new IndexMapper();

  this.columnIndexMapper.addLocalHook('indexesSequenceChange', (source: string) => {
    instance.runHooks('afterColumnSequenceChange', source);
  });

  this.rowIndexMapper.addLocalHook('indexesSequenceChange', (source: string) => {
    instance.runHooks('afterRowSequenceChange', source);
  });

  eventManager.addEventListener(this.rootDocument.documentElement, 'compositionstart', (event) => {
    instance.runHooks('beforeCompositionStart', event);
  });

  dataSource = new DataSource(instance);

  const moduleRegisterer = staticRegister(this.guid);

  moduleRegisterer.register('cellRangeMapper', new CellRangeToRenderableMapper({

    rowIndexMapper: this.rowIndexMapper,

    columnIndexMapper: this.columnIndexMapper,
  }));

  if (!this.rootElement.id || this.rootElement.id.substring(0, 3) === 'ht_') {

    this.rootElement.id = this.guid; // if root element does not have an id, assign a random id
  }

  const visualToRenderableCoords = (coords: {row: number, col: number}): CellCoords => {
    const { row: visualRow, col: visualColumn } = coords;

    return instance._createCellCoords(
      // We just store indexes for rows and columns without headers.
      visualRow >= 0 ? instance.rowIndexMapper.getRenderableFromVisualIndex(visualRow) : visualRow,
      visualColumn >= 0 ? instance.columnIndexMapper.getRenderableFromVisualIndex(visualColumn) : visualColumn
    ) as CellCoords;
  };

  const renderableToVisualCoords = (coords: {row: number, col: number}): CellCoords => {
    const { row: renderableRow, col: renderableColumn } = coords;

    return instance._createCellCoords(
      // We just store indexes for rows and columns without headers.
      renderableRow >= 0 ? instance.rowIndexMapper.getVisualFromRenderableIndex(renderableRow) : renderableRow,
      renderableColumn >= 0 ? instance.columnIndexMapper.getVisualFromRenderableIndex(renderableColumn) : renderableColumn // eslint-disable-line max-len
    ) as CellCoords;
  };

  const findFirstNonHiddenRenderableRow = (visualRowFrom: number, visualRowTo: number): number | null => {
    const dir = visualRowTo > visualRowFrom ? 1 : -1;
    const minIndex = Math.min(visualRowFrom, visualRowTo);
    const maxIndex = Math.max(visualRowFrom, visualRowTo);

    const rowIndex = instance.rowIndexMapper.getNearestNotHiddenIndex(visualRowFrom, dir);

    if (rowIndex === null || dir === 1 && rowIndex > maxIndex || dir === -1 && rowIndex < minIndex) {
      return null;
    }

    return (rowIndex >= 0 ?
      instance.rowIndexMapper.getRenderableFromVisualIndex(rowIndex) : rowIndex) as number | null;
  };

  const findFirstNonHiddenRenderableColumn = (visualColumnFrom: number, visualColumnTo: number): number | null => {
    const dir = visualColumnTo > visualColumnFrom ? 1 : -1;
    const minIndex = Math.min(visualColumnFrom, visualColumnTo);
    const maxIndex = Math.max(visualColumnFrom, visualColumnTo);

    const columnIndex = instance.columnIndexMapper.getNearestNotHiddenIndex(visualColumnFrom, dir);

    if (columnIndex === null || dir === 1 && columnIndex > maxIndex || dir === -1 && columnIndex < minIndex) {
      return null;
    }

    return (columnIndex >= 0 ?
      instance.columnIndexMapper.getRenderableFromVisualIndex(columnIndex) : columnIndex) as number | null;
  };

  let selection = new Selection(tableMeta, ({

    rowIndexMapper: instance.rowIndexMapper,

    columnIndexMapper: instance.columnIndexMapper,
    countCols: () => instance.countCols() as number,
    countRows: () => instance.countRows() as number,
    propToCol: (prop: string | number) => datamap.propToCol(prop) as number,
    isEditorOpened: () => {
      const editor = instance.getActiveEditor();

      return editor ? (editor.isOpened() as boolean) : false;
    },
    countRenderableColumns: () => instance.view.countRenderableColumns() as number,
    countRenderableRows: () => instance.view.countRenderableRows() as number,
    countRowHeaders: () => instance.countRowHeaders() as number,
    countColHeaders: () => instance.countColHeaders() as number,
    countRenderableRowsInRange: (rowStart: number, rowEnd: number) =>
      instance.view.countRenderableRowsInRange(rowStart, rowEnd) as number,
    countRenderableColumnsInRange: (columnStart: number, columnEnd: number) =>
      instance.view.countRenderableColumnsInRange(columnStart, columnEnd) as number,
    getShortcutManager: () => instance.getShortcutManager() as ShortcutManager,
    createCellCoords: (row: number, column: number) => instance._createCellCoords(row, column) as CellCoords,
    createCellRange: (
      highlight: {row: number, col: number}, from: {row: number, col: number}, to: {row: number, col: number}
    ) => instance._createCellRange(highlight, from, to) as CellRange,
    visualToRenderableCoords,
    renderableToVisualCoords,
    findFirstNonHiddenRenderableRow,
    findFirstNonHiddenRenderableColumn,
    isDisabledCellSelection: (visualRow: number, visualColumn: number) => {
      if (visualRow < 0 || visualColumn < 0) {
        return (instance.getSettings() as Record<string, unknown>).disableVisualSelection;
      }

      return (instance.getCellMeta(visualRow, visualColumn) as Record<string, unknown>).disableVisualSelection;
    }
  }) as unknown as SelectionTableProps);

  this.selection = selection;

  const onIndexMapperCacheUpdate = ({ hiddenIndexesChanged }: { hiddenIndexesChanged: boolean }) => {
    this.forceFullRender = true;

    if (hiddenIndexesChanged) {
      this.selection.commit();
    }
  };

  this.columnIndexMapper.addLocalHook('cacheUpdated', (indexesChangesState: { hiddenIndexesChanged: boolean }) => {
    onIndexMapperCacheUpdate(indexesChangesState);

    this.runHooks('afterColumnSequenceCacheUpdate', indexesChangesState);
  });

  this.rowIndexMapper.addLocalHook('cacheUpdated', (indexesChangesState: { hiddenIndexesChanged: boolean }) => {
    onIndexMapperCacheUpdate(indexesChangesState);

    this.runHooks('afterRowSequenceCacheUpdate', indexesChangesState);
  });

  this.selection.addLocalHook('afterSetRangeEnd', (
    cellCoords: {row: number, col: number}, isLastSelectionLayer: boolean
  ) => {
    const preventScrolling = createObjectPropListener(false);
    const selectionRange = this.selection.getSelectedRange();
    const { from, to } = selectionRange!.current()!;
    const selectionLayerLevel = selectionRange.size() - 1;

    this.runHooks('afterSelection',
      from.row,
      from.col,
      to.row,
      to.col,
      preventScrolling,
      selectionLayerLevel
    );
    this.runHooks('afterSelectionByProp',
      from.row,
      instance.colToProp(from.col!),
      to.row,
      instance.colToProp(to.col!),
      preventScrolling,
      selectionLayerLevel
    );

    const selectionSource = selection.getSelectionSource();
    const ignoreScrollSources = ['loadData', 'updateData', 'deselect', 'shift'];

    if (
      isLastSelectionLayer &&
      !ignoreScrollSources.includes(selectionSource) &&
      (!preventScrolling.isTouched() || preventScrolling.isTouched() && !preventScrolling.value)
    ) {
      viewportScroller.scrollTo(cellCoords as CellCoords);
    }

    const isSelectedByRowHeader = selection.isSelectedByRowHeader();
    const isSelectedByColumnHeader = selection.isSelectedByColumnHeader();

    // @TODO: These CSS classes are no longer needed anymore. They are used only as a indicator of the selected
    // rows/columns in the MergedCells plugin (via border.js#L520 in the walkontable module). After fixing
    // the Border class this should be removed.
    if (isSelectedByRowHeader && isSelectedByColumnHeader) {
      addClass(this.rootElement, ['ht__selection--rows', 'ht__selection--columns']);

    } else if (isSelectedByRowHeader) {
      removeClass(this.rootElement, 'ht__selection--columns');
      addClass(this.rootElement, 'ht__selection--rows');

    } else if (isSelectedByColumnHeader) {
      removeClass(this.rootElement, 'ht__selection--rows');
      addClass(this.rootElement, 'ht__selection--columns');

    } else {
      removeClass(this.rootElement, ['ht__selection--rows', 'ht__selection--columns']);
    }

    if (!['shift', 'refresh', 'loadData', 'updateData', 'deselect'].includes(selectionSource)) {
      editorManager.closeEditor();
    }

    if (!['refresh', 'loadData', 'updateData', 'deselect'].includes(selectionSource)) {
      instance.view.render();
      editorManager.prepareEditor();
    }
  });

  this.selection.addLocalHook('beforeSetFocus', (cellCoords: {row: number, col: number}) => {
    this.runHooks('beforeSelectionFocusSet', cellCoords.row, cellCoords.col);
  });

  this.selection.addLocalHook('afterSetFocus', (cellCoords: {row: number, col: number}) => {
    const preventScrolling = createObjectPropListener(false);

    this.runHooks('afterSelectionFocusSet', cellCoords.row, cellCoords.col, preventScrolling);

    if (!preventScrolling.isTouched() || preventScrolling.isTouched() && !preventScrolling.value) {
      viewportScroller.scrollTo(cellCoords as CellCoords);
    }

    editorManager.closeEditor();
    instance.view.render();
    editorManager.prepareEditor();
  });

  this.selection.addLocalHook('afterSelectionFinished',
    (cellRanges: Array<{from: {row: number, col: number}, to: {row: number, col: number}}>) => {
      const selectionLayerLevel = cellRanges.length - 1;
      const { from, to } = cellRanges[selectionLayerLevel];

      this.runHooks('afterSelectionEnd',
        from.row, from.col, to.row, to.col, selectionLayerLevel);
      this.runHooks('afterSelectionEndByProp',
        from.row, instance.colToProp(from.col), to.row, instance.colToProp(to.col), selectionLayerLevel);

      if (['refresh', 'deselect'].includes(selection.getSelectionSource())) {
        instance.view.render();
        editorManager.prepareEditor();
      }
    });

  this.selection.addLocalHook('afterIsMultipleSelection', (isMultiple: Record<string, boolean>) => {
    const changedIsMultiple = this.runHooks('afterIsMultipleSelection', isMultiple.value);

    if (isMultiple.value) {
      isMultiple.value = changedIsMultiple as boolean;
    }
  });

  this.selection.addLocalHook('afterDeselect', () => {
    editorManager.closeEditor();
    instance.view.render();

    removeClass(this.rootElement, ['ht__selection--rows', 'ht__selection--columns']);

    this.runHooks('afterDeselect');
  });

  this.selection
    .addLocalHook('beforeHighlightSet', () => instance.runHooks('beforeSelectionHighlightSet'))
    .addLocalHook('beforeSetRangeStart',
      (...args: unknown[]) => instance.runHooks('beforeSetRangeStart', ...args))
    .addLocalHook('beforeSetRangeStartOnly',
      (...args: unknown[]) => instance.runHooks('beforeSetRangeStartOnly', ...args))
    .addLocalHook('beforeSetRangeEnd',
      (...args: unknown[]) => instance.runHooks('beforeSetRangeEnd', ...args))
    .addLocalHook('beforeSelectColumns',
      (...args: unknown[]) => instance.runHooks('beforeSelectColumns', ...args))
    .addLocalHook('afterSelectColumns',
      (...args: unknown[]) => instance.runHooks('afterSelectColumns', ...args))
    .addLocalHook('beforeSelectRows',
      (...args: unknown[]) => instance.runHooks('beforeSelectRows', ...args))
    .addLocalHook('afterSelectRows',
      (...args: unknown[]) => instance.runHooks('afterSelectRows', ...args))
    .addLocalHook('beforeSelectAll',
      (...args: unknown[]) => instance.runHooks('beforeSelectAll', ...args))
    .addLocalHook('afterSelectAll',
      (...args: unknown[]) => instance.runHooks('afterSelectAll', ...args))
    .addLocalHook('beforeModifyTransformStart',
      (...args: unknown[]) => instance.runHooks('modifyTransformStart', ...args))
    .addLocalHook('afterModifyTransformStart',
      (...args: unknown[]) => instance.runHooks('afterModifyTransformStart', ...args))
    .addLocalHook('beforeModifyTransformFocus',
      (...args: unknown[]) => instance.runHooks('modifyTransformFocus', ...args))
    .addLocalHook('afterModifyTransformFocus',
      (...args: unknown[]) => instance.runHooks('afterModifyTransformFocus', ...args))
    .addLocalHook('beforeModifyTransformEnd',
      (...args: unknown[]) => instance.runHooks('modifyTransformEnd', ...args))
    .addLocalHook('afterModifyTransformEnd',
      (...args: unknown[]) => instance.runHooks('afterModifyTransformEnd', ...args))
    .addLocalHook('beforeRowWrap',
      (...args: unknown[]) => instance.runHooks('beforeRowWrap', ...args))
    .addLocalHook('beforeColumnWrap',
      (...args: unknown[]) => instance.runHooks('beforeColumnWrap', ...args))
    .addLocalHook('insertRowRequire',
      (totalRows: number) => instance.alter('insert_row_above', totalRows, 1, 'auto'))
    .addLocalHook('insertColRequire',
      (totalCols: number) => instance.alter('insert_col_start', totalCols, 1, 'auto'));

  grid = {
    /**
     * Inserts or removes rows and columns.
     *
     * @private
     * @param {string} action Possible values: "insert_row_above", "insert_row_below", "insert_col_start", "insert_col_end",
     *                        "remove_row", "remove_col".
     * @param {number|Array} index Row or column visual index which from the alter action will be triggered.
     *                             Alter actions such as "remove_row" and "remove_col" support array indexes in the
     *                             format `[[index, amount], [index, amount]...]` this can be used to remove
     *                             non-consecutive columns or rows in one call.
     * @param {number} [amount=1] Amount of rows or columns to remove.
     * @param {string} [source] Optional. Source of hook runner.
     * @param {boolean} [keepEmptyRows] Optional. Flag for preventing deletion of empty rows.
     */
    alter(action: string, index: number | number[][] | undefined, amount = 1, source: string, keepEmptyRows: boolean) {

      const skipAlter = instance.runHooks('beforeAlter', action, index, amount, source, keepEmptyRows);

      if (skipAlter === false) {
        return;
      }

      /* eslint-disable no-case-declarations */
      switch (action) {
        case 'insert_row_below':
        case 'insert_row_above':

          const numberOfSourceRows = instance.countSourceRows();

          if (tableMeta.maxRows === numberOfSourceRows) {
            return;
          }

          // `above` is the default behavior for creating new rows

          const insertRowMode = action === 'insert_row_below' ? 'below' : 'above';

          // Calling the `insert_row_above` action adds a new row at the beginning of the data set.

          const defaultRowIndex = insertRowMode === 'below' ? numberOfSourceRows : 0;

          const rowIndex = typeof index === 'number' ? index : defaultRowIndex;

          const {
            delta: rowDelta,
            startPhysicalIndex: startRowPhysicalIndex,
          } = datamap.createRow(rowIndex, amount, { source, mode: insertRowMode });

          selection.shiftRows(instance.toVisualRow(startRowPhysicalIndex!), rowDelta as number);
          break;

        case 'insert_col_start':
        case 'insert_col_end':
          // "start" is a default behavior for creating new columns

          const insertColumnMode = action === 'insert_col_end' ? 'end' : 'start';

          // Calling the `insert_col_start` action adds a new column to the left of the data set.

          const defaultColIndex = insertColumnMode === 'end' ? instance.countSourceCols() : 0;

          const colIndex = typeof index === 'number' ? index : defaultColIndex;

          const {
            delta: colDelta,
            startPhysicalIndex: startColumnPhysicalIndex,
          } = datamap.createCol(colIndex, amount, { source, mode: insertColumnMode });

          if (colDelta) {
            if (Array.isArray(tableMeta.colHeaders)) {
              const spliceArray = [instance.toVisualColumn(startColumnPhysicalIndex!), 0];

              spliceArray.length += colDelta as number; // inserts empty (undefined) elements at the end of an array
              Array.prototype.splice.apply(tableMeta.colHeaders, spliceArray as [number, number]); // inserts empty (undefined) elements into the colHeader array
            }

            selection.shiftColumns(instance.toVisualColumn(startColumnPhysicalIndex!), colDelta as number);
          }
          break;

        case 'remove_row':

          const removeRow = (indexes: number[][]) => {
            let offset = 0;

            // Normalize the {index, amount} groups into bigger groups.
            arrayEach(indexes, ([groupIndex, groupAmount]) => {
              const calcIndex = isEmpty(groupIndex) ? instance.countRows() - 1 : Math.max(groupIndex - offset, 0);

              // If the 'index' is an integer decrease it by 'offset' otherwise pass it through to make the value
              // compatible with datamap.removeCol method.
              if (Number.isInteger(groupIndex)) {

                groupIndex = Math.max(groupIndex - offset, 0);
              }

              // TODO: for datamap.removeRow index should be passed as it is (with undefined and null values). If not, the logic
              // inside the datamap.removeRow breaks the removing functionality.
              const wasRemoved = datamap.removeRow(groupIndex, groupAmount, source);

              if (!wasRemoved) {
                return;
              }

              if (selection.isSelected()) {
                const { row } = instance.getSelectedRangeActive()!.highlight;

                if (row! >= groupIndex && row! <= groupIndex + groupAmount - 1) {
                  editorManager.closeEditor(true);
                }
              }

              const totalRows = instance.countRows();
              const fixedRowsTop = tableMeta.fixedRowsTop;

              if (fixedRowsTop >= calcIndex + 1) {
                tableMeta.fixedRowsTop -= Math.min(groupAmount, fixedRowsTop - calcIndex);
              }

              const fixedRowsBottom = tableMeta.fixedRowsBottom;

              if (fixedRowsBottom && calcIndex >= totalRows - fixedRowsBottom) {
                tableMeta.fixedRowsBottom -= Math.min(groupAmount, fixedRowsBottom);
              }

              if (totalRows === 0) {
                selection.deselect();

              } else if (source === 'ContextMenu.removeRow') {
                const selectionRange = selection.getSelectedRange()!;
                const lastSelection = selectionRange.pop()!;

                selectionRange
                  .clear()
                  .set(lastSelection.from)
                  .current()!
                  .setTo(lastSelection.to);

                selection.refresh();

              } else {
                selection.shiftRows(groupIndex, -groupAmount);
              }

              offset += groupAmount;
            });
          };

          if (Array.isArray(index)) {
            removeRow(normalizeIndexesGroup(index));
          } else {
            removeRow([[index as number, amount]]);
          }
          break;

        case 'remove_col':

          const removeCol = (indexes: number[][]) => {
            let offset = 0;

            // Normalize the {index, amount} groups into bigger groups.
            arrayEach(indexes, ([groupIndex, groupAmount]) => {

              const calcIndex = isEmpty(groupIndex) ? instance.countCols() - 1 : Math.max(groupIndex - offset, 0);

              let physicalColumnIndex = instance.toPhysicalColumn(calcIndex);

              // If the 'index' is an integer decrease it by 'offset' otherwise pass it through to make the value
              // compatible with datamap.removeCol method.
              if (Number.isInteger(groupIndex)) {

                groupIndex = Math.max(groupIndex - offset, 0);
              }

              // TODO: for datamap.removeCol index should be passed as it is (with undefined and null values). If not, the logic
              // inside the datamap.removeCol breaks the removing functionality.
              const wasRemoved = datamap.removeCol(groupIndex, groupAmount, source);

              if (!wasRemoved) {
                return;
              }

              if (selection.isSelected()) {
                const { col } = instance.getSelectedRangeActive()!.highlight;

                if (col! >= groupIndex && col! <= groupIndex + groupAmount - 1) {
                  editorManager.closeEditor(true);
                }
              }

              const totalColumns = instance.countCols();

              if (totalColumns === 0) {
                selection.deselect();

              } else if (source === 'ContextMenu.removeColumn') {
                const selectionRange = selection.getSelectedRange()!;
                const lastSelection = selectionRange.pop()!;

                selectionRange
                  .clear()
                  .set(lastSelection.from)
                  .current()!
                  .setTo(lastSelection.to);

                selection.refresh();

              } else {
                selection.shiftColumns(groupIndex, -groupAmount);
              }

              const fixedColumnsStart = tableMeta.fixedColumnsStart;

              if (fixedColumnsStart >= calcIndex + 1) {
                tableMeta.fixedColumnsStart -= Math.min(groupAmount, fixedColumnsStart - calcIndex);
              }

              if (Array.isArray(tableMeta.colHeaders)) {
                if (typeof physicalColumnIndex === 'undefined') {
                  physicalColumnIndex = -1;
                }
                tableMeta.colHeaders.splice(physicalColumnIndex!, groupAmount);
              }

              offset += groupAmount;
            });
          };

          if (Array.isArray(index)) {
            removeCol(normalizeIndexesGroup(index));
          } else {
            removeCol([[index as number, amount]]);
          }
          break;
        default:
          throwWithCause(`There is no such action "${action}"`);
      }

      if (!keepEmptyRows) {
        grid.adjustRowsAndCols(); // makes sure that we did not add rows that will be removed in next refresh
      }

      instance.view.adjustElementsSize();
      instance.view.render();
    },

    /**
     * Makes sure there are empty rows at the bottom of the table.
     *
     * @private
     */
    adjustRowsAndCols() {

      const minRows = tableMeta.minRows;

      const minSpareRows = tableMeta.minSpareRows;

      const minCols = tableMeta.minCols;

      const minSpareCols = tableMeta.minSpareCols;

      if (minRows) {
        // should I add empty rows to data source to meet minRows?

        const nrOfRows = instance.countRows();

        if (nrOfRows < minRows) {
          // The synchronization with cell meta is not desired here. For `minRows` option,
          // we don't want to touch/shift cell meta objects.
          datamap.createRow(nrOfRows, minRows - nrOfRows, { source: 'auto' });
        }
      }
      if (minSpareRows) {

        const emptyRows = instance.countEmptyRows(true);

        // should I add empty rows to meet minSpareRows?
        if (emptyRows < minSpareRows) {
          const emptyRowsMissing = minSpareRows - emptyRows;
          const rowsToCreate = Math.min(emptyRowsMissing, tableMeta.maxRows - instance.countSourceRows());

          // The synchronization with cell meta is not desired here. For `minSpareRows` option,
          // we don't want to touch/shift cell meta objects.
          datamap.createRow(instance.countRows(), rowsToCreate, { source: 'auto' });
        }
      }
      {
        let emptyCols = 0;

        // count currently empty cols
        if (minCols || minSpareCols) {
          emptyCols = instance.countEmptyCols(true);
        }

        let nrOfColumns = instance.countCols();

        // should I add empty cols to meet minCols?
        if (minCols && !tableMeta.columns && nrOfColumns < minCols) {
          // The synchronization with cell meta is not desired here. For `minCols` option,
          // we don't want to touch/shift cell meta objects.
          const colsToCreate = minCols - nrOfColumns;

          emptyCols += colsToCreate;

          datamap.createCol(nrOfColumns, colsToCreate, { source: 'auto' });
        }
        // should I add empty cols to meet minSpareCols?
        if (minSpareCols && !tableMeta.columns && instance.dataType === 'array' &&
          emptyCols < minSpareCols) {

          nrOfColumns = instance.countCols();
          const emptyColsMissing = minSpareCols - emptyCols;
          const colsToCreate = Math.min(emptyColsMissing, tableMeta.maxCols - nrOfColumns);

          // The synchronization with cell meta is not desired here. For `minSpareCols` option,
          // we don't want to touch/shift cell meta objects.
          datamap.createCol(nrOfColumns, colsToCreate, { source: 'auto' });
        }
      }
    },

    /**
     * Populate the data from the provided 2d array from the given cell coordinates.
     *
     * @private
     * @param {object} start Start selection position. Visual indexes.
     * @param {Array} input 2d data array.
     * @param {object} [end] End selection position (only for drag-down mode). Visual indexes.
     * @param {string} [source="populateFromArray"] Source information string.
     * @param {string} [method="overwrite"] Populate method. Possible options: `shift_down`, `shift_right`, `overwrite`.
     * @returns {object|undefined} Ending td in pasted area (only if any cell was changed).
     */
    populateFromArray(
      start: CellCoords, input: Array<Array<unknown>>, end?: CellCoords, source?: string, method?: string
    ): object | false | undefined {
      let r;
      let rlen;
      let c;
      let clen;
      const setData = [];
      const current: Record<string, number> = {};
      const newDataByColumns: unknown[][] = [];
      const startRow = start.row;
      const startColumn = start.col;

      rlen = input.length;

      if (rlen === 0) {
        return false;
      }

      let columnsPopulationEnd = 0;
      let rowsPopulationEnd = 0;

      if (isObject(end)) {
        columnsPopulationEnd = end!.col! - startColumn! + 1;
        rowsPopulationEnd = end!.row! - startRow! + 1;
      }

      // insert data with specified pasteMode method
      switch (method) {
        case 'shift_down':
          // translate data from a list of rows to a list of columns
          const populatedDataByColumns: unknown[][] = pivot(input) as unknown[][];
          const numberOfDataColumns = populatedDataByColumns.length;
          // method's argument can extend the range of data population (data would be repeated)

          const numberOfColumnsToPopulate = Math.max(numberOfDataColumns, columnsPopulationEnd);
          const pushedDownDataByRows = instance.getData().slice(startRow!);

          // translate data from a list of rows to a list of columns
          const pushedDownDataByColumns: unknown[][] = (pivot(pushedDownDataByRows) as unknown[][])
            .slice(startColumn!, startColumn! + numberOfColumnsToPopulate);

          for (c = 0; c < numberOfColumnsToPopulate; c += 1) {
            if (c < numberOfDataColumns) {
              for (r = 0, rlen = populatedDataByColumns[c].length; r < rowsPopulationEnd - rlen; r += 1) {
                // repeating data for rows
                populatedDataByColumns[c].push(populatedDataByColumns[c][r % rlen]);
              }

              if (c < pushedDownDataByColumns.length) {
                newDataByColumns.push(populatedDataByColumns[c].concat(pushedDownDataByColumns[c]));

              } else {
                // if before data population, there was no data in the column
                // we fill the required rows' newly-created cells with `null` values
                newDataByColumns.push(populatedDataByColumns[c].concat(
                  new Array(pushedDownDataByRows.length).fill(null)));
              }

            } else {
              // Repeating data for columns.
              newDataByColumns.push(populatedDataByColumns[c % numberOfDataColumns].concat(pushedDownDataByColumns[c]));
            }
          }

          instance.populateFromArray(startRow!, startColumn!, pivot(newDataByColumns) as unknown[][]);

          break;

        case 'shift_right':
          const numberOfDataRows = input.length;
          // method's argument can extend the range of data population (data would be repeated)

          const numberOfRowsToPopulate = Math.max(numberOfDataRows, rowsPopulationEnd);
          const pushedRightDataByRows = instance.getData().slice(startRow!)
            .map((rowData: Array<unknown>) => rowData.slice(startColumn!));

          for (r = 0; r < numberOfRowsToPopulate; r += 1) {
            if (r < numberOfDataRows) {
              for (c = 0, clen = input[r].length; c < columnsPopulationEnd - clen; c += 1) {
                // repeating data for rows
                input[r].push(input[r][c % clen]);
              }

              if (r < pushedRightDataByRows.length) {
                for (let i = 0; i < pushedRightDataByRows[r].length; i += 1) {
                  input[r].push(pushedRightDataByRows[r][i]);
                }

              } else {
                // if before data population, there was no data in the row
                // we fill the required columns' newly-created cells with `null` values
                input[r].push(...new Array(pushedRightDataByRows[0].length).fill(null));
              }

            } else {
              // Repeating data for columns.
              input.push(input[r % rlen].slice(0, numberOfRowsToPopulate).concat(pushedRightDataByRows[r]));
            }
          }

          instance.populateFromArray(startRow!, startColumn!, input);

          break;

        case 'overwrite':
        default:
          // overwrite and other not specified options
          current.row = start.row!;
          current.col = start.col!;

          let skippedRow = 0;
          let skippedColumn = 0;
          let pushData = true;
          let cellMeta;
          const isAutofillSource = source === 'Autofill.fill' || source === 'autofill.fill';

          const getInputValue = function getInputValue(row: number, col: number | null = null) {
            const rowValue = input[row % input.length];

            if (col !== null) {
              return rowValue[col % rowValue.length];
            }

            return rowValue;
          };
          const rowInputLength = input.length;
          const rowSelectionLength = end ? end.row! - start.row! + 1 : 0;

          if (end) {
            rlen = rowSelectionLength;
          } else {
            rlen = Math.max(rowInputLength, rowSelectionLength);
          }
          for (r = 0; r < rlen; r++) {
            if ((end && current.row > end.row! && rowSelectionLength > rowInputLength) ||
                (!tableMeta.allowInsertRow && current.row > instance.countRows() - 1) ||
                (current.row >= tableMeta.maxRows)) {
              break;
            }
            const visualRow = r - skippedRow;
            const sourceRow = isAutofillSource ? r : visualRow;
            const colInputLength = (getInputValue(sourceRow) as unknown[]).length;
            const colSelectionLength = end ? end.col! - start.col! + 1 : 0;

            if (end) {
              clen = colSelectionLength;
            } else {
              clen = Math.max(colInputLength, colSelectionLength);
            }
            current.col = start.col!;

            cellMeta = instance.getCellMeta(current.row, current.col);

            if ((source === 'CopyPaste.paste' || source === 'Autofill.fill' || source === 'autofill.fill') &&
                cellMeta.skipRowOnPaste) {
              skippedRow += 1;
              current.row += 1;

              if (source === 'CopyPaste.paste') {
                rlen += 1;
              }

              continue;
            }
            skippedColumn = 0;

            for (c = 0; c < clen; c++) {
              if ((end && current.col > end.col! && colSelectionLength > colInputLength) ||
                  (!tableMeta.allowInsertColumn && current.col > instance.countCols() - 1) ||
                  (current.col >= tableMeta.maxCols)) {
                break;
              }

              cellMeta = instance.getCellMeta(current.row, current.col);

              if ((source === 'CopyPaste.paste' || source === 'Autofill.fill' || source === 'autofill.fill') &&
                  cellMeta.skipColumnOnPaste) {
                skippedColumn += 1;
                current.col += 1;

                if (source === 'CopyPaste.paste') {
                  clen += 1;
                }

                continue;
              }

              if (cellMeta.readOnly && source !== 'UndoRedo.undo') {
                current.col += 1;

                continue;
              }

              const visualColumn = c - skippedColumn;

              const sourceColumn = isAutofillSource ? c : visualColumn;
              const hasValueSetter = !!cellMeta.valueSetter;

              let value = getInputValue(sourceRow, sourceColumn);

              let orgValue = instance.getSourceDataAtCell(current.row, current.col) ?? null;

              if (value !== null && typeof value === 'object') {
                // when 'value' is array and 'orgValue' is null, set 'orgValue' to
                // an empty array so that the null value can be compared to 'value'
                // as an empty value for the array context
                if (Array.isArray(value) && orgValue === null) {
                  orgValue = [];
                }

                if (!hasValueSetter && (typeof orgValue !== 'object' || orgValue === null)) {
                  pushData = false;

                  // Enabling `parsePastedValue` relaxes schema validation, so object-based values can be pasted
                  // into non-object-based cells
                  if (cellMeta.parsePastedValue && source === 'CopyPaste.paste') {
                    pushData = true;
                  }

                  // Editor saves always accept the new value regardless of the original cell type (#3234)
                  if (source === 'edit') {
                    pushData = true;
                    value = deepClone(value);
                  }

                } else if (orgValue !== null) {
                  const orgValueSchema = duckSchema(
                    Array.isArray(orgValue) ? orgValue : ((orgValue as Record<string, unknown>)[0] || orgValue));
                  const valueSchema = duckSchema(
                    Array.isArray(value) ? value : (((value as Record<string, unknown>)[0] || value) as object));

                  // Allow overwriting values with the same object-based schema or any array-based schema.
                  if (
                    hasValueSetter || // If the cell has a value setter, we don't know the value schema (it's dynamic)
                    source === 'edit' || // Editor saves always accept the new value regardless of schema (#3234)
                    (
                      isObjectEqual(orgValueSchema as object, valueSchema as object) ||
                      (Array.isArray(orgValueSchema) && Array.isArray(valueSchema))
                    )
                  ) {
                    value = deepClone(value);

                  } else {
                    pushData = false;
                  }
                }

              } else if (!hasValueSetter && orgValue !== null && typeof orgValue === 'object') {
                pushData = false;
              }

              if (pushData) {
                setData.push([current.row, current.col, value]);
              }

              pushData = true;
              current.col += 1;
            }

            current.row += 1;
          }
          instance.setDataAtCell(setData, null, null, source || 'populateFromArray');
          break;
      }
    },
  };

  /**
   * Internal function to set `language` key of settings.
   *
   * @private
   * @param {string} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
   * @fires Hooks#afterLanguageChange
   */
  function setLanguage(languageCode: string) {
    const normalizedLanguageCode = normalizeLanguageCode(languageCode);

    if (hasLanguageDictionary(normalizedLanguageCode)) {
      instance.runHooks('beforeLanguageChange', normalizedLanguageCode);

      globalMeta.language = normalizedLanguageCode;

      instance.runHooks('afterLanguageChange', normalizedLanguageCode);

    } else {
      warnUserAboutLanguageRegistration(languageCode);
    }
  }

  /**
   * Internal function to set `className` or `tableClassName`, depending on the key from the settings object.
   *
   * @private
   * @param {string} className `className` or `tableClassName` from the key in the settings object.
   * @param {string|string[]} classSettings String or array of strings. Contains class name(s) from settings object.
   */
  function setClassName(className: string, classSettings: string | string[] | undefined) {

    const element = className === 'className' ? instance.rootElement : instance.table;

    if (firstRun) {
      if (classSettings !== undefined) {
        addClass(element, classSettings);
      }

    } else {
      let globalMetaSettingsArray: string[] = [];
      let settingsArray: string[] = [];

      if (globalMeta[className]) {
        const globalMetaValue = globalMeta[className];

        globalMetaSettingsArray = Array.isArray(globalMetaValue) ?
          globalMetaValue as string[] : stringToArray(String(globalMetaValue));
      }

      if (classSettings) {
        settingsArray = Array.isArray(classSettings) ? classSettings : stringToArray(classSettings);
      }

      const classNameToRemove = getDifferenceOfArrays(globalMetaSettingsArray, settingsArray);
      const classNameToAdd = getDifferenceOfArrays(settingsArray, globalMetaSettingsArray);

      if (classNameToRemove.length) {
        removeClass(element, classNameToRemove);
      }

      if (classNameToAdd.length) {
        addClass(element, classNameToAdd);
      }
    }

    globalMeta[className] = classSettings;
  }

  this.init = function() {
    const theme = tableMeta.theme;
    const themeName = tableMeta.themeName;
    const rootContainerThemeClassName = getThemeClassName(instance.rootContainer);

    if (
      isRootInstance(instance) &&
      !rootContainerThemeClassName &&
      (isObject(theme) || (!theme && !themeName))
    ) {
      initializeThemeManager(theme as ThemeBuilder | undefined);
    }

    dataSource.setData(tableMeta.data);
    instance.runHooks('beforeInit');

    if (isMobileBrowser() || isIpadOS()) {
      addClass(instance.rootElement, 'mobile');
    }

    this.updateSettings(mergedUserSettings, true);

    this.view = new TableView(this);

    editorManager = (EditorManager as unknown as Record<string, (...args: unknown[]) => EditorManagerInstance>)
      .getInstance(instance, tableMeta, selection);
    viewportScroller = createViewportScroller(instance);

    focusGridManager.init();

    if (isRootInstance(this)) {
      installAccessibilityAnnouncer(instance.rootPortalElement);
      initLicenseNotification(instance);

      // Keep the edge slots (top, bottom) as wide as the table so their content
      // (toolbars, pagination, license notification) aligns with the grid.
      const lastEdgeWidths = { top: -1, bottom: -1 };
      const syncEdgeSlotsWidth = () => {
        if (instance.isDestroyed) {
          return;
        }

        const { view } = instance;

        if (!view) {
          return;
        }

        let width = view.isHorizontallyScrollableByWindow()
          ? view.getTotalTableWidth() : view.getWorkspaceWidth();

        if (width === 0 && instance.rootWrapperElement) {
          width = instance.rootWrapperElement.offsetWidth;
        }

        // Only write when the value actually changes — avoids a reflow → dimension-refresh
        // → re-sync feedback loop, and needless layout writes during volatile renders.
        if (instance.rootSlotBottomElement && width !== lastEdgeWidths.bottom) {
          lastEdgeWidths.bottom = width;
          instance.rootSlotBottomElement.style.width = `${width}px`;
        }

        if (instance.rootSlotTopElement && width !== lastEdgeWidths.top) {
          lastEdgeWidths.top = width;
          instance.rootSlotTopElement.style.width = `${width}px`;
        }
      };

      this.addHook('afterRender', syncEdgeSlotsWidth);
    }

    instance.runHooks('init');

    this.render();

    // Run the logic only if it's the table's initialization and the root element is not visible.
    if (!!firstRun && instance.rootElement.offsetParent === null) {
      observeVisibilityChangeOnce(instance.rootElement, () => {
        // Update the spreader size cache before rendering.
        instance.view._wt.wtOverlays.updateLastSpreaderSize();
        instance.view.adjustElementsSize();
        instance.render();
      });
    }

    if (typeof firstRun === 'object') {
      instance.runHooks('afterChange', firstRun[0], firstRun[1]);

      firstRun = false;
    }

    instance.runHooks('afterInit');
  };

  /**
   * Initializes the ThemeManager with the given theme configuration.
   *
   * @param {object|boolean} theme - The theme configuration object or `true` to use the default theme.
   */
  function initializeThemeManager(theme?: ThemeBuilder) {
    let themeObject;

    if (typeof theme === 'undefined') {
      if (hasTheme('main')) {
        themeObject = getTheme('main');
      } else {
        themeObject = registerTheme(mainTheme);
      }

      themeObject = getTheme('main')!;
    } else if (typeof theme.getThemeConfig !== 'function') {
      themeObject = registerTheme(theme as Parameters<typeof registerTheme>[0]);
    } else {
      themeObject = theme;
    }

    instance.themeManager = createThemeManager({

      hot: instance,
      themeObject
    });
  }

  /**
   * @ignore
   * @returns {object}
   */
  function ValidatorsQueue() { // moved this one level up so it can be used in any function here. Probably this should be moved to a separate file
    let resolved = false;

    return {
      validatorsInQueue: 0,
      valid: true,
      addValidatorToQueue() {
        this.validatorsInQueue += 1;
        resolved = false;
      },
      removeValidatorFormQueue() {
        this.validatorsInQueue = this.validatorsInQueue - 1 < 0 ? 0 : this.validatorsInQueue - 1;
        this.checkIfQueueIsEmpty();
      },
      onQueueEmpty(_valid: boolean) { },
      checkIfQueueIsEmpty() {
        if (this.validatorsInQueue === 0 && resolved === false) {
          resolved = true;
          this.onQueueEmpty(this.valid);
        }
      }
    };
  }

  /**
   * @ignore
   * @param {Array} changes List of changes in format `[visualRow, prop, oldValue, newValue]`.
   * @param {BaseEditor|undefined} activeEditor Current editor instance.
   * @returns {boolean} `true` when the active, opened editor points to a changed cell.
   */
  function doesChangeAffectOpenedEditor(changes: CellChange[], activeEditor: BaseEditor | undefined) {
    if (!activeEditor?.isOpened()) {
      return false;
    }

    return hasChangeForCell(changes, activeEditor.row!, activeEditor.prop!);
  }

  /**
   * @ignore
   * @param {Array} changes The 2D array containing information about each of the edited cells.
   * @param {string} source The string that identifies source of validation.
   * @param {Function} callback The callback function fot async validation.
   */
  function validateChanges(changes: CellChange[], source: string | undefined, callback: Function) {
    if (!changes.length) {
      callback();

      return;
    }

    const activeEditor = instance.getActiveEditor();
    const waitingForValidator = ValidatorsQueue();
    let shouldBeCanceled = true;

    // Track value corrections applied by validators via setDataAtCell during the validation window.
    // Without this, a corrected value written by a nested setDataAtCell call gets overwritten when
    // applyChanges() runs on the original changes array. The hook is removed before applyChanges()
    // runs (in onQueueEmpty), so it does not capture the parent apply itself.
    //
    // Source filtering is structurally required: each nested validateChanges() call registers its
    // own onAfterChange hook. Without filtering, when the parent applyChanges() fires afterChange,
    // the nested hook would intercept it and corrupt the nested changes array. Filtering to sources
    // that end with 'Validator' ensures only corrections emitted by validators are captured, never
    // values applied by applyChanges(). Custom validators that correct values must follow this
    // convention by passing a source ending in 'Validator' to their setDataAtCell call.
    const applyValidatorCorrection = ([changedRow, changedProp, , correctedValue]: CellChange) => {
      const idx = changes.findIndex(([row, prop]) => row === changedRow && prop === changedProp);

      if (idx !== -1) {
        changes[idx][3] = correctedValue;
      }
    };
    const onAfterChange = (afterChanges: CellChange[] | null | undefined, afterSource: unknown) => {
      if (typeof afterSource !== 'string' || !afterSource.endsWith('Validator')) {
        return;
      }

      afterChanges?.forEach(applyValidatorCorrection);
    };

    instance.addHook('afterChange', onAfterChange);

    waitingForValidator.onQueueEmpty = () => {
      instance.removeHook('afterChange', onAfterChange);

      if (
        activeEditor &&
        shouldBeCanceled &&
        activeEditor._closeAfterDataChange &&
        doesChangeAffectOpenedEditor(changes, activeEditor)
      ) {
        activeEditor.cancelChanges();
      }

      callback(); // called when async validators are resolved and beforeChange was not async
    };

    for (let i = changes.length - 1; i >= 0; i--) {
      const [row, prop,, newValue] = changes[i];
      const visualCol = datamap.propToCol(prop as string | number);
      let cellProperties;

      if (Number.isInteger(visualCol)) {

        cellProperties = instance.getCellMeta(row, visualCol as number);

      } else {
        // If there's no requested visual column, we can use the table meta as the cell properties when retrieving
        // the cell validator.
        cellProperties = { ...Object.getPrototypeOf(tableMeta) as Record<string, unknown>, ...tableMeta };
      }

      if (instance.getCellValidator(cellProperties)) {
        /* eslint-disable no-loop-func */
        waitingForValidator.addValidatorToQueue();

        instance.validateCell(newValue, cellProperties, (function(index, cellPropertiesReference) {
          return function(result: boolean) {
            if (typeof result !== 'boolean') {
              throwWithCause('Validation error: result is not boolean');
            }

            if (result === false && cellPropertiesReference.allowInvalid === false) {
              shouldBeCanceled = false;
              // cancel the change
              changes.splice(index, 1);
              // we cancelled the change, so cell value is still valid
              cellPropertiesReference.valid = true;
            }

            waitingForValidator.removeValidatorFormQueue();
          };
        }(i, cellProperties)), source);
      }
    }

    waitingForValidator.checkIfQueueIsEmpty();
  }

  /**
   * Internal function to apply changes. Called after validateChanges.
   *
   * @private
   * @param {Array} changes Array in form of [row, prop, oldValue, newValue].
   * @param {string} source String that identifies how this change will be described in changes array (useful in onChange callback).
   * @fires Hooks#beforeChangeRender
   * @fires Hooks#afterChange
   */
  function applyChanges(changes: CellChange[], source: string | undefined) {
    for (let i = changes.length - 1; i >= 0; i--) {
      let skipThisChange = false;

      if (changes[i] === null) {
        changes.splice(i, 1);

        continue;
      }

      if ((changes[i][2] === null || changes[i][2] === undefined)
        && (changes[i][3] === null || changes[i][3] === undefined)) {

        continue;
      }

      if (tableMeta.allowInsertRow) {
        while (changes[i][0] > instance.countRows() - 1) {
          const {
            delta: numberOfCreatedRows
          } = datamap.createRow(undefined, undefined, { source: 'auto' });

          if (numberOfCreatedRows === 0) {
            skipThisChange = true;
            break;
          }
        }
      }

      if (instance.dataType === 'array' && (!tableMeta.columns || tableMeta.columns.length === 0) &&
          tableMeta.allowInsertColumn) {
        while (Number(datamap.propToCol(changes[i][1] as string | number)) > instance.countCols() - 1) {
          const {
            delta: numberOfCreatedColumns
          } = datamap.createCol(undefined, undefined, { source: 'auto' });

          if (numberOfCreatedColumns === 0) {
            skipThisChange = true;
            break;
          }
        }
      }

      if (skipThisChange) {

        continue;
      }

      datamap.set(changes[i][0], changes[i][1] as string | number, changes[i][3]);
    }

    const hasChanges = changes.length > 0;
    const activeEditor = editorManager.getActiveEditor();
    const closeEditorAfterDataChange = activeEditor?._closeAfterDataChange;
    const isOpenedEditorAffectedByChanges = doesChangeAffectOpenedEditor(changes, activeEditor);

    if (hasChanges) {
      grid.adjustRowsAndCols();
      instance.runHooks('beforeChangeRender', changes, source);

      if (activeEditor?.isOpened() && closeEditorAfterDataChange && isOpenedEditorAffectedByChanges) {
        editorManager.closeEditor();
      }

      instance.view.adjustElementsSize();
      instance.render();

      if (
        (activeEditor?.isOpened() && closeEditorAfterDataChange && isOpenedEditorAffectedByChanges) ||
        !activeEditor?.isOpened()
      ) {
        editorManager.prepareEditor();
      }

      instance.runHooks('afterChange', changes, source || 'edit');

      if (
        activeEditor &&
        activeEditor.refreshValue !== undefined &&
        (!activeEditor.isOpened() || isOpenedEditorAffectedByChanges)
      ) {
        activeEditor.refreshValue();
      }

    } else {
      instance.render();
    }
  }

  /**
   * Creates and returns the CellCoords object.
   *
   * @private
   * @memberof Core#
   * @function _createCellCoords
   * @param {number} row The row index.
   * @param {number} column The column index.
   * @returns {CellCoords}
   */
  this._createCellCoords = function(row: number, column: number): CellCoords {
    const view = instance.view as TableView;

    return view._wt.createCellCoords(row, column) as CellCoords;
  };

  /**
   * Creates and returns the CellRange object.
   *
   * @private
   * @memberof Core#
   * @function _createCellRange
   * @param {CellCoords} highlight Defines the border around a cell where selection was started and to edit the cell
   *                               when you press Enter. The highlight cannot point to headers (negative values).
   * @param {CellCoords} from Initial coordinates.
   * @param {CellCoords} to Final coordinates.
   * @returns {CellRange}
   */
  this._createCellRange = function(
    highlight: {row: number, col: number}, from: {row: number, col: number}, to: {row: number, col: number}
  ): CellRange {
    const view = instance.view as TableView;

    return view._wt.createCellRange(
      highlight as unknown as CellCoords,
      from as unknown as CellCoords,
      to as unknown as CellCoords
    ) as CellRange;
  };

  /**
   * Validate a single cell.
   *
   * @memberof Core#
   * @function validateCell
   * @param {string|number} value The value to validate.
   * @param {object} cellProperties The cell meta which corresponds with the value.
   * @param {Function} callback The callback function.
   * @param {string} source The string that identifies source of the validation.
   */
  this.validateCell = function(
    value: unknown,
    cellProperties: Record<string, unknown> & {
      hidden?: boolean, visualCol?: number, visualRow?: number, prop?: string, valid?: boolean, allowInvalid?: boolean
    },
    callback: (valid: boolean) => void,
    source: string
  ) {

    let validator = instance.getCellValidator(cellProperties);

    // the `canBeValidated = false` argument suggests, that the cell passes validation by default.
    /**
     * @private
     * @function done
     * @param {boolean} valid Indicates if the validation was successful.
     * @param {boolean} [canBeValidated=true] Flag which controls the validation process.
     */
    function done(valid: boolean, canBeValidated = true) {
      // Fixes GH#3903
      if (!canBeValidated || cellProperties.hidden === true) {
        callback(valid);

        return;
      }

      const col = cellProperties.visualCol as number;
      const row = cellProperties.visualRow as number;
      const td = instance.getCell(row, col, true);

      if (td && td.nodeName !== 'TH') {
        const renderableRow = instance.rowIndexMapper.getRenderableFromVisualIndex(row)!;
        const renderableColumn = instance.columnIndexMapper.getRenderableFromVisualIndex(col)!;

        instance.view._wt.getSetting('cellRenderer', renderableRow, renderableColumn, td);
      }

      callback(valid);
    }

    if (isRegExp(validator)) {
      validator = (function(expression: RegExp) {
        return function(cellValue: unknown, validatorCallback: Function) {
          validatorCallback(expression.test(cellValue as string));
        };
      }(validator as RegExp));
    }

    if (isFunction(validator)) {
      // When the column data accessor is a function, cellProperties.prop holds the accessor
      // function itself — not a usable column reference. Fall back to the visual column index
      // so hook listeners always receive a number or a property string, never a function.
      const colArg = isFunction(cellProperties.prop) ? cellProperties.visualCol : cellProperties.prop;

      value = instance.runHooks('beforeValidate', value, cellProperties.visualRow, colArg, source);

      // To provide consistent behavior, validation should be always asynchronous
      instance._registerMicrotask(() => {
        validator.call(cellProperties, value, (valid: boolean) => {
          if (!instance) {
            return;
          }

          valid = instance
            .runHooks('afterValidate', valid, value, cellProperties.visualRow, colArg, source);
          cellProperties.valid = valid;

          done(valid);
          instance.runHooks(
            'postAfterValidate', valid, value, cellProperties.visualRow, colArg, source
          );
        });
      });

    } else {
      // resolve callback even if validator function was not found
      instance._registerMicrotask(() => {
        cellProperties.valid = true;
        done(cellProperties.valid, false);
      });
    }
  };

  /**
   * @ignore
   * @param {number} row The visual row index.
   * @param {string|number} propOrCol The visual prop or column index.
   * @param {*} value The cell value.
   * @returns {Array}
   */
  function setDataInputToArray(
    row: number | Array<[number, string | number, unknown]>, propOrCol: string | number, value: unknown
  ): Array<[number, string | number, unknown]> {
    if (Array.isArray(row)) { // it's an array of changes
      return row;
    }

    return [[row, propOrCol, value]];
  }

  /**
   * Process changes prepared for applying to the dataset (unifying list of changes, closing an editor - when needed,
   * calling a hook).
   *
   * @private
   * @param {Array} changes Array of changes in format `[[row, col, value],...]`.
   * @param {string} [source] String that identifies how this change will be described in the changes array (useful in afterChange or beforeChange callback). Set to 'edit' if left empty.
   * @returns {Array} List of changes finally applied to the dataset.
   */
  function processChanges(changes: Array<CellChange | null>, source: string | undefined): CellChange[] {

    const beforeChangeResult = instance.runHooks('beforeChange', changes, source || 'edit');
    // The `beforeChange` hook could add a `null` for purpose of cancelling some dataset's change.
    const filteredChanges = changes.filter((change): change is CellChange => change !== null);

    if (beforeChangeResult === false || filteredChanges.length === 0) {
      instance.getActiveEditor()?.cancelChanges();

      return [];
    }

    for (let i = filteredChanges.length - 1; i >= 0; i--) {
      const [row, prop, , newValue] = filteredChanges[i];
      const visualColumn = datamap.propToCol(prop as string | number);
      let cellProperties;

      if (Number.isInteger(visualColumn)) {

        cellProperties = instance.getCellMeta(row, visualColumn as number);
      } else {
        // If there's no requested visual column, we can use the table meta as the cell properties
        cellProperties = { ...Object.getPrototypeOf(tableMeta) as Record<string, unknown>, ...tableMeta };
      }

      filteredChanges[i][3] = getValueSetterValue(newValue, cellProperties);
    }

    return filteredChanges;
  }

  /**
   * @description
   * Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
   * `[[row, col, value],...]` as the first argument.
   *
   * @memberof Core#
   * @function setDataAtCell
   * @param {number|Array} row Visual row index or array of changes in format `[[row, col, value],...]`.
   * @param {number} [column] Visual column index.
   * @param {string} [value] New value.
   * @param {string} [source] String that identifies how this change will be described in the changes array (useful in afterChange or beforeChange callback). Set to 'edit' if left empty.
   */
  this.setDataAtCell = function(
    row: number | Array<[number, string | number, unknown]>, column: number | string, value: string, source?: string
  ) {
    const input = setDataInputToArray(row, column, value);
    const changes: CellChange[] = [];
    let changeSource = source;
    let i;
    let ilen;
    let prop;

    for (i = 0, ilen = input.length; i < ilen; i++) {
      const [visualRow, visualColumn, newValue] = input[i];

      if (typeof input[i] !== 'object') {
        throwWithCause('Method `setDataAtCell` accepts row number or changes array of arrays as its first parameter');
      }
      if (typeof input[i][1] !== 'number') {
        // eslint-disable-next-line max-len
        throwWithCause('Method `setDataAtCell` accepts row and column number as its parameters. If you want to use object property name, use method `setDataAtRowProp`');
      }

      // setDataAtCell validates that column is numeric above (throws if not number).
      const visualColumnIndex = typeof visualColumn === 'number' ? visualColumn : 0;

      if (visualColumnIndex >= this.countCols()) {
        prop = visualColumnIndex;

      } else {
        prop = datamap.colToProp(visualColumnIndex);
      }

      changes.push([
        visualRow,
        prop,
        dataSource.getAtCell(this.toPhysicalRow(visualRow), visualColumn),
        newValue,
      ]);
    }

    if (!changeSource && typeof row === 'object') {
      changeSource = column as string;
    }

    const processedChanges = processChanges(changes, changeSource);

    instance.runHooks('afterSetDataAtCell', processedChanges, changeSource);

    validateChanges(processedChanges, changeSource, () => {
      applyChanges(processedChanges, changeSource);
    });
  };

  /**
   * @description
   * Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
   * `[[row, prop, value],...]` as the first argument.
   *
   * @memberof Core#
   * @function setDataAtRowProp
   * @param {number|Array} row Visual row index or array of changes in format `[[row, prop, value], ...]`.
   * @param {string} prop Property name or the source string (e.g. `'first.name'` or `'0'`).
   * @param {string} value Value to be set.
   * @param {string} [source] String that identifies how this change will be described in changes array (useful in onChange callback).
   */
  this.setDataAtRowProp = function(
    row: number | Array<[number, string | number, unknown]>, prop: string | number, value: string, source?: string
  ) {
    const input = setDataInputToArray(row, prop, value);
    const changes: CellChange[] = [];
    let changeSource = source;
    let i;
    let ilen;

    for (i = 0, ilen = input.length; i < ilen; i++) {
      const [visualRow, inputProp, newValue] = input[i];

      changes.push([
        visualRow,
        inputProp,
        dataSource.getAtCell(this.toPhysicalRow(visualRow), inputProp as string | number),
        newValue,
      ]);
    }

    // TODO: I don't think `prop` should be used as `changeSource` here, but removing it would be a breaking change.
    // We should remove it with the next major release.
    if (!changeSource && typeof row === 'object') {
      changeSource = prop as string;
    }

    const processedChanges = processChanges(changes, changeSource);

    instance.runHooks('afterSetDataAtRowProp', processedChanges, changeSource);

    validateChanges(processedChanges, changeSource, () => {
      applyChanges(processedChanges, changeSource);
    });
  };

  /**
   * Listen to the keyboard input on document body. This allows Handsontable to capture keyboard events and respond
   * in the right way.
   *
   * @memberof Core#
   * @function listen
   * @fires Hooks#afterListen
   */
  this.listen = function() {
    if (instance && !instance.isListening()) {
      foreignHotInstances.forEach((foreignHot) => {
        if (instance !== foreignHot) {
          foreignHot.unlisten();
        }
      });

      activeGuid = instance.guid;
      instance.runHooks('afterListen');
    }
  };

  /**
   * Stop listening to keyboard input on the document body. Calling this method makes the Handsontable inactive for
   * any keyboard events.
   *
   * @memberof Core#
   * @function unlisten
   */
  this.unlisten = function() {
    if (this.isListening()) {
      activeGuid = null;
      instance.runHooks('afterUnlisten');
    }
  };

  /**
   * Returns `true` if the current Handsontable instance is listening to keyboard input on document body.
   *
   * @memberof Core#
   * @function isListening
   * @returns {boolean} `true` if the instance is listening, `false` otherwise.
   */
  this.isListening = function() {
    return activeGuid === instance.guid;
  };

  /**
   * Destroys the current editor, render the table and prepares the editor of the newly selected cell.
   *
   * @memberof Core#
   * @function destroyEditor
   * @param {boolean} [revertOriginal=false] If `true`, the previous value will be restored. Otherwise, the edited value will be saved.
   * @param {boolean} [prepareEditorIfNeeded=true] If `true` the editor under the selected cell will be prepared to open.
   */
  this.destroyEditor = function(revertOriginal = false, prepareEditorIfNeeded = true) {
    editorManager.closeEditor(revertOriginal);
    instance.view.render();

    if (prepareEditorIfNeeded && selection.isSelected()) {
      editorManager.prepareEditor();
    }
  };

  /**
   * Populates cells at position with 2D input array (e.g. `[[1, 2], [3, 4]]`). Use `endRow`, `endCol` when you
   * want to cut input when a certain row is reached.
   *
   * The `populateFromArray()` method can't change [`readOnly`](@/api/options.md#readonly) cells.
   *
   * Optional `method` argument has the same effect as pasteMode option (see {@link Options#pasteMode}).
   *
   * @memberof Core#
   * @function populateFromArray
   * @param {number} row Start visual row index.
   * @param {number} column Start visual column index.
   * @param {Array} input 2d array.
   * @param {number} [endRow] End visual row index (use when you want to cut input when certain row is reached).
   * @param {number} [endCol] End visual column index (use when you want to cut input when certain column is reached).
   * @param {string} [source=populateFromArray] Used to identify this call in the resulting events (beforeChange, afterChange).
   * @param {string} [method=overwrite] Populate method, possible values: `'shift_down'`, `'shift_right'`, `'overwrite'`.
   * @returns {object|undefined} Ending td in pasted area (only if any cell was changed).
   */
  this.populateFromArray = function(
    row: number, column: number, input: Array<Array<unknown>>, endRow: number | null | undefined,
    endCol: number | null | undefined, source?: string, method?: string
  ) {
    if (!(typeof input === 'object' && typeof input[0] === 'object')) {
      throwWithCause('populateFromArray parameter `input` must be an array of arrays'); // API changed in 0.9-beta2, let's check if you use it correctly
    }

    const c = typeof endRow === 'number' ? instance._createCellCoords(endRow, endCol as number | null) : undefined;

    return grid.populateFromArray(instance._createCellCoords(row, column), input, c, source, method);
  };

  /**
   * Adds/removes data from the column. This method works the same as Array.splice for arrays.
   *
   * @memberof Core#
   * @function spliceCol
   * @param {number} column Index of the column in which do you want to do splice.
   * @param {number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {...number} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array.
   * @returns {Array} Returns removed portion of columns.
   */
  this.spliceCol = function(column: number, index: number, amount: number, ...elements: unknown[]) {
    return datamap.spliceCol(column, index, amount, ...elements);
  };

  /**
   * Adds/removes data from the row. This method works the same as Array.splice for arrays.
   *
   * @memberof Core#
   * @function spliceRow
   * @param {number} row Index of column in which do you want to do splice.
   * @param {number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {...number} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array.
   * @returns {Array} Returns removed portion of rows.
   */
  this.spliceRow = function(row: number, index: number, amount: number, ...elements: unknown[]) {
    return datamap.spliceRow(row, index, amount, ...elements);
  };

  /**
   * Returns indexes of the currently selected cells as an array of arrays `[[startRow, startCol, endRow, endCol],...]`.
   *
   * Start row and start column are the coordinates of the active cell (where the selection was started).
   *
   * The version 0.36.0 adds a non-consecutive selection feature. Since this version, the method returns an array of arrays.
   * Additionally to collect the coordinates of the currently selected area (as it was previously done by the method)
   * you need to use `getSelectedLast` method.
   *
   * @memberof Core#
   * @function getSelected
   * @returns {Array[]|undefined} An array of arrays of the selection's coordinates.
   */
  this.getSelected = function() { // https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return arrayMap(
        selection.getSelectedRange().ranges,
        ({ from, to }) => [from.row as number, from.col as number, to.row as number, to.col as number]
      );
    }
  };

  /**
   * Returns the last coordinates applied to the table as a an array `[startRow, startCol, endRow, endCol]`.
   *
   * @since 0.36.0
   * @memberof Core#
   * @function getSelectedLast
   * @returns {Array|undefined} An array of the selection's coordinates.
   */
  this.getSelectedLast = function() {
    const selected = instance.getSelected() as number[][] | undefined;
    let result: number[] | undefined;

    if (selected && selected.length > 0) {
      result = selected[selected.length - 1];
    }

    return result;
  };

  /**
   * Returns the range coordinates of the active selection layer as an array. Active selection layer is the layer that
   * has visible focus highlight.
   *
   * @memberof Core#
   * @function getSelectedActive
   * @since 16.1.0
   * @returns {number[]|undefined} Selected range as an array of coordinates or `undefined` if there is no selection.
   */
  this.getSelectedActive = function() {

    const activeRange = instance.getSelectedRangeActive();

    if (!activeRange) {
      return;
    }

    const { from, to } = activeRange as CellRange;

    return [from.row as number, from.col as number, to.row as number, to.col as number];
  };

  /**
   * Returns the current selection as an array of CellRange objects.
   *
   * The version 0.36.0 adds a non-consecutive selection feature. Since this version, the method returns an array of arrays.
   * Additionally to collect the coordinates of the active selected area (as it was previously done by the method)
   * you need to use `getSelectedRangeActive()` method.
   *
   * @memberof Core#
   * @function getSelectedRange
   * @returns {CellRange[]|undefined} Selected range object or `undefined` if there is no selection.
   */
  this.getSelectedRange = function() { // https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return Array.from(selection.getSelectedRange());
    }
  };

  /**
   * Returns the last coordinates applied to the table as a CellRange object.
   *
   * @memberof Core#
   * @function getSelectedRangeLast
   * @since 0.36.0
   * @returns {CellRange|undefined} Selected range object or `undefined` if there is no selection.
   */
  this.getSelectedRangeLast = function() {
    const selectedRange = instance.getSelectedRange() as CellRange[] | undefined;
    let result: CellRange | undefined;

    if (selectedRange && selectedRange.length > 0) {
      result = selectedRange[selectedRange.length - 1];
    }

    return result;
  };

  /**
   * Returns the range coordinates of the active selection layer. Active selection layer is the layer that
   * has visible focus highlight.
   *
   * @memberof Core#
   * @function getSelectedRangeActive
   * @since 16.1.0
   * @returns {CellRange|undefined} Selected range object or `undefined` if there is no selection.
   */
  this.getSelectedRangeActive = function() {
    return selection.getActiveSelectedRange();
  };

  /**
   * Returns the index of the active selection layer. Active selection layer is the layer that
   * has visible focus highlight.
   *
   * @memberof Core#
   * @function getActiveSelectionLayerIndex
   * @since 16.1.0
   * @returns {number} The index of the active selection layer. `0` to `N` where `0` is the last (oldest) layer and `N` is the first (newest) layer.
   */
  this.getActiveSelectionLayerIndex = function() {
    return selection.getActiveSelectionLayerIndex();
  };

  /**
   * Erases content from cells that have been selected in the table.
   *
   * @memberof Core#
   * @function emptySelectedCells
   * @param {string} [source] String that identifies how this change will be described in the changes array (useful in afterChange or beforeChange callback). Set to 'edit' if left empty.
   * @since 0.36.0
   */
  this.emptySelectedCells = function(source: string) {
    if (!selection.isSelected() || this.countRows() === 0 || this.countCols() === 0) {
      return;
    }

    const changes: Array<[number, number, unknown]> = [];

    arrayEach(selection.getSelectedRange(), (cellRange: CellRange) => {
      if (cellRange.isSingleHeader()) {
        return;
      }

      const topStart = cellRange.getTopStartCorner();
      const bottomEnd = cellRange.getBottomEndCorner();
      const fromRow = Math.max(topStart.row!, 0);
      const toRow = Math.min(bottomEnd.row!, this.countRows() - 1);
      const fromColumn = Math.max(topStart.col!, 0);
      const toColumn = Math.min(bottomEnd.col!, this.countCols() - 1);

      if (fromRow > toRow || fromColumn > toColumn) {
        return;
      }

      const collectEmptyCellChanges = (row: number) => {
        rangeEach(fromColumn, toColumn, (column) => {
          if (!this.getCellMeta(row, column).readOnly) {
            changes.push([row, column, null]);
          }
        });
      };

      rangeEach(fromRow, toRow, collectEmptyCellChanges);
    });

    if (changes.length > 0) {
      this.setDataAtCell(changes, source);
    }
  };

  /**
   * Checks if the table rendering process was suspended. See explanation in {@link Core#suspendRender}.
   *
   * @memberof Core#
   * @function isRenderSuspended
   * @since 8.3.0
   * @returns {boolean}
   */
  this.isRenderSuspended = function(this: HotInstance & CoreInternals) {
    return this.renderSuspendedCounter > 0;
  };

  /**
   * Suspends the rendering process. It's helpful to wrap the table render
   * cycles triggered by API calls or UI actions (or both) and call the "render"
   * once in the end. As a result, it improves the performance of wrapped operations.
   * When the table is in the suspend state, most operations will have no visual
   * effect until the rendering state is resumed. Resuming the state automatically
   * invokes the table rendering. To make sure that after executing all operations,
   * the table will be rendered, it's highly recommended to use the {@link Core#batchRender}
   * method or {@link Core#batch}, which additionally aggregates the logic execution
   * that happens behind the table.
   *
   * The method is intended to be used by advanced users. Suspending the rendering
   * process could cause visual glitches when wrongly implemented.
   *
   * Every [`suspendRender()`](@/api/core.md#suspendrender) call needs to correspond with one [`resumeRender()`](@/api/core.md#resumerender) call.
   * For example, if you call [`suspendRender()`](@/api/core.md#suspendrender) 5 times, you need to call [`resumeRender()`](@/api/core.md#resumerender) 5 times as well.
   *
   * @memberof Core#
   * @function suspendRender
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendRender();
   * hot.alter('insert_row_above', 5, 45);
   * hot.alter('insert_col_start', 10, 40);
   * hot.setDataAtCell(1, 1, 'John');
   * hot.setDataAtCell(2, 2, 'Mark');
   * hot.setDataAtCell(3, 3, 'Ann');
   * hot.setDataAtCell(4, 4, 'Sophia');
   * hot.setDataAtCell(5, 5, 'Mia');
   * hot.selectCell(0, 0);
   * hot.resumeRender(); // It re-renders the table internally
   * ```
   */
  this.suspendRender = function(this: HotInstance & CoreInternals) {
    this.renderSuspendedCounter += 1;
  };

  /**
   * Resumes the rendering process. In combination with the {@link Core#suspendRender}
   * method it allows aggregating the table render cycles triggered by API calls or UI
   * actions (or both) and calls the "render" once in the end. When the table is in
   * the suspend state, most operations will have no visual effect until the rendering
   * state is resumed. Resuming the state automatically invokes the table rendering.
   *
   * The method is intended to be used by advanced users. Suspending the rendering
   * process could cause visual glitches when wrongly implemented.
   *
   * Every [`suspendRender()`](@/api/core.md#suspendrender) call needs to correspond with one [`resumeRender()`](@/api/core.md#resumerender) call.
   * For example, if you call [`suspendRender()`](@/api/core.md#suspendrender) 5 times, you need to call [`resumeRender()`](@/api/core.md#resumerender) 5 times as well.
   *
   * @memberof Core#
   * @function resumeRender
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendRender();
   * hot.alter('insert_row_above', 5, 45);
   * hot.alter('insert_col_start', 10, 40);
   * hot.setDataAtCell(1, 1, 'John');
   * hot.setDataAtCell(2, 2, 'Mark');
   * hot.setDataAtCell(3, 3, 'Ann');
   * hot.setDataAtCell(4, 4, 'Sophia');
   * hot.setDataAtCell(5, 5, 'Mia');
   * hot.selectCell(0, 0);
   * hot.resumeRender(); // It re-renders the table internally
   * ```
   */
  this.resumeRender = function(this: HotInstance & CoreInternals) {
    const nextValue = this.renderSuspendedCounter - 1;

    this.renderSuspendedCounter = Math.max(nextValue, 0);

    if (!this.isRenderSuspended() && nextValue === this.renderSuspendedCounter) {
      instance.view.render();
    }
  };

  /**
   * Rerender the table. Calling this method starts the process of recalculating, redrawing and applying the changes
   * to the DOM. While rendering the table all cell renderers are recalled.
   *
   * Calling this method manually is not recommended. Handsontable tries to render itself by choosing the most
   * optimal moments in its lifecycle.
   *
   * @memberof Core#
   * @function render
   */
  this.render = function() {
    if (this.view) {
      // used when data was changed or when all cells need to be re-rendered (slow render)
      this.forceFullRender = true;

      if (!this.isRenderSuspended()) {
        instance.view.render();
      }
    }
  };

  /**
   * The method aggregates multi-line API calls into a callback and postpones the
   * table rendering process. After the execution of the operations, the table is
   * rendered once. As a result, it improves the performance of wrapped operations.
   * Without batching, a similar case could trigger multiple table render calls.
   *
   * @memberof Core#
   * @function batchRender
   * @param {Function} wrappedOperations Batched operations wrapped in a function.
   * @returns {*} Returns result from the wrappedOperations callback.
   * @since 8.3.0
   * @example
   * ```js
   * hot.batchRender(() => {
   *   hot.alter('insert_row_above', 5, 45);
   *   hot.alter('insert_col_start', 10, 40);
   *   hot.setDataAtCell(1, 1, 'John');
   *   hot.setDataAtCell(2, 2, 'Mark');
   *   hot.setDataAtCell(3, 3, 'Ann');
   *   hot.setDataAtCell(4, 4, 'Sophia');
   *   hot.setDataAtCell(5, 5, 'Mia');
   *   hot.selectCell(0, 0);
   *   // The table will be rendered once after executing the callback
   * });
   * ```
   */
  this.batchRender = function<T>(wrappedOperations: () => T): T {
    instance.suspendRender();

    const result = wrappedOperations();

    instance.resumeRender();

    return result;
  };

  /**
   * Checks if the table indexes recalculation process was suspended. See explanation
   * in {@link Core#suspendExecution}.
   *
   * @memberof Core#
   * @function isExecutionSuspended
   * @since 8.3.0
   * @returns {boolean}
   */
  this.isExecutionSuspended = function(this: HotInstance & CoreInternals) {
    return this.executionSuspendedCounter > 0;
  };

  /**
   * Suspends the execution process. It's helpful to wrap the table logic changes
   * such as index changes into one call after which the cache is updated. As a result,
   * it improves the performance of wrapped operations.
   *
   * The method is intended to be used by advanced users. Suspending the execution
   * process could cause visual glitches caused by not updated the internal table cache.
   *
   * @memberof Core#
   * @function suspendExecution
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendExecution();
   * const filters = hot.getPlugin('filters');
   *
   * filters.addCondition(2, 'contains', ['3']);
   * filters.filter();
   * hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
   * hot.resumeExecution(); // It updates the cache internally
   * ```
   */
  this.suspendExecution = function(this: HotInstance & CoreInternals) {
    this.executionSuspendedCounter += 1;
    this.columnIndexMapper.suspendOperations();
    this.rowIndexMapper.suspendOperations();
  };

  /**
   * Resumes the execution process. In combination with the {@link Core#suspendExecution}
   * method it allows aggregating the table logic changes after which the cache is
   * updated. Resuming the state automatically invokes the table cache updating process.
   *
   * The method is intended to be used by advanced users. Suspending the execution
   * process could cause visual glitches caused by not updated the internal table cache.
   *
   * @memberof Core#
   * @function resumeExecution
   * @param {boolean} [forceFlushChanges=false] If `true`, the table internal data cache
   * is recalculated after the execution of the batched operations. For nested
   * {@link Core#batchExecution} calls, it can be desire to recalculate the table
   * after each batch.
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendExecution();
   * const filters = hot.getPlugin('filters');
   *
   * filters.addCondition(2, 'contains', ['3']);
   * filters.filter();
   * hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
   * hot.resumeExecution(); // It updates the cache internally
   * ```
   */
  this.resumeExecution = function(this: HotInstance & CoreInternals, forceFlushChanges = false) {
    const nextValue = this.executionSuspendedCounter - 1;

    this.executionSuspendedCounter = Math.max(nextValue, 0);

    if ((!this.isExecutionSuspended() && nextValue === this.executionSuspendedCounter) || forceFlushChanges) {
      this.columnIndexMapper.resumeOperations();
      this.rowIndexMapper.resumeOperations();
    }
  };

  /**
   * The method aggregates multi-line API calls into a callback and postpones the
   * table execution process. After the execution of the operations, the internal table
   * cache is recalculated once. As a result, it improves the performance of wrapped
   * operations. Without batching, a similar case could trigger multiple table cache rebuilds.
   *
   * @memberof Core#
   * @function batchExecution
   * @param {Function} wrappedOperations Batched operations wrapped in a function.
   * @param {boolean} [forceFlushChanges=false] If `true`, the table internal data cache
   * is recalculated after the execution of the batched operations. For nested calls,
   * it can be a desire to recalculate the table after each batch.
   * @returns {*} Returns result from the wrappedOperations callback.
   * @since 8.3.0
   * @example
   * ```js
   * hot.batchExecution(() => {
   *   const filters = hot.getPlugin('filters');
   *
   *   filters.addCondition(2, 'contains', ['3']);
   *   filters.filter();
   *   hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
   *   // The table cache will be recalculated once after executing the callback
   * });
   * ```
   */
  this.batchExecution = function<T>(wrappedOperations: () => T, forceFlushChanges = false): T {
    instance.suspendExecution();

    const result = wrappedOperations();

    instance.resumeExecution(forceFlushChanges);

    return result;
  };

  /**
   * It batches the rendering process and index recalculations. The method aggregates
   * multi-line API calls into a callback and postpones the table rendering process
   * as well aggregates the table logic changes such as index changes into one call
   * after which the cache is updated. After the execution of the operations, the
   * table is rendered, and the cache is updated once. As a result, it improves the
   * performance of wrapped operations.
   *
   * @memberof Core#
   * @function batch
   * @param {Function} wrappedOperations Batched operations wrapped in a function.
   * @returns {*} Returns result from the wrappedOperations callback.
   * @since 8.3.0
   * @example
   * ```js
   * hot.batch(() => {
   *   hot.alter('insert_row_above', 5, 45);
   *   hot.alter('insert_col_start', 10, 40);
   *   hot.setDataAtCell(1, 1, 'x');
   *   hot.setDataAtCell(2, 2, 'c');
   *   hot.setDataAtCell(3, 3, 'v');
   *   hot.setDataAtCell(4, 4, 'b');
   *   hot.setDataAtCell(5, 5, 'n');
   *   hot.selectCell(0, 0);
   *
   *   const filters = hot.getPlugin('filters');
   *
   *   filters.addCondition(2, 'contains', ['3']);
   *   filters.filter();
   *   hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
   *   // The table will be re-rendered and cache will be recalculated once after executing the callback
   * });
   * ```
   */
  this.batch = function<T>(wrappedOperations: () => T): T {
    instance.suspendRender();
    instance.suspendExecution();

    const result = wrappedOperations();

    instance.resumeExecution();
    instance.resumeRender();

    return result;
  };

  /**
   * Updates dimensions of the table. The method compares previous dimensions with the current ones and updates accordingly.
   *
   * @memberof Core#
   * @function refreshDimensions
   * @fires Hooks#beforeRefreshDimensions
   * @fires Hooks#afterRefreshDimensions
   */
  this.refreshDimensions = function() {
    if (!instance.view) {
      return;
    }

    const view = instance.view;

    const { width: lastWidth, height: lastHeight } = view.getLastSize();

    const { width, height } = instance.rootElement.getBoundingClientRect();
    const isSizeChanged = width !== lastWidth || height !== lastHeight;
    const isResizeBlocked = instance.runHooks(
      'beforeRefreshDimensions',

      { width: lastWidth, height: lastHeight },

      { width, height },
      isSizeChanged
    ) === false;

    if (isResizeBlocked) {
      return;
    }

    if (isSizeChanged || view._wt.wtOverlays.scrollableElement === instance.rootWindow) {
      view.setLastSize(width, height);
      view.adjustElementsSize();
      instance.render();
    }

    instance.runHooks(
      'afterRefreshDimensions',

      { width: lastWidth, height: lastHeight },

      { width, height },
      isSizeChanged
    );
  };

  /**
   * The `updateData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.
   *
   * The `updateData()` method:
   * - Keeps cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
   * - Keeps rows' states (e.g. row order)
   * - Keeps columns' states (e.g. column order)
   *
   * To replace Handsontable's [`data`](@/api/options.md#data) and reset states, use the [`loadData()`](#loaddata) method.
   *
   * Read more:
   * - [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
   * - [Saving data](@/guides/getting-started/saving-data/saving-data.md)
   *
   * @memberof Core#
   * @function updateData
   * @since 11.1.0
   * @param {Array} data An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data
   * @param {string} [source] The source of the `updateData()` call
   * @fires Hooks#beforeUpdateData
   * @fires Hooks#afterUpdateData
   * @fires Hooks#afterChange
   */
  this.updateData = function(data: unknown[][][] | object[], source: string) {
    replaceData(
      data,
      (newDataMap: DataMapInstance) => {
        datamap = newDataMap;
      },
      (newDataMap: DataMapInstance) => {
        datamap = newDataMap;

        instance.columnIndexMapper.fitToLength(this.getInitialColumnCount());
        instance.rowIndexMapper.fitToLength(this.countSourceRows());

        grid.adjustRowsAndCols();
        selection.markSource('updateData');
        selection.refresh();
        selection.markEndSource();
      }, {

        hotInstance: instance,
        dataMap: datamap,
        dataSource,
        internalSource: 'updateData',
        source,
        metaManager,
        firstRun
      });
  };

  /**
   * The `loadData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.
   *
   * Additionally, the `loadData()` method:
   * - Resets cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
   * - Resets rows' states (e.g. row order)
   * - Resets columns' states (e.g. column order)
   *
   * To replace Handsontable's [`data`](@/api/options.md#data) without resetting states, use the [`updateData()`](#updatedata) method.
   *
   * Read more:
   * - [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
   * - [Saving data](@/guides/getting-started/saving-data/saving-data.md)
   *
   * @memberof Core#
   * @function loadData
   * @param {Array} data An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data
   * @param {string} [source] The source of the `loadData()` call
   * @fires Hooks#beforeLoadData
   * @fires Hooks#afterLoadData
   * @fires Hooks#afterChange
   */
  this.loadData = function(data: unknown[][][] | object[], source: string) {
    replaceData(
      data,
      (newDataMap: DataMapInstance) => {
        datamap = newDataMap;
      },
      () => {
        metaManager.clearCellsCache();
        instance.initIndexMappers();
        grid.adjustRowsAndCols();
        selection.markSource('loadData');
        selection.refresh();
        selection.markEndSource();

        if (firstRun) {
          firstRun = [null, 'loadData'];
        }
      }, {

        hotInstance: instance,
        dataMap: datamap,
        dataSource,
        internalSource: 'loadData',
        source,
        metaManager,
        firstRun
      });
  };

  /**
   * Gets the initial column count, calculated based on the `columns` setting.
   *
   * @private
   * @returns {number} The calculated number of columns.
   */
  this.getInitialColumnCount = function() {
    const columnsSettings = tableMeta.columns;
    let finalNrOfColumns = 0;

    // We will check number of columns when the `columns` property was defined as an array. Columns option may
    // narrow down or expand displayed dataset in that case.
    if (Array.isArray(columnsSettings)) {
      finalNrOfColumns = columnsSettings.length;

    } else if (isFunction(columnsSettings)) {
      if (instance.dataType === 'array') {
        const nrOfSourceColumns = instance.countSourceCols();

        for (let columnIndex = 0; columnIndex < nrOfSourceColumns; columnIndex += 1) {
          if (columnsSettings(columnIndex)) {
            finalNrOfColumns += 1;
          }
        }

        // Extended dataset by the `columns` property? Moved code right from the refactored `countCols` method.
      } else if (instance.dataType === 'object' || instance.dataType === 'function') {
        finalNrOfColumns = datamap.colToPropCache.length;
      }

      // In some cases we need to check columns length from the schema, i.e. `data` may be empty.
    } else if (isDefined(tableMeta.dataSchema)) {
      const schema = datamap.getSchema();

      // Schema may be defined as an array of objects. Each object will define column.
      finalNrOfColumns = Array.isArray(schema) ? schema.length : deepObjectSize(schema);

    } else {
      // We init index mappers by length of source data to provide indexes also for skipped indexes.
      finalNrOfColumns = instance.countSourceCols();
    }

    return finalNrOfColumns;
  };

  /**
   * Init index mapper which manage indexes assigned to the data.
   *
   * @private
   */
  this.initIndexMappers = function() {
    this.columnIndexMapper.initToLength(this.getInitialColumnCount());
    this.rowIndexMapper.initToLength(this.countSourceRows());
  };

  /**
   * Returns the current data object (the same one that was passed by `data` configuration option or `loadData` method,
   * unless some modifications have been applied (i.e. Sequence of rows/columns was changed, some row/column was skipped).
   * If that's the case - use the {@link Core#getSourceData} method.).
   *
   * Optionally you can provide cell range by defining `row`, `column`, `row2`, `column2` to get only a fragment of table data.
   *
   * @memberof Core#
   * @function getData
   * @param {number} [row] From visual row index.
   * @param {number} [column] From visual column index.
   * @param {number} [row2] To visual row index.
   * @param {number} [column2] To visual column index.
   * @returns {Array[]} Array with the data.
   * @example
   * ```js
   * // Get all data (in order how it is rendered in the table).
   * hot.getData();
   * // Get data fragment (from top-left 0, 0 to bottom-right 3, 3).
   * hot.getData(3, 3);
   * // Get data fragment (from top-left 2, 1 to bottom-right 3, 3).
   * hot.getData(2, 1, 3, 3);
   * ```
   */
  this.getData = function(row: number, column: number, row2: number, column2: number) {
    if (isUndefined(row)) {
      return datamap.getAll();
    }

    return datamap.getRange(
      instance._createCellCoords(row, column) as { row: number; col: number },
      instance._createCellCoords(row2, column2) as { row: number; col: number },
      DataMap.DESTINATION_RENDERER
    );
  };

  /**
   * Returns a string value of the selected range. Each column is separated by tab, each row is separated by a new
   * line character.
   *
   * @memberof Core#
   * @function getCopyableText
   * @param {number} startRow From visual row index.
   * @param {number} startCol From visual column index.
   * @param {number} endRow To visual row index.
   * @param {number} endCol To visual column index.
   * @returns {string}
   */
  this.getCopyableText = function(startRow: number, startCol: number, endRow: number, endCol: number) {
    return datamap.getCopyableText(
      instance._createCellCoords(startRow, startCol) as { row: number; col: number },
      instance._createCellCoords(endRow, endCol) as { row: number; col: number }
    );
  };

  /**
   * Returns the data's copyable value at specified `row` and `column` index.
   *
   * @memberof Core#
   * @function getCopyableData
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {string}
   */
  this.getCopyableData = function(row: number, column: number) {
    return datamap.getCopyable(row, datamap.colToProp(column)) as string;
  };

  /**
   * Returns the source data's copyable value at specified `row` and `column` index.
   *
   * @memberof Core#
   * @function getCopyableSourceData
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @since 16.1.0
   * @returns {string}
   */
  this.getCopyableSourceData = function(row: number, column: number) {
    return dataSource.getCopyable(row, datamap.colToProp(column)) as string;
  };

  /**
   * Returns schema provided by constructor settings. If it doesn't exist then it returns the schema based on the data
   * structure in the first row.
   *
   * @memberof Core#
   * @function getSchema
   * @returns {object} Schema object.
   */
  this.getSchema = function() {
    return datamap.getSchema();
  };

  /**
   * Use it if you need to change configuration after initialization. The `settings` argument is an object containing the changed
   * settings, declared the same way as in the initial settings object.
   *
   * __Note__, that although the `updateSettings` method doesn't overwrite the previously declared settings, it might reset
   * the settings made post-initialization. (for example - ignore changes made using the columnResize feature).
   *
   * Since 8.0.0 passing `columns` or `data` inside `settings` objects will result in resetting states corresponding to rows and columns
   * (for example, row/column sequence, column width, row height, frozen columns etc.).
   *
   * Since 12.0.0 passing `data` inside `settings` objects no longer results in resetting states corresponding to rows and columns
   * (for example, row/column sequence, column width, row height, frozen columns etc.).
   *
   * Cell meta set imperatively through [[setCellMeta]] (for example, by the user or the context menu) is preserved across
   * `updateSettings`, even when `settings` includes `cell`, `cells`, or `columns`. On a direct conflict, a value re-stated
   * through the declarative `cell` option takes precedence over the preserved imperative value.
   *
   * When [[Hooks#hasExternalDataSource]] is true, Handsontable clears and rebinds the placeholder dataset only during
   * initialization or when `settings` includes `data` or `dataProvider`. Other keys alone (for example `height`) do not clear loaded rows.
   * If only `columns` changes, the column map is rebuilt without clearing rows.
   *
   * @memberof Core#
   * @function updateSettings
   * @param {object} settings A settings object (see {@link Options}). Only provide the settings that are changed, not the whole settings object that was used for initialization.
   * @param {boolean} [init=false] Internally used during initialization.
   * @example
   * ```js
   * hot.updateSettings({
   *    contextMenu: true,
   *    colHeaders: true,
   *    fixedRowsTop: 2
   * });
   * ```
   * @fires Hooks#afterCellMetaReset
   * @fires Hooks#afterUpdateSettings
   */
  this.updateSettings = function(settings: Partial<GridSettings>, init = false) {

    const dataUpdateFunction = (firstRun ? instance.loadData : instance.updateData).bind(this);
    let i;
    let j;

    if (isDefined(settings.rows)) {
      throwWithCause('The "rows" setting is no longer supported. Do you mean startRows, minRows or maxRows?');
    }
    if (isDefined(settings.cols)) {
      throwWithCause('The "cols" setting is no longer supported. Do you mean startCols, minCols or maxCols?');
    }
    if (isDefined(settings.ganttChart)) {
      throwWithCause('Since 8.0.0 the "ganttChart" setting is no longer supported.');
    }

    if (isDefined(settings.rowHeights) && isDefined(settings.minRowHeights)) {
      warn('Both `rowHeights` and `minRowHeights` are defined in your configuration. ' +
        'As one is the alias of the other, only one of them can be used at a time. ' +
        '`rowHeights` will be used as the row height configuration.');
    }

    // eslint-disable-next-line no-restricted-syntax
    for (i in settings) {
      if (i === 'data' || i === 'language') {
        // Do nothing. loadData and language change will be triggered later

      } else if (i === 'className') {
        setClassName('className', settings.className);

      } else if (i === 'tableClassName' && instance.table) {
        setClassName('tableClassName', settings.tableClassName);

        instance.view._wt.wtOverlays.syncOverlayTableClassNames();

      } else if (Hooks.getSingleton().isRegistered(i) || Hooks.getSingleton().isDeprecated(i)) {
        const hook = settings[i] as HookCallback | HookCallback[] | undefined;

        if (isFunction(hook)) {
          Hooks.getSingleton().addAsFixed(i, hook, instance);
          tableMeta[i] = hook;

        } else if (Array.isArray(hook)) {
          Hooks.getSingleton().add(i, hook, instance);
          tableMeta[i] = hook;
        }

      } else if (!init && hasOwnProperty(settings, i)) { // Update settings
        globalMeta[i] = settings[i];
      }
    }

    const rootContainerThemeClassName = getThemeClassName(instance.rootContainer);
    const themeNameOptionExists = hasOwnProperty(settings, 'themeName');
    const themeOptionExists = hasOwnProperty(settings, 'theme');

    if (themeNameOptionExists && themeOptionExists) {
      warn('Both `theme` and `themeName` are defined in your configuration. ' +
      'These options are aliases and cannot be used together. ' +
      'The `themeName` option will be ignored.');
    }

    // Update the theme via the `theme` or `themeName` option as a string or undefined.
    if (init) {
      let themeName;

      if (themeOptionExists && typeof settings.theme === 'string') {
        themeName = settings.theme;

      } else if (
        themeNameOptionExists &&
        typeof settings.themeName === 'string' &&
        settings.themeName &&
        !themeOptionExists
      ) {
        themeName = settings.themeName;
        tableMeta.theme = settings.themeName;
        tableMeta.themeName = undefined;

      } else if (rootContainerThemeClassName) {
        themeName = rootContainerThemeClassName;

      } else if (instance.themeManager) {

        themeName = instance.themeManager.getClassName();
      }

      instance.useTheme(themeName ?? null);
    } else {
      const currentThemeName = instance.getCurrentThemeName();

      // Use `theme` option if it's a string and differs from current theme (takes priority over `themeName`).
      if (themeOptionExists && typeof settings.theme === 'string' && currentThemeName !== settings.theme) {
        instance.themeManager?.unmount();
        instance.themeManager = null;
        instance.useTheme(settings.theme);

      // Use `themeName` option if `theme` is not provided and the name differs from current theme.
      } else if (themeNameOptionExists && !themeOptionExists && currentThemeName !== settings.themeName) {
        instance.themeManager?.unmount();
        instance.themeManager = null;
        tableMeta.theme = settings.themeName;
        tableMeta.themeName = undefined;
        instance.useTheme(settings.themeName!);

      // Initialize or update the themeManager when theme is an object.
      } else if (
        isRootInstance(instance) &&
        !rootContainerThemeClassName &&
        isObject(settings.theme)
      ) {
        if (instance.themeManager === null) {
          initializeThemeManager(settings.theme as ThemeBuilder);
          instance.useTheme(instance.themeManager!.getClassName());

        } else {
          let themeObject;

          if (typeof (settings.theme as { getThemeConfig?: () => unknown }).getThemeConfig !== 'function') {

            themeObject = registerTheme(settings.theme);
          } else {
            themeObject = settings.theme as ThemeBuilder;
          }

          instance.themeManager!.update(themeObject);
          instance.useTheme(instance.themeManager!.getClassName());
        }
      }
    }

    // Load data or create data map
    if (instance.runHooks('hasExternalDataSource') === true) {
      // When dataProvider is a complete server-backed config, ignore static data, the plugin loads rows.
      if (settings.data) {
        warn('The "data" setting is ignored when "hasExternalDataSource" returns `true`.');
      }

      // Replace the in-memory placeholder only when the update touches init, `data`, or `dataProvider`. Otherwise
      // `updateData([], …)` would empty the grid without a refetch, because DataProvider runs `updatePlugin` only when
      // `dataProvider` is present in this payload.
      const shouldSyncExternalPlaceholderData = init ||
        hasOwnProperty(settings, 'data') ||
        hasOwnProperty(settings, 'dataProvider');

      if (shouldSyncExternalPlaceholderData) {
        dataUpdateFunction([], 'updateSettings');
      } else if (settings.columns !== undefined) {
        datamap.createMap();
        instance.initIndexMappers();
      }

    } else if (settings.data === undefined && tableMeta.data === undefined) {
      dataUpdateFunction(null as unknown as unknown[], 'updateSettings'); // data source created just now

    } else if (settings.data !== undefined) {
      dataUpdateFunction(settings.data, 'updateSettings'); // data source given as option

    } else if (settings.columns !== undefined) {
      datamap.createMap();

      // The `column` property has changed - dataset may be expanded or narrowed down. The `loadData` do the same.
      instance.initIndexMappers();
    }

    if (!firstRun && settings.language) {
      setLanguage(settings.language);
    }

    const clen = instance.countCols();

    const columnSetting = tableMeta.columns;

    // Clear cell meta cache. Cell meta set imperatively through `setCellMeta` (for example, by the
    // user or the context menu) is snapshotted beforehand and replayed afterward, so that it
    // survives the clear instead of being discarded (see GitHub issue #4446).
    if (settings.cell !== undefined || settings.cells !== undefined || settings.columns !== undefined) {
      const userDefinedCellMetas = metaManager.getUserDefinedCellMetas();

      metaManager.clearCache();

      // Replay before the column and `cell` option re-application, so that a value re-stated through
      // the declarative `cell` option still wins on a direct conflict (preserving legacy behavior).
      userDefinedCellMetas.forEach(({ physicalRow, physicalColumn, key, value }) => {
        metaManager.setCellMeta(physicalRow, physicalColumn, key, value);
      });
    }

    if (clen > 0) {
      for (i = 0, j = 0; i < clen; i++) {
        // Use settings provided by user
        if (columnSetting) {
          const column = isFunction(columnSetting)
            ? (columnSetting as (i: number) => Record<string, unknown>)(i)
            : columnSetting[j];

          if (column) {
            metaManager.updateColumnMeta(j, column);
          }
        }

        j += 1;
      }
    }

    if (isDefined(settings.cell)) {
      // The `cell` option is declarative - it is re-applied from settings on every `updateSettings`
      // call. Recording is disabled so these writes are not tracked as user-defined (and a key
      // re-stated here de-marks any imperative value), keeping `updateSettings({ cell: [] })` able
      // to remove previously declared entries.
      metaManager.disableUserDefinedMetaRecording();

      try {
        (settings.cell as Record<string, unknown>[]).forEach((cell: Record<string, unknown>) => {
          instance.setCellMetaObject(cell.row as number, cell.col as number, cell);
        });
      } finally {
        metaManager.enableUserDefinedMetaRecording();
      }
    }

    instance.runHooks('afterCellMetaReset');

    // for the first run, we need to run the source data warnings after cell meta initialization
    // otherwise there is no access to `sourceDataValidator` function
    if (firstRun) {
      runSourceDataValidators(instance, 'init');
    }

    let currentHeight: string | number = instance.rootElement.style.height;

    if (currentHeight !== '') {
      currentHeight = parseInt(instance.rootElement.style.height, 10);
    }

    if (init) {

      const initialStyle = instance.rootElement.getAttribute('style');

      if (initialStyle) {
        instance.rootElement.dataset.initialstyle = instance.rootElement.getAttribute('style') ?? '';
      }
    }

    let height = settings.height;

    if (typeof settings.height !== 'undefined') {
      if (isFunction(height)) {
        height = (height as () => string | number)();
      }

      height = instance.runHooks('beforeHeightChange', height);

      if (height === null) {

        const initialStyle = instance.rootElement.dataset.initialstyle;

        if (initialStyle && (initialStyle.indexOf('height') > -1 || initialStyle.indexOf('overflow') > -1)) {
          instance.rootElement.setAttribute('style', initialStyle);

        } else {
          instance.rootElement.style.height = '';
          instance.rootElement.style.overflow = '';
        }

      } else if (height !== undefined) {
        instance.rootElement.style.height = isNaN(height as number) ? `${height}` : `${height}px`;
        instance.rootElement.style.overflow = 'clip';
      }
    }

    if (typeof settings.width !== 'undefined') {
      let width = settings.width;

      if (isFunction(width)) {
        width = (width as () => string | number)();
      }

      width = instance.runHooks('beforeWidthChange', width);
      instance.rootElement.style.width = isNaN(width as number) ? `${width}` : `${width}px`;
    }

    // When height is absent the table uses window scroll, so the `overflow: clip` shorthand from the
    // height block is not applied. Set overflowX: clip to prevent the inner table from visually
    // overflowing a constrained width. Read the effective values from the DOM (after both height and
    // width blocks ran) so partial updateSettings calls see the correct state.
    // When height IS set, the height block's `overflow: clip` shorthand handles both axes — leave
    // overflowX untouched to avoid breaking that shorthand.
    // Browser compatibility: `overflow-x: clip` requires Safari 16+. On Safari 14.1–15.x it silently
    // falls back to `visible` (graceful degradation — pre-existing behavior, not a new regression).
    if (typeof settings.height !== 'undefined' || typeof settings.width !== 'undefined') {
      const effectiveHeight = instance.rootElement.style.height;
      const effectiveWidth = instance.rootElement.style.width;

      if (!effectiveHeight) {
        const currentOverflowX = instance.rootElement.style.overflowX;

        // Only manage the overflow-x we own (`clip`) or that is unset. Preserve a user-defined
        // overflow (e.g. `overflow: hidden` restored from the initial style) so it is not stomped
        // by `clip`. Unlike `hidden`, `clip` creates no block formatting context and allows no
        // programmatic scroll.
        if (currentOverflowX === '' || currentOverflowX === 'clip') {
          instance.rootElement.style.overflowX =
            (effectiveWidth && effectiveWidth !== 'auto') ? 'clip' : '';
        }
      }
    }

    if (!init) {
      if (instance.view) {
        instance.view._wt.wtViewport.resetHasOversizedColumnHeadersMarked();
        instance.view._wt.exportSettingsAsClassNames();
        instance.view.invalidateIndexSizesCache();
      }

      selection.updateHighlightClassNames();
      instance.runHooks('afterUpdateSettings', settings);
    }

    grid.adjustRowsAndCols();

    if (instance.view && !firstRun) {
      instance.render();
      instance.view._wt.wtOverlays.adjustElementsSize();
    }

    if (!init && instance.view && (currentHeight === '' || height === '' || height === undefined) &&
        currentHeight !== height) {
      instance.view._wt.wtOverlays.updateMainScrollableElements();
    }

    if (isRootInstance(instance)) {
      layoutManager?.applyConfig(tableMeta.layout as LayoutConfig | undefined);
    }
  };

  /**
   * Gets the value of the currently focused cell.
   *
   * For column headers and row headers, returns `null`.
   *
   * @memberof Core#
   * @function getValue
   * @returns {*} The value of the focused cell.
   */
  this.getValue = function(): unknown {
    const activeSelection = instance.getSelectedRangeActive() as CellRange | undefined;

    if (tableMeta.getValue) {
      if (isFunction(tableMeta.getValue)) {
        return (tableMeta.getValue as Function).call(instance) as unknown;

      } else if (activeSelection && typeof tableMeta.getValue === 'string') {
        const rowIndex = activeSelection.highlight.row ?? 0;
        const rowData = (instance.getData() as unknown[][])[rowIndex];

        return (rowData as unknown as Record<string, unknown>)[tableMeta.getValue];
      }

    } else if (activeSelection) {
      return instance.getDataAtCell(activeSelection.highlight.row!, activeSelection.highlight.col!) as unknown;
    }

    return null;
  };

  /**
   * Returns the object settings.
   *
   * @memberof Core#
   * @function getSettings
   * @returns {TableMeta} Object containing the current table settings.
   */
  this.getSettings = function() {
    return tableMeta as unknown as GridSettings;
  };

  /**
   * Clears the data from the table (the table settings remain intact) and clears the current selection.
   *
   * @memberof Core#
   * @function clear
   */
  this.clear = function(this: HotInstance & CoreInternals) {
    this.selectAll();
    this.emptySelectedCells();
    this.deselectCell();
  };

  /**
   * The `alter()` method lets you alter the grid's structure
   * by adding or removing rows and columns at specified positions.
   *
   * ::: tip
   * If you use an array of objects in your [`data`](@/api/options.md#data), the column-related actions won't work.
   * :::
   *
   * ```js
   * // above row 10 (by visual index), insert 1 new row
   * hot.alter('insert_row_above', 10);
   * ```
   *
   *  | Action               | With `index` | Without `index` |
   *  | -------------------- | ------------ | --------------- |
   *  | `'insert_row_above'` | Inserts rows above the `index` row. | Inserts rows above the first row. |
   *  | `'insert_row_below'` | Inserts rows below the `index` row. | Inserts rows below the last row. |
   *  | `'remove_row'`       | Removes rows, starting from the `index` row. | Removes rows, starting from the last row. |
   *  | `'insert_col_start'` | Inserts columns before the `index` column. | Inserts columns before the first column. |
   *  | `'insert_col_end'`   | Inserts columns after the `index` column. | Inserts columns after the last column. |
   *  | `'remove_col'`       | Removes columns, starting from the `index` column. | Removes columns, starting from the last column. |
   *
   * Additional information about `'insert_col_start'` and `'insert_col_end'`:
   * - Their behavior depends on your [`layoutDirection`](@/api/options.md#layoutdirection).
   * - If the provided `index` is higher than the actual number of columns, Handsontable doesn't generate
   * the columns missing in between. Instead, the new columns are inserted next to the last column.
   *
   * @memberof Core#
   * @function alter
   * @param {string} action Available operations:
   * <ul>
   *    <li> `'insert_row_above'` </li>
   *    <li> `'insert_row_below'` </li>
   *    <li> `'remove_row'` </li> </li>
   *    <li> `'insert_col_start'` </li>
   *    <li> `'insert_col_end'` </li>
   *    <li> `'remove_col'` </li>
   * </ul>
   * @param {number|number[]} [index] A visual index of the row/column before or after which the new row/column will be
   *                                inserted or removed. Can also be an array of arrays, in format `[[index, amount],...]`.
   * @param {number} [amount] The amount of rows or columns to be inserted or removed (default: `1`).
   * @param {string} [source] Source indicator.
   * @param {boolean} [keepEmptyRows] If set to `true`: prevents removing empty rows.
   * @example
   * ```js
   * // above row 10 (by visual index), insert 1 new row
   * hot.alter('insert_row_above', 10);
   *
   * // below row 10 (by visual index), insert 3 new rows
   * hot.alter('insert_row_below', 10, 3);
   *
   * // in the LTR layout direction: to the left of column 10 (by visual index), insert 3 new columns
   * // in the RTL layout direction: to the right of column 10 (by visual index), insert 3 new columns
   * hot.alter('insert_col_start', 10, 3);
   *
   * // in the LTR layout direction: to the right of column 10 (by visual index), insert 1 new column
   * // in the RTL layout direction: to the left of column 10 (by visual index), insert 1 new column
   * hot.alter('insert_col_end', 10);
   *
   * // remove 2 rows, starting from row 10 (by visual index)
   * hot.alter('remove_row', 10, 2);
   *
   * // remove 3 rows, starting from row 1 (by visual index)
   * // remove 2 rows, starting from row 5 (by visual index)
   * hot.alter('remove_row', [[1, 3], [5, 2]]);
   * ```
   */
  this.alter = function(
    action: string, index: number | number[][] | undefined, amount: number, source: string, keepEmptyRows: boolean
  ) {
    grid.alter(action, index, amount, source, keepEmptyRows);
  };

  /**
   * Returns a TD element for the given `row` and `column` arguments, if it is rendered on screen.
   * Returns `null` if the TD is not rendered on screen (probably because that part of the table is not visible).
   *
   * @memberof Core#
   * @function getCell
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {boolean} [topmost=false] If set to `true`, it returns the TD element from the topmost overlay. For example,
   * if the wanted cell is in the range of fixed rows, it will return a TD element from the `top` overlay.
   * @returns {HTMLTableCellElement|null} The cell's TD element.
   */
  this.getCell = function(row: number, column: number, topmost = false) {
    let renderableColumnIndex: number | null = column; // Handling also column headers.
    let renderableRowIndex: number | null = row; // Handling also row headers.

    if (column >= 0) {
      if (instance.columnIndexMapper.isHidden(instance.toPhysicalColumn(column))) {
        return null;
      }

      renderableColumnIndex = instance.columnIndexMapper.getRenderableFromVisualIndex(column);
    }

    if (row >= 0) {
      if (instance.rowIndexMapper.isHidden(instance.toPhysicalRow(row))) {
        return null;
      }

      renderableRowIndex = instance.rowIndexMapper.getRenderableFromVisualIndex(row);
    }

    if (
      renderableRowIndex === null ||
      renderableColumnIndex === null ||
      renderableRowIndex === undefined ||
      renderableColumnIndex === undefined
    ) {
      return null;
    }

    return (instance.view as TableView)
      .getCellAtCoords(
        instance._createCellCoords(renderableRowIndex, renderableColumnIndex) as unknown as {row: number, col: number},
        topmost
      ) as HTMLTableCellElement | null;
  };

  /**
   * Returns the coordinates of the cell, provided as a HTML table cell element.
   *
   * @memberof Core#
   * @function getCoords
   * @param {HTMLTableCellElement} element The HTML Element representing the cell.
   * @returns {CellCoords|null} Visual coordinates object.
   * @example
   * ```js
   * hot.getCoords(hot.getCell(1, 1));
   * // it returns CellCoords object instance with props row: 1 and col: 1.
   * ```
   */
  this.getCoords = function(element: HTMLElement) {
    const renderableCoords = instance.view._wt.wtTable.getCoords(element) as CellCoords | null;

    if (renderableCoords === null) {
      return null;
    }

    const { row: renderableRow, col: renderableColumn } = renderableCoords;

    let visualRow = renderableRow;
    let visualColumn = renderableColumn;

    if (renderableRow !== null && renderableRow >= 0) {
      visualRow = instance.rowIndexMapper.getVisualFromRenderableIndex(renderableRow);
    }

    if (renderableColumn !== null && renderableColumn >= 0) {
      visualColumn = instance.columnIndexMapper.getVisualFromRenderableIndex(renderableColumn);
    }

    return instance._createCellCoords(visualRow, visualColumn) as CellCoords;
  };

  /**
   * Returns the property name that corresponds with the given column index.
   * If the data source is an array of arrays, it returns the columns index.
   *
   * @memberof Core#
   * @function colToProp
   * @param {number} column Visual column index.
   * @returns {string|number} Column property or physical column index.
   */
  this.colToProp = function(column: number) {
    return datamap.colToProp(column);
  };

  /**
   * Returns column index that corresponds with the given property.
   *
   * @memberof Core#
   * @function propToCol
   * @param {string|number} prop Property name or physical column index.
   * @returns {number} Visual column index.
   */
  this.propToCol = function(prop: string | number) {
    return datamap.propToCol(prop) as number;
  };

  /**
   * Translate physical row index into visual.
   *
   * This method is useful when you want to retrieve visual row index which can be reordered, moved or trimmed
   * based on a physical index.
   *
   * @memberof Core#
   * @function toVisualRow
   * @param {number} row Physical row index.
   * @returns {number} Returns visual row index.
   */
  this.toVisualRow = (row: number) =>
    instance.rowIndexMapper.getVisualFromPhysicalIndex(row) as number;

  /**
   * Translate physical column index into visual.
   *
   * This method is useful when you want to retrieve visual column index which can be reordered, moved or trimmed
   * based on a physical index.
   *
   * @memberof Core#
   * @function toVisualColumn
   * @param {number} column Physical column index.
   * @returns {number} Returns visual column index.
   */
  this.toVisualColumn = (column: number) =>
    instance.columnIndexMapper.getVisualFromPhysicalIndex(column) as number;

  /**
   * Translate visual row index into physical.
   *
   * This method is useful when you want to retrieve physical row index based on a visual index which can be
   * reordered, moved or trimmed.
   *
   * @memberof Core#
   * @function toPhysicalRow
   * @param {number} row Visual row index.
   * @returns {number} Returns physical row index.
   */
  this.toPhysicalRow = (row: number) =>
    instance.rowIndexMapper.getPhysicalFromVisualIndex(row) as number;

  /**
   * Translate visual column index into physical.
   *
   * This method is useful when you want to retrieve physical column index based on a visual index which can be
   * reordered, moved or trimmed.
   *
   * @memberof Core#
   * @function toPhysicalColumn
   * @param {number} column Visual column index.
   * @returns {number} Returns physical column index.
   */
  this.toPhysicalColumn = (column: number) =>
    instance.columnIndexMapper.getPhysicalFromVisualIndex(column) as number;

  /**
   * @description
   * Returns the cell value at `row`, `column`.
   *
   * __Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtCell
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {*} Data at cell.
   */
  this.getDataAtCell = function(row: number, column: number) {
    return datamap.get(row, datamap.colToProp(column));
  };

  /**
   * Returns value at visual `row` and `prop` indexes.
   *
   * __Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtRowProp
   * @param {number} row Visual row index.
   * @param {string} prop Property name.
   * @returns {*} Cell value.
   */
  this.getDataAtRowProp = function(row: number, prop: string | number) {
    return datamap.get(row, prop);
  };

  /**
   * @description
   * Returns array of column values from the data source.
   *
   * __Note__: If columns were reordered or sorted, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtCol
   * @param {number} column Visual column index.
   * @returns {Array} Array of cell values.
   */
  this.getDataAtCol = function(column: number) {
    const columnData = [];
    const dataByRows = datamap.getRange(
      instance._createCellCoords(0, column) as { row: number; col: number },
      instance._createCellCoords(tableMeta.data.length - 1, column) as { row: number; col: number },
      DataMap.DESTINATION_RENDERER
    );

    for (let i = 0; i < dataByRows.length; i += 1) {
      for (let j = 0; j < dataByRows[i].length; j += 1) {
        columnData.push(dataByRows[i][j]);
      }
    }

    return columnData;
  };

  /**
   * Given the object property name (e.g. `'first.name'` or `'0'`), returns an array of column's values from the table data.
   * You can also provide a column index as the first argument.
   *
   * @memberof Core#
   * @function getDataAtProp
   * @param {string|number} prop Property name or physical column index.
   * @returns {Array} Array of cell values.
   */
  // TODO: Getting data from `datamap` should work on visual indexes.
  this.getDataAtProp = function(prop: string | number) {
    const columnData = [];
    const dataByRows = datamap.getRange(
      instance._createCellCoords(0, datamap.propToCol(prop) as number | null) as { row: number; col: number },
      instance._createCellCoords(
        tableMeta.data.length - 1, datamap.propToCol(prop) as number | null
      ) as { row: number; col: number },
      DataMap.DESTINATION_RENDERER
    );

    for (let i = 0; i < dataByRows.length; i += 1) {
      for (let j = 0; j < dataByRows[i].length; j += 1) {
        columnData.push(dataByRows[i][j]);
      }
    }

    return columnData;
  };

  /**
   * Returns a clone of the source data object.
   * Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
   * fragment of the table data.
   *
   * __Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
   * sorted or trimmed only physical indexes are correct.
   *
   * __Note__: This method may return incorrect values for cells that contain
   * [formulas](@/guides/formulas/formula-calculation/formula-calculation.md). This is because `getSourceData()`
   * operates on source data ([physical indexes](@/api/indexMapper.md)),
   * whereas formulas operate on visual data (visual indexes).
   *
   * @memberof Core#
   * @function getSourceData
   * @param {number} [row] From physical row index.
   * @param {number} [column] From physical column index (or visual index, if data type is an array of objects).
   * @param {number} [row2] To physical row index.
   * @param {number} [column2] To physical column index (or visual index, if data type is an array of objects).
   * @returns {Array[]|object[]} The table data.
   */
  this.getSourceData = function(row?: number, column?: number, row2?: number, column2?: number) {
    let data;

    if (row === undefined) {
      data = dataSource.getData();
    } else {
      data = dataSource.getByRange(
        instance._createCellCoords(row, column ?? null) as { row?: number; col?: number },
        instance._createCellCoords(row2 ?? null, column2 ?? null) as { row?: number; col?: number }
      );
    }

    return data as unknown[] | object[];
  };

  /**
   * Returns the source data object as an arrays of arrays format even when source data was provided in another format.
   * Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
   * fragment of the table data.
   *
   * __Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
   * sorted or trimmed only physical indexes are correct.
   *
   * @memberof Core#
   * @function getSourceDataArray
   * @param {number} [row] From physical row index.
   * @param {number} [column] From physical column index (or visual index, if data type is an array of objects).
   * @param {number} [row2] To physical row index.
   * @param {number} [column2] To physical column index (or visual index, if data type is an array of objects).
   * @returns {Array} An array of arrays.
   */
  this.getSourceDataArray = function(row?: number, column?: number, row2?: number, column2?: number) {
    let data;

    if (row === undefined) {
      data = dataSource.getData(true);
    } else {
      data = dataSource.getByRange(
        instance._createCellCoords(row, column ?? null) as { row?: number; col?: number },
        instance._createCellCoords(row2 ?? null, column2 ?? null) as { row?: number; col?: number },
        true
      );
    }

    return data as unknown[][];
  };

  /**
   * Returns an array of column values from the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtCol
   * @param {number} column Visual column index.
   * @returns {Array} Array of the column's cell values.
   */
  // TODO: Getting data from `sourceData` should work always on physical indexes.
  this.getSourceDataAtCol = function(column: number) {
    return dataSource.getAtColumn(column);
  };

  /**
   * Set the provided value in the source data set at the provided coordinates.
   *
   * @memberof Core#
   * @function setSourceDataAtCell
   * @param {number|Array} row Physical row index or array of changes in format `[[row, prop, value], ...]`.
   * @param {number|string} column Physical column index / prop name.
   * @param {*} value The value to be set at the provided coordinates.
   * @param {string} [source] Source of the change as a string.
   */

  this.setSourceDataAtCell = function(
    row: number | Array<[number, string | number, unknown]>, column: number | string, value: unknown, source: string
  ) {
    const input = setDataInputToArray(row, column, value);
    const isThereAnySetSourceListener = instance.hasHook('afterSetSourceDataAtCell');
    const changesForHook: Array<Array<unknown>> = [];
    const getCellProperties = (changeRow: number, changeProp: string | number) => {
      const visualRow = instance.toVisualRow(changeRow);
      const visualColumn = instance.toVisualColumn(changeProp as number);

      if (Number.isInteger(visualColumn)) {
        return instance.getCellMeta(visualRow!, visualColumn as number) as Record<string, unknown>;
      }

      // If there's no requested visual column, we can use the table meta as the cell properties
      return { ...(Object.getPrototypeOf(tableMeta) as Record<string, unknown>), ...tableMeta };
    };

    if (isThereAnySetSourceListener) {
      arrayEach(input, ([changeRow, changeProp, changeValue]) => {
        const newValue = getValueSetterValue(
          changeValue,
          getCellProperties(changeRow, changeProp),
        );

        changesForHook.push([
          changeRow,
          changeProp,
          dataSource.getAtCell(changeRow, changeProp), // The previous value.
          newValue,
        ]);
      });
    }

    arrayEach(input, ([changeRow, changeProp, changeValue]) => {
      const cellMeta = getCellProperties(changeRow, changeProp);
      const newValue = getValueSetterValue(
        changeValue,
        cellMeta
      );

      if (runSourceDataValidator(newValue, cellMeta, source ?? 'setSourceDataAtCell')) {
        // changeProp is a physical column index for array-based data sources.
        dataSource.setAtCell(changeRow, changeProp as string | number, newValue);
      }
    });

    if (isThereAnySetSourceListener) {
      this.runHooks('afterSetSourceDataAtCell', changesForHook, source);
    }

    this.render();

    const activeEditor = instance.getActiveEditor();

    if (activeEditor && isDefined(activeEditor.refreshValue)) {
      (activeEditor.refreshValue as () => void)();
    }
  };

  /**
   * Returns a single row of the data (array or object, depending on what data format you use).
   *
   * __Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
   * sorted or trimmed only physical indexes are correct.
   *
   * @memberof Core#
   * @function getSourceDataAtRow
   * @param {number} row Physical row index.
   * @returns {Array|object} Single row of data.
   */
  this.getSourceDataAtRow = function(row: number) {
    return dataSource.getAtRow(row);
  };

  /**
   * Returns a single value from the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtCell
   * @param {number} row Physical row index.
   * @param {number} column Visual column index.
   * @returns {*} Cell data.
   */
  // TODO: Getting data from `sourceData` should work always on physical indexes.
  this.getSourceDataAtCell = function(row: number, column: number) {
    return dataSource.getAtCell(row, column);
  };

  /**
   * @description
   * Returns a single row of the data.
   *
   * __Note__: If rows were reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtRow
   * @param {number} row Visual row index.
   * @returns {Array} Array of row's cell data.
   */
  this.getDataAtRow = function(row: number) {
    const data = datamap.getRange(
      instance._createCellCoords(row, 0) as { row: number; col: number },
      instance._createCellCoords(row, this.countCols() - 1) as { row: number; col: number },
      DataMap.DESTINATION_RENDERER
    );

    return data[0] || [];
  };

  /**
   * @description
   * Returns a data type defined in the Handsontable settings under the `type` key ({@link Options#type}).
   * If there are cells with different types in the selected range, it returns `'mixed'`.
   *
   * __Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataType
   * @param {number} rowFrom From visual row index.
   * @param {number} columnFrom From visual column index.
   * @param {number} rowTo To visual row index.
   * @param {number} columnTo To visual column index.
   * @returns {string} Cell type (e.q: `'mixed'`, `'text'`, `'numeric'`, `'autocomplete'`).
   */
  this.getDataType = function(rowFrom: number, columnFrom: number, rowTo: number, columnTo: number) {
    const coords = rowFrom === undefined ?
      [0, 0, instance.countRows(), instance.countCols()] : [rowFrom, columnFrom, rowTo, columnTo];
    const [rowStart, columnStart] = coords;
    let [,, rowEnd, columnEnd] = coords;
    let previousType: string | null = null;
    let currentType: string | null = null;

    if (rowEnd === undefined) {
      rowEnd = rowStart;
    }
    if (columnEnd === undefined) {
      columnEnd = columnStart;
    }
    let type = 'mixed';

    rangeEach(Math.max(Math.min(rowStart, rowEnd), 0), Math.max(rowStart, rowEnd), (row) => {
      let isTypeEqual = true;

      rangeEach(Math.max(Math.min(columnStart, columnEnd), 0), Math.max(columnStart, columnEnd), (column) => {
        const cellType = instance.getCellMeta(row, column);

        currentType = (cellType.type as string | null | undefined) ?? null;

        if (previousType) {
          isTypeEqual = previousType === currentType;
        } else {
          previousType = currentType;
        }

        return isTypeEqual;
      });
      type = isTypeEqual ? (currentType ?? 'mixed') : 'mixed';

      return isTypeEqual;
    });

    return type;
  };

  /**
   * Remove a property defined by the `key` argument from the cell meta object for the provided `row` and `column` coordinates.
   *
   * @memberof Core#
   * @function removeCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} key Property name.
   * @fires Hooks#beforeRemoveCellMeta
   * @fires Hooks#afterRemoveCellMeta
   */
  this.removeCellMeta = function(row: number, column: number, key: string) {
    const [physicalRow, physicalColumn] = [instance.toPhysicalRow(row), instance.toPhysicalColumn(column)];

    let cachedValue = metaManager.getCellMetaKeyValue(physicalRow, physicalColumn, key);

    const hookResult = instance.runHooks('beforeRemoveCellMeta', row, column, key, cachedValue);

    if (hookResult !== false) {
      metaManager.removeCellMeta(physicalRow, physicalColumn, key);

      instance.runHooks('afterRemoveCellMeta', row, column, key, cachedValue);
    }

    cachedValue = null;
  };

  /**
   * Removes or adds one or more rows of the cell meta objects to the cell meta collections.
   *
   * @since 0.30.0
   * @memberof Core#
   * @function spliceCellsMeta
   * @param {number} visualIndex A visual index that specifies at what position to add/remove items.
   * @param {number} [deleteAmount=0] The number of items to be removed. If set to 0, no cell meta objects will be removed.
   * @param {...object} [cellMetaRows] The new cell meta row objects to be added to the cell meta collection.
   */
  this.spliceCellsMeta = function(
    this: HotInstance & CoreInternals, visualIndex: number, deleteAmount = 0, ...cellMetaRows: object[]) {
    if (cellMetaRows.length > 0 && !Array.isArray(cellMetaRows[0])) {
      throwWithCause('The 3rd argument (cellMetaRows) has to be passed as an array of cell meta objects array.');
    }

    if (deleteAmount > 0) {
      metaManager.removeRow(instance.toPhysicalRow(visualIndex), deleteAmount);
    }

    if (cellMetaRows.length > 0) {
      arrayEach(cellMetaRows.reverse(), (cellMetaRow) => {
        metaManager.createRow(instance.toPhysicalRow(visualIndex));

        arrayEach(cellMetaRow as unknown[],
          (cellMeta, columnIndex) => {
            this.setCellMetaObject(visualIndex, columnIndex, cellMeta as Record<string, unknown>);
          });
      });
    }

    instance.render();
  };

  /**
   * Set cell meta data object defined by `prop` to the corresponding params `row` and `column`.
   *
   * @memberof Core#
   * @function setCellMetaObject
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} prop Meta object.
   */
  this.setCellMetaObject = function(row: number, column: number, prop: Record<string, unknown>) {
    if (typeof prop === 'object') {
      objectEach(prop, (value, key) => {
        this.setCellMeta(row, column, key, value);
      });
    }
  };

  /**
   * Sets a property defined by the `key` property to the meta object of a cell corresponding to params `row` and `column`.
   *
   * @memberof Core#
   * @function setCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} key Property name.
   * @param {string} value Property value.
   * @fires Hooks#beforeSetCellMeta
   * @fires Hooks#afterSetCellMeta
   */
  this.setCellMeta = function(row: number, column: number, key: string, value: string) {

    const allowSetCellMeta = instance.runHooks('beforeSetCellMeta', row, column, key, value);

    if (allowSetCellMeta === false) {
      return;
    }

    let physicalRow = row;
    let physicalColumn = column;

    if (row < instance.countRows()) {
      physicalRow = instance.toPhysicalRow(row);
    }

    if (column < instance.countCols()) {
      physicalColumn = instance.toPhysicalColumn(column);
    }

    metaManager.setCellMeta(physicalRow, physicalColumn, key, value);

    instance.runHooks('afterSetCellMeta', row, column, key, value);
  };

  /**
   * Get all the cells meta settings at least once generated in the table (in order of cell initialization).
   *
   * @memberof Core#
   * @function getCellsMeta
   * @returns {Array} Returns an array of ColumnSettings object instances.
   */
  this.getCellsMeta = function() {
    return metaManager.getCellsMeta();
  };

  /**
   * Returns the cell properties object for the given `row` and `column` coordinates.
   *
   * @memberof Core#
   * @function getCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} options Execution options for the `getCellMeta` method.
   * @param {boolean} [options.skipMetaExtension=false] If `true`, skips extending the cell meta object. This means, the `cells` function, as well as the `afterGetCellMeta` and `beforeGetCellMeta` hooks, will not be called.
   * @returns {object} The cell properties object.
   * @fires Hooks#beforeGetCellMeta
   * @fires Hooks#afterGetCellMeta
   */
  this.getCellMeta = function<M extends object = Record<string, unknown>>(
    row: number, column: number, options = { skipMetaExtension: false }
  ): M {
    let physicalRow = instance.toPhysicalRow(row);
    let physicalColumn = instance.toPhysicalColumn(column);

    if (physicalRow === null) {
      physicalRow = row;
    }

    if (physicalColumn === null) {
      physicalColumn = column;
    }

    return metaManager.getCellMeta(physicalRow, physicalColumn, {
      visualRow: row,
      visualColumn: column,
      ...options
    }) as M;
  };

  /**
   * Returns the meta information for the provided column.
   *
   * @since 14.5.0
   * @memberof Core#
   * @function getColumnMeta
   * @param {number} column Visual column index.
   * @returns {object}
   */
  this.getColumnMeta = function(column: number) {
    return metaManager.getColumnMeta(instance.toPhysicalColumn(column));
  };

  /**
   * Returns an array of cell meta objects for specified physical row index.
   *
   * @memberof Core#
   * @function getCellMetaAtRow
   * @param {number} row Physical row index.
   * @returns {Array}
   */
  this.getCellMetaAtRow = function(row: number) {
    return metaManager.getCellsMetaAtRow(row);
  };

  /**
   * Checks if your [data format](@/guides/getting-started/binding-to-data/binding-to-data.md#compatible-data-types)
   * and [configuration options](@/guides/getting-started/configuration-options/configuration-options.md)
   * allow for changing the number of columns.
   *
   * Returns `false` when your data is an array of objects,
   * or when you use the [`columns`](@/api/options.md#columns) option.
   * Otherwise, returns `true`.
   *
   * @memberof Core#
   * @function isColumnModificationAllowed
   * @returns {boolean}
   */
  this.isColumnModificationAllowed = function() {
    return !(instance.dataType === 'object' || tableMeta.columns);
  };

  /**
   * Returns the cell renderer function by given `row` and `column` arguments.
   *
   * @memberof Core#
   * @function getCellRenderer
   * @param {number|object} rowOrMeta Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {number} column Visual column index.
   * @returns {Function} Returns the renderer function.
   * @example
   * ```js
   * // Get cell renderer using `row` and `column` coordinates.
   * hot.getCellRenderer(1, 1);
   * // Get cell renderer using cell meta object.
   * hot.getCellRenderer(hot.getCellMeta(1, 1));
   * ```
   */
  this.getCellRenderer = function(rowOrMeta: number | Record<string, unknown>, column: number) {
    const cellRenderer = typeof rowOrMeta === 'number' ?
      (instance.getCellMeta(rowOrMeta, column) as Record<string, unknown>).renderer : rowOrMeta.renderer;

    if (typeof cellRenderer === 'string') {
      return getRenderer(cellRenderer);
    }

    return isUndefined(cellRenderer) ? getRenderer('text') : cellRenderer as BaseRenderer;
  };

  /**
   * Returns the cell editor class by the provided `row` and `column` arguments.
   *
   * @memberof Core#
   * @function getCellEditor
   * @param {number} rowOrMeta Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {number} column Visual column index.
   * @returns {Function|boolean} Returns the editor class or `false` is cell editor is disabled.
   * @example
   * ```js
   * // Get cell editor class using `row` and `column` coordinates.
   * hot.getCellEditor(1, 1);
   * // Get cell editor class using cell meta object.
   * hot.getCellEditor(hot.getCellMeta(1, 1));
   * ```
   */
  this.getCellEditor = function(rowOrMeta: number | Record<string, unknown>, column: number) {
    const cellEditor = typeof rowOrMeta === 'number' ?
      (instance.getCellMeta(rowOrMeta, column) as Record<string, unknown>).editor : rowOrMeta.editor;

    if (typeof cellEditor === 'string') {
      return getEditor(cellEditor);
    }

    type EditorConstructor = (new (hotInstance: HotInstance) => unknown) & { EDITOR_TYPE?: string };

    return (isUndefined(cellEditor) ? getEditor('text') : cellEditor) as EditorConstructor;
  };

  /**
   * Returns the cell validator by `row` and `column`.
   *
   * @memberof Core#
   * @function getCellValidator
   * @param {number|object} rowOrMeta Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {number} column Visual column index.
   * @returns {Function|RegExp|undefined} The validator function.
   * @example
   * ```js
   * // Get cell validator using `row` and `column` coordinates.
   * hot.getCellValidator(1, 1);
   * // Get cell validator using cell meta object.
   * hot.getCellValidator(hot.getCellMeta(1, 1));
   * ```
   */
  this.getCellValidator = function(rowOrMeta: number | Record<string, unknown>, column: number) {
    const cellValidator = typeof rowOrMeta === 'number' ?
      (instance.getCellMeta(rowOrMeta, column) as Record<string, unknown>).validator : rowOrMeta.validator;

    if (typeof cellValidator === 'string') {
      return getValidator(cellValidator);
    }

    return cellValidator as ((value: unknown, callback: (valid: boolean) => void) => void) | RegExp | undefined;
  };

  /**
   * Validates every cell in the data set,
   * using a [validator function](@/guides/cell-functions/cell-validator/cell-validator.md) configured for each cell.
   *
   * Doesn't validate cells that are currently [trimmed](@/guides/rows/row-trimming/row-trimming.md),
   * [hidden](@/guides/rows/row-hiding/row-hiding.md), or [filtered](@/guides/columns/column-filter/column-filter.md),
   * as such cells are not included in the data set until you bring them back again.
   *
   * After the validation, the `callback` function is fired, with the `valid` argument set to:
   * - `true` for valid cells
   * - `false` for invalid cells
   *
   * @memberof Core#
   * @function validateCells
   * @param {Function} [callback] The callback function.
   * @example
   * ```js
   * hot.validateCells((valid) => {
   *   if (valid) {
   *     // ... code for validated cells
   *   }
   * })
   * ```
   */
  this.validateCells = function(this: HotInstance & CoreInternals, callback?: (valid: boolean) => void) {
    this._validateCells(callback);
  };

  /**
   * Validates rows using their validator functions and calls callback when finished.
   *
   * If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
   *  would equal `true`.
   *
   * @memberof Core#
   * @function validateRows
   * @param {Array} [rows] Array of validation target visual row indexes.
   * @param {Function} [callback] The callback function.
   * @example
   * ```js
   * hot.validateRows([3, 4, 5], (valid) => {
   *   if (valid) {
   *     // ... code for validated rows
   *   }
   * })
   * ```
   */
  this.validateRows = function(this: HotInstance & CoreInternals, rows: number[], callback?: (valid: boolean) => void) {
    if (!Array.isArray(rows)) {
      throwWithCause('validateRows parameter `rows` must be an array');
    }
    this._validateCells(callback, rows);
  };

  /**
   * Validates columns using their validator functions and calls callback when finished.
   *
   * If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
   *  would equal `true`.
   *
   * @memberof Core#
   * @function validateColumns
   * @param {Array} [columns] Array of validation target visual columns indexes.
   * @param {Function} [callback] The callback function.
   * @example
   * ```js
   * hot.validateColumns([3, 4, 5], (valid) => {
   *   if (valid) {
   *     // ... code for validated columns
   *   }
   * })
   * ```
   */
  this.validateColumns = function(
    this: HotInstance & CoreInternals, columns: number[], callback?: (valid: boolean) => void) {
    if (!Array.isArray(columns)) {
      throwWithCause('validateColumns parameter `columns` must be an array');
    }
    this._validateCells(callback, undefined, columns);
  };

  /**
   * Validates all cells using their validator functions and calls callback when finished.
   *
   * If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it would equal `true`.
   *
   * Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _validateCells
   * @param {Function} [callback] The callback function.
   * @param {Array} [rows] An array of validation target visual row indexes.
   * @param {Array} [columns] An array of validation target visual column indexes.
   */
  this._validateCells = function(callback: () => void, rows: number[], columns: number[]) {
    const waitingForValidator = ValidatorsQueue();

    if (callback) {
      waitingForValidator.onQueueEmpty = callback;
    }

    let i = instance.countRows() - 1;

    while (i >= 0) {
      if (rows !== undefined && rows.indexOf(i) === -1) {
        i -= 1;
        continue;
      }
      let j = instance.countCols() - 1;

      while (j >= 0) {
        if (columns !== undefined && columns.indexOf(j) === -1) {
          j -= 1;
          continue;
        }
        waitingForValidator.addValidatorToQueue();

        instance.validateCell(instance.getDataAtCell(i, j), instance.getCellMeta(i, j), (result: boolean) => {
          if (typeof result !== 'boolean') {
            throwWithCause('Validation error: result is not boolean');
          }
          if (result === false) {
            waitingForValidator.valid = false;
          }
          waitingForValidator.removeValidatorFormQueue();
        }, 'validateCells');
        j -= 1;
      }
      i -= 1;
    }

    waitingForValidator.checkIfQueueIsEmpty();
  };

  /**
   * Returns an array of row headers' values (if they are enabled). If param `row` was given, it returns the header of the given row as a string.
   *
   * @memberof Core#
   * @function getRowHeader
   * @param {number} [row] Visual row index.
   * @fires Hooks#modifyRowHeader
   * @returns {Array|string|number} Array of header values / single header value.
   */
  this.getRowHeader = function(row: number) {
    let rowHeader: unknown = tableMeta.rowHeaders;
    let physicalRow = row;

    if (physicalRow !== undefined) {

      physicalRow = instance.runHooks('modifyRowHeader', physicalRow);
    }

    if (physicalRow === undefined) {
      const headers: unknown[] = [];

      rangeEach(instance.countRows() - 1, (i: number) => {
        headers.push(instance.getRowHeader(i));
      });
      rowHeader = headers;

    } else if (Array.isArray(rowHeader) && rowHeader[physicalRow] !== undefined) {
      rowHeader = rowHeader[physicalRow];

    } else if (isFunction(rowHeader)) {
      rowHeader = rowHeader(physicalRow);

    } else if (rowHeader && typeof rowHeader !== 'string' && typeof rowHeader !== 'number') {
      rowHeader = physicalRow + 1;
    }

    return rowHeader as string | string[];
  };

  /**
   * Returns information about if this table is configured to display row headers.
   *
   * @memberof Core#
   * @function hasRowHeaders
   * @returns {boolean} `true` if the instance has the row headers enabled, `false` otherwise.
   */
  this.hasRowHeaders = function() {
    return !!tableMeta.rowHeaders;
  };

  /**
   * Returns information about if this table is configured to display column headers.
   *
   * @memberof Core#
   * @function hasColHeaders
   * @returns {boolean} `true` if the instance has the column headers enabled, `false` otherwise.
   */
  this.hasColHeaders = function() {
    if (tableMeta.colHeaders !== undefined && tableMeta.colHeaders !== null) { // Polymer has empty value = null
      return !!tableMeta.colHeaders;
    }
    for (let i = 0, ilen = instance.countCols(); i < ilen; i++) {
      if (instance.getColHeader(i)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Gets the values of column headers (if column headers are [enabled](@/api/options.md#colheaders)).
   *
   * To get an array with the values of all
   * [bottom-most](@/guides/cell-features/clipboard/clipboard.md#copy-with-headers) column headers,
   * call `getColHeader()` with no arguments.
   *
   * To get the value of the bottom-most header of a specific column, use the `column` parameter.
   *
   * To get the value of a [specific-level](@/guides/columns/column-groups/column-groups.md) header
   * of a specific column, use the `column` and `headerLevel` parameters.
   *
   * Read more:
   * - [Guides: Column groups](@/guides/columns/column-groups/column-groups.md)
   * - [Options: `colHeaders`](@/api/options.md#colheaders)
   * - [Guides: Copy with headers](@/guides/cell-features/clipboard/clipboard.md#copy-with-headers)
   *
   * ```js
   * // get the contents of all bottom-most column headers
   * hot.getColHeader();
   *
   * // get the contents of the bottom-most header of a specific column
   * hot.getColHeader(5);
   *
   * // get the contents of a specific column header at a specific level
   * hot.getColHeader(5, -2);
   * ```
   *
   * @memberof Core#
   * @function getColHeader
   * @param {number} [column] A visual column index.
   * @param {number} [headerLevel=-1] (Since 12.3.0) Header level index. Accepts positive (0 to n)
   *                                  and negative (-1 to -n) values. For positive values, 0 points to the
   *                                  topmost header. For negative values, -1 points to the bottom-most
   *                                  header (the header closest to the cells).
   * @fires Hooks#modifyColHeader
   * @fires Hooks#modifyColumnHeaderValue
   * @returns {Array|string|number} Column header values.
   */
  this.getColHeader = function(column: number, headerLevel = -1) {

    const columnIndex = instance.runHooks('modifyColHeader', column);

    if (columnIndex === undefined) {
      const out: Array<string | number | null> = [];

      const ilen = instance.countCols();

      for (let i = 0; i < ilen; i++) {
        out.push(instance.getColHeader(i) as string | number | null);
      }

      return out as string[];
    }

    let result: unknown = tableMeta.colHeaders;
    const columns = tableMeta.columns;

    const translateVisualIndexToColumns = function(visualColumnIndex: number) {
      const arr: number[] = [];

      const columnsLen = instance.countCols();
      let index = 0;

      for (; index < columnsLen; index++) {
        if (isFunction(columns) && columns(index)) {
          arr.push(index);
        }
      }

      return arr[visualColumnIndex];
    };

    const physicalColumn = instance.toPhysicalColumn(columnIndex as number);
    const prop = translateVisualIndexToColumns(physicalColumn!);

    if (tableMeta.colHeaders === false) {
      result = null;

    } else if (columns && isFunction(columns) && columns(prop) &&
               (columns(prop) as Record<string, unknown>).title) {
      result = (columns(prop) as Record<string, unknown>).title;

    } else if (columns && !isFunction(columns) && columns[physicalColumn!] &&
               columns[physicalColumn!].title) {
      result = columns[physicalColumn!].title;

    } else if (Array.isArray(tableMeta.colHeaders) && tableMeta.colHeaders[physicalColumn!] !== undefined) {
      result = tableMeta.colHeaders[physicalColumn!];

    } else if (isFunction(tableMeta.colHeaders)) {
      result = tableMeta.colHeaders(physicalColumn!);

    } else if (tableMeta.colHeaders && typeof tableMeta.colHeaders !== 'string' &&
               typeof tableMeta.colHeaders !== 'number') {
      result = spreadsheetColumnLabel(columnIndex as number); // see #1458
    }

    result = instance.runHooks('modifyColumnHeaderValue', result, column, headerLevel);

    return result as string | string[];
  };

  /**
   * Return column width from settings (no guessing). Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _getColWidthFromSettings
   * @param {number} col Visual col index.
   * @returns {number}
   */
  this._getColWidthFromSettings = function(col: number) {
    let width;

    // We currently don't support cell meta objects for headers (negative values)
    if (col >= 0) {
      const cellProperties = instance.getCellMeta(0, col) as Record<string, unknown>;

      width = cellProperties.width;
    }

    if (width === undefined || width === tableMeta.width) {
      width = tableMeta.colWidths;
    }

    if (width !== undefined && width !== null) {
      switch (typeof width) {
        case 'object': // array
          width = (width as Record<number, unknown>)[col];
          break;

        case 'function':
          width = (width as (col: number) => unknown)(col);
          break;
        default:
          break;
      }
      if (typeof width === 'string') {
        width = Number.parseInt(width, 10);
      }
    }

    return width as number | undefined;
  };

  /**
   * Returns the width of the requested column.
   *
   * @memberof Core#
   * @function getColWidth
   * @param {number} column Visual column index.
   * @param {string} [source] The source of the call.
   * @returns {number} Column width.
   * @fires Hooks#modifyColWidth
   */
  this.getColWidth = function(column: number, source: string): number {
    let width = instance._getColWidthFromSettings(column) as number | undefined;

    width = instance.runHooks('modifyColWidth', width, column, source) as number | undefined;

    if (width === undefined) {
      width = DEFAULT_COLUMN_WIDTH;
    }

    return width;
  };

  /**
   * Return row height from settings (no guessing). Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _getRowHeightFromSettings
   * @param {number} row Visual row index.
   * @returns {number}
   */
  this._getRowHeightFromSettings = function(row: number) {
    const defaultRowHeight = (instance.stylesHandler as StylesHandler).getDefaultRowHeight(row);
    let height: unknown = tableMeta.rowHeights ?? tableMeta.minRowHeights;

    if (height !== undefined && height !== null) {
      switch (typeof height) {
        case 'object': // array
          height = (height as Record<number, unknown>)[row];
          break;

        case 'function':
          height = (height as (row: number) => unknown)(row);
          break;

        default:
          break;
      }

      if (typeof height === 'string') {
        height = Number.parseInt(height, 10);
      }
    }

    const numHeight = height as number | undefined | null;
    const numDefaultRowHeight = defaultRowHeight as number | null;

    return ((numHeight !== undefined && numHeight !== null &&
      numDefaultRowHeight !== null && numHeight < numDefaultRowHeight)
      ? numDefaultRowHeight
      : numHeight) as number | undefined;
  };

  /**
   * Returns a row's height, as recognized by Handsontable.
   *
   * Depending on your configuration, the method returns (in order of priority):
   *   1. The row height set by the [`ManualRowResize`](@/api/manualRowResize.md) plugin
   *     (if the plugin is enabled).
   *   2. The row height set by the [`rowHeights`](@/api/options.md#rowheights) configuration option
   *     (if the option is set).
   *   3. The row height as measured in the DOM by the [`AutoRowSize`](@/api/autoRowSize.md) plugin
   *     (if the plugin is enabled).
   *   4. `undefined`, if neither [`ManualRowResize`](@/api/manualRowResize.md),
   *     nor [`rowHeights`](@/api/options.md#rowheights),
   *     nor [`AutoRowSize`](@/api/autoRowSize.md) is used.
   *
   * The height returned includes 1 px of the row's bottom border.
   *
   * Mind that this method is different from the
   * [`getRowHeight()`](@/api/autoRowSize.md#getrowheight) method
   * of the [`AutoRowSize`](@/api/autoRowSize.md) plugin.
   *
   * @memberof Core#
   * @function getRowHeight
   * @param {number} row A visual row index.
   * @param {string} [source] The source of the call.
   * @returns {number|undefined} The height of the specified row, in pixels.
   * @fires Hooks#modifyRowHeight
   */
  this.getRowHeight = function(row: number, source: string): number {
    let height = instance._getRowHeightFromSettings(row) as number | undefined;

    height = instance.runHooks('modifyRowHeight', height, row, source) as number | undefined;

    return height as number;
  };

  /**
   * Returns the total number of rows in the data source.
   *
   * @memberof Core#
   * @function countSourceRows
   * @returns {number} Total number of rows.
   */
  this.countSourceRows = function() {
    return dataSource.countRows();
  };

  /**
   * Returns the total number of columns in the data source. It will take value either from schema, columns settings or the first row from the data set. Unlike [countCols()](@/api/core.md#countcols), this value is not affected by the columns configuration option.
   *
   * @memberof Core#
   * @function countSourceCols
   * @returns {number} Total number of columns.
   */
  this.countSourceCols = function() {
    return dataSource.countFirstRowKeys();
  };

  /**
   * Returns the total number of visual rows in the table.
   *
   * @memberof Core#
   * @function countRows
   * @returns {number} Total number of rows.
   */
  this.countRows = function() {
    return datamap.getLength();
  };

  /**
   * Returns the total number of rendered columns. If the columns option is defined, it returns the number of columns set in that configuration, not the number of columns in the data source.
   *
   * @memberof Core#
   * @function countCols
   * @returns {number} Total number of columns.
   */
  this.countCols = function() {
    const maxCols = tableMeta.maxCols;
    const dataLen = instance.columnIndexMapper.getNotTrimmedIndexesLength();

    return Math.min(maxCols, dataLen);
  };

  /**
   * Returns the number of rendered rows including rows that are partially or fully rendered
   * outside the table viewport.
   *
   * @memberof Core#
   * @function countRenderedRows
   * @returns {number} Returns -1 if table is not visible.
   */
  this.countRenderedRows = function(): number {
    const view = instance.view as TableView;

    return view._wt.drawn ? view._wt.wtTable.getRenderedRowsCount() as number : -1;
  };

  /**
   * Returns the number of rendered rows that are only visible in the table viewport.
   * The rows that are partially visible are not counted.
   *
   * @memberof Core#
   * @function countVisibleRows
   * @returns {number} Number of visible rows or -1.
   */
  this.countVisibleRows = function(): number {
    const view = instance.view as TableView;

    return view._wt.drawn ? view._wt.wtTable.getVisibleRowsCount() as number : -1;
  };

  /**
   * Returns the number of rendered rows including columns that are partially or fully rendered
   * outside the table viewport.
   *
   * @memberof Core#
   * @function countRenderedCols
   * @returns {number} Returns -1 if table is not visible.
   */
  this.countRenderedCols = function(): number {
    const view = instance.view as TableView;

    return view._wt.drawn ? view._wt.wtTable.getRenderedColumnsCount() as number : -1;
  };

  /**
   * Returns the number of rendered columns that are only visible in the table viewport.
   * The columns that are partially visible are not counted.
   *
   * @memberof Core#
   * @function countVisibleCols
   * @returns {number} Number of visible columns or -1.
   */
  this.countVisibleCols = function(): number {
    const view = instance.view as TableView;

    return view._wt.drawn ? view._wt.wtTable.getVisibleColumnsCount() as number : -1;
  };

  /**
   * Returns the number of rendered row headers.
   *
   * @since 14.0.0
   * @memberof Core#
   * @function countRowHeaders
   * @returns {number} Number of row headers.
   */
  this.countRowHeaders = function(): number {
    return (instance.view as TableView).getRowHeadersCount();
  };

  /**
   * Returns the number of rendered column headers.
   *
   * @since 14.0.0
   * @memberof Core#
   * @function countColHeaders
   * @returns {number} Number of column headers.
   */
  this.countColHeaders = function(): number {
    return (instance.view as TableView).getColumnHeadersCount();
  };

  /**
   * Returns the number of empty rows. If the optional ending parameter is `true`, returns the
   * number of empty rows at the bottom of the table.
   *
   * @memberof Core#
   * @function countEmptyRows
   * @param {boolean} [ending=false] If `true`, will only count empty rows at the end of the data source.
   * @returns {number} Count empty rows.
   */
  this.countEmptyRows = function(ending = false) {
    let emptyRows = 0;

    rangeEachReverse(instance.countRows() - 1, (visualIndex: number) => {
      if (instance.isEmptyRow(visualIndex)) {
        emptyRows += 1;

      } else if (ending === true) {
        return false;
      }
    });

    return emptyRows;
  };

  /**
   * Returns the number of empty columns. If the optional ending parameter is `true`, returns the number of empty
   * columns at right hand edge of the table.
   *
   * @memberof Core#
   * @function countEmptyCols
   * @param {boolean} [ending=false] If `true`, will only count empty columns at the end of the data source row.
   * @returns {number} Count empty cols.
   */
  this.countEmptyCols = function(ending = false) {
    let emptyColumns = 0;

    rangeEachReverse(instance.countCols() - 1, (visualIndex: number) => {
      if (instance.isEmptyCol(visualIndex)) {
        emptyColumns += 1;

      } else if (ending === true) {
        return false;
      }
    });

    return emptyColumns;
  };

  /**
   * Check if all cells in the row declared by the `row` argument are empty.
   *
   * @memberof Core#
   * @function isEmptyRow
   * @param {number} row Visual row index.
   * @returns {boolean} `true` if the row at the given `row` is empty, `false` otherwise.
   */
  this.isEmptyRow = function(row: number): boolean {
    return (tableMeta.isEmptyRow as Function).call(instance, row) as boolean;
  };

  /**
   * Check if all cells in the the column declared by the `column` argument are empty.
   *
   * @memberof Core#
   * @function isEmptyCol
   * @param {number} column Column index.
   * @returns {boolean} `true` if the column at the given `col` is empty, `false` otherwise.
   */
  this.isEmptyCol = function(column: number): boolean {
    return (tableMeta.isEmptyCol as Function).call(instance, column) as boolean;
  };

  /**
   * Select a single cell, or a single range of adjacent cells.
   *
   * To select a cell, pass its visual row and column indexes, for example: `selectCell(2, 4)`.
   *
   * To select a range, pass the visual indexes of the first and last cell in the range, for example: `selectCell(2, 4, 3, 5)`.
   *
   * If your columns have properties, you can pass those properties' values instead of column indexes, for example: `selectCell(2, 'first_name')`.
   *
   * By default, `selectCell()` also:
   *  - Scrolls the viewport to the newly-selected cells.
   *  - Switches the keyboard focus to Handsontable (by calling Handsontable's [`listen()`](#listen) method).
   *
   * @example
   * ```js
   * // select a single cell
   * hot.selectCell(2, 4);
   *
   * // select a range of cells
   * hot.selectCell(2, 4, 3, 5);
   *
   * // select a single cell, using a column property
   * hot.selectCell(2, 'first_name');
   *
   * // select a range of cells, using column properties
   * hot.selectCell(2, 'first_name', 3, 'last_name');
   *
   * // select a range of cells, without scrolling to them
   * hot.selectCell(2, 4, 3, 5, false);
   *
   * // select a range of cells, without switching the keyboard focus to Handsontable
   * hot.selectCell(2, 4, 3, 5, null, false);
   * ```
   *
   * @memberof Core#
   * @function selectCell
   * @param {number} row A visual row index.
   * @param {number|string} column A visual column index (`number`), or a column property's value (`string`).
   * @param {number} [endRow] If selecting a range: the visual row index of the last cell in the range.
   * @param {number|string} [endColumn] If selecting a range: the visual column index (or a column property's value) of the last cell in the range.
   * @param {boolean} [scrollToCell=true] `true`: scroll the viewport to the newly-selected cells. `false`: keep the previous viewport.
   * @param {boolean} [changeListener=true] `true`: switch the keyboard focus to Handsontable. `false`: keep the
   * previous keyboard focus. If an element outside Handsontable (such as a custom input) currently owns the browser
   * focus, it remains focused after the call.
   * @returns {boolean} `true`: the selection was successful, `false`: the selection failed.
   */
  this.selectCell = function(
    row: number, column: number, endRow: number, endColumn: number, scrollToCell = true, changeListener = true
  ) {
    if (isUndefined(row) || isUndefined(column)) {
      return false;
    }

    const rowNum = (row === null || row === undefined) || Number.isNaN(Number(row)) ? 0 : Number(row);
    const col = (column === null || column === undefined) ||
      (typeof column === 'number' && Number.isNaN(column)) ? 0 : column;

    const coords = [
      [
        rowNum,
        col,
        isUndefined(endRow) ? undefined : endRow,
        isUndefined(endColumn) ? undefined : endColumn
      ]
    ];

    return instance.selectCells(coords, scrollToCell, changeListener) as boolean;
  };

  /**
   * Select multiple cells or ranges of cells, adjacent or non-adjacent.
   *
   * You can pass one of the below:
   * - An array of arrays (which matches the output of Handsontable's [`getSelected()`](#getselected) method).
   * - An array of [`CellRange`](@/api/cellRange.md) objects (which matches the output of Handsontable's [`getSelectedRange()`](#getselectedrange) method).
   *
   * To select multiple cells, pass the visual row and column indexes of each cell, for example: `hot.selectCells([[1, 1], [5, 5]])`.
   *
   * To select multiple ranges, pass the visual indexes of the first and last cell in each range, for example: `hot.selectCells([[1, 1, 2, 2], [6, 2, 0, 2]])`.
   *
   * If your columns have properties, you can pass those properties' values instead of column indexes, for example: `hot.selectCells([[1, 'first_name'], [5, 'last_name']])`.
   *
   * By default, `selectCell()` also:
   *  - Scrolls the viewport to the newly-selected cells.
   *  - Switches the keyboard focus to Handsontable (by calling Handsontable's [`listen()`](#listen) method).
   *
   * @example
   * ```js
   * // select non-adjacent cells
   * hot.selectCells([[1, 1], [5, 5], [10, 10]]);
   *
   * // select non-adjacent ranges of cells
   * hot.selectCells([[1, 1, 2, 2], [10, 10, 20, 20]]);
   *
   * // select cells and ranges of cells
   * hot.selectCells([[1, 1, 2, 2], [3, 3], [6, 2, 0, 2]]);
   *
   * // select cells, using column properties
   * hot.selectCells([[1, 'id', 2, 'first_name'], [3, 'full_name'], [6, 'last_name', 0, 'first_name']]);
   *
   * // select multiple ranges, using an array of `CellRange` objects
   * const selected = hot.getSelectedRange();
   *
   * selected[0].from.row = 0;
   * selected[0].from.col = 0;
   * selected[0].to.row = 5;
   * selected[0].to.col = 5;
   *
   * selected[1].from.row = 10;
   * selected[1].from.col = 10;
   * selected[1].to.row = 20;
   * selected[1].to.col = 20;
   *
   * hot.selectCells(selected);
   * ```
   *
   * @memberof Core#
   * @since 0.38.0
   * @function selectCells
   * @param {Array[]|CellRange[]} coords Visual coordinates,
   * passed either as an array of arrays (`[[rowStart, columnStart, rowEnd, columnEnd], ...]`)
   * or as an array of [`CellRange`](@/api/cellRange.md) objects.
   * @param {boolean} [scrollToCell=true] `true`: scroll the viewport to the newly-selected cells. `false`: keep the previous viewport.
   * @param {boolean} [changeListener=true] `true`: switch the keyboard focus to Handsontable. `false`: keep the
   * previous keyboard focus. If an element outside Handsontable (such as a custom input) currently owns the browser
   * focus, it remains focused after the call.
   * @returns {boolean} `true`: the selection was successful, `false`: the selection failed.
   */
  this.selectCells = function(
    coords: Array<Array<number | undefined>> = [[]], scrollToCell = true, changeListener = true
  ) {
    if (scrollToCell === false) {
      viewportScroller.suspend();
    }
    if (changeListener === false) {
      focusGridManager.suspend();
    }

    let wasSelected;

    try {
      wasSelected = selection.selectCells(coords);
    } finally {
      // Always release the suspended state even if `selection.selectCells` throws on malformed
      // coordinates. Otherwise the flags would leak across subsequent calls.
      viewportScroller.resume();
      focusGridManager.resume();
    }

    if (wasSelected && changeListener) {
      instance.listen();
    }

    return wasSelected;
  };

  /**
   * Select column specified by `startColumn` visual index, column property or a range of columns finishing at `endColumn`.
   *
   * @example
   * ```js
   * // Select column using visual index.
   * hot.selectColumns(1);
   * // Select column using column property.
   * hot.selectColumns('id');
   * // Select range of columns using visual indexes.
   * hot.selectColumns(1, 4);
   * // Select range of columns using visual indexes and mark the first header as highlighted.
   * hot.selectColumns(1, 2, -1);
   * // Select range of columns using visual indexes and mark the second cell as highlighted.
   * hot.selectColumns(2, 1, 1);
   * // Select range of columns using visual indexes and move the focus position somewhere in the middle of the range.
   * hot.selectColumns(2, 5, { row: 2, col: 3 });
   * // Select range of columns using column properties.
   * hot.selectColumns('id', 'last_name');
   * ```
   *
   * @memberof Core#
   * @since 0.38.0
   * @function selectColumns
   * @param {number} startColumn The visual column index from which the selection starts.
   * @param {number} [endColumn=startColumn] The visual column index to which the selection finishes. If `endColumn`
   * is not defined the column defined by `startColumn` will be selected.
   * @param {number | { row: number, col: number } | CellCoords} [focusPosition=0] The argument allows changing the cell/header focus
   * position. The value can take visual row index from -N to N, where negative values point to the headers and positive
   * values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus
   * position horizontally.
   * @returns {boolean} `true` if selection was successful, `false` otherwise.
   */
  this.selectColumns = function(
    startColumn: number, endColumn = startColumn, focusPosition: number | {row?: number, col?: number}
  ) {
    return selection.selectColumns(startColumn, endColumn, focusPosition);
  };

  /**
   * Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.
   *
   * @example
   * ```js
   * // Select row using visual index.
   * hot.selectRows(1);
   * // select a range of rows, using visual indexes.
   * hot.selectRows(1, 4);
   * // select a range of rows, using visual indexes, and mark the header as highlighted.
   * hot.selectRows(1, 2, -1);
   * // Select range of rows using visual indexes and mark the second cell as highlighted.
   * hot.selectRows(2, 1, 1);
   * // Select range of rows using visual indexes and move the focus position somewhere in the middle of the range.
   * hot.selectRows(2, 5, { row: 2, col: 3 });
   * ```
   *
   * @memberof Core#
   * @since 0.38.0
   * @function selectRows
   * @param {number} startRow The visual row index from which the selection starts.
   * @param {number} [endRow=startRow] The visual row index to which the selection finishes. If `endRow`
   * is not defined the row defined by `startRow` will be selected.
   * @param {number | { row: number, col: number } | CellCoords} [focusPosition=0] The argument allows changing the cell/header focus
   * position. The value can take visual row index from -N to N, where negative values point to the headers and positive
   * values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus
   * position vertically.
   * @returns {boolean} `true` if selection was successful, `false` otherwise.
   */
  this.selectRows = function(
    startRow: number, endRow = startRow, focusPosition: number | {row?: number, col?: number}
  ) {
    return selection.selectRows(startRow, endRow, focusPosition);
  };

  /**
   * Deselects the current cell selection on the table.
   *
   * @memberof Core#
   * @function deselectCell
   */
  this.deselectCell = function() {
    selection.deselect();
  };

  /**
   * Select all cells in the table excluding headers and corner elements.
   *
   * The previous selection is overwritten.
   *
   * ```js
   * // Select all cells in the table along with row headers, including all headers and the corner cell.
   * // Doesn't select column headers and corner elements.
   * hot.selectAll();
   *
   * // Select all cells in the table, including row headers but excluding the corner cell and column headers.
   * hot.selectAll(true, false);
   *
   * // Select all cells in the table, including all headers and the corner cell, but move the focus.
   * // highlight to position 2, 1
   * hot.selectAll(-2, -1, {
   *    focusPosition: { row: 2, col: 1 }
   * });
   *
   * // Select all cells in the table, without headers and corner elements.
   * hot.selectAll(false);
   * ```
   *
   * @since 0.38.2
   * @memberof Core#
   * @function selectAll
   * @param {boolean} [includeRowHeaders=false] `true` If the selection should include the row headers,
   * `false` otherwise.
   * @param {boolean} [includeColumnHeaders=false] `true` If the selection should include the column
   * headers, `false` otherwise.
   *
   * @param {object} [options] Additional object with options. Since 14.0.0
   * @param {{row: number, col: number} | boolean} [options.focusPosition] The argument allows changing the cell/header
   * focus position. The value takes an object with a `row` and `col` properties from -N to N, where
   * negative values point to the headers and positive values point to the cell range. If `false`, the focus
   * position won't be changed. Example:
   * ```js
   * hot.selectAll(0, 0, {
   * focusPosition: { row: 0, col: 1 },
   * disableHeadersHighlight: true
   * })
   * ```
   *
   * @param {boolean} [options.disableHeadersHighlight] If `true`, disables highlighting the headers even when
   * the logical coordinates points on them.
   */
  this.selectAll = function(
    includeRowHeaders = true, includeColumnHeaders = includeRowHeaders, options: Record<string, unknown>
  ) {
    viewportScroller.skipNextScrollCycle();
    selection.selectAll(includeRowHeaders, includeColumnHeaders, options);
  };

  const getIndexToScroll = (indexMapper: IndexMapper, visualIndex: number) => {
    // Looking for a visual index on the right and then (when not found) on the left.
    return indexMapper.getNearestNotHiddenIndex(visualIndex, 1, true);
  };

  /**
   * Resolves renderable row and column indexes for scrolling, accounting for hidden indexes.
   *
   * @param {number|undefined} row Visual row index.
   * @param {number|undefined} col Visual column index.
   * @returns {{renderableRow: number|undefined, renderableColumn: number|undefined}|false} Resolved
   *   renderable indexes, or `false` when scrolling target is not reachable.
   */
  const resolveRenderableScrollTarget = (row: number | undefined, col: number | undefined) => {
    const isValidRowGrid = row !== undefined && Number.isInteger(row) && row >= 0;
    const isValidColumnGrid = col !== undefined && Number.isInteger(col) && col >= 0;

    const visualRowToScroll = isValidRowGrid ? getIndexToScroll(instance.rowIndexMapper, row!) : undefined;
    const visualColumnToScroll = isValidColumnGrid ? getIndexToScroll(instance.columnIndexMapper, col!) : undefined;

    if (visualRowToScroll === null || visualColumnToScroll === null) {
      return false;
    }

    const renderableRow = isValidRowGrid ?
      (instance.rowIndexMapper.getRenderableFromVisualIndex(visualRowToScroll!) ?? undefined) : row;
    const renderableColumn = isValidColumnGrid ?
      (instance.columnIndexMapper.getRenderableFromVisualIndex(visualColumnToScroll!) ?? undefined) : col;

    return { renderableRow, renderableColumn };
  };

  /**
   * Scroll viewport to coordinates specified by the `row` and/or `col` object properties.
   *
   * ```js
   * // scroll the viewport to the visual row index (leave the horizontal scroll untouched)
   * hot.scrollViewportTo({ row: 50 });
   *
   * // scroll the viewport to the passed coordinates so that the cell at 50, 50 will be snapped to
   * // the bottom-end table's edge.
   * hot.scrollViewportTo({
   *   row: 50,
   *   col: 50,
   *   verticalSnap: 'bottom',
   *   horizontalSnap: 'end',
   * }, () => {
   *   // callback function executed after the viewport is scrolled
   * });
   * ```
   *
   * @memberof Core#
   * @function scrollViewportTo
   * @param {object} options A dictionary containing the following parameters:
   * @param {number} [options.row] Specifies the number of visual rows along the Y axis to scroll the viewport.
   * @param {number} [options.col] Specifies the number of visual columns along the X axis to scroll the viewport.
   * @param {'top' | 'bottom'} [options.verticalSnap] Determines to which edge of the table the viewport will be scrolled based on the passed coordinates.
   * This option is a string which must take one of the following values:
   * - `top`: The viewport will be scrolled to a row in such a way that it will be positioned on the top of the viewport;
   * - `bottom`: The viewport will be scrolled to a row in such a way that it will be positioned on the bottom of the viewport;
   * - If the property is not defined the vertical auto-snapping is enabled. Depending on where the viewport is scrolled from, a row will
   * be positioned at the top or bottom of the viewport.
   * @param {'start' | 'end'} [options.horizontalSnap] Determines to which edge of the table the viewport will be scrolled based on the passed coordinates.
   * This option is a string which must take one of the following values:
   * - `start`: The viewport will be scrolled to a column in such a way that it will be positioned on the start (left edge or right, if the layout direction is set to `rtl`) of the viewport;
   * - `end`: The viewport will be scrolled to a column in such a way that it will be positioned on the end (right edge or left, if the layout direction is set to `rtl`) of the viewport;
   * - If the property is not defined the horizontal auto-snapping is enabled. Depending on where the viewport is scrolled from, a column will
   * be positioned at the start or end of the viewport.
   * @param {boolean} [options.considerHiddenIndexes=true] If `true`, we handle visual indexes, otherwise we handle only indexes which
   * may be rendered when they are in the viewport (we don't consider hidden indexes as they aren't rendered).
   * @param {Function} [callback] The callback function to call after the viewport is scrolled.
   * @returns {boolean} `true` if viewport was scrolled, `false` otherwise.
   */
  this.scrollViewportTo = function(
    options: {row?: number, col?: number, horizontalSnap?: string, verticalSnap?: string,
      considerHiddenIndexes?: boolean},
    callback: Function
  ) {
    // Support for backward compatibility arguments: (row, col, snapToBottom, snapToRight, considerHiddenIndexes)
    if (typeof options === 'number') {
      /* eslint-disable prefer-rest-params, @typescript-eslint/no-unsafe-assignment */
      options = {
        row: arguments[0],
        col: arguments[1],
        verticalSnap: arguments[2] ? 'bottom' : 'top',
        horizontalSnap: arguments[3] ? 'end' : 'start',
        considerHiddenIndexes: arguments[4] ?? true,
      };
      /* eslint-enable prefer-rest-params, @typescript-eslint/no-unsafe-assignment */
    }

    const {
      row,
      col,
      considerHiddenIndexes,
    } = options ?? {};

    let renderableRow = row;
    let renderableColumn = col;

    if (isFunction(callback)) {
      this.addHookOnce('afterScroll', callback);
    }

    if (considerHiddenIndexes === undefined || considerHiddenIndexes) {
      const resolved = resolveRenderableScrollTarget(row, col);

      if (resolved === false) {
        return false;
      }

      renderableRow = resolved.renderableRow;
      renderableColumn = resolved.renderableColumn;
    }

    const isRowInteger = Number.isInteger(renderableRow);
    const isColumnInteger = Number.isInteger(renderableColumn);
    let isScrolled = false;

    if (isRowInteger && renderableRow! >= 0 && isColumnInteger && renderableColumn! >= 0) {
      isScrolled = instance.view.scrollViewport(
        instance._createCellCoords(renderableRow!, renderableColumn!) as { row: number; col: number },
        options.horizontalSnap,
        options.verticalSnap,
      );

    } else if (isRowInteger && renderableRow! >= 0 && (isColumnInteger && renderableColumn! < 0 || !isColumnInteger)) {
      isScrolled = instance.view.scrollViewportVertically(renderableRow!, options.verticalSnap as string);

    } else if (isColumnInteger && renderableColumn! >= 0 && (isRowInteger && renderableRow! < 0 || !isRowInteger)) {
      isScrolled = instance.view.scrollViewportHorizontally(renderableColumn!, options.horizontalSnap as string);
    }

    if (isFunction(callback)) {
      if (isScrolled) {
        // fast render triggers `afterScroll` hook
        this.view.render();
      } else {
        this.removeHook('afterScroll', callback);
        this._registerMicrotask(() => callback());
      }
    }

    return isScrolled;
  };

  /**
   * Scrolls the viewport to coordinates specified by the currently focused cell.
   *
   * @since 14.0.0
   * @memberof Core#
   * @fires Hooks#afterScroll
   * @function scrollToFocusedCell
   * @param {Function} [callback] The callback function to call after the viewport is scrolled.
   * @returns {boolean} `true` if the viewport was scrolled, `false` otherwise.
   */
  this.scrollToFocusedCell = function(callback?: () => void) {
    if (!instance.selection.isSelected()) {
      return false;
    }

    if (isFunction(callback)) {
      instance.addHookOnce('afterScroll', callback);
    }

    const { highlight } = instance.getSelectedRangeActive() as CellRange;
    const isScrolled = instance.scrollViewportTo(
      highlight.toObject() as { row?: number; col?: number }
    ) as boolean;

    if (isScrolled) {
      // fast render triggers `afterScroll` hook
      (instance.view as TableView).render();

    } else if (isFunction(callback)) {
      instance.removeHook('afterScroll', callback);
      instance._registerMicrotask(() => callback());
    }

    return isScrolled;
  };

  /**
   * Removes the table from the DOM and destroys the instance of the Handsontable.
   *
   * @memberof Core#
   * @function destroy
   * @fires Hooks#afterDestroy
   */
  this.destroy = function() {
    instance._clearTimeouts();
    instance._clearMicrotasks();

    if (instance.view) { // in case HT is destroyed before initialization has finished
      instance.view.destroy();
    }
    if (dataSource) {
      dataSource.destroy();
    }

    dataSource = null!;

    if (isRootInstance(this)) {
      uninstallAccessibilityAnnouncer();
      this.getFocusScopeManager().destroy();
      layoutManager?.destroy();

      instance.themeManager?.destroy();
    }

    this.getShortcutManager().destroy();
    moduleRegisterer.clear();
    metaManager.clearCache();
    foreignHotInstances.delete(this.guid);

    eventManager.destroy();

    if (editorManager) {
      editorManager.destroy();
    }

    if (instance.rootContainer) {
      empty(instance.rootContainer);
    }

    if (instance.rootPortalElement) {
      instance.rootPortalElement.remove();
    }

    // The plugin's `destroy` method is called as a consequence and it should handle
    // unregistration of plugin's maps. Some unregistered maps reset the cache.
    instance.batchExecution(() => {
      instance.rowIndexMapper.destroy();
      instance.columnIndexMapper.destroy();

      pluginsRegistry
        .getItems()
        .forEach(([, plugin]) => {
          (plugin as BasePlugin).destroy();
        });
      pluginsRegistry.clear();
      instance.runHooks('afterDestroy');
    }, true);

    Hooks.getSingleton().destroy(instance);

    objectEach(instance, (property: unknown, key: string, obj: Record<string, unknown>) => {
      // replace instance methods with post mortem
      if (isFunction(property)) {
        obj[key] = postMortem(key);

      } else if (key !== 'guid') {
        // replace instance properties with null (restores memory)
        // it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
        obj[key] = null;
      }
    });

    instance.isDestroyed = true;

    // replace private properties with null (restores memory)
    // it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
    if (datamap) {
      datamap.destroy();
    }

    datamap = null!;
    grid = null!;
    selection = null!;
    editorManager = null!;
    instance = null as unknown as HotInstance;
  };

  /**
   * Replacement for all methods after the Handsontable was destroyed.
   *
   * @private
   * @param {string} method The method name.
   * @returns {Function}
   */
  function postMortem(method: string) {
    return () => {
      throwWithCause(`The "${method}" method cannot be called because this Handsontable instance has been destroyed`);
    };
  }

  /**
   * Returns the active editor class instance.
   *
   * The active editor is the editor instance associated with the currently selected cell.
   * An editor becomes active when a cell is selected and the editor is prepared (but not
   * necessarily open). If no cell is selected, the method returns `undefined`.
   *
   * @memberof Core#
   * @function getActiveEditor
   * @returns {BaseEditor | undefined} The active editor instance, or `undefined` if no cell is selected.
   */
  this.getActiveEditor = function() {
    // During the first `afterLoadData` hook (fired from `loadData` inside `init`),
    // `editorManager` has not been assigned yet. Guard so callers (e.g.
    // `setSourceDataAtCell`) invoked from that hook do not crash.
    return editorManager?.getActiveEditor();
  };

  /**
   * Returns the first rendered row in the DOM (usually, it is not visible in the table's viewport).
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstRenderedVisibleRow
   * @returns {number | null}
   */
  this.getFirstRenderedVisibleRow = function(): number {
    return (instance.view as TableView).getFirstRenderedVisibleRow() as number;
  };

  /**
   * Returns the last rendered row in the DOM (usually, it is not visible in the table's viewport).
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastRenderedVisibleRow
   * @returns {number | null}
   */
  this.getLastRenderedVisibleRow = function(): number {
    return (instance.view as TableView).getLastRenderedVisibleRow() as number;
  };

  /**
   * Returns the first rendered column in the DOM (usually, it is not visible in the table's viewport).
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstRenderedVisibleColumn
   * @returns {number | null}
   */
  this.getFirstRenderedVisibleColumn = function(): number {
    return (instance.view as TableView).getFirstRenderedVisibleColumn() as number;
  };

  /**
   * Returns the last rendered column in the DOM (usually, it is not visible in the table's viewport).
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastRenderedVisibleColumn
   * @returns {number | null}
   */
  this.getLastRenderedVisibleColumn = function(): number {
    return (instance.view as TableView).getLastRenderedVisibleColumn() as number;
  };

  /**
   * Returns the first fully visible row in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstFullyVisibleRow
   * @returns {number | null}
   */
  this.getFirstFullyVisibleRow = function(): number {
    return (instance.view as TableView).getFirstFullyVisibleRow() as number;
  };

  /**
   * Returns the last fully visible row in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastFullyVisibleRow
   * @returns {number | null}
   */
  this.getLastFullyVisibleRow = function(): number {
    return (instance.view as TableView).getLastFullyVisibleRow() as number;
  };

  /**
   * Returns the first fully visible column in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstFullyVisibleColumn
   * @returns {number | null}
   */
  this.getFirstFullyVisibleColumn = function(): number {
    return (instance.view as TableView).getFirstFullyVisibleColumn() as number;
  };

  /**
   * Returns the last fully visible column in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastFullyVisibleColumn
   * @returns {number | null}
   */
  this.getLastFullyVisibleColumn = function(): number {
    return (instance.view as TableView).getLastFullyVisibleColumn() as number;
  };

  /**
   * Returns the first partially visible row in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstPartiallyVisibleRow
   * @returns {number | null}
   */
  this.getFirstPartiallyVisibleRow = function(): number {
    return (instance.view as TableView).getFirstPartiallyVisibleRow() as number;
  };

  /**
   * Returns the last partially visible row in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastPartiallyVisibleRow
   * @returns {number | null}
   */
  this.getLastPartiallyVisibleRow = function(): number {
    return (instance.view as TableView).getLastPartiallyVisibleRow() as number;
  };

  /**
   * Returns the first partially visible column in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstPartiallyVisibleColumn
   * @returns {number | null}
   */
  this.getFirstPartiallyVisibleColumn = function(): number {
    return (instance.view as TableView).getFirstPartiallyVisibleColumn() as number;
  };

  /**
   * Returns the last partially visible column in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastPartiallyVisibleColumn
   * @returns {number | null}
   */
  this.getLastPartiallyVisibleColumn = function(): number {
    return (instance.view as TableView).getLastPartiallyVisibleColumn() as number;
  };

  /**
   * Returns plugin instance by provided its name.
   *
   * @memberof Core#
   * @function getPlugin
   * @param {string} pluginName The plugin name.
   * @returns {BasePlugin|undefined} The plugin instance or undefined if there is no plugin.
   */
  this.getPlugin = function<T extends BasePlugin = BasePlugin>(pluginName: string): T | undefined {
    return pluginsRegistry.getItem(toUpperCaseFirst(pluginName)) as T | undefined;
  };

  /**
   * Returns name of the passed plugin.
   *
   * @private
   * @memberof Core#
   * @param {BasePlugin} plugin The plugin instance.
   * @returns {string}
   */
  this.getPluginName = function(plugin: Record<string, unknown>) {
    return pluginsRegistry.getId(plugin) as string;
  };

  /**
   * Returns the Handsontable instance.
   *
   * @memberof Core#
   * @function getInstance
   * @returns {Handsontable} The Handsontable instance.
   */
  this.getInstance = function(): HotInstance {
    return instance as HotInstance;
  };

  /**
   * Adds listener to the specified hook name (only for this Handsontable instance).
   *
   * @memberof Core#
   * @function addHook
   * @see Hooks#add
   * @param {string} key Hook name (see {@link Hooks}).
   * @param {Function|Array} callback Function or array of functions.
   * @param {number} [orderIndex] Order index of the callback.
   *                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.
   *                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.
   *                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes.
   * @example
   * ```js
   * hot.addHook('beforeInit', myCallback);
   * ```
   */
  this.addHook = function(key: string, callback: HookCallback | HookCallback[], orderIndex: number) {
    Hooks.getSingleton().add(key, callback, instance, orderIndex);
  };

  /**
   * Check if for a specified hook name there are added listeners (only for this Handsontable instance). All available
   * hooks you will find {@link Hooks}.
   *
   * @memberof Core#
   * @function hasHook
   * @see Hooks#has
   * @param {string} key Hook name.
   * @returns {boolean}
   *
   * @example
   * ```js
   * const hasBeforeInitListeners = hot.hasHook('beforeInit');
   * ```
   */
  this.hasHook = function(key: string) {
    return Hooks.getSingleton().has(key, instance) || Hooks.getSingleton().has(key);
  };

  /**
   * Adds listener to specified hook name (only for this Handsontable instance). After the listener is triggered,
   * it will be automatically removed.
   *
   * @memberof Core#
   * @function addHookOnce
   * @see Hooks#once
   * @param {string} key Hook name (see {@link Hooks}).
   * @param {Function|Array} callback Function or array of functions.
   * @param {number} [orderIndex] Order index of the callback.
   *                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.
   *                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.
   *                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes.
   * @example
   * ```js
   * hot.addHookOnce('beforeInit', myCallback);
   * ```
   */
  this.addHookOnce = function(key: string, callback: HookCallback | HookCallback[], orderIndex: number) {
    Hooks.getSingleton().once(key, callback, instance, orderIndex);
  };

  /**
   * Removes the hook listener previously registered with {@link Core#addHook}.
   *
   * @memberof Core#
   * @function removeHook
   * @see Hooks#remove
   * @param {string} key Hook name.
   * @param {Function} callback Reference to the function which has been registered using {@link Core#addHook}.
   *
   * @example
   * ```js
   * hot.removeHook('beforeInit', myCallback);
   * ```
   */
  this.removeHook = function(key: string, callback: HookCallback) {
    Hooks.getSingleton().remove(key, callback, instance);
  };

  /**
   * Run the callbacks for the hook provided in the `key` argument using the parameters given in the other arguments.
   *
   * @memberof Core#
   * @function runHooks
   * @see Hooks#run
   * @param {string} key Hook name.
   * @param {*} [p1] Argument passed to the callback.
   * @param {*} [p2] Argument passed to the callback.
   * @param {*} [p3] Argument passed to the callback.
   * @param {*} [p4] Argument passed to the callback.
   * @param {*} [p5] Argument passed to the callback.
   * @param {*} [p6] Argument passed to the callback.
   * @returns {*}
   *
   * @example
   * ```js
   * // Run built-in hook
   * hot.runHooks('beforeInit');
   * // Run custom hook
   * hot.runHooks('customAction', 10, 'foo');
   * ```
   */
  this.runHooks = function<R = unknown>(
    key: string, p1: unknown, p2: unknown, p3: unknown, p4: unknown, p5: unknown, p6: unknown
  ): R {
    return Hooks.getSingleton().run(instance, key, p1, p2, p3, p4, p5, p6) as R;
  };

  /**
   * Get language phrase for specified dictionary key.
   *
   * @memberof Core#
   * @function getTranslatedPhrase
   * @since 0.35.0
   * @param {string} dictionaryKey Constant which is dictionary key.
   * @param {*} extraArguments Arguments which will be handled by formatters.
   * @returns {string}
   */
  this.getTranslatedPhrase = function(dictionaryKey: string, extraArguments: unknown) {
    return getTranslatedPhrase(tableMeta.language, dictionaryKey, extraArguments) as string;
  };

  /**
   * Converts instance into outerHTML of HTMLTableElement.
   *
   * @memberof Core#
   * @function toHTML
   * @since 7.1.0
   * @returns {string}
   */
  this.toHTML = () => instanceToHTML(this);

  /**
   * Converts instance into HTMLTableElement.
   *
   * @memberof Core#
   * @function toTableElement
   * @since 7.1.0
   * @returns {HTMLTableElement}
   */
  this.toTableElement = (): HTMLTableElement | null => {
    const rootDocument = instance.rootDocument as Document;
    const tempElement = rootDocument.createElement('div');

    tempElement.insertAdjacentHTML('afterbegin', instanceToHTML(instance as HotInstance));

    return tempElement.firstElementChild as HTMLTableElement | null;
  };

  this.timeouts = [];

  /**
   * Use the theme specified by the provided name.
   *
   * @memberof Core#
   * @function useTheme
   * @since 15.0.0
   * @param {string|boolean|undefined} themeName The name of the theme to use.
   */
  this.useTheme = (themeName: string | null) => {
    const isFirstRun = !!firstRun;

    this.stylesHandler.useTheme(themeName ?? undefined);

    const validThemeName = this.stylesHandler.getThemeName();

    if (!isFirstRun && validThemeName) {
      if (getThemeClassName(this.rootContainer)) {
        removeClass(this.rootContainer, /ht-theme-.*/g);
        addClass(this.rootContainer, validThemeName);
      }

      instance.render();
      instance.scrollViewportTo(0, 0);
    }

    this.runHooks('afterSetTheme', validThemeName, isFirstRun);
  };

  /**
   * Gets the name of the currently used theme.
   *
   * @memberof Core#
   * @function getCurrentThemeName
   * @since 15.0.0
   * @returns {string|undefined} The name of the currently used theme.
   */
  this.getCurrentThemeName = (): string | null => {
    return (instance.stylesHandler as StylesHandler).getThemeName() ?? null;
  };

  /**
   * Gets the table's root container element height.
   *
   * @memberof Core#
   * @function getTableHeight
   * @since 16.0.0
   * @returns {number}
   */
  this.getTableHeight = (): number => {
    return (instance.rootElement as HTMLElement).offsetHeight;
  };

  /**
   * Gets the table's root container element width.
   *
   * @memberof Core#
   * @function getTableWidth
   * @since 16.0.0
   * @returns {number}
   */
  this.getTableWidth = (): number => {
    return (instance.rootElement as HTMLElement).offsetWidth;
  };

  /**
   * Sets timeout. Purpose of this method is to clear all known timeouts when `destroy` method is called.
   *
   * @param {number|Function} handle Handler returned from setTimeout or function to execute (it will be automatically wraped
   *                                 by setTimeout function).
   * @param {number} [delay=0] If first argument is passed as a function this argument set delay of the execution of that function.
   * @returns {number} The timeout handle (usable with `clearTimeout`).
   * @private
   */
  this._registerTimeout = function(this: HotInstance & CoreInternals, handle: Function | number, delay = 0) {
    let handleFunc = handle;

    if (typeof handleFunc === 'function') {
      handleFunc = setTimeout(handleFunc, delay);
    }

    this.timeouts.push(handleFunc);

    return handleFunc;
  };

  /**
   * Clears all known timeouts.
   *
   * @private
   */
  this._clearTimeouts = function(this: HotInstance & CoreInternals) {
    arrayEach(this.timeouts, (handler: ReturnType<typeof setTimeout>) => {
      clearTimeout(handler);
    });
  };

  this.microtasks = [];

  /**
   * Registers a microtask callback.
   *
   * @param {Function} callback Function to be delayed in execution.
   * @private
   */
  this._registerMicrotask = function(this: HotInstance & CoreInternals, callback: Function) {
    const entry = { cancelled: false };

    this.microtasks.push(entry);
    this.rootWindow.queueMicrotask(() => {
      if (!entry.cancelled) {
        callback();
      }
    });
  };

  /**
   * Clears all known microtasks (prevents pending callbacks from running).
   *
   * @private
   */
  this._clearMicrotasks = function(this: HotInstance & CoreInternals) {
    arrayEach(this.microtasks, (entry: { cancelled: boolean }) => {
      entry.cancelled = true;
    });
    this.microtasks.length = 0;
  };

  /**
   * Gets the instance of the EditorManager.
   *
   * @private
   * @returns {EditorManager}
   */
  this._getEditorManager = function() {
    return editorManager;
  };

  /**
   * Gets the instance of the DataSource.
   *
   * @private
   * @returns {DataSource}
   */
  this._getDataSource = function() {
    return dataSource;
  };

  /**
   * Gets the instance of the MetaManager.
   *
   * @private
   * @returns {MetaManager}
   */
  this._getMetaManager = function() {
    return metaManager;
  };

  const shortcutManager = createShortcutManager({
    handleEvent(_event, scope) {
      if (scope === 'global') {
        return true;
      }

      return instance.isListening() as boolean;
    },
    beforeKeyDown: (event) => {
      return instance.runHooks('beforeKeyDown', event) as void | boolean;
    },
    afterKeyDown: (event) => {
      if (this.isDestroyed) { // Handsontable could be destroyed after performing action (executing a callback).
        return;
      }

      instance.runHooks('afterDocumentKeyDown', event);
    },

    ownerWindow: this.rootWindow,
  });

  this.addHook('beforeOnCellMouseDown', (event: MouseEvent) => {
    // Releasing keys as some browser/system shortcuts break events sequence (thus the `keyup` event isn't triggered).
    if (event.ctrlKey === false && event.metaKey === false) {
      shortcutManager.releasePressedKeys();
    }
  });

  /**
   * Returns instance of a manager responsible for handling shortcuts stored in some contexts. It run actions after
   * pressing key combination in active Handsontable instance.
   *
   * @memberof Core#
   * @since 12.0.0
   * @function getShortcutManager
   * @returns {ShortcutManager} Instance of {@link ShortcutManager}
   */
  this.getShortcutManager = function() {
    return shortcutManager;
  };

  focusGridManager = new FocusGridManager(instance);

  const focusScopeManager = isRootInstance(this) ? createFocusScopeManager(instance) : null;

  const layoutManager = isRootInstance(this)
    ? new LayoutManager({
      top: instance.rootSlotTopElement,
      bottom: instance.rootSlotBottomElement,
    })
    : null;

  /**
   * Return the Focus Manager responsible for managing the browser's focus in the table.
   *
   * @memberof Core#
   * @since 14.0.0
   * @function getFocusManager
   * @returns {FocusManager}
   */
  this.getFocusManager = function() {
    return focusGridManager;
  };

  /**
   * Returns the Focus Scope Manager. The module allows to register focus scopes for different parts of the grid
   * e.g. for dialogs, pagination, and other plugins that have own UI elements and need separate context.
   *
   * @memberof Core#
   * @since 16.2.0
   * @function getFocusScopeManager
   * @returns {FocusScopeManager} Instance of {@link FocusScopeManager}
   *
   * @example
   * ```js
   * hot.getFocusScopeManager().registerScope('myPluginName', containerElement, {
   *   shortcutsContextName: 'plugin:myPluginName',
   *   onActivate: (focusSource) => {
   *     // Focus the internal focusable element within the plugin UI element
   *     // depends on the activation focus source.
   *   },
   * });
   * ```
   */
  this.getFocusScopeManager = function() {
    if (!isRootInstance(instance)) {
      throwWithCause('The FocusScopeManager is only available for the main Handsontable instance.');
    }

    return focusScopeManager as FocusScopeManager;
  };

  /**
   * Returns the Layout Manager. The module manages the order of plugin UI elements within the
   * user-orderable wrapper slots (`top`, `bottom`). Use it to add or remove custom UI and
   * order it via weights or the `layout` setting. Only available for the main instance.
   *
   * @memberof Core#
   * @since 18.0.0
   * @function getLayoutManager
   * @returns {LayoutManager} Instance of {@link LayoutManager}
   *
   * @example
   * ```js
   * hot.getLayoutManager().register('myToolbar', toolbarElement, { side: 'top', weight: 100 });
   * ```
   */
  this.getLayoutManager = function() {
    if (!isRootInstance(instance)) {
      throwWithCause('The LayoutManager is only available for the main Handsontable instance.');
    }

    return layoutManager as LayoutManager;
  };

  const theme = mergedUserSettings.theme as ThemeBuilder | undefined;
  const themeName = mergedUserSettings.themeName;
  const rootContainerThemeClassName = getThemeClassName(instance.rootContainer);

  if (
    isRootInstance(instance) &&
    !rootContainerThemeClassName &&
    (isObject(theme) || (!theme && !themeName))
  ) {
    initializeThemeManager(theme as ThemeBuilder | undefined);
  }

  getPluginsNames().forEach((pluginName) => {
    const PluginClass = getPlugin(pluginName);

    if (PluginClass) {
      pluginsRegistry.addItem(pluginName, new PluginClass(this));
    }
  });

  registerAllShortcutContexts(instance);

  if (isRootInstance(this)) {
    registerAllFocusScopes(instance);
  }

  shortcutManager.setActiveContextName('grid');

  Hooks.getSingleton().run(instance, 'construct');
}
