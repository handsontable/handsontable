import {arrayEach} from 'handsontable/helpers/array';
import {mixin} from 'handsontable/helpers/object';
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

  prepareAlter(action, ...args) {
    if (!operations.has(action)) {
      throw Error(`Alter operation "${action}" not exist.`);
    }
    operations.get(action).prepare.apply(this, args);
  }

  /**
   * Trigger alter table action.
   *
   * @param {String} action One of action defined in alterOperation.
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
