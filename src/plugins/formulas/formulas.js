import BasePlugin from '../_base';
import { arrayEach } from '../../helpers/array';
import { isObject, objectEach } from '../../helpers/object';
import EventManager from '../../eventManager';
import { registerPlugin } from '../../plugins';
import { isFormulaExpression, toUpperCaseFormula, isFormulaExpressionEscaped, unescapeFormulaExpression } from './utils';
import Sheet from './sheet';
import DataProvider from './dataProvider';
import UndoRedoSnapshot from './undoRedoSnapshot';

/**
 * The formulas plugin.
 *
 * @plugin Formulas
 * @experimental
 */
class Formulas extends BasePlugin {
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
     * Instance of {@link DataProvider}.
     *
     * @private
     * @type {DataProvider}
     */
    this.dataProvider = new DataProvider(this.hot);
    /**
     * Instance of {@link Sheet}.
     *
     * @private
     * @type {Sheet}
     */
    this.sheet = new Sheet(this.hot, this.dataProvider);
    /**
     * Instance of {@link UndoRedoSnapshot}.
     *
     * @private
     * @type {UndoRedoSnapshot}
     */
    this.undoRedoSnapshot = new UndoRedoSnapshot(this.sheet);
    /**
     * Flag which indicates if table should be re-render after sheet recalculations.
     *
     * @type {Boolean}
     * @default false
     * @private
     */
    this._skipRendering = false;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link Formulas#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    /* eslint-disable no-unneeded-ternary */
    return this.hot.getSettings().formulas ? true : false;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    const settings = this.hot.getSettings().formulas;

    if (isObject(settings)) {
      if (isObject(settings.variables)) {
        objectEach(settings.variables, (value, name) => this.setVariable(name, value));
      }
    }

    this.addHook('afterColumnSort', (...args) => this.onAfterColumnSort(...args));
    this.addHook('afterCreateCol', (...args) => this.onAfterCreateCol(...args));
    this.addHook('afterCreateRow', (...args) => this.onAfterCreateRow(...args));
    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('afterRemoveCol', (...args) => this.onAfterRemoveCol(...args));
    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
    this.addHook('afterSetDataAtCell', (...args) => this.onAfterSetDataAtCell(...args));
    this.addHook('afterSetDataAtRowProp', (...args) => this.onAfterSetDataAtCell(...args));
    this.addHook('beforeColumnSort', (...args) => this.onBeforeColumnSort(...args));
    this.addHook('beforeCreateCol', (...args) => this.onBeforeCreateCol(...args));
    this.addHook('beforeCreateRow', (...args) => this.onBeforeCreateRow(...args));
    this.addHook('beforeRemoveCol', (...args) => this.onBeforeRemoveCol(...args));
    this.addHook('beforeRemoveRow', (...args) => this.onBeforeRemoveRow(...args));
    this.addHook('beforeValidate', (...args) => this.onBeforeValidate(...args));
    this.addHook('beforeValueRender', (...args) => this.onBeforeValueRender(...args));
    this.addHook('modifyData', (...args) => this.onModifyData(...args));

    this.sheet.addLocalHook('afterRecalculate', (...args) => this.onSheetAfterRecalculate(...args));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Returns cell value (evaluated from formula expression) at specified cell coords.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {*}
   */
  getCellValue(row, column) {
    const cell = this.sheet.getCellAt(row, column);

    return cell ? (cell.getError() || cell.getValue()) : void 0;
  }

  /**
   * Checks if there are any formula evaluations made under specific cell coords.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {Boolean}
   */
  hasComputedCellValue(row, column) {
    return this.sheet.getCellAt(row, column) !== null;
  }

  /**
   * Recalculates all formulas (an algorithm will choose the best method of calculation).
   */
  recalculate() {
    this.sheet.recalculate();
  }

  /**
   * Recalculates all formulas (rebuild dependencies from scratch - slow approach).
   */
  recalculateFull() {
    this.sheet.recalculateFull();
  }

  /**
   * Recalculates all formulas (recalculate only changed cells - fast approach).
   */
  recalculateOptimized() {
    this.sheet.recalculateOptimized();
  }

  /**
   * Sets predefined variable name which can be visible while parsing formula expression.
   *
   * @param {String} name Variable name.
   * @param {*} value Variable value.
   */
  setVariable(name, value) {
    this.sheet.setVariable(name, value);
  }

  /**
   * Returns variable name.
   *
   * @param {String} name Variable name.
   * @returns {*}
   */
  getVariable(name) {
    return this.sheet.getVariable(name);
  }

  /**
   * Local hook listener for after sheet recalculation.
   *
   * @private
   * @param {Array} cells An array of recalculated/changed cells.
   */
  onSheetAfterRecalculate(cells) {
    if (this._skipRendering) {
      this._skipRendering = false;

      return;
    }
    const hot = this.hot;

    arrayEach(cells, ({ row, column }) => {
      hot.validateCell(hot.getDataAtCell(row, column), hot.getCellMeta(row, column), () => {});
    });
    hot.render();
  }

