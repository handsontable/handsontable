import BasePlugin from 'handsontable/plugins/_base';
import {arrayEach, arrayMap} from 'handsontable/helpers/array';
import {toSingleLine} from 'handsontable/helpers/templateLiteralTag';
import {rangeEach} from 'handsontable/helpers/number';
import EventManager from 'handsontable/eventManager';
import {addClass, removeClass, closest} from 'handsontable/helpers/dom/element';
import {registerPlugin} from 'handsontable/plugins';
import {SEPARATOR} from 'handsontable/plugins/contextMenu/predefinedItems';
import * as constants from 'handsontable/i18n/constants';
import ConditionComponent from './component/condition';
import OperatorsComponent from './component/operators';
import ValueComponent from './component/value';
import ActionBarComponent from './component/actionBar';
import ConditionCollection from './conditionCollection';
import DataFilter from './dataFilter';
import ConditionUpdateObserver from './conditionUpdateObserver';
import {createArrayAssertion, toEmptyString, unifyColumnValues} from './utils';
import {CONDITION_NONE, CONDITION_BY_VALUE, OPERATION_AND, OPERATION_OR, OPERATION_OR_THEN_VARIABLE} from './constants';

import './filters.css';

/**
 * This plugin allows filtering the table data either by the built-in component or with the API.
 *
 * @plugin Filters
 * @pro
 * @dependencies DropdownMenu TrimRows BindRowsWithHeaders HiddenRows
 */
