import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { arrayEach, arrayFilter, arrayMap } from '../../helpers/array';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';
import { addClass, isBottomMostColumnHeader, isHTMLElement, removeClass } from '../../helpers/dom/element';
import { isKey } from '../../helpers/unicode';
import { getValueGetterValue } from '../../utils/valueAccessors';
import { createObjectPropListener, deepClone, hasOwnProperty, isObject } from '../../helpers/object';
import type { ObjectPropListener } from '../../helpers/object';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import * as constants from '../../i18n/constants';
import { ConditionComponent } from './component/condition';
import { OperatorsComponent } from './component/operators';
import type { StateInfo } from './component/value';
import { ValueComponent } from './component/value';
import { ActionBarComponent } from './component/actionBar';
import ConditionCollection from './conditionCollection';
import DataFilter from './dataFilter';
import ConditionUpdateObserver from './conditionUpdateObserver';
import {
  createArrayAssertion,
  getPinnedPhysicalRows,
  toEmptyString,
  warnAboutPerColumnFilterSettings,
} from './utils';
import { createMenuFocusController } from './menu/focusController';
import type { Menu } from '../contextMenu/menu/menu';
import type { DropdownMenu } from '../dropdownMenu/dropdownMenu';
import {
  CONDITION_NONE,
  CONDITION_BY_VALUE,
  OPERATION_AND,
  OPERATION_OR,
  OPERATION_OR_THEN_VARIABLE
} from './constants';
import type { IndexMap, TrimmingMap } from '../../translations';
import type { BaseComponent } from './component/_base';

export type OperationType = 'conjunction' | 'disjunction' | 'disjunctionWithExtraCondition';

export interface ConditionId {
  name: string;
  args: unknown[];
}

export interface ColumnConditions {
  column: number;
  conditions: ConditionId[];
  operation: OperationType;
}

export const PLUGIN_KEY = 'filters';
export const PLUGIN_PRIORITY = 250;
const SHORTCUTS_GROUP = PLUGIN_KEY;

/**
 * Default for the `filterFixedRows` option: the rows pinned by `fixedRowsTop` and `fixedRowsBottom`
 * take part in filtering, which is what the plugin has always done. Flipping this constant is a
 * breaking change - a grid whose footer row happens not to match its own filter would start
 * keeping that row on screen.
 *
 * The sibling option on the sorting side, `columnSorting`'s `sortFixedRows`, defaults the other way
 * round, because 18.0.0 had already shipped "pinned rows stay put" for sorting before the option
 * existed. The two defaults therefore disagree on purpose.
 */
const FILTER_FIXED_ROWS_DEFAULT = true;

/**
 * @plugin Filters
 * @class Filters
 *
 * @description
 * The plugin allows filtering the table data either by the built-in component or with the API.
 *
 * Set the `filters` option to an object to configure the plugin:
 *
 * | Option            | Possible settings                                                                                                                                             |
 * | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | `searchMode`      | `'show'`: Filter only the values shown in the list<br>`'apply'`: Apply the search term as the filter                                                         |
 * | `filterFixedRows` | `true`: Filter the whole dataset, including the frozen rows<br>`false`: Leave the rows frozen by `fixedRowsTop` and `fixedRowsBottom` out of the filter<br>Grid-level only |
 *
 * To turn filtering off for a single column, set `filters` to `false` for that column in the
 * `columns` option. That hides the filter controls in the column's dropdown menu; the API is
 * unaffected, so {@link Filters#addCondition} still filters the column.
 *
 * See [the filtering demo](@/guides/columns/column-filter/column-filter.md) for examples.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   dropdownMenu: true,
 *   filters: true
 * });
 *
 * // keep the frozen rows out of the filter, and turn filtering off for the first column
 * const hot2 = new Handsontable(container2, {
 *   data: getData(),
 *   colHeaders: true,
 *   dropdownMenu: true,
 *   fixedRowsBottom: 1,
 *   filters: {
 *     filterFixedRows: false,
 *   },
 *   columns: [
 *     { filters: false },
 *     {},
 *   ],
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   colHeaders={true}
 *   rowHeaders={true}
 *   dropdownMenu={true}
 *   filters={true}
 * />
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * settings = {
 *   data: getData(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   dropdownMenu: true,
 *   filters: true,
 * };
 * ```
 *
 * ```html
 * <hot-table [settings]="settings"></hot-table>
 * ```
 * :::
 */
