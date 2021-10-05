import { createHighlight } from './types';
import {
  ACTIVE_HEADER_TYPE,
  AREA_TYPE,
  CELL_TYPE,
  CUSTOM_SELECTION_TYPE,
  FILL_TYPE,
  HEADER_TYPE,
} from './constants';
import { arrayEach } from './../../helpers/array';

/**
 * Highlight class responsible for managing Walkontable Selection classes.
 *
 * With Highlight object you can manipulate four different highlight types:
 *  - `cell` can be added only to a single cell at a time and it defines currently selected cell;
 *  - `fill` can occur only once and its highlight defines selection of autofill functionality (managed by the plugin with the same name);
 *  - `areas` can be added to multiple cells at a time. This type highlights selected cell or multiple cells.
 *    The multiple cells have to be defined as an uninterrupted order (regular shape). Otherwise, the new layer of
 *    that type should be created to manage not-consecutive selection;
 *  - `header` can occur multiple times. This type is designed to highlight only headers. Like `area` type it
 *    can appear with multiple highlights (accessed under different level layers).
 *
 * @class Highlight
 * @util
 */
class Highlight {
  constructor(options) {
    /**
     * Options consumed by Highlight class and Walkontable Selection classes.
     *
     * @type {object}
     */
    this.options = options;
    /**
     * The property which describes which layer level of the visual selection will be modified.
     * This option is valid only for `area` and `header` highlight types which occurs multiple times on
     * the table (as a non-consecutive selection).
     *
     * An order of the layers is the same as the order of added new non-consecutive selections.
     *
     * @type {number}
     * @default 0
     */
    this.layerLevel = 0;
    /**
     * `cell` highlight object which describes attributes for the currently selected cell.
     * It can only occur only once on the table.
     *
     * @type {Selection}
     */
    this.cell = createHighlight(CELL_TYPE, options);
    /**
     * `fill` highlight object which describes attributes for the borders for autofill functionality.
     * It can only occur only once on the table.
     *
     * @type {Selection}
     */
    this.fill = createHighlight(FILL_TYPE, options);
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
     * Collection of the `active-header` highlights. That objects describes attributes for the selection of
     * the multiple selected rows and columns in the table header. The table headers which have selected all items in
     * a row will be marked as `active-header`.
     *
     * @type {Map.<number, Selection>}
     */
    this.activeHeaders = new Map();
    /**
     * Collection of the `custom-selection`, holder for example borders added through CustomBorders plugin.
     *
     * @type {Selection[]}
     */
    this.customSelections = [];
  }

  /**
   * Check if highlight cell rendering is disabled for specified highlight type.
   *
   * @param {string} highlightType Highlight type. Possible values are: `cell`, `area`, `fill` or `header`.
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   * @returns {boolean}
   */
  isEnabledFor(highlightType, coords) {
    let type = highlightType;

    // Legacy compatibility.
    if (highlightType === CELL_TYPE) {
      type = 'current'; // One from settings for `disableVisualSelection` up to Handsontable 0.36/Handsontable Pro 1.16.0.
    }

    let disableHighlight = this.options.disabledCellSelection(coords.row, coords.col);

    if (typeof disableHighlight === 'string') {
      disableHighlight = [disableHighlight];
    }

    return disableHighlight === false || Array.isArray(disableHighlight) && !disableHighlight.includes(type);
  }

  /**
   * Set a new layer level to make access to the desire `area` and `header` highlights.
   *
   * @param {number} [level=0] Layer level to use.
   * @returns {Highlight}
   */
  useLayerLevel(level = 0) {
    this.layerLevel = level;

    return this;
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the currently selected/edited cell.
   *
   * @returns {Selection}
   */
  getCell() {
    return this.cell;
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the autofill functionality.
   *
   * @returns {Selection}
   */
  getFill() {
    return this.fill;
  }

  /**
   * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
   * of the multiple selected cells.
   *
   * @returns {Selection}
   */
  createOrGetArea() {
    const layerLevel = this.layerLevel;
    let area;

    if (this.areas.has(layerLevel)) {
      area = this.areas.get(layerLevel);
    } else {
      area = createHighlight(AREA_TYPE, { layerLevel, ...this.options });

      this.areas.set(layerLevel, area);
    }

    return area;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the visual highlight of the cells.
   *
   * @returns {Selection[]}
   */
  getAreas() {
    return [...this.areas.values()];
  }

  /**
   * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
   * of the multiple selected header cells.
   *
   * @returns {Selection}
   */
  createOrGetHeader() {
    const layerLevel = this.layerLevel;
    let header;

    if (this.headers.has(layerLevel)) {
      header = this.headers.get(layerLevel);
    } else {
      header = createHighlight(HEADER_TYPE, { ...this.options });

      this.headers.set(layerLevel, header);
    }

    return header;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the visual highlight of the headers.
   *
   * @returns {Selection[]}
   */
  getHeaders() {
    return [...this.headers.values()];
  }

  /**
   * Get or create (if not exist in the cache) Walkontable Selection instance created for controlling highlight
   * of the multiple selected active header cells.
   *
   * @returns {Selection}
   */
  createOrGetActiveHeader() {
    const layerLevel = this.layerLevel;
    let header;

    if (this.activeHeaders.has(layerLevel)) {
      header = this.activeHeaders.get(layerLevel);
    } else {
      header = createHighlight(ACTIVE_HEADER_TYPE, { ...this.options });

      this.activeHeaders.set(layerLevel, header);
    }

    return header;
  }

  /**
   * Get all Walkontable Selection instances which describes the state of the visual highlight of the active headers.
   *
   * @returns {Selection[]}
   */
  getActiveHeaders() {
    return [...this.activeHeaders.values()];
  }

  /**
   * Get Walkontable Selection instance created for controlling highlight of the custom selection functionality.
   *
   * @returns {Selection}
   */
  getCustomSelections() {
    return [...this.customSelections.values()];
  }

  /**
   * Add selection to the custom selection instance. The new selection are added to the end of the selection collection.
   *
   * @param {object} selectionInstance The selection instance.
   */
  addCustomSelection(selectionInstance) {
    this.customSelections.push(createHighlight(CUSTOM_SELECTION_TYPE, { ...this.options, ...selectionInstance }));
  }

  /**
   * Perform cleaning visual highlights for the whole table.
   */
  clear() {
    this.cell.clear();
    this.fill.clear();

    arrayEach(this.areas.values(), highlight => void highlight.clear());
    arrayEach(this.headers.values(), highlight => void highlight.clear());
    arrayEach(this.activeHeaders.values(), highlight => void highlight.clear());
  }

  /**
   * This object can be iterate over using `for of` syntax or using internal `arrayEach` helper.
   *
   * @returns {Selection[]}
   */
  [Symbol.iterator]() {
    return [
      this.cell,
      this.fill,
      ...this.areas.values(),
      ...this.headers.values(),
      ...this.activeHeaders.values(),
      ...this.customSelections,
    ][Symbol.iterator]();
  }
}

export default Highlight;
