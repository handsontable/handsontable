import { ClipboardData } from './clipboardData';
import { getDataWithHeadersByConfig } from '../../../utils/parseTable';
import { parse } from '../../../3rdparty/SheetClip';
import { isDefined } from '../../../helpers/mixed';

/**
 * Creates an object containing information about paste action.
 *
 * @private
 */
export class PasteClipboardData extends ClipboardData {
  /**
   * Sanitized data of "text/html" type inside the clipboard.
   *
   * @private
   * @type {string}
   */
  html;
  /**
   * Copied data stored as array of arrays.
   *
   * @private
   * @type {string[][]}
   */
  data;
  /**
   * @param {string} data Data of "text/plain" type inside the clipboard.
   * @param {string} html Sanitized data of "text/html" type inside the clipboard.
   */
  constructor(data, html) {
    super();
    this.html = html;

    if (this.isSerializedTable()) {
      this.data = getDataWithHeadersByConfig(this.getMetaInfo());

    } else {
      this.data = parse(data);
    }
  }

  /**
   * Checks whether pasted data is an array.
   *
   * @private
   * @returns {boolean}
   */
  isSerializedTable() {
    return isDefined(this.html) && /(<table)|(<TABLE)/g.test(this.html);
  }

  /**
   * Checks whether pasted data is a Handsontable.
   *
   * @private
   * @returns {boolean}
   */
  isSerializedHandsontable() {
    return this.isSerializedTable() && /<meta (.*?)content="Handsontable"/.test(this.html);
  }

  /**
   * Gets type of the copied data.
   *
   * @returns {string}
   */
  getType() {
    if (this.isSerializedHandsontable()) {
      return 'handsontable';
    }

    if (this.isSerializedTable()) {
      return 'table';
    }

    return 'string';
  }
}
