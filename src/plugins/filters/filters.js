import BasePlugin from 'handsontable/plugins/_base';
import { arrayEach, arrayMap } from 'handsontable/helpers/array';
import { toSingleLine } from 'handsontable/helpers/templateLiteralTag';
import { warn } from 'handsontable/helpers/console';
import { rangeEach } from 'handsontable/helpers/number';
import EventManager from 'handsontable/eventManager';
import { addClass, removeClass, closest } from 'handsontable/helpers/dom/element';
import { registerPlugin } from 'handsontable/plugins';
import { SEPARATOR } from 'handsontable/plugins/contextMenu/predefinedItems';
import * as constants from 'handsontable/i18n/constants';
import ConditionComponent from './component/condition';
import OperatorsComponent from './component/operators';
import ValueComponent from './component/value';
import ActionBarComponent from './component/actionBar';
import ConditionCollection from './conditionCollection';
import DataFilter from './dataFilter';
import ConditionUpdateObserver from './conditionUpdateObserver';
import { createArrayAssertion, toEmptyString, unifyColumnValues } from './utils';
import { CONDITION_NONE, CONDITION_BY_VALUE, OPERATION_AND, OPERATION_OR, OPERATION_OR_THEN_VARIABLE } from './constants';

import './filters.css';

/**
 * @plugin Filters
 * @pro
 * @dependencies DropdownMenu TrimRows
 *
 * @description
 * The plugin allows filtering the table data either by the built-in component or with the API.
 *
 * See [the filtering demo](https://docs.handsontable.com/pro/demo-filtering.html) for examples.
 *
 * @example
 * ```
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   dropdownMenu: true,
 *   filters: true
 * });
 * ```
 */
