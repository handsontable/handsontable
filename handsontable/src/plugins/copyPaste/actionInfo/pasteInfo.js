import { ActionInfo } from './actionInfo';
import { getDataWithHeadersByConfig } from '../../../utils/parseTable';
import { parse } from '../../../3rdparty/SheetClip';

/**
 * Creates an object containing information about paste action.
 *
 * @private
 */
export class PasteInfo extends ActionInfo {
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
   * @param {string} data Data of "text/plain" type inside the clipboard.
   * @param {string} html Sanitized data of "text/html" type inside the clipboard.
   */
  constructor(data, html) {
    super();
    this.html = html;

    if (this.isTable()) {
      this.data = getDataWithHeadersByConfig(this.getGridSettings());

    } else {
      this.data = parse(data);
    }
  }
}
