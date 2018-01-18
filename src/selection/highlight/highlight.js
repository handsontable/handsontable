import {createHighlight} from './types';
import {arrayEach} from './../../helpers/array';

class Highlight {
  constructor(options) {
    /**
     * Options passed to the Walkontable Selection class.
     *
     * @type {Object}
     */
    this.options = options;
    /**
     * The property which describes which layer level of the visual selection will be modified.
     * This option is valid only for `area` and `header` highlight types which occurs multiple times on
     * the table (as a non-consecutive selection).
     *
     * An order of the layers is the same as the order of added new non-consecutive selections.
     *
     * @type {Number}
     * @default 0
     */
    this.layerLevel = 0;
    /**
     * `cell` highlight object which describes attributes for the currently selected cell.
     * It can only occur only once on the table.
     *
     * @type {Selection}
     */
    this.cell = createHighlight('cell', options);
    /**
     * `fill` highlight object which describes attributes for the borders for autofill functionality.
     * It can only occur only once on the table.
     *
     * @type {Selection}
     */
    this.fill = createHighlight('fill', options);
    /**
     * Collection of the `area` highlights. That objects describes attributes for the borders and selection of
     * the multiple selected cells. It can occur multiple times on the table.
     *
     * @type {Map.<number, Selection>}
     */
    this.areas = new Map();
    /**
     * Collection of the `header` highlights. That objects describes attributes for the selection of
     * the multiple selected rows and columns in the table header. It can occur multiple times on the table.
     *
     * @type {Map.<number, Selection>}
     */
    this.headers = new Map();
    /**
     * The temporary property, holder for borders added through CustomBorders plugin.
     *
     * @type {Selection[]}
     */
    this.borders = [];
  }

  /**
   * Set a new layer level to make access to the desire `area` and `header` highlights.
   *
   * @param {Number} [level=0] Layer level to use.
   */
  useLayerLevel(level = 0) {
    this.layerLevel = level;
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the currently selected/edited cell.
   *
   * @return {Selection}
   */
  getCell() {
    return this.cell;
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the autofill functionality.
   *
   * @return {Selection}
   */
  getFill() {
    return this.fill;
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the multiple selected cells.
   *
   * @return {Selection}
   */
  getArea() {
    let area;
    const layerLevel = this.layerLevel;

    if (this.areas.has(layerLevel)) {
      area = this.areas.get(layerLevel);
    } else {
      area = createHighlight('area', this.options);

      this.areas.set(layerLevel, area);
    }

    return area;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the visual highlight of the cells.
   *
   * @return {Selection[]}
   */
  getAreas() {
    return [...this.areas.values()];
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the multiple selected header cells.
   *
   * @return {Selection}
   */
  getHeader() {
    let header;
    const layerLevel = this.layerLevel;

    if (this.headers.has(layerLevel)) {
      header = this.headers.get(layerLevel);
    } else {
      header = createHighlight('header', this.options);

      this.headers.set(layerLevel, header);
    }

    return header;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the visual highlight of the header cells.
   *
   * @return {Selection[]}
   */
  getHeaders() {
    return [...this.headers.values()];
  }

  /**
   * Perform cleaning visual highlights of the whole table.
   *
   * @return {[type]}
   */
  clear() {
    this.cell.clear();
    this.fill.clear();

    arrayEach(Array.from(this.areas.entries()), ([, area]) => {
      area.clear();
    });
    arrayEach(Array.from(this.headers.entries()), ([, header]) => {
      header.clear();
    });
  }

  /**
   * This object can be iterate over using `for of` syntax or using internal `arrayEach` helper.
   */
  [Symbol.iterator]() {
    return [this.cell, ...this.areas.values(), ...this.headers.values(), this.fill, ...this.borders][Symbol.iterator]();
  }
}

export default Highlight;
