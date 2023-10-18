import { META_HEAD, ActionInfo } from './actionInfo';
import { normalizeRanges } from '../copyableRanges';
import { getDataByCoords, getHTMLByCoords} from '../../../utils/parseTable';

/**
 * Creates an object containing information about copy/cut action.
 *
 * @private
 */
export class CopyInfo extends ActionInfo {
  /**
   * Sanitized data of "text/html" type inside the clipboard.
   *
   * @type {string}
   */
  html;
  /**
   * Copied data stored as array of arrays.
   *
   * @type {string[][]}
   */
  data;
  /**
   * Copied cell ranges related to instance of Handsontable.
   *
   * @type {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>}
   */
  copyableRanges;
  /**
   * @param {Core} instance Handsontable instance (used only while copying data).
   * @param {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>} copyableRanges Cell
   * ranges related to instance of Handsontable (used only while copying data).
   */
  constructor(instance, copyableRanges) {
    super();

    const { rows, columns } = normalizeRanges(copyableRanges);

    this.html = [META_HEAD, getHTMLByCoords(instance, { rows, columns })].join('');
    this.data = getDataByCoords(instance, { rows, columns });
    this.copyableRanges = copyableRanges;
  }
}