class Filters extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link EventManager}.
     *
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * Instance of {@link TrimRows}.
     *
     * @type {TrimRows}
     */
    this.trimRowsPlugin = null;
    /**
     * Instance of {@link DropdownMenu}.
     *
     * @type {DropdownMenu}
     */
    this.dropdownMenuPlugin = null;
    /**
     * Instance of {@link ConditionCollection}.
     *
     * @type {ConditionCollection}
     */
    this.conditionCollection = null;
    /**
     * Instance of {@link ConditionUpdateObserver}.
     *
     * @type {ConditionUpdateObserver}
     */
    this.conditionUpdateObserver = null;
    /**
     * Map, where key is component identifier and value represent `BaseComponent` element or it derivatives.
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
     * @type {Object}
     * @default null
     */
    this.lastSelectedColumn = null;
    /**
     * Hidden menu rows indexed by physical column index
     *
     * @type {Map}
     */
    this.hiddenRowsCache = new Map();

    // One listener for the enable/disable functionality
    this.hot.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    /* eslint-disable no-unneeded-ternary */
    return this.hot.getSettings().filters ? true : false;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    this.trimRowsPlugin = this.hot.getPlugin('trimRows');
    this.dropdownMenuPlugin = this.hot.getPlugin('dropdownMenu');

    let addConfirmationHooks = (component) => {
      component.addLocalHook('accept', () => this.onActionBarSubmit('accept'));
      component.addLocalHook('cancel', () => this.onActionBarSubmit('cancel'));
      component.addLocalHook('change', (command) => this.onComponentChange(component, command));

      return component;
    };

    const filterByConditionLabel = () => `${this.hot.getTranslatedPhrase(constants.FILTERS_DIVS_FILTER_BY_CONDITION)}:`;
    const filterValueLabel = () => `${this.hot.getTranslatedPhrase(constants.FILTERS_DIVS_FILTER_BY_VALUE)}:`;

    if (!this.components.get('filter_by_condition')) {
      const conditionComponent = new ConditionComponent(this.hot, {id: 'filter_by_condition', name: filterByConditionLabel, addSeparator: false});
      conditionComponent.addLocalHook('afterClose', () => this.onSelectUIClosed());

      this.components.set('filter_by_condition', addConfirmationHooks(conditionComponent));
    }
    if (!this.components.get('filter_operators')) {
      this.components.set('filter_operators', new OperatorsComponent(this.hot, {id: 'filter_operators', name: 'Operators'}));
    }
    if (!this.components.get('filter_by_condition2')) {
      const conditionComponent = new ConditionComponent(this.hot, {id: 'filter_by_condition2', name: '', addSeparator: true});
      conditionComponent.addLocalHook('afterClose', () => this.onSelectUIClosed());

      this.components.set('filter_by_condition2', addConfirmationHooks(conditionComponent));
    }
    if (!this.components.get('filter_by_value')) {
      this.components.set('filter_by_value', addConfirmationHooks(new ValueComponent(this.hot, {id: 'filter_by_value', name: filterValueLabel})));
    }
    if (!this.components.get('filter_action_bar')) {
      this.components.set('filter_action_bar', addConfirmationHooks(new ActionBarComponent(this.hot, {id: 'filter_action_bar', name: 'Action bar'})));
    }
    if (!this.conditionCollection) {
      this.conditionCollection = new ConditionCollection();
    }
    if (!this.conditionUpdateObserver) {
      this.conditionUpdateObserver = new ConditionUpdateObserver(this.conditionCollection, (column) => this.getDataMapAtColumn(column));
      this.conditionUpdateObserver.addLocalHook('update', (conditionState) => this.updateComponents(conditionState));
    }

    this.components.forEach((component) => {
      component.show();
    });

    this.registerEvents();
    this.addHook('beforeDropdownMenuSetItems', (items) => this.onBeforeDropdownMenuSetItems(items));
    this.addHook('afterDropdownMenuDefaultOptions', (defaultOptions) => this.onAfterDropdownMenuDefaultOptions(defaultOptions));
    this.addHook('afterDropdownMenuShow', () => this.onAfterDropdownMenuShow());
    this.addHook('afterDropdownMenuHide', () => this.onAfterDropdownMenuHide());
    this.addHook('afterChange', (changes, source) => this.onAfterChange(changes));

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
   * Register the DOM listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'click', (event) => this.onTableClick(event));
  }

  /**
   * Disable plugin for this Handsontable instance.
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
   * Add condition to the conditions collection at specified column index.
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
   * Possible operations:
   *  * `conjunction` - [**Conjunction**](https://en.wikipedia.org/wiki/Logical_conjunction) on conditions collection (by default)
   *  * `disjunction` - [**Disjunction**](https://en.wikipedia.org/wiki/Logical_disjunction) on conditions collection
   *
   * @example
   * ```js
   * // Add filter "Greater than" 95 to column at index 1
   * hot.getPlugin('filters').addCondition(1, 'gt', [95]);
   * hot.getPlugin('filters').filter();
   *
   * // Add filter "By value" to column at index 1
   * // In this case all value's that don't match will be filtered.
   * hot.getPlugin('filters').addCondition(1, 'by_value', [['ing', 'ed', 'as', 'on']]);
   * hot.getPlugin('filters').filter();
   *
   * // Add filter "Begins with" with value "de" AND "Not contains" with value "ing"
   * hot.getPlugin('filters').addCondition(1, 'begins_with', ['de'], 'conjunction');
   * hot.getPlugin('filters').addCondition(1, 'not_contains', ['ing'], 'conjunction');
   * hot.getPlugin('filters').filter();
   *
   * // Add filter "Begins with" with value "de" OR "Not contains" with value "ing"
   * hot.getPlugin('filters').addCondition(1, 'begins_with', ['de'], 'disjunction');
   * hot.getPlugin('filters').addCondition(1, 'not_contains', ['ing'], 'disjunction');
   * hot.getPlugin('filters').filter();
   * ```
   * @param {Number} column Visual column index.
   * @param {String} name Condition short name.
   * @param {Array} args Condition arguments.
   * @param {String} operationId `id` of operation which is performed on the column
   */
  addCondition(column, name, args, operationId = OPERATION_AND) {
    const physicalColumn = this.t.toPhysicalColumn(column);

    this.conditionCollection.addCondition(physicalColumn, {command: {key: name}, args}, operationId);
  }

  /**
   * Remove conditions at specified column index.
   *
   * @param {Number} column Visual column index.
   */
  removeConditions(column) {
    const physicalColumn = this.t.toPhysicalColumn(column);

    this.conditionCollection.removeConditions(physicalColumn);
  }

  /**
   * Clear all conditions previously added to the collection for the specified column index or, if the column index
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
   * Filter data based on added filter conditions.
   */
  filter() {
    let dataFilter = this._createDataFilter();
    let needToFilter = !this.conditionCollection.isEmpty();
    let visibleVisualRows = [];

    const conditions = this.conditionCollection.exportAllConditions();
    const allowFiltering = this.hot.runHooks('beforeFilter', conditions);

    if (allowFiltering !== false) {
      if (needToFilter) {
        let trimmedRows = [];

        this.trimRowsPlugin.trimmedRows.length = 0;

        visibleVisualRows = arrayMap(dataFilter.filter(), (rowData) => rowData.meta.visualRow);

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
   * Get last selected column index.
   *
   * @returns {Object|null} Return `null` when column isn't selected otherwise
   * object containing information about selected column with keys `visualIndex` and `physicalIndex`
   */
  getSelectedColumn() {
    return this.lastSelectedColumn;
  }

  /**
   * Clear column selection.
   */
  clearColumnSelection() {
    let [row, col] = this.hot.getSelectedLast() || [];

    if (row !== void 0 && col !== void 0) {
      this.hot.selectCell(row, col);
    }
  }

  /**
   * Get handsontable source data with cell meta based on current selection.
   *
   * @param {Number} [column] Column index. By default column index accept the value of the selected column.
   * @returns {Array} Returns array of objects where keys as row index.
   */
  getDataMapAtColumn(column) {
    const visualIndex = this.t.toVisualColumn(column);
    const data = [];

    arrayEach(this.hot.getSourceDataAtCol(visualIndex), (value, rowIndex) => {
      let {row, col, visualCol, visualRow, type, instance, dateFormat} = this.hot.getCellMeta(rowIndex, visualIndex);

      data.push({
        meta: {row, col, visualCol, visualRow, type, instance, dateFormat},
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

        this.updateValueComponentCondition(columnIndex);
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
   * After dropdown menu show listener.
   *
   * @private
   */
  onAfterDropdownMenuShow() {
    const selectedColumn = this.getSelectedColumn();
    const physicalIndex = selectedColumn && selectedColumn.physicalIndex;

    this.components.forEach((component) => {
      if (!component.isHidden() && component.setState) {
        component.restoreState(physicalIndex);
      }
    });
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
    const menuKeys = arrayMap(items, (item) => item.key);

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
    defaultOptions.items.push({name: SEPARATOR});

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
    let th = closest(event.target, 'TH');

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
   * Destroy plugin.
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
   * Create DataFilter instance based on condition collection.
   *
   * @private
   * @param {ConditionCollection} conditionCollection Condition collection object.
   * @returns {DataFilter}
   */
  _createDataFilter(conditionCollection = this.conditionCollection) {
    return new DataFilter(conditionCollection, (column) => this.getDataMapAtColumn(column));
  }

  /**
   * Update components basing on conditions state.
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
    const conditionsByValue = conditions.filter((condition) => condition.name === CONDITION_BY_VALUE);
    const conditionsWithoutByValue = conditions.filter((condition) => condition.name !== CONDITION_BY_VALUE);
    const operationType = this.conditionCollection.columnTypes[column];

    if (conditionsByValue.length === 2 || conditionsWithoutByValue.length === 3) {
      console.warn(toSingleLine`The filter conditions have been applied properly, but couldn’t be displayed visually. 
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
   * Show component for particular column.
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
   * Remove specific rows from `hiddenRows` cache for particular column.
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
   * Hide component for particular column.
   *
   * @private
   * @param {BaseComponent} component `BaseComponent` element or it derivatives.
   * @param {Number} column Physical column index.
   */
  hideComponentForParticularColumn(component, column) {
    if (!this.hiddenRowsCache.has(column)) {
      this.hiddenRowsCache.set(column, this.getIndexesOfComponents(component));

    } else {
      const indexes = this.getIndexesOfComponents(component);
      this.addIndexesToHiddenRowsCache(column, indexes);
    }
  }

  /**
   * Add specific rows to `hiddenRows` cache for particular column.
   *
   * @private
   * @param column Physical column index.
   * @param indexes Physical indexes of rows which will be added to `hiddenRows` cache
   */
  addIndexesToHiddenRowsCache(column, indexes) {
    const hiddenRowsForColumn = this.hiddenRowsCache.get(column);

    arrayEach(indexes, (index) => {
      if (hiddenRowsForColumn.indexOf(index) === -1) {
        hiddenRowsForColumn.push(index);
      }
    });
  }


  /**
   * Get indexes of passed components inside list of `dropdownMenu` items.
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
   * Change visibility of component.
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
   * Init `hiddenRows` cache.
   *
   * @private
   */
  initHiddenRowsCache() {
    this.dropdownMenuPlugin.menu.addLocalHook('afterOpen', () => {
      const index = this.lastSelectedColumn.physicalIndex;

      if (!this.hiddenRowsCache.has(index)) {
        this.hiddenRowsCache.set(index, this.getIndexesOfComponents(this.components.get('filter_operators'), this.components.get('filter_by_condition2')));
      }

      this.dropdownMenuPlugin.menu.hotMenu.updateSettings({hiddenRows: {rows: this.hiddenRowsCache.get(index)}});
    });
  }

  /**
   * Save `hiddenRows` cache for particular row.
   *
   * @private
   * @param rowIndex Physical row index
   */
  saveHiddenRowsCache(rowIndex) {
    this.hiddenRowsCache.set(rowIndex, this.dropdownMenuPlugin.menu.hotMenu.getPlugin('hiddenRows').hiddenRows);
  }

  /**
   * Hide components of filters `dropdownMenu`.
   *
   * @private
   * @param {...BaseComponent} components List of components.
   */
  hideComponents(...components) {
    this.changeComponentsVisibility(false, ...components);
  }

  /**
   * Show components of filters `dropdownMenu`.
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
