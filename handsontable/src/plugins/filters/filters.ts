import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { arrayEach, arrayMap } from '../../helpers/array';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';
import { rangeEach } from '../../helpers/number';
import { addClass, isBottomMostColumnHeader, isHTMLElement, removeClass } from '../../helpers/dom/element';
import { isKey } from '../../helpers/unicode';
import { getValueGetterValue } from '../../utils/valueAccessors';
import { createObjectPropListener, deepClone } from '../../helpers/object';
import type { ObjectPropListener } from '../../helpers/object';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import * as constants from '../../i18n/constants';
import { ConditionComponent } from './component/condition';
import { OperatorsComponent } from './component/operators';
import { ValueComponent, StateInfo } from './component/value';
import { ActionBarComponent } from './component/actionBar';
import ConditionCollection from './conditionCollection';
import DataFilter from './dataFilter';
import ConditionUpdateObserver from './conditionUpdateObserver';
import { createArrayAssertion, toEmptyString, unifyColumnValues } from './utils';
import { getSortComparatorForMeta } from './sortComparators';
import { createMenuFocusController } from './menu/focusController';
import {
  CONDITION_NONE,
  CONDITION_BY_VALUE,
  OPERATION_AND,
  OPERATION_OR,
  OPERATION_OR_THEN_VARIABLE
} from './constants';
import { TrimmingMap } from '../../translations';
import { BaseComponent } from './component/_base';

/**
 * Interface for a DropdownMenu's Menu instance.
 */
interface DropdownMenuInterface {
  clearLocalHooks(): void;
  updateMenuDimensions(): void;
  menuItems: { key: string; [key: string]: unknown }[];
  hotMenu: {
    getPlugin(name: string): {
      showRows(indexes: number[]): void;
      hideRows(indexes: number[]): void;
      [key: string]: unknown;
    };
    render(): void;
    [key: string]: unknown;
  };
  getNavigator(): {
    getCurrentPage(): number;
    setCurrentPage(page: number): void;
    toFirstItem(): void;
    clear(): void;
  };
  focus(): void;
  [key: string]: unknown;
}

/**
 * Interface for the DropdownMenu plugin.
 */
interface DropdownMenuPluginInterface {
  menu: DropdownMenuInterface;
  enabled: boolean;
  disablePlugin(): void;
  enablePlugin(): void;
  close(): void;
  setListening(): void;
  [key: string]: unknown;
}

/**
 * Interface for the menu focus navigator.
 */
