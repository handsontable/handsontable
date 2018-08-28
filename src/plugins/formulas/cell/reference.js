import { toLabel } from 'hot-formula-parser';
import BaseCell from './_base';

/**
 * Class which indicates formula expression precedents cells at specified cell
 * coordinates (CellValue). This object uses visual cell coordinates.
 *
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
      { index: this.row, isAbsolute: false },
      { index: this.column, isAbsolute: false }
    );
  }
}

export default CellReference;
