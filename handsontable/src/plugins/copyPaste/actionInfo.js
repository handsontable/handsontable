import { normalizeRanges } from './copyableRanges';
import { isDefined } from '../../helpers/mixed';
import {
  getDataByCoords,
  getDataWithHeadersByConfig,
  getHTMLByCoords,
  getHTMLFromConfig,
  htmlToGridSettings,
} from '../../utils/parseTable';
import { parse } from '../../3rdparty/SheetClip';

const META_HEAD = [
  '<meta name="generator" content="Handsontable"/>',
  '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
].join('');

/**
 * Creates an object containing information about performed action: copy, cut (performing also copying) or paste action.
 *
 * @private
 */
export class ActionInfo {
  /**
   * Cell ranges related to instance of Handsontable (used only while copying data).
   *
   * @type {CellRange[]}
   */
  #copyableRanges;
  /**
   * Handsontable instance (used only while copying data).
   *
   * @type {Core}
   */
  #instance;
  /**
   * Sanitized data of "text/html" type inside the clipboard.
   *
   * @type {string}
   */
  #html;
  /**
   * Copied data stored as array of arrays.
   *
   * @type {string[][]}
   */
  #data;
  /**
   * @param {object} config Configuration object for the action.
   * @param {'copy'|'paste'} config.type Type of action - copying (and cutting) or pasting the data.
   * @param {string} config.html Sanitized data of "text/html" type inside the clipboard.
   * @param {Core} [config.instance] Handsontable instance (used only while copying data).
   * @param {CellRange[]} [config.copyableRanges] Cell ranges related to instance of Handsontable (used only while copying data).
   */
  constructor({ type, html, instance, copyableRanges }) {
    if (type === 'copy') {
      this.#instance = instance;
      this.#copyableRanges = copyableRanges;

      const { rows, columns } = normalizeRanges(this.#copyableRanges);

      this.#html = [META_HEAD, getHTMLByCoords(this.#instance, { rows, columns })].join('');
      this.#data = getDataByCoords(this.#instance, { rows, columns });

    } else {
      this.#html = html;

      if (this.isTable()) {
        this.#data = getDataWithHeadersByConfig({
          ...this.getGridSettings(),
          ignoredRows: [],
          ignoredColumns: [],
        });

      } else {
        this.#data = parse(this.#html);
      }
    }
  }

  /**
   * Checks whether copied data is an array.
   *
   * @returns {boolean}
   */
  isTable() {
    return isDefined(this.#html) && /(<table)|(<TABLE)/g.test(this.#html);
  }

  /**
   * Checks whether copied data is a Handsontable.
   *
   * @returns {boolean}
   */
  isHandsontable() {
    return this.isTable() && this.#html.includes(META_HEAD);
  }

  /**
   * Gets sanitized data of "text/html" type inside the clipboard.
   *
   * @returns {string}
   */
  getHTML() {
    return this.#html;
  }

  /**
   * Gets copied data stored as array of arrays.
   *
   * @returns {string[][]}
   */
  getData() {
    return this.#data;
  }

  /**
   * Gets grid settings for copied data.
   *
   * @returns {object} Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells` keys and
   * the corresponding values.
   */
  getGridSettings() {
    return htmlToGridSettings(this.#html);
  }

  /**
   * Overwrite stored data basing on handled configuration.
   *
   * @private
   * @param {object} config Configuration.
   */
  overWriteInfo(config) {
    this.#html = [this.isHandsontable() ? META_HEAD : '', getHTMLFromConfig(config)].join('');
    this.#data = getDataWithHeadersByConfig(config);
  }

  /**
   * Removes rows/columns from the copied/pasted dataset.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable. Please keep in mind that headers
   * are handled separately from cells and they are recognised using negative indexes.
   *
   * @param {object} config Configuration object describing removed rows/columns.
   * @param {number[]} [config.rows] List of row indexes which should be excluded when creating copy/cut/paste data.
   * @param {number[]} [config.columns] List of column indexes which should be excluded when creating copy/cut/paste data.
   */
  remove({ rows, columns }) {
    const config = {
      ...this.getGridSettings(),
      ignoredRows: rows || [],
      ignoredColumns: columns || [],
    };

    this.overWriteInfo(config);
  }

  /**
   * Change headers or cells in the copied/pasted dataset.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable. Please keep in mind that headers
   * are handled separately from cells and they are recognised using negative indexes.
   *
   * @param {object[]} changes Configuration object describing changed cells.
   * @param {number} changes.row Row index of cell which should be changed.
   * @param {number} changes.column Column index of cell which should be changed.
   * @param {string} changes.value Value for particular indexes.
   */
  change(changes) {
    const config = this.getGridSettings();
    const { data, nestedHeaders, colHeaders } = config;

    changes.forEach((singleChange) => {
      const { row, column, value } = singleChange;

      if (row < 0 && Array.isArray(nestedHeaders)) {
        const headerRelative = row + nestedHeaders.length;

        if (Array.isArray(nestedHeaders[headerRelative]) && isDefined(nestedHeaders[headerRelative][column])) {
          nestedHeaders[headerRelative][column] = value;
        }

      } else if (row < 0 && Array.isArray(colHeaders)) {
        const headerRelative = row + colHeaders.length;

        if (Array.isArray(colHeaders[headerRelative]) && isDefined(colHeaders[headerRelative][column])) {
          colHeaders[headerRelative][column] = value;
        }

      } else if (row >= 0 && Array.isArray(data) && Array.isArray(data[row]) && isDefined(data[row][column])) {
        data[row][column] = value;
      }
    });

    this.overWriteInfo({
      ...config,
      ignoredRows: [],
      ignoredColumns: [],
    });
  }
}
