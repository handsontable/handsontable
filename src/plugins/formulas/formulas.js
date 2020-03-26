import { HyperFormula } from 'hyperformula/es/src/index';
import BasePlugin from '../_base';
import staticRegister from '../../utils/staticRegister';
import { registerPlugin } from '../../plugins';
import { parseErrorObject } from './utils/utils';
import { sequenceToMoveOperations } from './utils/columnSorting';

staticRegister('formulas').register('hyperformula', HyperFormula.buildEmpty());
staticRegister('formulas').register('sheetMapping', new Map());

class Formulas extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Static register for the formula plugin, contains the one global instance of HyperFormula.
     *
     * @type {{}}
     */
    this.formulasStaticCollection = staticRegister('formulas');

    /**
     * Reference to the global instance of HyperFormula.
     *
     * @type {HyperFormula}
     */
    this.hyperformula = this.formulasStaticCollection.getItem('hyperformula');

    /**
     * Cached settings for the formulas plugin.
     *
     * @type {object|boolean} //TODO: check initialization with boolean (auto-generating sheet name?)
     */
    this.settings = null;

    /**
     * Cached sheet ID for the current instance of Handsontable.
     *
     * @type {number}
     */
    this.sheetId = null;

    /**
     * Sheet name for the current Handsontable instance.
     *
     * @type {string}
     */
    this.sheetName = null;

    /**
     * Current row order of the Handsontable instance.
     *
     * @type {number[]}
     */
    this.currentSortOrderSequence = null; // TODO: consider moving elsewhere
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link Formulas#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().formulas;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

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
    this.addHook('beforeColumnSort', (...args) => this.onBeforeColumnSort(...args));
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

    this.settings = this.hot.getSettings().formulas;

    this.sheetName = this.hyperformula.addSheet(this.settings.sheetName || void 0);

    this.sheetId = this.hyperformula.getSheetId(this.sheetName);

    super.enablePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    // TODO: destroy HF here

    super.disablePlugin();
  }

  /**
   * Parse a HyperFormula-based value.
   *
   * @param {HyperFormula.SimpleCellAddress} coords HyperFormula's address object. // TODO: SimpleCellAddress not exported in the HF types?
   * @param {HyperFormula.CellValueType} value Value coming from HyperFormula. // TODO: CellValueType not exported in the HF types?
   * @returns {number|string|boolean|null}
   */
  parseHFValue(coords, value) {
    let returnVal = value;

    switch (this.hyperformula.getCellValueType(coords)) {
      case 'EMPTY':
        returnVal = null;

        break;
      case 'NUMBER':
        returnVal = parseFloat(value);

        break;
      case 'STRING':
        // TODO: do nothing?

        break;
      case 'BOOLEAN':
        returnVal = value;

        break;
      case 'ERROR':
        returnVal = parseErrorObject(value);

        break;
      default:
    }

    return returnVal;
  }

  /**
   * `beforeRemoveRow` hook callback.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} amount An amount of removed rows.
   * @returns {boolean} `true` if it is possible to remove rows in HyperFormula, `false` otherwise.
   */
  onBeforeRemoveRow(row, amount) {
    return this.hyperformula.isItPossibleToRemoveRows(this.sheetId, [row, amount]);
  }

  /**
   * `beforeRemoveCol` hook callback.
   *
   * @private
   * @param {number} column Column index.
   * @param {number} amount An amount of removed columns.
   * @returns {boolean} `true` if it is possible to remove columns in HyperFormula, `false` otherwise.
   */
  onBeforeRemoveCol(column, amount) {
    return this.hyperformula.isItPossibleToRemoveColumns(this.sheetId, [column, amount]);
  }

  /**
   * `beforeCreateRow` hook callback.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} amount An amount of created rows.
   * @returns {boolean} `true` if it is possible to create rows in HyperFormula, `false` otherwise.
   */
  onBeforeCreateRow(row, amount) {
    return this.hyperformula.isItPossibleToAddRows(this.sheetId, [row, amount]);
  }

  /**
   * `beforeCreateCol` hook callback.
   *
   * @private
   * @param {number} column Column index.
   * @param {number} amount An amount of created columns.
   * @returns {boolean} `true` if it is possible to create columns in HyperFormula, `false` otherwise.
   */
  onBeforeCreateCol(column, amount) {
    return this.hyperformula.isItPossibleToAddColumns(this.sheetId, [column, amount]);
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} amount An amount of removed rows.
   */
  onAfterRemoveRow(row, amount) {
    this.hyperformula.removeRows(this.sheetId, [row, amount]);
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @private
   * @param {number} column Column index.
   * @param {number} amount An amount of removed columns.
   */
  onAfterRemoveCol(column, amount) {
    this.hyperformula.removeColumns(this.sheetId, [column, amount]);
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} amount An amount of created rows.
   */
  onAfterCreateRow(row, amount) {
    this.hyperformula.addRows(this.sheetId, [row, amount]);
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {number} column Column index.
   * @param {number} amount An amount of created columns.
   */
  onAfterCreateCol(column, amount) {
    this.hyperformula.addColumns(this.sheetId, [column, amount]);
  }

  /**
   * `afterLoadData` hook callback.
   *
   * @private
   */
  onAfterLoadData() {
    if (this.isEnabled()) {

      // TODO: temporary solution for no `clearSheet` HF API method
      this.hyperformula.removeSheet(this.sheetName);
      this.sheetName = this.hyperformula.addSheet(this.settings.sheetName || void 0);
      this.sheetId = this.hyperformula.getSheetId(this.sheetName);
      //

      this.hyperformula.setCellContents({
        row: 0,
        col: 0,
        sheet: this.sheetId
      }, this.hot.getSourceDataArray());
    }
  }

  /**
   * `modifyRowData` hook callback. Replaces the value from HOT with the ones from HyperFormula.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @param {object} valueHolder Value holder as an object to change value by reference.
   * @param {string} ioMode IO operation (`get` or `set`).
   */
  onModifyData(row, column, valueHolder, ioMode) {
    const hfAddress = {
      row: this.hot.toVisualRow(row),
      col: column,
      sheet: this.sheetId
    };

    if (this.isEnabled()) {
      if (ioMode === 'get') {
        valueHolder.value = this.hyperformula.getCellValue(hfAddress);

        valueHolder.value = this.parseHFValue(hfAddress, valueHolder.value);

      } else if (ioMode === 'set') {
        this.hyperformula.setCellContents(hfAddress, valueHolder.value);
      }
    }
  }

  /**
   * `modifySourceData` hook callback. Replaces the value from HOT with the ones from HyperFormula for source data.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @param {object} valueHolder Value holder as an object to change value by reference.
   * @param {string} ioMode IO operation (`get` or `set`).
   */
  onModifySourceData(row, column, valueHolder, ioMode) {
    const hfAddress = {
      row: this.hot.toVisualRow(row),
      col: column,
      sheet: this.sheetId
    };

    if (this.isEnabled()) {
      const sheetDimensions = this.hyperformula.getSheetDimensions(this.sheetId);

      if (sheetDimensions.width !== 0 && sheetDimensions.height !== 0) {
        if (ioMode === 'get') {
          valueHolder.value = this.hyperformula.getCellFormula(hfAddress) || this.hyperformula.getCellValue(hfAddress); // TODO: optimize

        }
      }
    }
  }

  /**
   * `beforeColumnSort` hook callback.
   *
   * @private
   */
  onBeforeColumnSort() {
    this.currentSortOrderSequence = this.hot.rowIndexMapper.getNotSkippedIndexes();
  }

  /**
   * `afterColumnSort` hook callback.
   *
   * @private
   */
  onAfterColumnSort() {
    const HFmoveActionList = sequenceToMoveOperations(this.currentSortOrderSequence, this.hot.rowIndexMapper.getNotSkippedIndexes());

    this.hyperformula.batch(() => {
      HFmoveActionList.forEach((moveAction) => {
        // TODO: might be removed later, made to compensate the index differences between HOT and HF API
        const indexCompensation = (moveAction.baseIndex < moveAction.targetIndex ? 1 : 0);

        this.hyperformula.moveRows(this.sheetId, moveAction.baseIndex, 1, moveAction.targetIndex + indexCompensation);
      });
    });

    this.currentSortOrderSequence = this.hot.rowIndexMapper.getNotSkippedIndexes();
  }
}

registerPlugin('formulas', Formulas);

export default Formulas;