class Filters extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link EventManager}.
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * Instance of {@link TrimRows}.
     *
     * @private
     * @type {TrimRows}
     */
    this.trimRowsPlugin = null;
    /**
     * Instance of {@link DropdownMenu}.
     *
     * @private
     * @type {DropdownMenu}
     */
    this.dropdownMenuPlugin = null;
    /**
     * Instance of {@link ConditionCollection}.
     *
     * @private
     * @type {ConditionCollection}
     */
    this.conditionCollection = null;
    /**
     * Instance of {@link ConditionUpdateObserver}.
     *
     * @private
     * @type {ConditionUpdateObserver}
     */
    this.conditionUpdateObserver = null;
    /**
     * Map, where key is component identifier and value represent `BaseComponent` element or it derivatives.
     *
     * @private
     * @type {Map}
     */
    this.components = new Map([
      ['filter_by_condition', null],
      ['filter_operators', null],
      ['filter_by_condition2', null],
      ['filter_by_value', null],
      ['filter_action_bar', null]
    ]);
    /**
     * Object containing information about last selected column physical and visual index for added filter conditions.
     *
     * @private
     * @type {Object}
     * @default null
     */
    this.lastSelectedColumn = null;
    /**
     * Hidden menu rows indexed by physical column index
     *
     * @private
     * @type {Map}
     */
    this.hiddenRowsCache = new Map();

    // One listener for the enable/disable functionality
    this.hot.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link Filters#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    /* eslint-disable no-unneeded-ternary */
    return this.hot.getSettings().filters ? true : false;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    this.trimRowsPlugin = this.hot.getPlugin('trimRows');
    this.dropdownMenuPlugin = this.hot.getPlugin('dropdownMenu');

    const addConfirmationHooks = (component) => {
      component.addLocalHook('accept', () => this.onActionBarSubmit('accept'));
      component.addLocalHook('cancel', () => this.onActionBarSubmit('cancel'));
      component.addLocalHook('change', command => this.onComponentChange(component, command));

      return component;
    };

    const filterByConditionLabel = () => `${this.hot.getTranslatedPhrase(constants.FILTERS_DIVS_FILTER_BY_CONDITION)}:`;
    const filterValueLabel = () => `${this.hot.getTranslatedPhrase(constants.FILTERS_DIVS_FILTER_BY_VALUE)}:`;

    if (!this.components.get('filter_by_condition')) {
      const conditionComponent = new ConditionComponent(this.hot, { id: 'filter_by_condition', name: filterByConditionLabel, addSeparator: false });
      conditionComponent.addLocalHook('afterClose', () => this.onSelectUIClosed());

      this.components.set('filter_by_condition', addConfirmationHooks(conditionComponent));
    }
    if (!this.components.get('filter_operators')) {
      this.components.set('filter_operators', new OperatorsComponent(this.hot, { id: 'filter_operators', name: 'Operators' }));
    }
    if (!this.components.get('filter_by_condition2')) {
      const conditionComponent = new ConditionComponent(this.hot, { id: 'filter_by_condition2', name: '', addSeparator: true });
      conditionComponent.addLocalHook('afterClose', () => this.onSelectUIClosed());

      this.components.set('filter_by_condition2', addConfirmationHooks(conditionComponent));
    }
    if (!this.components.get('filter_by_value')) {
      this.components.set('filter_by_value', addConfirmationHooks(new ValueComponent(this.hot, { id: 'filter_by_value', name: filterValueLabel })));
    }
    if (!this.components.get('filter_action_bar')) {
      this.components.set('filter_action_bar', addConfirmationHooks(new ActionBarComponent(this.hot, { id: 'filter_action_bar', name: 'Action bar' })));
    }
    if (!this.conditionCollection) {
      this.conditionCollection = new ConditionCollection();
    }
    if (!this.conditionUpdateObserver) {
      this.conditionUpdateObserver = new ConditionUpdateObserver(this.conditionCollection, column => this.getDataMapAtColumn(column));
      this.conditionUpdateObserver.addLocalHook('update', conditionState => this.updateComponents(conditionState));
    }

    this.components.forEach((component) => {
      component.show();
    });

    this.registerEvents();
    this.addHook('beforeDropdownMenuSetItems', items => this.onBeforeDropdownMenuSetItems(items));
    this.addHook('afterDropdownMenuDefaultOptions', defaultOptions => this.onAfterDropdownMenuDefaultOptions(defaultOptions));
    this.addHook('afterDropdownMenuShow', () => this.onAfterDropdownMenuShow());
    this.addHook('afterDropdownMenuHide', () => this.onAfterDropdownMenuHide());
    this.addHook('afterChange', changes => this.onAfterChange(changes));

    // force to enable dependent plugins
    this.hot.getSettings().trimRows = true;
    this.trimRowsPlugin.enablePlugin();

    // Temp. solution (extending menu items bug in contextMenu/dropdownMenu)
    if (this.hot.getSettings().dropdownMenu) {
      this.dropdownMenuPlugin.disablePlugin();
      this.dropdownMenuPlugin.enablePlugin();
    }

    super.enablePlugin();
  }

  /**
   * Registers the DOM listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'click', event => this.onTableClick(event));
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    if (this.enabled) {
      if (this.dropdownMenuPlugin.enabled) {
        this.dropdownMenuPlugin.menu.clearLocalHooks();
      }

      this.components.forEach((component) => {
        component.hide();
      });

      this.conditionCollection.clean();
      this.trimRowsPlugin.untrimAll();
    }
    super.disablePlugin();
  }

  /**
   * @description
   * Adds condition to the conditions collection at specified column index.
   *
   * Possible predefined conditions:
   *  * `begins_with` - Begins with
   *  * `between` - Between
   *  * `by_value` - By value
   *  * `contains` - Contains
   *  * `empty` - Empty
   *  * `ends_with` - Ends with
   *  * `eq` - Equal
   *  * `gt` - Greater than
   *  * `gte` - Greater than or equal
   *  * `lt` - Less than
   *  * `lte` - Less than or equal
   *  * `none` - None (no filter)
   *  * `not_between` - Not between
   *  * `not_contains` - Not contains
   *  * `not_empty` - Not empty
   *  * `neq` - Not equal
   *
   * Possible operations on collection of conditions:
   *  * `conjunction` - [**Conjunction**](https://en.wikipedia.org/wiki/Logical_conjunction) on conditions collection (by default), i.e. for such operation: c1 AND c2 AND c3 AND c4 ... AND cn === TRUE, where c1 ... cn are conditions.
   *  * `disjunction` - [**Disjunction**](https://en.wikipedia.org/wiki/Logical_disjunction) on conditions collection, i.e. for such operation: `c1 OR c2 OR c3 OR c4 ... OR cn` === TRUE, where c1, c2, c3, c4 ... cn are conditions.
   *  * `disjunctionWithExtraCondition` - **Disjunction** on first `n - 1`\* conditions from collection with an extra requirement computed from the last condition, i.e. for such operation: `c1 OR c2 OR c3 OR c4 ... OR cn-1 AND cn` === TRUE, where c1, c2, c3, c4 ... cn are conditions.
   *
   * \* when `n` is collection size; it's used i.e. for one operation introduced from UI (when choosing from filter's drop-down menu two conditions with OR operator between them, mixed with choosing values from the multiple choice select)
   *
   * **Note**: Mind that you cannot mix different types of operations (for instance, if you use `conjunction`, use it consequently for a particular column).
   *
   * @example
   * ```js
   * const container = document.getElementById('example');
   * const hot = new Handsontable(container, {
   *   date: getData(),
   *   filter: true
   * });
   *
   * // access to filters plugin instance
   * const filtersPlugin = hot.getPlugin('filters');
   *
   * // add filter "Greater than" 95 to column at index 1
   * filtersPlugin.addCondition(1, 'gt', [95]);
   * filtersPlugin.filter();
   *
   * // add filter "By value" to column at index 1
   * // in this case all value's that don't match will be filtered.
   * filtersPlugin.addCondition(1, 'by_value', [['ing', 'ed', 'as', 'on']]);
   * filtersPlugin.filter();
   *
   * // add filter "Begins with" with value "de" AND "Not contains" with value "ing"
   * filtersPlugin.addCondition(1, 'begins_with', ['de'], 'conjunction');
   * filtersPlugin.addCondition(1, 'not_contains', ['ing'], 'conjunction');
   * filtersPlugin.filter();
   *
   * // add filter "Begins with" with value "de" OR "Not contains" with value "ing"
   * filtersPlugin.addCondition(1, 'begins_with', ['de'], 'disjunction');
   * filtersPlugin.addCondition(1, 'not_contains', ['ing'], 'disjunction');
   * filtersPlugin.filter();
   * ```
   * @param {Number} column Visual column index.
   * @param {String} name Condition short name.
   * @param {Array} args Condition arguments.
   * @param {String} operationId `id` of operation which is performed on the column
   */
  addCondition(column, name, args, operationId = OPERATION_AND) {
    const physicalColumn = this.t.toPhysicalColumn(column);

    this.conditionCollection.addCondition(physicalColumn, { command: { key: name }, args }, operationId);
  }

  /**
   * Removes conditions at specified column index.
   *
   * @param {Number} column Visual column index.
   */
  removeConditions(column) {
    const physicalColumn = this.t.toPhysicalColumn(column);

    this.conditionCollection.removeConditions(physicalColumn);
  }

  /**
   * Clears all conditions previously added to the collection for the specified column index or, if the column index
   * was not passed, clear the conditions for all columns.
   *
   * @param {Number} [column] Visual column index.
   */
  clearConditions(column) {
    if (column === void 0) {
      this.conditionCollection.clean();

    } else {
      const physicalColumn = this.t.toPhysicalColumn(column);

      this.conditionCollection.clearConditions(physicalColumn);
    }
  }

  /**
   * Filters data based on added filter conditions.
   *
   * @fires Hooks#beforeFilter
   * @fires Hooks#afterFilter
   */
  filter() {
    const dataFilter = this._createDataFilter();
    const needToFilter = !this.conditionCollection.isEmpty();
    let visibleVisualRows = [];

    const conditions = this.conditionCollection.exportAllConditions();
    const allowFiltering = this.hot.runHooks('beforeFilter', conditions);

    if (allowFiltering !== false) {
      if (needToFilter) {
        const trimmedRows = [];

        this.trimRowsPlugin.trimmedRows.length = 0;

        visibleVisualRows = arrayMap(dataFilter.filter(), rowData => rowData.meta.visualRow);

        const visibleVisualRowsAssertion = createArrayAssertion(visibleVisualRows);

        rangeEach(this.hot.countSourceRows() - 1, (row) => {
          if (!visibleVisualRowsAssertion(row)) {
            trimmedRows.push(row);
          }
        });

        this.trimRowsPlugin.trimRows(trimmedRows);

        if (!visibleVisualRows.length) {
          this.hot.deselectCell();
        }
      } else {
        this.trimRowsPlugin.untrimAll();
      }
    }

    this.hot.view.wt.wtOverlays.adjustElementsSize(true);
    this.hot.render();
    this.clearColumnSelection();

    this.hot.runHooks('afterFilter', conditions);
  }

  /**
   * Gets last selected column index.
   *
   * @returns {Object|null} Return `null` when column isn't selected otherwise
   * object containing information about selected column with keys `visualIndex` and `physicalIndex`
   */
  getSelectedColumn() {
    return this.lastSelectedColumn;
  }

  /**
   * Clears column selection.
   *
   * @private
   */
  clearColumnSelection() {
    const [row, col] = this.hot.getSelectedLast() || [];

    if (row !== void 0 && col !== void 0) {
      this.hot.selectCell(row, col);
    }
  }

  /**
   * Returns handsontable source data with cell meta based on current selection.
   *
   * @param {Number} [column] Column index. By default column index accept the value of the selected column.
   * @returns {Array} Returns array of objects where keys as row index.
   */
  getDataMapAtColumn(column) {
    const visualIndex = this.t.toVisualColumn(column);
    const data = [];

    arrayEach(this.hot.getSourceDataAtCol(visualIndex), (value, rowIndex) => {
      const { row, col, visualCol, visualRow, type, instance, dateFormat } = this.hot.getCellMeta(rowIndex, visualIndex);

      data.push({
        meta: { row, col, visualCol, visualRow, type, instance, dateFormat },
        value: toEmptyString(value),
      });
    });

    return data;
  }

  /**
   * `afterChange` listener.
   *
   * @private
   * @param {Array} changes Array of changes.
   */
  onAfterChange(changes) {
    if (changes) {
      arrayEach(changes, (change) => {
        const [, prop] = change;
        const columnIndex = this.hot.propToCol(prop);

        if (this.conditionCollection.hasConditions(columnIndex)) {
          this.updateValueComponentCondition(columnIndex);
        }
      });
    }
  }

  /**
   * Update condition of ValueComponent basing on handled changes
   *
   * @private
   * @param {Number} columnIndex Column index of handled ValueComponent condition
   */
  updateValueComponentCondition(columnIndex) {
    const dataAtCol = this.hot.getDataAtCol(columnIndex);
    const selectedValues = unifyColumnValues(dataAtCol);

    this.conditionUpdateObserver.updateStatesAtColumn(columnIndex, selectedValues);
  }

  /**
   * Restores components to their cached state.
   *
   * @private
   * @param {Array} components List of components.
   */
  restoreComponents(components) {
    const selectedColumn = this.getSelectedColumn();
    const physicalIndex = selectedColumn && selectedColumn.physicalIndex;

    components.forEach((component) => {
      if (component.isHidden() === false) {
        component.restoreState(physicalIndex);
      }
    });
  }

  /**
   * After dropdown menu show listener.
   *
   * @private
   */
  onAfterDropdownMenuShow() {
    this.restoreComponents([
      this.components.get('filter_by_condition'),
      this.components.get('filter_operators'),
      this.components.get('filter_by_condition2'),
      this.components.get('filter_by_value'),
    ]);
  }

  /**
   * After dropdown menu hide listener.
   *
   * @private
   */
  onAfterDropdownMenuHide() {
    this.components.get('filter_by_condition').getSelectElement().closeOptions();
    this.components.get('filter_by_condition2').getSelectElement().closeOptions();
  }

  /**
   * Before dropdown menu set menu items listener.
   *
   * @private
   * @param {Array} items DropdownMenu items created based on predefined items and settings provided by user.
   */
  onBeforeDropdownMenuSetItems(items) {
    const menuKeys = arrayMap(items, item => item.key);

    this.components.forEach((component) => {
      component[menuKeys.indexOf(component.getMenuItemDescriptor().key) === -1 ? 'hide' : 'show']();
    });

    this.initHiddenRowsCache();
  }

  /**
   * After dropdown menu default options listener.
   *
   * @private
   * @param {Object} defaultOptions ContextMenu default item options.
   */
  onAfterDropdownMenuDefaultOptions(defaultOptions) {
    defaultOptions.items.push({ name: SEPARATOR });

    this.components.forEach((component) => {
      defaultOptions.items.push(component.getMenuItemDescriptor());
    });
  }

  /**
   * Get operation basing on number and type of arguments (where arguments are states of components)
   *
   * @param {String} suggestedOperation operation which was chosen by user from UI
   * @param {Object} byConditionState1 state of first condition component
   * @param {Object} byConditionState2 state of second condition component
   * @param {Object} byValueState state of value component
   * @private
   * @returns {String}
   */
  getOperationBasedOnArguments(suggestedOperation, byConditionState1, byConditionState2, byValueState) {
    let operation = suggestedOperation;

    if (operation === OPERATION_OR && byConditionState1.command.key !== CONDITION_NONE &&
      byConditionState2.command.key !== CONDITION_NONE && byValueState.command.key !== CONDITION_NONE) {
      operation = OPERATION_OR_THEN_VARIABLE;

    } else if (byValueState.command.key !== CONDITION_NONE) {
      if (byConditionState1.command.key === CONDITION_NONE || byConditionState2.command.key === CONDITION_NONE) {
        operation = OPERATION_AND;
      }
    }

    return operation;
  }

  /**
   * On action bar submit listener.
   *
   * @private
   * @param {String} submitType
   */
  onActionBarSubmit(submitType) {
    if (submitType === 'accept') {
      const selectedColumn = this.getSelectedColumn();
      const physicalIndex = selectedColumn && selectedColumn.physicalIndex;
      const byConditionState1 = this.components.get('filter_by_condition').getState();
      const byConditionState2 = this.components.get('filter_by_condition2').getState();
      const byValueState = this.components.get('filter_by_value').getState();

      const operation = this.getOperationBasedOnArguments(this.components.get('filter_operators').getActiveOperationId(),
        byConditionState1, byConditionState2, byValueState);

      this.conditionUpdateObserver.groupChanges();
      this.conditionCollection.clearConditions(physicalIndex);

      if (byConditionState1.command.key === CONDITION_NONE && byConditionState2.command.key === CONDITION_NONE && byValueState.command.key === CONDITION_NONE) {
        this.conditionCollection.removeConditions(physicalIndex);

      } else {
        if (byConditionState1.command.key !== CONDITION_NONE) {
          this.conditionCollection.addCondition(physicalIndex, byConditionState1, operation);

          if (byConditionState2.command.key !== CONDITION_NONE) {
            this.conditionCollection.addCondition(physicalIndex, byConditionState2, operation);
          }
        }

        if (byValueState.command.key !== CONDITION_NONE) {
          this.conditionCollection.addCondition(physicalIndex, byValueState, operation);
        }
      }

      this.conditionUpdateObserver.flush();

      this.components.get('filter_operators').saveState(physicalIndex);
      this.components.get('filter_by_value').saveState(physicalIndex);
      this.saveHiddenRowsCache(physicalIndex);

      this.trimRowsPlugin.trimmedRows.length = 0;
      this.filter();
    }
    this.dropdownMenuPlugin.close();
  }

  /**
   * On component change listener.
   *
   * @private
   * @param {BaseComponent} component Component inheriting BaseComponent
   * @param {Object} command Menu item object (command).
   */
  onComponentChange(component, command) {
    if (component === this.components.get('filter_by_condition')) {
      if (command.showOperators) {
        this.showComponents(this.components.get('filter_by_condition2'), this.components.get('filter_operators'));

      } else {
        this.hideComponents(this.components.get('filter_by_condition2'), this.components.get('filter_operators'));
      }
    }

    if (component.constructor === ConditionComponent && !command.inputsCount) {
      this.setListeningDropdownMenu();
    }
  }

  /**
   * On component SelectUI closed listener.
   *
   * @private
   */
  onSelectUIClosed() {
    this.setListeningDropdownMenu();
  }

  /**
   * Listen to the keyboard input on document body and forward events to instance of Handsontable
   * created by DropdownMenu plugin
   *
   * @private
   */
  setListeningDropdownMenu() {
    this.dropdownMenuPlugin.setListening();
  }

  /**
   * On after get column header listener.
   *
   * @private
   * @param {Number} col
   * @param {HTMLTableCellElement} TH
   */
  onAfterGetColHeader(col, TH) {
    const physicalColumn = this.t.toPhysicalColumn(col);

    if (this.enabled && this.conditionCollection.hasConditions(physicalColumn)) {
      addClass(TH, 'htFiltersActive');
    } else {
      removeClass(TH, 'htFiltersActive');
    }
  }

  /**
   * On table click listener.
   *
   * @private
   * @param {Event} event DOM Event.
   */
  onTableClick(event) {
    const th = closest(event.target, 'TH');

    if (th) {
      const visualIndex = this.hot.getCoords(th).col;
      const physicalIndex = this.t.toPhysicalColumn(visualIndex);

      this.lastSelectedColumn = {
        visualIndex,
        physicalIndex
      };
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    if (this.enabled) {
      this.components.forEach((component) => {
        component.destroy();
      });

      this.conditionCollection.destroy();
      this.conditionUpdateObserver.destroy();
      this.hiddenRowsCache.clear();
      this.trimRowsPlugin.disablePlugin();
    }
    super.destroy();
  }

  /**
   * Creates DataFilter instance based on condition collection.
   *
   * @private
   * @param {ConditionCollection} conditionCollection Condition collection object.
   * @returns {DataFilter}
   */
  _createDataFilter(conditionCollection = this.conditionCollection) {
    return new DataFilter(conditionCollection, column => this.getDataMapAtColumn(column));
  }

  /**
   * Updates components basing on conditions state.
   *
   * @private
   * @param {Object} conditionsState
   */
  updateComponents(conditionsState) {
    if (!this.dropdownMenuPlugin.enabled) {
      return;
    }

    const conditions = conditionsState.editedConditionStack.conditions;
    const column = conditionsState.editedConditionStack.column;
    const conditionsByValue = conditions.filter(condition => condition.name === CONDITION_BY_VALUE);
    const conditionsWithoutByValue = conditions.filter(condition => condition.name !== CONDITION_BY_VALUE);
    const operationType = this.conditionCollection.columnTypes[column];

    if (conditionsByValue.length === 2 || conditionsWithoutByValue.length === 3) {
      warn(toSingleLine`The filter conditions have been applied properly, but couldn’t be displayed visually.
        The overall amount of conditions exceed the capability of the dropdown menu.
        For more details see the documentation.`);

    } else {
      if (conditionsWithoutByValue.length > 0) {
        this.showComponentForParticularColumn(this.components.get('filter_operators'), column);
      }

      this.components.get('filter_by_condition').updateState(conditionsWithoutByValue[0], column);
      this.components.get('filter_by_condition2').updateState(conditionsWithoutByValue[1], column);
      this.components.get('filter_by_value').updateState(conditionsState);
      this.components.get('filter_operators').updateState(operationType, column);
    }
  }

  /**
   * Shows component for particular column.
   *
   * @private
   * @param {BaseComponent} component `BaseComponent` element or it derivatives.
   * @param {Number} column Physical column index.
   */
  showComponentForParticularColumn(component, column) {
    if (!this.hiddenRowsCache.has(column)) {
      this.hiddenRowsCache.set(column, []);

    } else {
      const indexes = this.getIndexesOfComponents(component);
      this.removeIndexesFromHiddenRowsCache(column, indexes);
    }
  }

  /**
   * Removes specific rows from `hiddenRows` cache for particular column.
   *
   * @private
   * @param {Number} column Physical column index.
   * @param {Array} indexes Physical indexes of rows which will be removed from `hiddenRows` cache
   */
  removeIndexesFromHiddenRowsCache(column, indexes) {
    const hiddenRowsForColumn = this.hiddenRowsCache.get(column);

    arrayEach(indexes, (index) => {
      if (hiddenRowsForColumn.includes(index)) {
        hiddenRowsForColumn.splice(hiddenRowsForColumn.indexOf(index), 1);
      }
    });
  }

  /**
   * Returns indexes of passed components inside list of `dropdownMenu` items.
   *
   * @private
   * @param {...BaseComponent} components List of components.
   * @returns {Array}
   */
  getIndexesOfComponents(...components) {
    const menu = this.dropdownMenuPlugin.menu;
    const indexes = [];

    arrayEach(components, (component) => {
      arrayEach(menu.menuItems, (item, index) => {
        if (item.key === component.getMenuItemDescriptor().key) {

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
   * @param {Boolean} visible Determine if components should be visible.
   * @param {...BaseComponent} components List of components.
   */
  changeComponentsVisibility(visible = true, ...components) {
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
   * Initializes `hiddenRows` cache.
   *
   * @private
   */
  initHiddenRowsCache() {
    this.dropdownMenuPlugin.menu.addLocalHook('afterOpen', () => {
      const index = this.lastSelectedColumn.physicalIndex;

      if (!this.hiddenRowsCache.has(index)) {
        this.hiddenRowsCache.set(index, this.getIndexesOfComponents(this.components.get('filter_operators'), this.components.get('filter_by_condition2')));
      }

      this.dropdownMenuPlugin.menu.hotMenu.updateSettings({ hiddenRows: { rows: this.hiddenRowsCache.get(index) } });
    });
  }

  /**
   * Saves `hiddenRows` cache for particular row.
   *
   * @private
   * @param rowIndex Physical row index
   */
  saveHiddenRowsCache(rowIndex) {
    this.hiddenRowsCache.set(rowIndex, this.dropdownMenuPlugin.menu.hotMenu.getPlugin('hiddenRows').hiddenRows);
  }

  /**
   * Hides components of filters `dropdownMenu`.
   *
   * @private
   * @param {...BaseComponent} components List of components.
   */
  hideComponents(...components) {
    this.changeComponentsVisibility(false, ...components);
  }

  /**
   * Shows components of filters `dropdownMenu`.
   *
   * @private
   * @param {...BaseComponent} components List of components.
   */
  showComponents(...components) {
    this.changeComponentsVisibility(true, ...components);
  }

}

registerPlugin('filters', Filters);

export default Filters;
