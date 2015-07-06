
import {arrayEach, objectEach, rangeEach, requestAnimationFrame, cancelAnimationFrame} from './../../helpers.js';
import {addClass, removeClass} from './../../dom.js';
import BasePlugin from './../_base.js';
import {registerPlugin} from './../../plugins.js';
import {GhostTable} from './../../utils/ghostTable.js';
import {SamplesGenerator} from './../../utils/samplesGenerator.js';


/**
 * @class AutoRowSize
 * @plugin AutoRowSize
 */
class AutoRowSize extends BasePlugin {
  static get CALCULATION_STEP() {
    return 19;
  }

  /**
   * @param {Core} hotInstance Handsontable instance.
   */
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Cached rows heights.
     *
     * @type {Array}
     */
    this.heights = [];
    /**
     * Instance of GhostTable for rows and columns size calculations.
     *
     * @type {GhostTable}
     */
    this.ghostTable = new GhostTable(this.hot);
    /**
     * Instance of SamplesGenerator for generating samples necessary for rows height calculations.
     *
     * @type {SamplesGenerator}
     */
    this.samplesGenerator = new SamplesGenerator((row, col) => this.hot.getDataAtCell(row, col));
  }

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().autoRowSize !== false;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('beforeChange', (changes) => this.onBeforeChange(changes));
    this.addHook('beforeColumnMove', () => this.calculateAllRowsHeight());
    this.addHook('beforeColumnResize', () => this.calculateAllRowsHeight());
    this.addHook('beforeColumnSort', () => this.clearCache());
    this.addHook('beforeRender', (force) => this.onBeforeRender(force));
    this.addHook('beforeRowMove', (rowStart, rowEnd) => this.onBeforeRowMove(rowStart, rowEnd));
    this.addHook('beforeRowResize', (row, size, isDblClick) => this.onBeforeRowResize(row, size, isDblClick));
    this.addHook('modifyRowHeight', (height, row) => this.getRowHeight(row, height));
    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Calculate rows height.
   *
   * @param {Number|Object} rowRange Row range object.
   * @param {Number|Object} colRange Column range object.
   * @param {Boolean} [force=false] If `true` force calculate height even when value was cached earlier.
   */
  calculateRowsHeight(rowRange = {from: 0, to: this.hot.countRows() - 1}, colRange = {from: 0, to: this.hot.countCols() - 1}, force = false) {
    if (typeof rowRange === 'number') {
      rowRange = {from: rowRange, to: rowRange};
    }
    if (typeof colRange === 'number') {
      colRange = {from: colRange, to: colRange};
    }
    rangeEach(rowRange.from, rowRange.to, (row) => {
      // For rows we must calculate row height even when user had set height value manually.
      // We can shrink column but cannot shrink rows!
      if (force || this.heights[row] === void 0) {
        const samples = this.samplesGenerator.generateRowSamples(row, colRange);

        samples.forEach((sample, row) => {
          this.ghostTable.addRow(row, sample);
        });
      }
    });
    if (this.ghostTable.rows.length) {
      this.ghostTable.getHeights((row, height) => {
        this.heights[row] = height;
      });
      this.ghostTable.clean();
    }
  }

  /**
   * Calculate all rows height.
   *
   * @param {Object|Number} colRange Column range object.
   */
  calculateAllRowsHeight(colRange = {from: 0, to: this.hot.countCols() - 1}) {
    let current = 0;
    let length = this.hot.countRows() - 1;
    let timer = null;

    let loop = () => {
      // When hot was destroyed after calculating finished cancel frame
      if (!this.hot) {
        cancelAnimationFrame(timer);

        return;
      }
      this.calculateRowsHeight({from: current, to: Math.min(current + AutoRowSize.CALCULATION_STEP, length)}, colRange, true);
      current = current + AutoRowSize.CALCULATION_STEP + 1;

      if (current < length) {
        timer = requestAnimationFrame(loop);
      } else {
        if (timer !== null) {
          cancelAnimationFrame(timer);
        }
        // @TODO Should call once per render cycle, currently fired separately in different plugins
        this.hot.view.wt.wtOverlays.adjustElementsSize(true);
        // tmp
        if (this.hot.view.wt.wtOverlays.leftOverlay.needFullRender) {
          this.hot.view.wt.wtOverlays.leftOverlay.clone.draw();
        }
      }
    };
    if (current < length) {
      loop();
    }
  }

  /**
   * Get calculated row height.
   *
   * @param {Number} row Row index.
   * @param {Number} [defaultHeight] Default row height. It will be pick up if no calculated height found.
   * @returns {Number}
   */
  getRowHeight(row, defaultHeight = void 0) {
    let height = defaultHeight;

    if (this.heights[row] !== void 0 && this.heights[row] > (defaultHeight || 0)) {
      height = this.heights[row];
    }

    return height;
  }

  /**
   * Get first visible row.
   *
   * @returns {Number} Returns row index or -1 if table is not rendered.
   */
  getFirstVisibleRow() {
    const wot = this.hot.view.wt;

    if (wot.wtViewport.rowsVisibleCalculator) {
      return wot.wtTable.getFirstVisibleRow();
    }
    if (wot.wtViewport.rowsRenderCalculator) {
      return wot.wtTable.getFirstRenderedRow();
    }

    return -1;
  }

  /**
   * Get last visible row.
   *
   * @returns {Number} Returns row index or -1 if table is not rendered.
   */
  getLastVisibleRow() {
    const wot = this.hot.view.wt;

    if (wot.wtViewport.rowsVisibleCalculator) {
      return wot.wtTable.getLastVisibleRow();
    }
    if (wot.wtViewport.rowsRenderCalculator) {
      return wot.wtTable.getLastRenderedRow();
    }

    return -1;
  }

  /**
   * Clear cached heights.
   */
  clearCache() {
    this.heights.length = 0;
  }

  /**
   * Clear cache by range.
   *
   * @param {Object|Number} range Row range object.
   */
  clearCacheByRange(range) {
    if (typeof range === 'number') {
      range = {from: range, to: range};
    }
    rangeEach(Math.min(range.from, range.to), Math.max(range.from, range.to), (row) => {
      this.heights[row] = void 0;
    });
  }

  /**
   * On before render listener.
   *
   * @private
   */
  onBeforeRender() {
    let force = this.hot.renderCall;
    this.calculateRowsHeight({from: this.getFirstVisibleRow(), to: this.getLastVisibleRow()}, void 0, force);
  }

  /**
   * On before row move listener.
   *
   * @private
   * @param {Number} from Row index where was grabbed.
   * @param {Number} to Destination row index.
   */
  onBeforeRowMove(from, to) {
    this.clearCacheByRange({from, to});
  }

  /**
   * On before row resize listener.
   *
   * @param {Number} row
   * @param {Number} size
   * @param {Boolean} isDblClick
   * @returns {Number}
   */
  onBeforeRowResize(row, size, isDblClick) {
    if (isDblClick) {
      this.calculateRowsHeight(row, void 0, true);
      size = this.getRowHeight(row);
    }

    return size;
  }

  /**
   * On after load data listener.
   */
  onAfterLoadData() {
    setTimeout(() => {
      if (this.hot) {
        this.calculateAllRowsHeight();
      }
    }, 0);
  }

  /**
   * On before change listener.
   *
   * @private
   * @param {Array} changes
   */
  onBeforeChange(changes) {
    arrayEach(changes, (data) => {
      this.heights[data[0]] = void 0;
    });
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.ghostTable.clean();
    super.destroy();
  }
}

export {AutoRowSize};

registerPlugin('autoRowSize', AutoRowSize);
