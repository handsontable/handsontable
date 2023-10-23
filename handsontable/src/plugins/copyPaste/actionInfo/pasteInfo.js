import { ActionInfo } from './actionInfo';
import { getDataWithHeadersByConfig } from '../../../utils/parseTable';
import { parse } from '../../../3rdparty/SheetClip';
import {isDefined} from "../../../helpers/mixed";

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
  isTable() {
    return isDefined(this.html) && /(<table)|(<TABLE)/g.test(this.html);
  }

  /**
   * Checks whether pasted data is a Handsontable.
   *
   * @private
   * @returns {boolean}
   */
  isHandsontable() {
    return this.isTable() && /<meta (.*?)content="Handsontable"/.test(this.html);
  }

  /**
   * Gets source of the copied data.
   *
   * @returns {string}
   */
  getSource() {
    if (this.isHandsontable()) {
      return 'Handsontable';
    }

    if (this.isTable()) {
      return 'table';
    }

    return 'string';
  }
}
