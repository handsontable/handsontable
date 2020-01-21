import BasePlugin from '../_base';
import staticRegister from '../../utils/staticRegister';
import { HyperFormula } from 'hyperformula/dist/hyperformula.full.js';
import { registerPlugin } from '../../plugins';
import { parseHFValue } from './utils';

staticRegister('formulas').register('hyperformula', HyperFormula.buildEmpty());
staticRegister('formulas').register('sheetMapping', new Map());

class Formulas extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    // TODO: docs
    this.formulasStaticCollection = staticRegister('formulas');

    // TODO: docs
    this.hyperformula = this.formulasStaticCollection.getItem('hyperformula');

    /**
     * TODO: docs
     */
    this.settings = null;

    // TODO: docs
    this.sheetId = null;

    // TODO: docs
    this.sheetName = null;

    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('modifySourceData', (...args) => this.onModifySourceData(...args));
    this.addHook('modifyData', (...args) => this.onModifyData(...args));
    this.addHook('beforeRemoveCol', (...args) => this.onBeforeRemoveCol(...args));
    this.addHook('beforeRemoveRow', (...args) => this.onBeforeRemoveRow(...args));
    this.addHook('beforeCreateCol', (...args) => this.onBeforeCreateCol(...args));
    this.addHook('beforeCreateRow', (...args) => this.onBeforeCreateRow(...args));
    this.addHook('afterRemoveCol', (...args) => this.onAfterRemoveCol(...args));
    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
    this.addHook('afterCreateCol', (...args) => this.onAfterCreateCol(...args));
    this.addHook('afterCreateRow', (...args) => this.onAfterCreateRow(...args));
    this.addHook('afterColumnSort', (...args) => this.onAfterColumnSort(...args));

    // TODO: check if these hooks from the previous version of the plugin are still relevant
    // this.addHook('afterSetDataAtCell', (...args) => this.onAfterSetDataAtCell(...args));
    // this.addHook('afterSetDataAtRowProp', (...args) => this.onAfterSetDataAtCell(...args));
    // this.addHook('beforeColumnSort', (...args) => this.onBeforeColumnSort(...args));
    // this.addHook('beforeCreateCol', (...args) => this.onBeforeCreateCol(...args));
    // this.addHook('beforeCreateRow', (...args) => this.onBeforeCreateRow(...args));
    // this.addHook('beforeRemoveCol', (...args) => this.onBeforeRemoveCol(...args));
    // this.addHook('beforeRemoveRow', (...args) => this.onBeforeRemoveRow(...args));
    // this.addHook('beforeValidate', (...args) => this.onBeforeValidate(...args));
    // this.addHook('beforeValueRender', (...args) => this.onBeforeValueRender(...args));
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link Formulas#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().formulas;
  }

  /**
   * TODO: docs
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.settings = this.hot.getSettings().formulas;

    this.sheetName = this.hyperformula.addSheet(this.settings.sheetName || void 0);

    this.sheetId = this.hyperformula.getSheetId(this.sheetName); // TODO: maybe this HF API entry should be called `getSheetId` for consistency, instead of `sheetId`?

    super.enablePlugin();
  }

  /**
   * TODO: docs
   */
  disablePlugin() {
    // TODO: destroy HF here

    super.disablePlugin();
  }

  /**
   * On before remove row listener. TODO: check docs
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of removed rows.
   */
  onBeforeRemoveRow(row, amount) {
    return this.hyperformula.isItPossibleToRemoveRows(this.sheetId, [row, amount]);
  }

  /**
   * On before remove row listener. TODO: check docs
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of removed rows.
   */
  onBeforeRemoveCol(column, amount) {
    return this.hyperformula.isItPossibleToRemoveColumns(this.sheetId, [column, amount]);
  }

  /**
   * On before create column listener. TODO: check docs
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} amount An amount of created columns.
   * @param {String} source Source of method call.
   */
  onBeforeCreateRow(row, amount, source) {
    return this.hyperformula.isItPossibleToAddRows(this.sheetId, [row, amount]);
  }

  /**
   * On before create column listener. TODO: check docs
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} amount An amount of created columns.
   * @param {String} source Source of method call.
   */
  onBeforeCreateCol(column, amount, source) {
    return this.hyperformula.isItPossibleToAddColumns(this.sheetId, [column, amount]);
  }

  /**
   * On after remove row listener. TODO: check docs
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of removed rows.
   */
  onAfterRemoveRow(row, amount) {
    this.hyperformula.removeRows(this.sheetId, [row, amount]);
  }

  /**
   * On after remove row listener. TODO: check docs
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of removed rows.
   */
  onAfterRemoveCol(column, amount) {
    this.hyperformula.removeColumns(this.sheetId, [column, amount]);
  }

  /**
   * On after create column listener. TODO: check docs
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} amount An amount of created columns.
   * @param {String} source Source of method call.
   */
  onAfterCreateRow(row, amount, source) {
    this.hyperformula.addRows(this.sheetId, [row, amount]);
  }

  /**
   * On after create column listener. TODO: check docs
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} amount An amount of created columns.
   * @param {String} source Source of method call.
   */
  onAfterCreateCol(column, amount, source) {
    this.hyperformula.addColumns(this.sheetId, [column, amount]);
  }

  /**
   * TODO: docs
   */
  onAfterLoadData() {
    if (this.isEnabled()) {

      // TODO: temporary solution for no `clearSheet` HF API method
      this.hyperformula.removeSheet(this.sheetName);
      this.sheetName = this.hyperformula.addSheet(this.settings.sheetName || void 0);
      this.sheetId = this.hyperformula.getSheetId(this.sheetName);
      //

      this.hyperformula.setMultipleCellContents({
        row: 0,
        col: 0,
        sheet: this.sheetId
      }, this.hot.getSourceDataArray().map((row) => {
        return row.slice(0, this.hot.countCols()).map((el) => {
          return el === null ? null : (el === void 0 ? '' : el.toString());
        });
      })); // TODO: optimize
    }
  }

  /**
   * On modify row data listener. It overwrites raw values into calculated ones and force upper case all formula expressions.
   * TODO: check docs
   * @private
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @param {Object} valueHolder Value holder as an object to change value by reference.
   * @param {String} ioMode IO operation (`get` or `set`).
   * @returns {Array|undefined} Returns modified row data.
   */
  onModifyData(row, column, valueHolder, ioMode) {
    if (this.isEnabled()) {
      if (ioMode === 'get') {
        valueHolder.value = this.hyperformula.getCellValue({
          row,
          col: column,
          sheet: this.sheetId
        });

        valueHolder.value = parseHFValue(valueHolder.value);

      } else if (ioMode === 'set') {
        this.hyperformula.setCellContent({
          row,
          col: column,
          sheet: this.sheetId
        }, valueHolder.value);
      }
    }
  }

  /**
   * TODO: docs + correct the modifySourceData hook
   * @param row
   * @param column
   * @param valueHolder
   * @param ioMode
   */
  onModifySourceData(row, column, valueHolder, ioMode) {
    if (this.isEnabled()) {
      const sheetDimensions = this.hyperformula.getSheetDimensions(this.sheetId);

      if (sheetDimensions.width !== 0 && sheetDimensions.height !== 0) {
        if (ioMode === 'get') {
          valueHolder.value = this.hyperformula.getCellFormula({
            row,
            col: column,
            sheet: this.sheetId
          }) || this.hyperformula.getCellValue({
            row,
            col: column,
            sheet: this.sheetId
          }); //TODO: optimize

          valueHolder.value = parseHFValue(valueHolder.value);
        }
      }
    }
  }

  /**
   * On after column sorting listener. TODO: docs
   *
   * @private
   * @param {Number} column Sorted column index.
   * @param {Boolean} order Order type.
   */
  onAfterColumnSort(currentSortConfig, destinationSortConfigs) {
    // TODO: no sorting implementation in hyperformula yet
  }
}

registerPlugin('formulas', Formulas);

export default Formulas;
