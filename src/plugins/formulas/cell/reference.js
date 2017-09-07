import {toLabel} from 'hot-formula-parser';
import BaseCell from './_base';

/**
 * @class CellReference
 * @util
 */
class CellReference extends BaseCell {
  /**
   * Stringify object.
   *
   * @returns {String}
   */
  toString() {
    return toLabel(
      {index: this.row, isAbsolute: false},
      {index: this.column, isAbsolute: false}
    );
  }
}

export default CellReference;