export class Filters extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS() {
    return {
      searchMode: 'show',
      filterFixedRows: FILTER_FIXED_ROWS_DEFAULT,
    };
  }

  /**
   * Returns validator functions for each plugin setting to verify their values are valid before applying them.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      searchMode: (value: unknown) => typeof value === 'string' && ['show', 'apply'].includes(value),
      filterFixedRows: (value: unknown) => typeof value === 'boolean',
    };
  }

  /**
   * Returns the list of plugin dependencies required before this plugin can be initialized.
   */
  static get PLUGIN_DEPS() {
    return [
      'plugin:DropdownMenu',
      'plugin:HiddenRows',
      'cell-type:checkbox',
    ];
  }

  /**
   * Instance of {@link DropdownMenu}.
   *
   * @private
   * @type {DropdownMenu}
   */
  dropdownMenuPlugin: DropdownMenu | null = null;
  /**
   * Instance of {@link ConditionCollection}.
   *
   * @private
   * @type {ConditionCollection}
   */
  conditionCollection: ConditionCollection | null = null;
  /**
   * Instance of {@link ConditionUpdateObserver}.
   *
   * @private
   * @type {ConditionUpdateObserver}
   */
  conditionUpdateObserver: ConditionUpdateObserver | null = null;
  /**
   * Map, where key is component identifier and value represent `BaseComponent` element or it derivatives.
   *
   * @private
   * @type {Map}
   */
  components = new Map<string, BaseComponent | null>([
    ['filter_by_condition', null],
    ['filter_operators', null],
    ['filter_by_condition2', null],
    ['filter_by_value', null],
    ['filter_action_bar', null]
  ]);
  /**
   * Map of skipped rows by plugin.
   *
   * @private
   * @type {null|TrimmingMap}
   */
  filtersRowsMap: TrimmingMap | null = null;
  /**
   * Menu focus navigator allows switching the focus position through Tab and Shift Tab keys.
   *
   * @type {MenuFocusNavigator|undefined}
   */
  #menuFocusNavigator: ReturnType<typeof createMenuFocusController> | undefined;
  /**
   * Traces the new menu instances to apply the focus navigation to the latest one.
   *
   * @type {WeakSet<Menu>}
   */
  #dropdownMenuTraces = new WeakSet<Menu>();
  /**
   * Stores the previous state of the condition stack before the latest filter operation.
   * This is used in the `beforeFilter` plugin to allow performing the undo operation.
   *
   * @type {Array}
   */
  #previousConditionStack: ColumnConditions[] = [];

  /**
   * Snapshot of `#previousConditionStack` at the start of `filter()` when the DataProvider plugin is active.
   * Used to restore filter UI after `fetchRows` fails (the fetch request used the in-collection state; this holds the last committed stack).
   *
   * @type {Array}
   */
  #dataProviderFilterRollbackStack: ColumnConditions[] = [];

  /**
   * Indicates if the DataProvider plugin is active.
   *
   * @type {boolean}
   */
  #isDataProviderActive = false;
  /**
   * Memoized result of `#getPinnedRows()`, or `undefined` while nothing is memoized.
   *
   * Resolving the pinned rows walks every physical row against the other plugins' trimming maps,
   * and one `filter()` asks for them once per filtered column plus once for the trimmed-state pass.
   * The memo is only sound for the length of that call, so `filter()` clears it on the way in and
   * on the way out - the row order and the `fixedRows*` options can both change between calls.
   *
   * @type {Set<number>|null|undefined}
   */
  #pinnedRowsCache: Set<number> | null | undefined;
  /**
   * Whether a `filter()` pass is running, which is the only scope `#pinnedRowsCache` is valid in.
   *
   * @type {boolean}
   */
  #isFilterPassActive = false;
  /**
   * Guards `#refilterForPinnedRows()` against re-entering itself.
   *
   * @type {boolean}
   */
  #isRefilteringForPinnedRows = false;

  /**
   * Initializes the plugin and registers the column header hook needed to inject the filter UI.
   */
  constructor(hotInstance: HotInstance) {
    super(hotInstance);
    // One listener for the enable/disable functionality
    this.hot.addHook('afterGetColHeader', this.#onAfterGetColHeader);
  }

  /**
   * @private
   */
  #getConditionComponent(id: 'filter_by_condition' | 'filter_by_condition2'): ConditionComponent | null {
    return (this.components.get(id) as ConditionComponent | null | undefined) ?? null;
  }

  /**
   * @private
   */
  #getOperatorsComponent(): OperatorsComponent | null {
    return (this.components.get('filter_operators') as OperatorsComponent | null | undefined) ?? null;
  }

  /**
   * @private
   */
  #getValueComponent(): ValueComponent | null {
    return (this.components.get('filter_by_value') as ValueComponent | null | undefined) ?? null;
  }

  /**
   * Whether this grid exempts its frozen rows from filtering at all.
   *
   * Deliberately separate from "how many rows are pinned right now": those counts are zero both
   * when the grid never opted in AND when the last overlay was just cleared. Reading the counts to
   * decide whether to act conflates the two, so clearing `fixedRowsTop` would skip the re-filter
   * and leave a row on screen that nothing pins any more.
   *
   * @private
   */
  #isFixedRowExemptionActive(): boolean {
    // A data provider filters server-side, and the request carries no notion of a pinned row, so
    // exempting rows locally would only make the grid disagree with the server's own result.
    return !this.#isDataProviderActive && this.getSetting('filterFixedRows') === false;
  }

  /**
   * How many rows each overlay pins, or zeros while `filterFixedRows` keeps them in the filter.
   *
   * Read straight from the grid settings on every call, the same way `fixedRowsTop` and
   * `fixedRowsBottom` themselves are read, so `updateSettings` needs no wiring of its own.
   *
   * @private
   */
  #getPinnedRowCounts(): { top: number, bottom: number } {
    if (!this.#isFixedRowExemptionActive()) {
      return { top: 0, bottom: 0 };
    }

    const { fixedRowsTop, fixedRowsBottom } = this.hot.getSettings();

    // `Number(x) || 0` rather than `?? 0`, to match how `TableView` reads the same two options.
    // `Math.max` alone lets a non-numeric value through as NaN, which silently empties the
    // value-list loop that counts up to it.
    return {
      top: Math.max(0, Number(fixedRowsTop) || 0),
      bottom: Math.max(0, Number(fixedRowsBottom) || 0),
    };
  }

  /**
   * The physical rows the filter must leave alone, or `null` when every row is in scope.
   *
   * `null` rather than an empty set, so the read loops can skip the membership test entirely on a
   * grid that pins nothing - which is every grid that has not opted in.
   *
   * The rows are resolved from the rows the grid SHOWS, minus the ones this plugin's own map is
   * trimming. The raw index sequence cannot answer it: it still holds rows that `trimRows` or a
   * collapsed `nestedRows` parent removed, while the two overlays freeze the first and last
   * VISIBLE rows - so on such a grid the sequence names rows that are not pinned and misses the
   * ones that are. This plugin's own trim is excluded because it is the thing being recomputed;
   * counting it would let the pinned set drift with each pass.
   *
   * Memoized for the duration of one `filter()` call, where every column read asks again.
   *
   * @private
   */
  #getPinnedRows(): Set<number> | null {
    if (this.#pinnedRowsCache !== undefined) {
      return this.#pinnedRowsCache;
    }

    const { top, bottom } = this.#getPinnedRowCounts();
    let pinnedRows: Set<number> | null = null;

    if (top > 0 || bottom > 0) {
      // Visual order, so the two overlays freeze the rows the user actually sees. `getIndexesSequence()`
      // carries the sort permutation, and the rows another plugin trims are dropped from it here.
      const rowOrder = this.hot.rowIndexMapper.getIndexesSequence();
      const visibleRows = rowOrder.filter(physicalRow => !this.#isTrimmedByAnotherPlugin(physicalRow));
      const resolved = getPinnedPhysicalRows(visibleRows, top, bottom);

      pinnedRows = resolved.size > 0 ? resolved : null;
    }

    // Stored ONLY while `filter()` is running. Every other caller - the value list, which is built
    // on each menu opening - must resolve afresh: nothing clears the memo between those calls, and
    // with no condition applied there is no `filter()` to clear it, so a later `fixedRows*` change
    // or row move would keep being answered from the set this call resolved.
    if (this.#isFilterPassActive) {
      this.#pinnedRowsCache = pinnedRows;
    }

    return pinnedRows;
  }

  /**
   * Whether a row is trimmed by a map other than this plugin's own.
   *
   * @private
   */
  #isTrimmedByAnotherPlugin(physicalRow: number): boolean {
    const trimmingMaps = this.hot.rowIndexMapper.trimmingMapsCollection.get() as IndexMap[];

    return trimmingMaps.some(map => map !== this.filtersRowsMap && map.getValueAtIndex(physicalRow) === true);
  }

  /**
   * Runs the pinned rows through `filter()` again after the set of pinned rows may have changed.
   *
   * The exemption is applied while filtering, so nothing re-applies it on its own when the rows
   * move underneath: changing `fixedRows*`, inserting or removing a row at either end, moving rows
   * or sorting all change WHICH rows are pinned, and the trimming map still holds the answer from
   * the previous pass. Left alone, a frozen pane ends up showing a row the filter should have
   * hidden, and the record that is really pinned stays trimmed.
   *
   * Only grids that opted in and are actually filtering pay for this.
   *
   * @private
   */
  #refilterForPinnedRows() {
    // The OPTION, not the current counts: clearing the last `fixedRows*` count makes the counts
    // zero, and gating on them would read that as "this grid never opted in" and skip the pass
    // that puts the no-longer-pinned rows back under the conditions.
    if (this.#isRefilteringForPinnedRows ||
        !this.#isFixedRowExemptionActive() ||
        !this.conditionCollection ||
        this.conditionCollection.isEmpty()) {
      return;
    }

    // A re-entrancy flag, not a test on the change's source. Writing `filtersRowsMap` does not fire
    // this hook - only a change to the index SEQUENCE does, and a trimming map is not the sequence -
    // so `filter()` cannot re-enter here on its own. The flag stops a consumer that sorts or moves
    // rows from `beforeFilter`/`afterFilter`. Source is no help: a sort reports `'update'`, the same
    // value ordinary changes carry.
    this.#isRefilteringForPinnedRows = true;

    try {
      this.filter();
    } finally {
      this.#isRefilteringForPinnedRows = false;
    }
  }

  /**
   * Whether a column takes part in filtering at all.
   *
   * Only an OWN property of the column meta answers this. Column meta inherits from the grid meta
   * through the prototype chain, so a plain read would also see the grid-level `filters` value -
   * and report every column as opted out on a grid built with `filters: false` whose plugin was
   * switched on afterwards through `enablePlugin()`. Whether the plugin runs at all is
   * `BasePlugin`'s question, not this one's.
   *
   * @private
   */
  #isColumnFilterable(visualColumn = this.getSelectedColumn()?.visualIndex ?? -1): boolean {
    if (visualColumn < 0) {
      return true;
    }

    const columnMeta = this.hot.getColumnMeta(visualColumn) as Record<string, unknown>;

    if (!hasOwnProperty(columnMeta, PLUGIN_KEY)) {
      return true;
    }

    return columnMeta[PLUGIN_KEY] !== false;
  }

  /**
   * Warns once per grid when a column carries a `filters` settings OBJECT, which is ignored.
   *
   * Scanned over every column rather than raised from the visibility check, so a grid with no
   * dropdown menu, or a column whose menu is never opened, still gets the message - the docs
   * promise it is logged once per grid, not once per menu opening. A visibility predicate is also
   * the wrong place for a side effect.
   *
   * @private
   */
  #warnAboutPerColumnSettingsObjects = () => {
    const columnCount = this.hot.countCols();

    for (let visualColumn = 0; visualColumn < columnCount; visualColumn++) {
      const columnMeta = this.hot.getColumnMeta(visualColumn) as Record<string, unknown>;

      if (hasOwnProperty(columnMeta, PLUGIN_KEY) && isObject(columnMeta[PLUGIN_KEY])) {
        warnAboutPerColumnFilterSettings(this.hot.rootElement, PLUGIN_KEY);

        return;
      }
    }
  };

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link Filters#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    /* eslint-disable no-unneeded-ternary */
    return this.hot.getSettings()[PLUGIN_KEY] ? true : false;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#isDataProviderActive = this.hot.runHooks('hasExternalDataSource') === true;

    this.filtersRowsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap(this.pluginName ?? '', 'trimming');
    this.dropdownMenuPlugin = this.hot.getPlugin('dropdownMenu');

    const dropdownSettings = this.hot.getSettings().dropdownMenu;
    const uiContainerCandidate = typeof dropdownSettings === 'object'
      ? (dropdownSettings as Record<string, unknown>).uiContainer : null;
    const menuContainer = isHTMLElement(uiContainerCandidate)
      ? uiContainerCandidate
      : this.hot.rootPortalElement;
    const addConfirmationHooks = (component: BaseComponent) => {
      component.addLocalHook('accept', () => this.#onActionBarSubmit('accept'));
      component.addLocalHook('cancel', () => this.#onActionBarSubmit('cancel'));
      component.addLocalHook('change',
        (command: Record<string, unknown>) => this.#onComponentChange(component, command));

      return component;
    };

    const filterByConditionLabel = () => `${this.hot.getTranslatedPhrase(constants.FILTERS_DIVS_FILTER_BY_CONDITION)}:`;
    const filterValueLabel = () => `${this.hot.getTranslatedPhrase(constants.FILTERS_DIVS_FILTER_BY_VALUE)}:`;
    // Re-read on every menu opening, never captured: it answers for the column the menu was opened
    // on, and `updateSettings` can change the answer without the plugin being re-enabled.
    const hiddenForColumn = () => !this.#isColumnFilterable();

    if (!this.components.get('filter_by_condition')) {
      const conditionComponent = new ConditionComponent(this.hot, {
        id: 'filter_by_condition',
        name: filterByConditionLabel,
        addSeparator: false,
        hiddenWhen: hiddenForColumn,
        menuContainer
      });

      conditionComponent.addLocalHook('afterClose', () => this.#onSelectUIClosed());

      this.components.set('filter_by_condition', addConfirmationHooks(conditionComponent));
    }

    if (!this.components.get('filter_operators')) {
      this.components.set('filter_operators', new OperatorsComponent(this.hot, {
        id: 'filter_operators',
        name: 'Operators',
        hiddenWhen: hiddenForColumn,
      }));
    }

    if (!this.components.get('filter_by_condition2')) {
      const conditionComponent = new ConditionComponent(this.hot, {
        id: 'filter_by_condition2',
        name: '',
        addSeparator: true,
        hiddenWhen: hiddenForColumn,
        menuContainer
      });

      conditionComponent.addLocalHook('afterClose', () => this.#onSelectUIClosed());

      this.components.set('filter_by_condition2', addConfirmationHooks(conditionComponent));
    }

    if (!this.components.get('filter_by_value')) {
      const searchMode = this.getSetting('searchMode');

      this.components.set('filter_by_value', addConfirmationHooks(new ValueComponent(this.hot, {
        id: 'filter_by_value',
        name: filterValueLabel,
        searchMode,
        hiddenWhen: () => this.#isDataProviderActive || hiddenForColumn(),
      })));
    }

    if (!this.components.get('filter_action_bar')) {
      this.components.set('filter_action_bar', addConfirmationHooks(new ActionBarComponent(this.hot, {
        id: 'filter_action_bar',
        name: 'Action bar',
        hiddenWhen: hiddenForColumn,
      })));
    }

    if (!this.conditionCollection) {
      this.conditionCollection = new ConditionCollection(this.hot);
    }

    if (!this.conditionUpdateObserver) {
      this.conditionUpdateObserver = new ConditionUpdateObserver(
        this.hot,
        this.conditionCollection,
        (physicalColumn: number, physicalRows?: number[]) =>
          this.getDataMapAtColumn(physicalColumn, physicalRows),
      );
      this.conditionUpdateObserver.addLocalHook('update',
        (conditionState: Record<string, unknown>) => this.#updateComponents(conditionState));
    }

    this.components.forEach(component => component?.show());

    this.addHook('afterDropdownMenuDefaultOptions', this.#onAfterDropdownMenuDefaultOptions);
    this.addHook('beforeDropdownMenuShow', this.#onBeforeDropdownMenuShow);
    this.addHook('afterDropdownMenuShow', this.#onAfterDropdownMenuShow);
    this.addHook('afterDropdownMenuHide', this.#onAfterDropdownMenuHide);
    this.addHook('afterChange', this.#onAfterChange);
    this.addHook('afterUpdateData', this.#onAfterUpdateData);
    // Option A for the stale exemption: re-run the filter whenever the rows the overlays freeze may
    // have moved. `afterUpdateSettings` covers the `fixedRows*` options themselves, and the row
    // sequence hook covers an insert, a remove, a move and a sort. Both are cheap no-ops unless the
    // grid opted in AND is actually filtering - see `#refilterForPinnedRows()`.
    this.addHook('afterUpdateSettings', this.#onAfterUpdateSettings);
    this.addHook('afterRowSequenceChange', this.#onAfterRowSequenceChange);
    this.addHook('afterDataProviderFetch', this.#onAfterDataProviderFetch);
    this.addHook('afterDataProviderFetchError', this.#onAfterDataProviderFetchError);

    // Temp. solution (extending menu items bug in contextMenu/dropdownMenu)
    if (this.hot.getSettings().dropdownMenu && this.dropdownMenuPlugin) {
      this.dropdownMenuPlugin.disablePlugin();
      this.dropdownMenuPlugin.enablePlugin();
    }

    if (!this.#menuFocusNavigator && this.dropdownMenuPlugin?.enabled) {
      const focusableItems = [
        // A fake menu item that once focused allows escaping from the focus navigation (using Tab keys)
        // to the menu navigation using arrow keys.
        {
          focus: () => {
            const navigator = this.#menuFocusNavigator;

            if (!navigator) {
              return;
            }

            const menu = navigator.getMenu();
            const menuNavigator = menu.getNavigator();
            const lastSelectedMenuItem = navigator.getLastMenuPage();

            menu.focus();

            if (lastSelectedMenuItem > 0) {
              menuNavigator?.setCurrentPage(lastSelectedMenuItem);
            } else {
              menuNavigator?.toFirstItem();
            }
          },
        },
        ...Array.from(this.components)
          .map(([, component]) => component?.getElements() ?? [])
          .flat(),
      ];

      this.#menuFocusNavigator = createMenuFocusController(
        this.dropdownMenuPlugin.menu!, focusableItems);

      const forwardToFocusNavigation = (event: KeyboardEvent) => {
        this.#menuFocusNavigator?.listen();
        event.preventDefault();

        if (isKey(event.keyCode, 'TAB')) {
          if (event.shiftKey) {
            this.#menuFocusNavigator?.toPreviousItem();
          } else {
            this.#menuFocusNavigator?.toNextItem();
          }
        }
      };

      this.components.get('filter_by_value')
        ?.addLocalHook('listTabKeydown', forwardToFocusNavigation);
      this.components.get('filter_by_condition')
        ?.addLocalHook('selectTabKeydown', forwardToFocusNavigation);
    }

    // Deferred to `afterInit`: `enablePlugin()` runs on `afterPluginsInitialized`, where the column
    // meta layer is not resolvable yet and every column reads as carrying nothing.
    this.addHook('afterInit', this.#warnAboutPerColumnSettingsObjects);
    this.registerShortcuts();
    super.enablePlugin();
  }

  /**
   * Update plugin state after Handsontable settings update.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    if (this.enabled) {
      if (this.dropdownMenuPlugin?.enabled) {
        this.dropdownMenuPlugin.menu?.clearLocalHooks();
      }

      this.components.forEach((component, key) => {
        component?.destroy();
        this.components.set(key, null);
      });
      // Destroy and null the observer alongside the collection, the way `destroy()` tears down
      // both. The observer holds its own reference to the collection, so leaving it bound to a
      // destroyed collection strands it: `enablePlugin()` recreates the collection but skips the
      // observer it still holds, and the next data change reads the destroyed collection and throws
      // (DEV-2889). Order between the two does not matter - neither `destroy()` fires a hook the
      // other listens to.
      this.conditionUpdateObserver?.destroy();
      this.conditionUpdateObserver = null;
      this.conditionCollection?.destroy();
      this.conditionCollection = null;
      // Drop the focus navigator too. It caches `focusableItems` built from the component elements
      // just destroyed, and its `enablePlugin()` rebuild sits behind an `if (!this.#menuFocusNavigator)`
      // guard - so a surviving instance keeps pointing the Tab focus at detached elements and blocks
      // a fresh one. Same stale-reference family as the collection/observer above (DEV-2889).
      this.#menuFocusNavigator = undefined;
      this.hot.rowIndexMapper.unregisterMap(this.pluginName ?? '');
    }

    this.unregisterShortcuts();
    super.disablePlugin();
  }

  /**
   * Register shortcuts responsible for clearing the filters.
   *
   * @private
   */
  registerShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.addShortcut({
        keys: [['Alt', 'A']],
        stopPropagation: true,
        callback: () => {
          const selection = this.hot.getSelected();

          this.clearConditions();
          this.filter();

          if (selection) {
            this.hot.selectCells(selection);
          }
        },
        group: SHORTCUTS_GROUP,
      });
  }

  /**
   * Unregister shortcuts responsible for clearing the filters.
   *
   * @private
   */
  unregisterShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * @memberof Filters#
   * @function addCondition
   * @description
   * Adds condition to the conditions collection at specified column index.
   *
   * Possible predefined conditions:
   *
   * | Condition | Description | Expected `args` |
   * |---|---|---|
   * | `begins_with` | Begins with | `[value: string]`, e.g. `['de']` |
   * | `between` | Between | `[from: number\|string, to: number\|string]`, e.g. `[10, 50]` |
   * | `by_value` | By value | `[[...values: Array]]`, e.g. `[['ing', 'ed', 'as']]`. The outer array wraps a single inner array that contains all values to **keep** (show) after filtering. |
   * | `contains` | Contains | `[value: string]`, e.g. `['ing']` |
   * | `date_after` | After a date (exclusive) | `[dateString: string]`, e.g. `['1/1/2023']`. The format must match the column's `dateFormat` option. |
   * | `date_after_or_equal` | After or equal to a date (inclusive) | `[dateString: string]`, e.g. `['1/1/2023']`. The format must match the column's `dateFormat` option. |
   * | `date_before` | Before a date (exclusive) | `[dateString: string]`, e.g. `['1/1/2023']`. The format must match the column's `dateFormat` option. |
   * | `date_before_or_equal` | Before or equal to a date (inclusive) | `[dateString: string]`, e.g. `['1/1/2023']`. The format must match the column's `dateFormat` option. |
   * | `date_today` | Today | `[]` |
   * | `date_tomorrow` | Tomorrow | `[]` |
   * | `date_yesterday` | Yesterday | `[]` |
   * | `empty` | Empty | `[]` |
   * | `ends_with` | Ends with | `[value: string]`, e.g. `['ing']` |
   * | `eq` | Equal | `[value: string\|number]`, e.g. `['John']` |
   * | `gt` | Greater than | `[value: number]`, e.g. `[95]` |
   * | `gte` | Greater than or equal | `[value: number]`, e.g. `[95]` |
   * | `intl_date_after` | After a date, exclusive (locale-aware) | `[dateString: string]`, e.g. `['2023-01-01']` |
   * | `intl_date_after_or_equal` | After or equal to a date, inclusive (locale-aware) | `[dateString: string]`, e.g. `['2023-01-01']` |
   * | `intl_date_before` | Before a date, exclusive (locale-aware) | `[dateString: string]`, e.g. `['2023-01-01']` |
   * | `intl_date_before_or_equal` | Before or equal to a date, inclusive (locale-aware) | `[dateString: string]`, e.g. `['2023-01-01']` |
   * | `intl_date_between` | Between dates (locale-aware) | `[fromDateString: string, toDateString: string]`, e.g. `['2023-01-01', '2023-12-31']` |
   * | `intl_date_today` | Today (locale-aware) | `[]` |
   * | `intl_date_tomorrow` | Tomorrow (locale-aware) | `[]` |
   * | `intl_date_yesterday` | Yesterday (locale-aware) | `[]` |
   * | `intl_time_after` | After a time (locale-aware) | `[timeString: string]`, e.g. `['12:00']` |
   * | `intl_time_before` | Before a time (locale-aware) | `[timeString: string]`, e.g. `['08:00']` |
   * | `intl_time_between` | Between times (locale-aware) | `[fromTimeString: string, toTimeString: string]`, e.g. `['08:00', '12:00']` |
   * | `lt` | Less than | `[value: number]`, e.g. `[10]` |
   * | `lte` | Less than or equal | `[value: number]`, e.g. `[10]` |
   * | `none` | None (no filter) | `[]`. Matches every row, so it has no filtering effect. To clear a column's filter, use [`removeConditions()`](@/api/filters.md#removeconditions) instead. |
   * | `not_between` | Not between | `[from: number\|string, to: number\|string]`, e.g. `[10, 50]` |
   * | `not_contains` | Not contains | `[value: string]`, e.g. `['ing']` |
   * | `not_empty` | Not empty | `[]` |
   * | `neq` | Not equal | `[value: string\|number]`, e.g. `['John']` |
   *
   * Possible operations on collection of conditions:
   *  * `conjunction` - [**Conjunction**](https://en.wikipedia.org/wiki/Logical_conjunction) on conditions collection (by default), i.e. for such operation: <br/> c1 AND c2 AND c3 AND c4 ... AND cn === TRUE, where c1 ... cn are conditions.
   *  * `disjunction` - [**Disjunction**](https://en.wikipedia.org/wiki/Logical_disjunction) on conditions collection, i.e. for such operation: <br/> c1 OR c2 OR c3 OR c4 ... OR cn === TRUE, where c1, c2, c3, c4 ... cn are conditions.
   *  * `disjunctionWithExtraCondition` - **Disjunction** on first `n - 1`\* conditions from collection with an extra requirement computed from the last condition, i.e. for such operation: <br/> c1 OR c2 OR c3 OR c4 ... OR cn-1 AND cn === TRUE, where c1, c2, c3, c4 ... cn are conditions.
   *
   * \* when `n` is collection size; it's used i.e. for one operation introduced from UI (when choosing from filter's drop-down menu two conditions with OR operator between them, mixed with choosing values from the multiple choice select)
   *
   * **Note**: Mind that you cannot mix different types of operations (for instance, if you use `conjunction`, use it consequently for a particular column).
   *
   * **Note**: If the number of conditions added programmatically via `addCondition()` exceeds the capacity of the
   * filter's dropdown UI (at most 2 regular conditions and 1 `by_value` condition per column), the extra conditions
   * will be applied to the data but will not be visible or editable in the dropdown menu.
   *
   * @example
   * ::: only-for javascript
   * ```js
   * const container = document.getElementById('example');
   * const hot = new Handsontable(container, {
   *   data: getData(),
   *   filters: true
   * });
   *
   * // access to filters plugin instance
   * const filtersPlugin = hot.getPlugin('filters');
   *
   * // add filter "Begins with" with value "de" to column at index 1
   * filtersPlugin.addCondition(1, 'begins_with', ['de']);
   * filtersPlugin.filter();
   *
   * // add filter "Between" 10 and 50 to column at index 1
   * filtersPlugin.addCondition(1, 'between', [10, 50]);
   * filtersPlugin.filter();
   *
   * // add filter "By value" to column at index 1
   * // in this case all values that don't match will be filtered
   * filtersPlugin.addCondition(1, 'by_value', [['ing', 'ed', 'as', 'on']]);
   * filtersPlugin.filter();
   *
   * // add filter "Contains" with value "ing" to column at index 1
   * filtersPlugin.addCondition(1, 'contains', ['ing']);
   * filtersPlugin.filter();
   *
   * // add filter "After a date" with value "1/1/2023" to column at index 1
   * filtersPlugin.addCondition(1, 'date_after', ['1/1/2023']);
   * filtersPlugin.filter();
   *
   * // add filter "Before a date" with value "1/1/2023" to column at index 1
   * filtersPlugin.addCondition(1, 'date_before', ['1/1/2023']);
   * filtersPlugin.filter();
   *
   * // add filter "Today" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'date_today', []);
   * filtersPlugin.filter();
   *
   * // add filter "Tomorrow" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'date_tomorrow', []);
   * filtersPlugin.filter();
   *
   * // add filter "Yesterday" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'date_yesterday', []);
   * filtersPlugin.filter();
   *
   * // add filter "Empty" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'empty', []);
   * filtersPlugin.filter();
   *
   * // add filter "Ends with" with value "ing" to column at index 1
   * filtersPlugin.addCondition(1, 'ends_with', ['ing']);
   * filtersPlugin.filter();
   *
   * // add filter "Equal" with value "John" to column at index 1
   * filtersPlugin.addCondition(1, 'eq', ['John']);
   * filtersPlugin.filter();
   *
   * // add filter "Greater than" 95 to column at index 1
   * filtersPlugin.addCondition(1, 'gt', [95]);
   * filtersPlugin.filter();
   *
   * // add filter "Greater than or equal" 95 to column at index 1
   * filtersPlugin.addCondition(1, 'gte', [95]);
   * filtersPlugin.filter();
   *
   * // add filter "Less than" 10 to column at index 1
   * filtersPlugin.addCondition(1, 'lt', [10]);
   * filtersPlugin.filter();
   *
   * // add filter "Less than or equal" 10 to column at index 1
   * filtersPlugin.addCondition(1, 'lte', [10]);
   * filtersPlugin.filter();
   *
   * // add filter "None" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'none', []);
   * filtersPlugin.filter();
   *
   * // add filter "Not between" 10 and 50 to column at index 1
   * filtersPlugin.addCondition(1, 'not_between', [10, 50]);
   * filtersPlugin.filter();
   *
   * // add filter "Not contains" with value "ing" to column at index 1
   * filtersPlugin.addCondition(1, 'not_contains', ['ing']);
   * filtersPlugin.filter();
   *
   * // add filter "Not empty" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'not_empty', []);
   * filtersPlugin.filter();
   *
   * // add filter "Not equal" with value "John" to column at index 1
   * filtersPlugin.addCondition(1, 'neq', ['John']);
   * filtersPlugin.filter();
   * ```
   * :::
   *
   * ::: only-for react
   * ```jsx
   * const hotRef = useRef(null);
   *
   * ...
   *
   * <HotTable
   *   ref={hotRef}
   *   data={getData()}
   *   filters={true}
   * />
   *
   * // access to filters plugin instance
   * const hot = hotRef.current.hotInstance;
   * const filtersPlugin = hot.getPlugin('filters');
   *
   * // add filter "Begins with" with value "de" to column at index 1
   * filtersPlugin.addCondition(1, 'begins_with', ['de']);
   * filtersPlugin.filter();
   *
   * // add filter "Between" 10 and 50 to column at index 1
   * filtersPlugin.addCondition(1, 'between', [10, 50]);
   * filtersPlugin.filter();
   *
   * // add filter "By value" to column at index 1
   * // in this case all values that don't match will be filtered
   * filtersPlugin.addCondition(1, 'by_value', [['ing', 'ed', 'as', 'on']]);
   * filtersPlugin.filter();
   *
   * // add filter "Contains" with value "ing" to column at index 1
   * filtersPlugin.addCondition(1, 'contains', ['ing']);
   * filtersPlugin.filter();
   *
   * // add filter "After a date" with value "1/1/2023" to column at index 1
   * filtersPlugin.addCondition(1, 'date_after', ['1/1/2023']);
   * filtersPlugin.filter();
   *
   * // add filter "Before a date" with value "1/1/2023" to column at index 1
   * filtersPlugin.addCondition(1, 'date_before', ['1/1/2023']);
   * filtersPlugin.filter();
   *
   * // add filter "Today" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'date_today', []);
   * filtersPlugin.filter();
   *
   * // add filter "Tomorrow" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'date_tomorrow', []);
   * filtersPlugin.filter();
   *
   * // add filter "Yesterday" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'date_yesterday', []);
   * filtersPlugin.filter();
   *
   * // add filter "Empty" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'empty', []);
   * filtersPlugin.filter();
   *
   * // add filter "Ends with" with value "ing" to column at index 1
   * filtersPlugin.addCondition(1, 'ends_with', ['ing']);
   * filtersPlugin.filter();
   *
   * // add filter "Equal" with value "John" to column at index 1
   * filtersPlugin.addCondition(1, 'eq', ['John']);
   * filtersPlugin.filter();
   *
   * // add filter "Greater than" 95 to column at index 1
   * filtersPlugin.addCondition(1, 'gt', [95]);
   * filtersPlugin.filter();
   *
   * // add filter "Greater than or equal" 95 to column at index 1
   * filtersPlugin.addCondition(1, 'gte', [95]);
   * filtersPlugin.filter();
   *
   * // add filter "Less than" 10 to column at index 1
   * filtersPlugin.addCondition(1, 'lt', [10]);
   * filtersPlugin.filter();
   *
   * // add filter "Less than or equal" 10 to column at index 1
   * filtersPlugin.addCondition(1, 'lte', [10]);
   * filtersPlugin.filter();
   *
   * // add filter "None" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'none', []);
   * filtersPlugin.filter();
   *
   * // add filter "Not between" 10 and 50 to column at index 1
   * filtersPlugin.addCondition(1, 'not_between', [10, 50]);
   * filtersPlugin.filter();
   *
   * // add filter "Not contains" with value "ing" to column at index 1
   * filtersPlugin.addCondition(1, 'not_contains', ['ing']);
   * filtersPlugin.filter();
   *
   * // add filter "Not empty" with no arguments to column at index 1
   * filtersPlugin.addCondition(1, 'not_empty', []);
   * filtersPlugin.filter();
   *
   * // add filter "Not equal" with value "John" to column at index 1
   * filtersPlugin.addCondition(1, 'neq', ['John']);
   * filtersPlugin.filter();
   * ```
   * :::
   *
   * ::: only-for angular
   * ```ts
   * import { AfterViewInit, Component, ViewChild } from "@angular/core";
   * import {
   *   GridSettings,
   *   HotTableModule,
   *   HotTableComponent,
   * } from "@handsontable/angular-wrapper";
   *
   * `@Component`({
   *   selector: "app-example",
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
   *     data: this.getData(),
   *     filters: true,
   *   };
   *
   *   ngAfterViewInit(): void {
   *     // Access to filters plugin instance
   *     const hot = this.hotTable.hotInstance;
   *     const filtersPlugin = hot.getPlugin("filters");
   *
   *     // Add filter "Begins with" with value "de" to column at index 1
   *     filtersPlugin.addCondition(1, "begins_with", ["de"]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Between" 10 and 50 to column at index 1
   *     filtersPlugin.addCondition(1, "between", [10, 50]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "By value" to column at index 1
   *     // In this case, all values that don't match will be filtered.
   *     filtersPlugin.addCondition(1, "by_value", [["ing", "ed", "as", "on"]]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Contains" with value "ing" to column at index 1
   *     filtersPlugin.addCondition(1, "contains", ["ing"]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "After a date" with value "1/1/2023" to column at index 1
   *     filtersPlugin.addCondition(1, "date_after", ["1/1/2023"]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Before a date" with value "1/1/2023" to column at index 1
   *     filtersPlugin.addCondition(1, "date_before", ["1/1/2023"]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Today" with no arguments to column at index 1
   *     filtersPlugin.addCondition(1, "date_today", []);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Tomorrow" with no arguments to column at index 1
   *     filtersPlugin.addCondition(1, "date_tomorrow", []);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Yesterday" with no arguments to column at index 1
   *     filtersPlugin.addCondition(1, "date_yesterday", []);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Empty" with no arguments to column at index 1
   *     filtersPlugin.addCondition(1, "empty", []);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Ends with" with value "ing" to column at index 1
   *     filtersPlugin.addCondition(1, "ends_with", ["ing"]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Equal" with value "John" to column at index 1
   *     filtersPlugin.addCondition(1, "eq", ["John"]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Greater than" 95 to column at index 1
   *     filtersPlugin.addCondition(1, "gt", [95]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Greater than or equal" 95 to column at index 1
   *     filtersPlugin.addCondition(1, "gte", [95]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Less than" 10 to column at index 1
   *     filtersPlugin.addCondition(1, "lt", [10]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Less than or equal" 10 to column at index 1
   *     filtersPlugin.addCondition(1, "lte", [10]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "None" with no arguments to column at index 1
   *     filtersPlugin.addCondition(1, "none", []);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Not between" 10 and 50 to column at index 1
   *     filtersPlugin.addCondition(1, "not_between", [10, 50]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Not contains" with value "ing" to column at index 1
   *     filtersPlugin.addCondition(1, "not_contains", ["ing"]);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Not empty" with no arguments to column at index 1
   *     filtersPlugin.addCondition(1, "not_empty", []);
   *     filtersPlugin.filter();
   *
   *     // Add filter "Not equal" with value "John" to column at index 1
   *     filtersPlugin.addCondition(1, "neq", ["John"]);
   *     filtersPlugin.filter();
   *   }
   *
   *   private getData(): Array<*> {
   *     // Get some data
   *   }
   * }
   * ```
   * :::
   *
   * @param {number} column Visual column index.
   * @param {string} name Condition short name.
   * @param {Array} args Condition arguments. The expected format depends on the condition - see the table above for details.
   * @param {string} [operationId=conjunction] `id` of operation which is performed on the column.
   */
  addCondition(column: number, name: string, args: unknown[], operationId: string = OPERATION_AND): void {
    if (name === CONDITION_BY_VALUE && this.#isDataProviderActive) {
      return;
    }

    const physicalColumn = this.hot.toPhysicalColumn(column);

    this.conditionCollection?.addCondition(physicalColumn, { command: { key: name }, args }, operationId);
  }

  /**
   * Removes conditions at specified column index.
   *
   * This is the programmatic equivalent of selecting the `None` operator in the column menu – both
   * clear the column's filter.
   *
   * @param {number} column Visual column index.
   */
  removeConditions(column: number): void {
    const physicalColumn = this.hot.toPhysicalColumn(column);

    this.conditionCollection?.removeConditions(physicalColumn);
  }

  /**
   * Clears all conditions previously added to the collection for the specified column index or, if the column index
   * was not passed, clear the conditions for all columns.
   *
   * @param {number} [column] Visual column index.
   */
  clearConditions(column?: number): void {
    if (column === undefined) {
      this.conditionCollection?.clean();

    } else {
      const physicalColumn = this.hot.toPhysicalColumn(column);

      this.conditionCollection?.removeConditions(physicalColumn);
    }
  }

  /**
   * Imports filter conditions to all columns to the plugin. The method accepts
   * the array of conditions with the same structure as the {@link Filters#exportConditions} method returns.
   * The `column` property in each condition object must be a physical column index.
   * Importing conditions will replace the current conditions. Once replaced, the state of the condition
   * will be reflected in the UI. To apply the changes and filter the table, call
   * the {@link Filters#filter} method eventually.
   *
   * @param {Array} conditions Array of conditions keyed by physical column indexes.
   */
  importConditions(conditions: ColumnConditions[]): void {
    // Group the per-condition `afterAdd`/`afterClean` cascade the same way the action-bar
    // submit does. Without grouping, every imported condition triggers a full component
    // update that re-scans the whole dataset once per earlier filtered column.
    this.conditionUpdateObserver?.groupChanges();
    this.conditionCollection?.importAllConditions(conditions);
    this.conditionUpdateObserver?.flush();
  }

  /**
   * Exports filter conditions for all columns from the plugin.
   * The array represents the filter state for each column and uses physical column indexes in each `column` property.
   * For example:
   *
   * ```js
   * [
   *   {
   *     column: 1,
   *     operation: 'conjunction',
   *     conditions: [
   *       { name: 'gt', args: [95] },
   *     ]
   *   },
   *   {
   *     column: 7,
   *     operation: 'conjunction',
   *     conditions: [
   *       { name: 'contains', args: ['mike'] },
   *       { name: 'begins_with', args: ['m'] },
   *     ]
   *   },
   * ]
   * ```
   *
   * @returns {Array}
   */
  exportConditions(): ColumnConditions[] {
    return this.conditionCollection?.exportAllConditions() ?? [];
  }

  /**
   * Filters data based on added filter conditions.
   *
   * @fires Hooks#beforeFilter
   * @fires Hooks#afterFilter
   */
  filter(): void {
    const { navigableHeaders } = this.hot.getSettings();
    const needToFilter = !this.conditionCollection?.isEmpty();
    const conditions = this.exportConditions();

    // Resolved once per pass and reused by every column read below. Both the flag and the memo are
    // released in the `finally` rather than at the end of the body: `beforeFilter` and
    // `afterFilter` are host code and may throw, and a memo surviving the call would answer the
    // next read from this pass's row order.
    this.#pinnedRowsCache = undefined;
    this.#isFilterPassActive = true;

    try {
      this.#filterInternal(navigableHeaders, needToFilter, conditions);
    } finally {
      this.#isFilterPassActive = false;
      this.#pinnedRowsCache = undefined;
    }
  }

  /**
   * The body of `filter()`, run inside the pinned-rows memo scope it sets up.
   *
   * @private
   */
  #filterInternal(
    navigableHeaders: boolean | undefined, needToFilter: boolean, conditions: ColumnConditions[]
  ): void {

    if (this.#isDataProviderActive) {
      this.#dataProviderFilterRollbackStack = deepClone(this.#previousConditionStack) as ColumnConditions[];
    }

    const allowFiltering = this.hot.runHooks(
      'beforeFilter',
      conditions,
      this.#previousConditionStack
    );

    // Captured BEFORE the branch chain below, which is where the trimming map is written
    // (`setValues()` on the filtering branch, `clear()` on the nothing-to-filter one). Writing the
    // map fires the index mapper's cache update, and the Core drops a selection that the trim left
    // pointing at a record that is no longer there - so by the time the re-selection at the end of
    // this method runs, there may be no selection left to read the column from. Reading it here
    // also keeps the `beforeFilter` hook able to move the selection, which a consumer may
    // legitimately do.
    const selectedHighlightColumn = this.hot.getSelectedRangeActive()?.highlight.col;
    let isSelectionDropped = false;

    if (allowFiltering !== false && needToFilter) {
      const dataFilter = this._createDataFilter();
      const rowIndexesToShow = arrayMap(dataFilter.filter(),
        rowData => (rowData as { row: number }).row);
      const rowIndexesToShowAssertion = createArrayAssertion(rowIndexesToShow);
      const countSourceRows = this.hot.countSourceRows();
      // `getDataMapAtColumn()` never handed the pinned rows to the conditions, so they are absent
      // from `rowIndexesToShow` and would be trimmed here as "did not match". Put them back.
      const pinnedRows = this.#getPinnedRows();
      // Build the trimmed-state array in a single pass (`true` marks a row hidden by the filter), then
      // write it to the map in one bulk `setValues` call. The previous approach scanned the dataset
      // twice (a `clear()` that rebuilt the whole array, then a `rangeEach` pass) and fired a map
      // `change` per trimmed row; for large datasets that was a measurable share of `filter()` time.
      const trimmedRowsState = new Array(countSourceRows);

      for (let physicalRow = 0; physicalRow < countSourceRows; physicalRow++) {
        trimmedRowsState[physicalRow] = !rowIndexesToShowAssertion(physicalRow);
      }

      pinnedRows?.forEach((physicalRow) => {
        trimmedRowsState[physicalRow] = false;
      });

      this.hot.batchExecution(() => {
        this.filtersRowsMap?.setValues(trimmedRowsState);
      }, true);

      // The visible rows are the matches plus the pinned rows, so an empty match list no longer
      // means an empty grid - deselecting on it would drop the selection while rows are on screen.
      const hasVisibleRows = rowIndexesToShow.length > 0 || pinnedRows !== null;

      if (!navigableHeaders && !hasVisibleRows) {
        this.hot.deselectCell();
        isSelectionDropped = true;
      }

      this.#previousConditionStack = this.exportConditions();

    } else if (allowFiltering !== false && !needToFilter) {
      this.#previousConditionStack = this.exportConditions();
      this.filtersRowsMap?.clear();

    } else if (this.#isDataProviderActive) {
      this.#previousConditionStack = this.exportConditions();

    } else {
      this.importConditions(this.#previousConditionStack);
    }

    // The selection is read again here, and the captured value is only a FALLBACK. Both halves
    // earn their place. A selection can arrive during the call - `emptyDataState` restores the one
    // it stashed when the grid emptied, which is why the state at entry cannot be the only source -
    // and a selection can disappear during it, dropped by the Core when the trim strands it, which
    // is why the state at exit cannot be either.
    // The captured column is a FALLBACK, and it deliberately outranks a deselect that happened
    // during the call, because the Core drops a selection this filter's own trim stranded and the
    // re-selection below is what puts the user back on the column they were working in. The cost is
    // that a consumer deselecting from `beforeFilter` or a cache-update hook is overruled; a
    // consumer that wants the grid deselected after filtering should do it from `afterFilter`,
    // which runs last.
    const currentHighlightColumn = this.hot.getSelectedRangeActive()?.highlight.col;
    const columnToSelect = currentHighlightColumn ?? selectedHighlightColumn;

    if (!isSelectionDropped && columnToSelect !== null && columnToSelect !== undefined) {
      this.hot.selectCell(
        navigableHeaders ? -1 : 0,
        columnToSelect,
      );
    }

    if (allowFiltering !== false) {
      this.hot.runHooks('afterFilter', conditions);
      this.hot.render();
    }
  }

  /**
   * Gets the last selected column as an object with visual and physical indexes.
   *
   * @returns {{visualIndex: number, physicalIndex: number} | null} Returns `null` when a column is
   * not selected. Otherwise, returns an object with `visualIndex` and `physicalIndex` properties containing
   * column indexes.
   */
  getSelectedColumn(): { physicalIndex: number, visualIndex: number } | null {
    const highlight = this.hot.getSelectedRangeActive()?.highlight;

    if (!highlight || highlight.col === null) {
      return null;
    }

    return {
      visualIndex: highlight.col,
      physicalIndex: this.hot.toPhysicalColumn(highlight.col),
    };
  }

  /**
   * Returns the full dataset for a column with cell meta for each row. The dataset is independent of
   * any index mapper - no matter if the data is filtered, sorted, or otherwise transformed all rows
   * are included, unless `physicalRows` narrows the read to specific rows, or `filterFixedRows` is
   * `false`, which drops the rows pinned by `fixedRowsTop` and `fixedRowsBottom` from the full read.
   *
   * That single exclusion is what keeps pinned rows out of every consumer at once: `DataFilter`, the
   * `ConditionUpdateObserver` memo, and the has-conditions branch of `_getValueListDataAtColumn()`
   * all read the column through here. A caller that passes `physicalRows` has already chosen its
   * rows and is left alone.
   *
   * @param {number} physicalColumn The physical column index.
   * @param {number[]} [physicalRows] When provided, only these physical rows are read (in the given
   * order) instead of every source row.
   * @returns {Array<{row: number, meta: CellProperties, value: *}>} Array of objects with `row` (the physical
   * row index), `meta`, and `value`, one per read row. Consumers correlate rows through the `row` property -
   * the coordinate stamps on `meta` are shared with other readers and may change after this method returns.
   */
  getDataMapAtColumn(physicalColumn: number, physicalRows?: number[]): Record<string, unknown>[] {
    const rowsCount = physicalRows ? physicalRows.length : this.hot.countSourceRows();
    const visualColumn = this.hot.toVisualColumn(physicalColumn);
    const excludedRows = physicalRows ? null : this.#getPinnedRows();
    const data: Record<string, unknown>[] = [];

    for (let rowIndex = 0; rowIndex < rowsCount; rowIndex++) {
      const physicalRow = physicalRows ? physicalRows[rowIndex] : rowIndex;

      if (excludedRows !== null && excludedRows.has(physicalRow)) {
        continue; // eslint-disable-line no-continue
      }

      const cellMeta = this.hot._getMetaManager().getCellMetaUncached(physicalRow, physicalColumn, {
        visualRow: physicalRow,
        visualColumn: physicalColumn,
      });
      let value = getValueGetterValue(
        this.hot.getSourceDataAtCell(physicalRow, visualColumn),
        cellMeta
      );

      if (this.hot.hasHook('modifyData')) {
        const valueHolder: ObjectPropListener = createObjectPropListener(value);

        this.hot.runHooks('modifyData', physicalRow, physicalColumn, valueHolder, 'get');

        if (valueHolder.isTouched()) {
          value = valueHolder.value as typeof value;
        }
      }

      data.push({
        row: physicalRow,
        meta: cellMeta,
        value: toEmptyString(value),
      });
    }

    return data;
  }

  /**
   * `afterChange` listener.
   *
   * @param {Array} changes Array of changes.
   */
  #onAfterChange = (changes: unknown[]) => {
    if (changes) {
      // A single batch (paste, fill, undo) can carry thousands of changes that hit the same
      // column. The value-component refresh reads and sorts the whole column, so run it once
      // per distinct filtered column instead of once per changed cell.
      const changedColumns = new Set<number>();

      arrayEach(changes, (change) => {
        const [, prop] = change as unknown[];
        const visualColumnIndex = this.hot.propToCol(prop as string | number);
        const physicalColumnIndex = this.hot.toPhysicalColumn(visualColumnIndex);

        if (this.conditionCollection?.hasConditions(physicalColumnIndex)) {
          changedColumns.add(physicalColumnIndex);
        }
      });

      changedColumns.forEach((physicalColumnIndex) => {
        this.updateValueComponentCondition(physicalColumnIndex);
      });
    }
  };

  /**
   * Refreshes the "filter by value" list of a column whose data changed, leaving the user's
   * selection alone.
   *
   * A data change must never re-select values on the user's behalf. The list is rebuilt from the
   * rows surviving the *other* columns' conditions, so a value typed into a filtered column appears
   * in the list unchecked instead of being added to the condition (issue #6471).
   *
   * The columns filtered after this one are refreshed too, so their lists follow the new data. Their
   * selections survive that refresh, including the values their lists cannot show.
   *
   * @private
   * @param {number} columnIndex Physical column index of handled ValueComponent condition.
   */
  updateValueComponentCondition(columnIndex: number) {
    this.conditionUpdateObserver?.updateStatesAtColumn(columnIndex);
  }

  /**
   * Restores components to its saved state.
   *
   * @private
   * @param {Array} components List of components.
   */
  restoreComponents(components: BaseComponent[]) {
    const physicalIndex = this.getSelectedColumn()?.physicalIndex ?? -1;

    components.forEach((component: BaseComponent) => {
      if (component.isHidden()) {
        return;
      }

      component.restoreState(physicalIndex);
    });

    this.updateDependentComponentsVisibility();
  }

  /**
   * `afterUpdateData` listener. `updateData` replaces the source data but keeps
   * conditions intact. The `filter_by_value` snapshots were computed against the
   * previous dataset, so they need to be rebuilt so newly introduced values appear
   * in the dropdown. When `dataProvider` drives the grid, snapshot refresh is owned
   * by the fetch flow (`afterDataProviderFetch` -> `importConditions`).
   *
   * @param {unknown} _data The new source data.
   * @param {boolean} firstRun `true` for the initial data load.
   */
  #onAfterUpdateData = (_data: unknown, firstRun: boolean) => {
    if (firstRun || this.#isDataProviderActive || !this.conditionCollection) {
      return;
    }

    const filteredColumns = this.conditionCollection?.getFilteredColumns() ?? [];

    if (filteredColumns.length === 0) {
      return;
    }

    arrayEach(filteredColumns, (physicalColumn: number) => {
      this.conditionUpdateObserver?.updateStatesAtColumn(physicalColumn);
    });
  };

  /**
   * `afterUpdateSettings` listener.
   *
   * Two jobs, both keyed on the payload rather than run unconditionally. `fixedRowsTop` and
   * `fixedRowsBottom` change WHICH rows are exempt, and they are not among this plugin's
   * `SETTING_KEYS`, so nothing else re-applies the exemption for them. And `columns` is where a
   * per-column `filters` value lives, which is the one place the ignored-object warning can be
   * raised for every column rather than only for a column whose menu someone opens.
   */
  #onAfterUpdateSettings = (settings: Record<string, unknown>) => {
    if (hasOwnProperty(settings, 'columns')) {
      this.#warnAboutPerColumnSettingsObjects();
    }

    if (hasOwnProperty(settings, 'fixedRowsTop') || hasOwnProperty(settings, 'fixedRowsBottom')) {
      this.#refilterForPinnedRows();
    }
  };

  /**
   * `afterRowSequenceChange` listener.
   *
   * An insert, a remove, a move or a sort all change which rows sit at the two ends of the grid,
   * and the trimming map still holds the previous pass's answer. Every source is acted on, because
   * none of them identifies a change this plugin caused - writing `filtersRowsMap` does not reach
   * this hook at all, and a sort reports `'update'`, the same value ordinary changes carry.
   * `#refilterForPinnedRows()` owns the re-entrancy guard.
   */
  #onAfterRowSequenceChange = () => {
    this.#refilterForPinnedRows();
  };

  /**
   * After dataProvider fetch listener.
   *
   * @param {object} [result] Fetch result (filters match the request that just completed). May include `filtersConditionsStack` (Array).
   */
  #onAfterDataProviderFetch = (result: Record<string, unknown> | null) => {
    this.importConditions((result?.filtersConditionsStack as ColumnConditions[]) ?? []);
  };

  /**
   * After dataProvider fetch error listener.
   */
  #onAfterDataProviderFetchError = () => {
    this.importConditions(this.#dataProviderFilterRollbackStack);
  };

  /**
   * After dropdown menu show listener.
   */
  #onAfterDropdownMenuShow = () => {
    const menu = this.dropdownMenuPlugin?.menu;

    if (!menu) {
      return;
    }

    this.restoreComponents(
      Array.from(this.components.values()).filter((c): c is BaseComponent => c !== null)
    );

    menu.updateMenuDimensions();
  };

  /**
   * After dropdown menu hide listener.
   */
  #onAfterDropdownMenuHide = () => {
    (this.components.get('filter_by_condition') as ConditionComponent | null | undefined)
      ?.getSelectElement()?.closeOptions();
    (this.components.get('filter_by_condition2') as ConditionComponent | null | undefined)
      ?.getSelectElement()?.closeOptions();
    // The by-value list is a grid of its own and keeps its selection while the menu is hidden, so a
    // reopened menu would show a focus ring on an item while the focus is elsewhere.
    this.#getValueComponent()?.getMultipleSelectElement().deselect();
  };

  /**
   * Hooks applies the new dropdown menu instance to the focus navigator.
   */
  #onBeforeDropdownMenuShow = () => {
    const mainMenu = this.dropdownMenuPlugin?.menu;

    if (!mainMenu) {
      return;
    }

    if (!this.#dropdownMenuTraces.has(mainMenu)) {
      this.#menuFocusNavigator?.setMenu(mainMenu);
    }

    this.#dropdownMenuTraces.add(mainMenu);
  };

  /**
   * After dropdown menu default options listener.
   *
   * @param {object} defaultOptions ContextMenu default item options.
   */
  #onAfterDropdownMenuDefaultOptions = (defaultOptions: Record<string, unknown[]>) => {
    defaultOptions.items.push({ name: SEPARATOR });

    this.components.forEach((component) => {
      if (component) {
        defaultOptions.items.push(component.getMenuItemDescriptor());
      }
    });
  };

  /**
   * Get an operation, based on the number and types of arguments (where arguments are states of components).
   *
   * @param {string} suggestedOperation Operation which was chosen by user from UI.
   * @param {object} byConditionState1 State of first condition component.
   * @param {object} byConditionState2 State of second condition component.
   * @param {object} byValueState State of value component.
   * @private
   * @returns {string}
   */
  getOperationBasedOnArguments(
    suggestedOperation: string,
    byConditionState1: Record<string, unknown>,
    byConditionState2: Record<string, unknown>,
    byValueState: Record<string, unknown>
  ) {
    let operation = suggestedOperation;
    const cmd1 = (byConditionState1.command as Record<string, unknown>)?.key;
    const cmd2 = (byConditionState2.command as Record<string, unknown>)?.key;
    const cmdV = (byValueState.command as Record<string, unknown>)?.key;

    if (operation === OPERATION_OR && cmd1 !== CONDITION_NONE &&
      cmd2 !== CONDITION_NONE && cmdV !== CONDITION_NONE) {
      operation = OPERATION_OR_THEN_VARIABLE;

    } else if (cmdV !== CONDITION_NONE) {
      if (cmd1 === CONDITION_NONE || cmd2 === CONDITION_NONE) {
        operation = OPERATION_AND;
      }
    }

    return operation;
  }

  /**
   * On action bar submit listener.
   *
   * @private
   * @param {string} submitType The submit type.
   */
  #onActionBarSubmit(submitType: string) {
    if (submitType === 'accept') {
      const selectedColumn = this.getSelectedColumn();

      if (selectedColumn === null) {
        this.dropdownMenuPlugin?.close();

        return;
      }

      const { physicalIndex } = selectedColumn;
      const noneState: Record<string, unknown> = { command: { key: CONDITION_NONE }, args: [] };
      const byConditionState1 = this.#getConditionComponent('filter_by_condition')?.getState() ?? noneState;
      const byConditionState2 = this.#getConditionComponent('filter_by_condition2')?.getState() ?? noneState;
      const byValueState = this.#getValueComponent()?.getState() ?? noneState;

      const operation = this.getOperationBasedOnArguments(
        this.#getOperatorsComponent()?.getActiveOperationId() ?? OPERATION_AND,
        byConditionState1,
        byConditionState2,
        byValueState
      );

      this.conditionUpdateObserver?.groupChanges();

      let columnStackPosition = this.conditionCollection?.getColumnStackPosition(physicalIndex);

      if (columnStackPosition === undefined || columnStackPosition === -1) {
        columnStackPosition = undefined;
      }

      this.conditionCollection?.removeConditions(physicalIndex);

      const cmd1 = (byConditionState1.command as Record<string, unknown>)?.key;
      const cmd2 = (byConditionState2.command as Record<string, unknown>)?.key;
      const cmdV = (byValueState.command as Record<string, unknown>)?.key;

      if (cmd1 !== CONDITION_NONE) {
        this.conditionCollection?.addCondition(physicalIndex, byConditionState1, operation, columnStackPosition);

        if (cmd2 !== CONDITION_NONE) {
          this.conditionCollection?.addCondition(physicalIndex, byConditionState2, operation, columnStackPosition);
        }
      }

      if (cmdV !== CONDITION_NONE && !this.#isDataProviderActive) {
        this.conditionCollection?.addCondition(physicalIndex, byValueState, operation, columnStackPosition);
      }

      this.conditionUpdateObserver?.flush();
      this.components.forEach(component => component?.saveState(physicalIndex));
      this.filter();
    }

    this.dropdownMenuPlugin?.close();
  }

  /**
   * On component change listener.
   *
   * @param {BaseComponent} component Component inheriting BaseComponent.
   * @param {object} command Menu item object (command).
   */
  #onComponentChange(component: BaseComponent, command: Record<string, unknown>) {
    const menu = this.dropdownMenuPlugin?.menu;

    this.updateDependentComponentsVisibility();

    if (component.constructor === ConditionComponent && !command.inputsCount) {
      this.setListeningDropdownMenu();
    }

    menu?.updateMenuDimensions();
  }

  /**
   * On component SelectUI closed listener.
   */
  #onSelectUIClosed() {
    this.setListeningDropdownMenu();
  }

  /**
   * Listen to the keyboard input on document body and forward events to instance of Handsontable
   * created by DropdownMenu plugin.
   *
   * @private
   */
  setListeningDropdownMenu() {
    if (this.dropdownMenuPlugin) {
      this.dropdownMenuPlugin.setListening();
    }
  }

  /**
   * Updates visibility of some of the components, based on the state of the parent component.
   *
   * @private
   */
  updateDependentComponentsVisibility() {
    const component = this.#getConditionComponent('filter_by_condition');
    const defaultState: Record<string, unknown> = { command: { key: CONDITION_NONE } };
    const state = component?.getState() ?? defaultState;
    const command = (state as Record<string, unknown>).command as Record<string, unknown> | undefined;
    const componentsToShow = [
      this.components.get('filter_by_condition2'),
      this.components.get('filter_operators')
    ].filter((c): c is BaseComponent => c !== null && c !== undefined);

    if (command?.showOperators) {
      this.showComponents(...componentsToShow);
    } else {
      this.hideComponents(...componentsToShow);
    }
  }

  /**
   * On after get column header listener.
   *
   * @param {number} col Visual column index.
   * @param {HTMLTableCellElement} TH Header's TH element.
   *
   */
  #onAfterGetColHeader = (col: number, TH: HTMLElement) => {
    const physicalColumn = this.hot.toPhysicalColumn(col);

    if (
      this.enabled
      && this.conditionCollection?.hasConditions(physicalColumn)
      && isBottomMostColumnHeader(TH as HTMLTableCellElement)
    ) {
      addClass(TH, 'htFiltersActive');
    } else {
      removeClass(TH, 'htFiltersActive');
    }
  };

  /**
   * Gets the values the "filter by value" list of a column is built from.
   *
   * A column that carries conditions of its own reads the rows that survive the conditions of the
   * columns defined BEFORE it in the filter stack. Its own conditions are deliberately skipped - a
   * column's filter must not narrow down its own value list, or the values it filters out drop off
   * the list and become impossible to select again (issue #12226). A column with no conditions of
   * its own reads the currently visible data, which the other columns' filters already narrowed
   * down.
   *
   * @private
   * @param {number} column Visual column index.
   * @returns {Array<{value: *, meta: CellProperties}>} Array of objects with `value` and `meta`, one per row.
   */
  _getValueListDataAtColumn(column: number): Record<string, unknown>[] {
    const physicalColumn = this.hot.toPhysicalColumn(column);
    const stackPosition = this.conditionCollection?.getColumnStackPosition(physicalColumn) ?? -1;

    // A data provider filters server-side and the list is hidden anyway, so re-running the
    // conditions locally would filter data that is already filtered.
    if (stackPosition === -1 || this.#isDataProviderActive) {
      const visibleValues = this.hot.getDataAtCol(column);
      // The SAME physical set the has-conditions branch below uses, translated per row rather than
      // dropped by position. Two different ways of deciding "pinned" made the two branches disagree
      // whenever another plugin trimmed a row, so a column's value list changed the moment it got a
      // condition of its own.
      const pinnedRows = this.#getPinnedRows();
      const rows: Record<string, unknown>[] = [];

      for (let rowIndex = 0; rowIndex < visibleValues.length; rowIndex++) {
        if (pinnedRows !== null && pinnedRows.has(this.hot.toPhysicalRow(rowIndex))) {
          continue; // eslint-disable-line no-continue
        }

        rows.push({
          value: toEmptyString(visibleValues[rowIndex]),
          meta: this.hot.getCellMetaTransient(rowIndex, column),
        });
      }

      return rows;
    }

    const allRows = this.getDataMapAtColumn(physicalColumn);
    const conditionsBefore = (this.conditionCollection?.exportAllConditions() ?? []).slice(0, stackPosition);

    if (conditionsBefore.length === 0) {
      return allRows;
    }

    const splitConditionCollection = new ConditionCollection(this.hot, false);

    splitConditionCollection.importAllConditions(conditionsBefore);

    // Rows are correlated through the entry's own `row` property - the coordinate stamps on `meta`
    // are shared with every other meta reader and may have been overwritten since.
    // `DataFilter` is typed against `unknown[]` throughout, so its entries are narrowed here - the
    // same boundary cast `DataFilter.filter()` and `ConditionUpdateObserver` already make.
    const survivingRows = arrayMap(this._createDataFilter(splitConditionCollection).filter(),
      rowData => (rowData as { row: number }).row);
    const survivingRowsAssertion = createArrayAssertion(survivingRows);

    splitConditionCollection.destroy();

    return arrayFilter(allRows, rowData => survivingRowsAssertion(rowData.row));
  }

  /**
   * Creates DataFilter instance based on condition collection.
   *
   * @private
   * @param {ConditionCollection} conditionCollection Condition collection object.
   * @returns {DataFilter}
   */
  _createDataFilter(conditionCollection: ConditionCollection | null = this.conditionCollection) {
    if (!conditionCollection) {
      conditionCollection = new ConditionCollection(this.hot, false);
    }

    return new DataFilter(conditionCollection,
      (physicalColumn: number, physicalRows?: number[]) => this.getDataMapAtColumn(physicalColumn, physicalRows));
  }

  /**
   * It updates the components state. The state is triggered by ConditionUpdateObserver, which
   * reacts to any condition added to the condition collection. It may be added through the UI
   * components or by API call.
   *
   * @param {object} conditionsState An object with the state generated by UI components.
   */
  #updateComponents(conditionsState: Record<string, unknown>) {
    if (!this.dropdownMenuPlugin?.enabled) {
      return;
    }

    const editedStack = conditionsState.editedConditionStack as Record<string, unknown>;
    const conditions = editedStack.conditions as unknown[];
    const column = editedStack.column as number;

    // `#previousConditionStack` needs no re-sync here: a data change no longer rewrites the live
    // `by_value` args, so the snapshot taken by the last `filter()` still matches the collection.

    const conditionsByValue = conditions.filter(
      condition => (condition as Record<string, unknown>).name === CONDITION_BY_VALUE);
    const conditionsWithoutByValue = conditions.filter(
      condition => (condition as Record<string, unknown>).name !== CONDITION_BY_VALUE);

    if (conditionsByValue.length >= 2 || conditionsWithoutByValue.length >= 3) {
      warn(toSingleLine`The filter conditions have been applied properly, but couldn’t be displayed visually.\x20
        The dropdown menu supports at most 2 regular conditions and 1 'filter by value' condition per column,\x20
        but more were provided. For more details see the documentation.`);

    } else {
      const operationType = this.conditionCollection?.getOperation(column);

      this.#getConditionComponent('filter_by_condition')
        ?.updateState(conditionsWithoutByValue[0] as { name: string; args: unknown[] } | null, column);
      this.#getConditionComponent('filter_by_condition2')
        ?.updateState(conditionsWithoutByValue[1] as { name: string; args: unknown[] } | null, column);
      this.#getOperatorsComponent()?.updateState(operationType ?? OPERATION_AND, column);
      this.#getValueComponent()?.updateState(conditionsState as StateInfo);
    }
  }

  /**
   * Returns indexes of passed components inside list of `dropdownMenu` items.
   *
   * @private
   * @param {...BaseComponent} components List of components.
   * @returns {Array}
   */
  getIndexesOfComponents(...components: BaseComponent[]) {
    const menu = this.dropdownMenuPlugin?.menu;

    if (!menu) {
      return [];
    }

    return components
      .map(component => menu.getItemPositionByKey(String(component.getMenuItemDescriptor().key)))
      .filter(index => index !== -1);
  }

  /**
   * Changes visibility of component.
   *
   * @private
   * @param {boolean} visible Determine if components should be visible.
   * @param {...BaseComponent} components List of components.
   */
  changeComponentsVisibility(visible = true, ...components: BaseComponent[]) {
    if (!this.dropdownMenuPlugin) {
      return;
    }

    const menu = this.dropdownMenuPlugin.menu;

    if (!menu) {
      return;
    }

    const hotMenu = menu.hotMenu;

    if (!hotMenu) {
      return;
    }

    const hiddenRows = hotMenu.getPlugin('hiddenRows');
    const indexes = this.getIndexesOfComponents(...components);

    if (visible) {
      hiddenRows.showRows(indexes);

    } else {
      hiddenRows.hideRows(indexes);
    }

    hotMenu.render();
  }

  /**
   * Hides components of filters `dropdownMenu`.
   *
   * @private
   * @param {...BaseComponent} components List of components.
   */
  hideComponents(...components: BaseComponent[]) {
    this.changeComponentsVisibility(false, ...components);
  }

  /**
   * Shows components of filters `dropdownMenu`.
   *
   * @private
   * @param {...BaseComponent} components List of components.
   */
  showComponents(...components: BaseComponent[]) {
    this.changeComponentsVisibility(true, ...components);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    if (this.enabled) {
      this.components.forEach((component, key) => {
        if (component !== null) {
          component.destroy();
          this.components.set(key, null);
        }
      });
      this.conditionCollection?.destroy();
      this.conditionUpdateObserver?.destroy();
      this.hot.rowIndexMapper.unregisterMap(this.pluginName ?? '');
    }

    super.destroy();
  }
}
