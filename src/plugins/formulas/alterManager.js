import { mixin } from 'handsontable/helpers/object';
import localHooks from 'handsontable/mixins/localHooks';

import * as columnSorting from './alterOperation/columnSorting';
import * as insertColumn from './alterOperation/insertColumn';
import * as insertRow from './alterOperation/insertRow';
import * as removeColumn from './alterOperation/removeColumn';
import * as removeRow from './alterOperation/removeRow';

const operations = new Map();

registerOperation(columnSorting.OPERATION_NAME, columnSorting);
registerOperation(insertColumn.OPERATION_NAME, insertColumn);
registerOperation(insertRow.OPERATION_NAME, insertRow);
registerOperation(removeColumn.OPERATION_NAME, removeColumn);
registerOperation(removeRow.OPERATION_NAME, removeRow);

/**
 * Alter Manager is a service that is responsible for changing the formula expressions (especially cell coordinates)
 * based on specific alter operation applied into the table.
 *
 * For example, when a user adds a new row the algorithm that moves all the cells below the added row down by one row
 * should be triggered (eq: cell A5 become A6 etc).
 *
 * All alter operations are defined in the "alterOperation/" directory.
 *
 * @class AlterManager
 * @util
 */
class AlterManager {
  constructor(sheet) {
    /**
     * Instance of {@link Sheet}.
     *
     * @type {Sheet}
     */
    this.sheet = sheet;
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    this.hot = sheet.hot;
    /**
     * Instance of {@link DataProvider}.
     *
     * @type {DataProvider}
     */
    this.dataProvider = sheet.dataProvider;
    /**
     * Instance of {@link Matrix}.
     *
     * @type {Matrix}
     */
    this.matrix = sheet.matrix;
  }

  /**
   * Prepare to execute an alter algorithm. This preparation can be useful for collecting some variables and
   * states before specific algorithm will be executed.
   *
   * @param  {String} action One of the action defined in alterOperation.
   * @param  {*} args Arguments pass to alter operation.
   */
  prepareAlter(action, ...args) {
    if (!operations.has(action)) {
      throw Error(`Alter operation "${action}" not exist.`);
    }
    operations.get(action).prepare.apply(this, args);
  }

  /**
   * Trigger an alter algorithm and after executing code trigger local hook ("afterAlter").
   *
   * @param {String} action One of the action defined in alterOperation.
   * @param {*} args Arguments pass to alter operation.
   */
  triggerAlter(action, ...args) {
    if (!operations.has(action)) {
      throw Error(`Alter operation "${action}" not exist.`);
    }
    operations.get(action).operate.apply(this, args);
    this.runLocalHooks('afterAlter', ...args);
  }

  /**
   * Destroy class.
   */
  destroy() {
    this.sheet = null;
    this.hot = null;
    this.dataProvider = null;
    this.matrix = null;
  }
}

mixin(AlterManager, localHooks);

export default AlterManager;

const empty = () => {};

export function registerOperation(name, descriptor) {
  if (!operations.has(name)) {
    operations.set(name, {
      prepare: descriptor.prepare || empty,
      operate: descriptor.operate || empty,
    });
  }
}
