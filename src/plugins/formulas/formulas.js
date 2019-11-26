import BasePlugin from '../_base';
import staticRegister from '../../utils/staticRegister';
import { HyperFormula } from 'hyperformula/dist/unoptimized-full/bundle.js';
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

    this.hyperformula.addSheet(this.hot.guid.split('_')[1]); // TODO: the `_` character seems to not work within Sheet names.

    // TODO: docs
    this.sheetId = this.hyperformula.sheetMapping.fetch(this.hot.guid.split('_')[1]); // TODO: this should probably in the main HF API?

    this.addHook('afterColumnSort', (...args) => this.onAfterColumnSort(...args));
    this.addHook('afterCreateCol', (...args) => this.onAfterCreateCol(...args));
    this.addHook('afterCreateRow', (...args) => this.onAfterCreateRow(...args));
    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('afterRemoveCol', (...args) => this.onAfterRemoveCol(...args));
    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
    this.addHook('modifyData', (...args) => this.onModifyData(...args));
    this.addHook('modifySourceData', (...args) => this.onModifySourceData(...args));

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
   * On after remove row listener. TODO: check docs
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of removed rows.
   */
  onAfterRemoveRow(row, amount) {
    if (this.hyperformula.isItPossibleToRemoveRows(this.sheetId, [row, amount])) {
      this.hyperformula.removeRows(this.sheetId, [row, amount]);
    }
  }

  /**
   * On after remove row listener. TODO: check docs
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} amount An amount of removed rows.
   */
  onAfterRemoveCol(column, amount) {
    if (this.hyperformula.isItPossibleToRemoveColumns(this.sheetId, [column, amount])) {
      this.hyperformula.removeColumns(this.sheetId, [column, amount]);
    }
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
    if (this.hyperformula.isItPossibleToAddRows(this.sheetId, [row, amount])) {
      this.hyperformula.addRows(this.sheetId, [row, amount]);
    }
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
    if (this.hyperformula.isItPossibleToAddColumns(this.sheetId, [column, amount])) {
      this.hyperformula.addColumns(this.sheetId, [column, amount]);
    }
  }

  /**
   * TODO: docs
   */
  onAfterLoadData() {
    if (this.isEnabled()) {

      this.hyperformula.setMultipleCellContents({
        row: 0,
        col: 0,
        sheet: this.sheetId
      }, this.hot.getSourceDataArray().map((row) => {
        return row.slice(0, this.hot.countCols()).map((el) => { // TODO: this entire logic is done to parse `null` values to empty strings, needs to be changed
          return (el == null ? '' : el) .toString();
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
    const sheetDimensions = this.hyperformula.getSheetDimensions(this.sheetId);

    if (this.isEnabled() && (sheetDimensions.width !== 0 && sheetDimensions.height !== 0)) {
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

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link HyperFormula#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().formulas;
  }
}

registerPlugin('formulas', Formulas);

export default Formulas;