  /**
   * On modify row data listener. It overwrites raw values into calculated ones and force upper case all formula expressions.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @param {Object} valueHolder Value holder as an object to change value by reference.
   * @param {String} ioMode IO operation (`get` or `set`).
   * @returns {Array|undefined} Returns modified row data.
   */
  onModifyData(row, column, valueHolder, ioMode) {
    if (ioMode === 'get' && this.hasComputedCellValue(row, column)) {
      valueHolder.value = this.getCellValue(row, column);

    } else if (ioMode === 'set' && isFormulaExpression(valueHolder.value)) {
      valueHolder.value = toUpperCaseFormula(valueHolder.value);
    }
  }

  /**
   * On before value render listener.
   *
   * @private
   * @param {*} value Value to render.
   * @returns {*}
   */
  onBeforeValueRender(value) {
    let renderValue = value;

    if (isFormulaExpressionEscaped(renderValue)) {
      renderValue = unescapeFormulaExpression(renderValue);
    }

    return renderValue;
  }

  /**
   * On before validate listener.
   *
   * @private
   * @param {*} value Value to validate.
   * @param {Number} row Row index.
   * @param {Number} prop Column property.
   */
  onBeforeValidate(value, row, prop) {
    const column = this.hot.propToCol(prop);
    let validateValue = value;

    if (this.hasComputedCellValue(row, column)) {
      validateValue = this.getCellValue(row, column);
    }

    return validateValue;
  }

  /**
   * `afterSetDataAtCell` listener.
   *
   * @private
   * @param {Array} changes Array of changes.
   * @param {String} [source] Source of changes.
   */
  onAfterSetDataAtCell(changes, source) {
    if (source === 'loadData') {
      return;
    }

    this.dataProvider.clearChanges();

    arrayEach(changes, ([row, column, oldValue, newValue]) => {
      const physicalColumn = this.hot.propToCol(column);
      const physicalRow = this.t.toPhysicalRow(row);
      let value = newValue;

      if (isFormulaExpression(value)) {
        value = toUpperCaseFormula(value);
      }

      this.dataProvider.collectChanges(physicalRow, physicalColumn, value);

      if (oldValue !== value) {
        this.sheet.applyChanges(physicalRow, physicalColumn, value);
      }
    });
    this.recalculate();
  }

  /**
   * On before create row listener.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of removed rows.
   * @param {String} source Source of method call.
   */
  onBeforeCreateRow(row, amount, source) {
    if (source === 'UndoRedo.undo') {
      this.undoRedoSnapshot.restore();
    }
  }

  /**
   * On after create row listener.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of created rows.
   * @param {String} source Source of method call.
   */
  onAfterCreateRow(row, amount, source) {
    this.sheet.alterManager.triggerAlter('insert_row', row, amount, source !== 'UndoRedo.undo');
  }

  /**
   * On before remove row listener.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of removed rows.
   */
  onBeforeRemoveRow(row, amount) {
    this.undoRedoSnapshot.save('row', row, amount);
  }

  /**
   * On after remove row listener.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of removed rows.
   */
  onAfterRemoveRow(row, amount) {
    this.sheet.alterManager.triggerAlter('remove_row', row, amount);
  }

  /**
   * On before create column listener.
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} amount An amount of removed columns.
   * @param {String} source Source of method call.
   */
  onBeforeCreateCol(column, amount, source) {
    if (source === 'UndoRedo.undo') {
      this.undoRedoSnapshot.restore();
    }
  }

  /**
   * On after create column listener.
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} amount An amount of created columns.
   * @param {String} source Source of method call.
   */
  onAfterCreateCol(column, amount, source) {
    this.sheet.alterManager.triggerAlter('insert_column', column, amount, source !== 'UndoRedo.undo');
  }

  /**
   * On before remove column listener.
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} amount An amount of removed columns.
   */
  onBeforeRemoveCol(column, amount) {
    this.undoRedoSnapshot.save('column', column, amount);
  }

  /**
   * On after remove column listener.
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} amount An amount of created columns.
   */
  onAfterRemoveCol(column, amount) {
    this.sheet.alterManager.triggerAlter('remove_column', column, amount);
  }

  /**
   * On before column sorting listener.
   *
   * @private
   * @param {Number} column Sorted column index.
   * @param {Boolean} order Order type.
   */
  onBeforeColumnSort(column, order) {
    this.sheet.alterManager.prepareAlter('column_sorting', column, order);
  }

  /**
   * On after column sorting listener.
   *
   * @private
   * @param {Number} column Sorted column index.
   * @param {Boolean} order Order type.
   */
  onAfterColumnSort(column, order) {
    this.sheet.alterManager.triggerAlter('column_sorting', column, order);
  }

  /**
   * On after load data listener.
   *
   * @private
   */
  onAfterLoadData() {
    this._skipRendering = true;
    this.recalculateFull();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.dataProvider.destroy();
    this.dataProvider = null;
    this.sheet.destroy();
    this.sheet = null;

    super.destroy();
  }
}

registerPlugin('formulas', Formulas);

export default Formulas;