interface MenuFocusNavigatorInterface {
  setCurrentPage(page: number): void;
  getCurrentPage(): number;
  toFirstItem(): void;
  toLastItem(): void;
  toNextItem(): void;
  toPreviousItem(): void;
  clear(): void;
  listen(): void;
  setMenu(menu: DropdownMenuInterface): void;
  getMenu(): Record<string, Function>;
  getLastMenuPage(): number;
}

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
 * @plugin Filters
 * @class Filters
 *
 * @description
 * The plugin allows filtering the table data either by the built-in component or with the API.
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
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      searchMode: 'show',
    };
  }

  static get SETTINGS_VALIDATORS() {
    return {
      searchMode: (value: unknown) => typeof value === 'string' && ['show', 'apply'].includes(value),
    };
  }

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
  dropdownMenuPlugin: DropdownMenuPluginInterface | null = null;
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
  #menuFocusNavigator: MenuFocusNavigatorInterface | undefined;
  /**
   * Traces the new menu instances to apply the focus navigation to the latest one.
   *
   * @type {WeakSet<Menu>}
   */
  #dropdownMenuTraces = new WeakSet<DropdownMenuInterface>();
  /**
   * Stores the previous state of the condition stack before the latest filter operation.
   * This is used in the `beforeFilter` plugin to allow performing the undo operation.
   *
   * @type {Array}
   */
  #previousConditionStack: ColumnConditions[] = [];

  /**
   * Snapshot of [[#previousConditionStack]] at the start of [[filter]] when the DataProvider plugin is active.
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

    this.filtersRowsMap = this.hot.rowIndexMapper.registerMap(this.pluginName ?? '', new TrimmingMap()) as TrimmingMap;
    this.dropdownMenuPlugin = this.hot.getPlugin('dropdownMenu') as unknown as DropdownMenuPluginInterface;

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

    if (!this.components.get('filter_by_condition')) {
      const conditionComponent = new ConditionComponent(this.hot, {
        id: 'filter_by_condition',
        name: filterByConditionLabel,
        addSeparator: false,
        menuContainer
      });

      conditionComponent.addLocalHook('afterClose', () => this.#onSelectUIClosed());

      this.components.set('filter_by_condition', addConfirmationHooks(conditionComponent));
    }

    if (!this.components.get('filter_operators')) {
      this.components.set('filter_operators', new OperatorsComponent(this.hot, {
        id: 'filter_operators',
        name: 'Operators'
      }));
    }

    if (!this.components.get('filter_by_condition2')) {
      const conditionComponent = new ConditionComponent(this.hot, {
        id: 'filter_by_condition2',
        name: '',
        addSeparator: true,
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
        hiddenWhen: () => this.#isDataProviderActive,
      })));
    }

    if (!this.components.get('filter_action_bar')) {
      this.components.set('filter_action_bar', addConfirmationHooks(new ActionBarComponent(this.hot, {
        id: 'filter_action_bar',
        name: 'Action bar'
      })));
    }

    if (!this.conditionCollection) {
      this.conditionCollection = new ConditionCollection(this.hot);
    }

    if (!this.conditionUpdateObserver) {
      this.conditionUpdateObserver = new ConditionUpdateObserver(
        this.hot,
        this.conditionCollection,
        (physicalColumn: number) => this.getDataMapAtColumn(physicalColumn),
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
              menuNavigator.setCurrentPage(lastSelectedMenuItem);
            } else {
              menuNavigator.toFirstItem();
            }
          },
        },
        ...Array.from(this.components)
          .map(([, component]) => component?.getElements() ?? [])
          .flat(),
      ];

      this.#menuFocusNavigator = createMenuFocusController(
        this.dropdownMenuPlugin.menu, focusableItems) as MenuFocusNavigatorInterface;

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
        this.dropdownMenuPlugin.menu.clearLocalHooks();
      }

      this.components.forEach((component, key) => {
        component?.destroy();
        this.components.set(key, null);
      });
      this.conditionCollection?.destroy();
      this.conditionCollection = null;
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

  /* eslint-disable jsdoc/require-description-complete-sentence */
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
   * | `none` | None (no filter) | `[]` |
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
  /* eslint-enable jsdoc/require-description-complete-sentence */
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
   * Importing conditions will replace the current conditions. Once replaced, the state of the condition
   * will be reflected in the UI. To apply the changes and filter the table, call
   * the {@link Filters#filter} method eventually.
   *
   * @param {Array} conditions Array of conditions.
   */
  importConditions(conditions: ColumnConditions[]): void {
    this.conditionCollection?.importAllConditions(conditions);
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Exports filter conditions for all columns from the plugin.
   * The array represents the filter state for each column. For example:
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
  /* eslint-enable jsdoc/require-description-complete-sentence */

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

    if (this.#isDataProviderActive) {
      this.#dataProviderFilterRollbackStack = deepClone(this.#previousConditionStack) as ColumnConditions[];
    }

    const allowFiltering = this.hot.runHooks(
      'beforeFilter',
      conditions,
      this.#previousConditionStack
    );

    if (allowFiltering !== false && needToFilter) {
      const trimmedRows: number[] = [];
      const dataFilter = this._createDataFilter();
      const rowIndexesToShow = arrayMap(dataFilter.filter(),
        rowData => (rowData as { meta: { row: number } }).meta.row);
      const rowIndexesToShowAssertion = createArrayAssertion(rowIndexesToShow);

      this.hot.batchExecution(() => {
        this.filtersRowsMap?.clear();

        rangeEach(this.hot.countSourceRows() - 1, (row: number) => {
          if (!rowIndexesToShowAssertion(row)) {
            trimmedRows.push(row);
          }
        });

        arrayEach(trimmedRows, (physicalRow) => {
          this.filtersRowsMap?.setValueAtIndex(physicalRow, true);
        });
      }, true);

      if (!navigableHeaders && !rowIndexesToShow.length) {
        this.hot.deselectCell();
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

    if (this.hot.selection.isSelected()) {
      const highlightCol = this.hot.getSelectedRangeActive()?.highlight.col;

      if (highlightCol !== null && highlightCol !== undefined) {
        this.hot.selectCell(
          navigableHeaders ? -1 : 0,
          highlightCol,
        );
      }
    }

    if (allowFiltering !== false) {
      this.hot.runHooks('afterFilter', conditions);
      this.hot.view.adjustElementsSize();
      this.hot.render();
    }
  }

  /**
   * Gets last selected column index.
   *
   * @returns {{visualIndex: number, physicalIndex: number} | null} Returns `null` when a column is
   * not selected. Otherwise, returns an object with `visualIndex` and `physicalIndex` properties containing
   * the index of the column.
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
   * are included.
   *
   * @param {number} physicalColumn The physical column index.
   * @returns {Array<{meta: CellProperties, value: *}>} Array of objects with `meta` and `value`, one per source row.
   */
  getDataMapAtColumn(physicalColumn: number): Record<string, unknown>[] {
    const countSourceRows = this.hot.countSourceRows();
    const visualColumn = this.hot.toVisualColumn(physicalColumn);
    const data: Record<string, unknown>[] = [];

    type HotWithMetaManager = {
      _getMetaManager(): {
        getCellMeta(row: number, col: number, opts: Record<string, unknown>): Record<string, unknown>;
      };
    };

    for (let physicalRow = 0; physicalRow < countSourceRows; physicalRow++) {
      const cellMeta = (this.hot as unknown as HotWithMetaManager)
        ._getMetaManager().getCellMeta(physicalRow, physicalColumn, {
          visualRow: physicalRow,
          visualColumn: physicalColumn,
          skipMetaExtension: true,
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
      arrayEach(changes, (change) => {
        const [, prop] = change as unknown[];
        const visualColumnIndex = this.hot.propToCol(prop as string | number);
        const physicalColumnIndex = this.hot.toPhysicalColumn(visualColumnIndex);

        if (this.conditionCollection?.hasConditions(physicalColumnIndex)) {
          this.updateValueComponentCondition(physicalColumnIndex);
        }
      });
    }
  };

  /**
   * Update the condition of ValueComponent, based on the handled changes.
   *
   * @private
   * @param {number} columnIndex Physical column index of handled ValueComponent condition.
   */
  updateValueComponentCondition(columnIndex: number) {
    const visualColumnIndex = this.hot.toVisualColumn(columnIndex);
    const dataAtCol = this.hot.getDataAtCol(visualColumnIndex);
    const columnMeta = this.hot.countRows() > 0 ? this.hot.getCellMeta(0, visualColumnIndex) : null;
    const comparator = getSortComparatorForMeta(columnMeta);
    const selectedValues = unifyColumnValues(dataAtCol, comparator);

    this.conditionUpdateObserver?.updateStatesAtColumn(columnIndex, selectedValues);
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
  }

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
      ((physicalColumn: number) => this.getDataMapAtColumn(physicalColumn)) as () => Record<string, unknown>[]);
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
    const conditionArgsChange = conditionsState.conditionArgsChange;

    if (Array.isArray(conditionArgsChange)) {
      // update the previous condition stack (only for 'by_value' condition) on each dataset
      // change to make the undo/redo work properly
      this.#previousConditionStack = this.#previousConditionStack.map((stack) => {
        if (stack.column === column && conditions.length > 0) {
          stack.conditions.forEach((condition) => {
            if (condition.name === 'by_value') {
              condition.args = [[...conditionArgsChange]];
            }
          });
        }

        return stack;
      });
    }

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
    const indexes: number[] = [];

    if (!this.dropdownMenuPlugin) {
      return indexes;
    }

    const menu = this.dropdownMenuPlugin.menu;

    arrayEach(components, (component) => {
      const comp = (component as unknown) as { getMenuItemDescriptor(): { key: string } };

      arrayEach(menu.menuItems, (item, index) => {
        if ((item as { key: string }).key === comp.getMenuItemDescriptor().key) {

          indexes.push(index);
        }
      });
    });

    return indexes;
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
    const hotMenu = menu.hotMenu;
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
