import {addClass, removeClass} from 'handsontable/helpers/dom/element';
import {objectEach, deepClone, extend} from 'handsontable/helpers/object';
import {createEmptySpreadsheetData} from 'handsontable/helpers/data';
import {registerPlugin} from 'handsontable/plugins';
import BasePlugin from 'handsontable/plugins/_base';
import DateCalculator from './dateCalculator';
import GanttChartDataFeed from './ganttChartDataFeed';
import {DEC_LENGTH, WEEK_LENGTH} from './utils';

import './ganttChart.css';

/**
 * @plugin GanttChart
 * @pro
 * @experimental
 * @dependencies CollapsibleColumns
 *
 * @description
 * GanttChart plugin enables a possibility to create a Gantt chart using a Handsontable instance.
 * In this case, the whole table becomes read-only.
 *
 * @example
 * ```js
 * ganttChart: {
 *     dataSource: data,
 *     firstWeekDay: 'monday', // sets the first day of the week to either 'monday' or 'sunday'
 *     startYear: 2015 // sets the displayed year to the provided value
 *     weekHeaderGenerator: function(start, end) { return start + ' - ' + end; } // sets the label on the week column headers (optional). The `start` and `end` arguments are numbers representing the beginning and end day of the week.
 *   }
 *
 * // Where data can be either an data object or an object containing information about another Handsontable instance, which
 * // would feed the chart-enabled instance with data.
 * // For example:
 *
 * // Handsontable-binding information
 * var data = {
 *   instance: source, // reference to another Handsontable instance
 *   startDateColumn: 4, // index of a column, which contains information about start dates of data ranges
 *   endDateColumn: 5, // index of a column, which contains information about end dates of data ranges
 *   additionalData: { // information about additional data passed to the chart, in this example example:
 *     label: 0, // labels are stored in the first column
 *     quantity: 1 // quantity information is stored in the second column
 *   },
 *   allowSplitWeeks: true, // If set to `true` (default), will allow splitting week columns between months. If not, plugin will generate "mixed" months, like "Jan/Feb"
 *   asyncUpdates: true // if set to true, the updates from the source instance with be asynchronous. Defaults to false.
 * }
 *
 * // Data object
 * var data = [
 *   {
 *     additionalData: {label: 'Example label.', quantity: 'Four packs.'},
 *     startDate: '1/5/2015',
 *     endDate: '1/20/2015'
 *   },
 *   {
 *     additionalData: {label: 'Another label.', quantity: 'One pack.'},
 *     startDate: '1/11/2015',
 *     endDate: '1/29/2015'
 *   }
 * ];
 * ```
 */
class GanttChart extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Cached plugin settings.
     *
     * @type {Object}
     */
    this.settings = {};
    /**
     * Date Calculator object.
     *
     * @type {Object}
     */
    this.dateCalculator = null;
    /**
     * Currently loaded year.
     *
     * @type {Number}
     */
    this.currentYear = null;
    /**
     * List of months and their corresponding day counts.
     *
     * @type {Array}
     */
    this.monthList = [];
    /**
     * Array of data for the month headers.
     *
     * @type {Array}
     */
    this.monthHeadersArray = [];
    /**
     * Array of data for the week headers.
     *
     * @type {Array}
     */
    this.weekHeadersArray = [];
    /**
     * Object containing the currently created range bars, along with their corresponding parameters.
     *
     * @type {Object}
     */
    this.rangeBars = {};
    /**
     * Object containing the currently created ranges with coordinates to their range bars.
     *
     * @type {Object}
     */
    this.rangeList = {};
    /**
     * Reference to the Nested Headers plugin.
     *
     * @type {Object}
     */
    this.nestedHeadersPlugin = null;

    /**
     * Object containing properties of the source Handsontable instance (the data source).
     *
     * @type {Object}
     */
    this.hotSource = null;
    /**
     * Number of week 'blocks' in the nested headers.
     *
     * @type {Number}
     */
    this.overallWeekSectionCount = null;
    /**
     * Initial instance settings - used to rollback the gantt-specific settings during the disabling of the plugin.
     *
     * @type {Object}
     */
    this.initialSettings = null;
    /**
     * Data feed controller for this plugin.
     *
     * @type {Object}
     */
    this.dataFeed = null;
    /**
     * Color information set after applying colors to the chart.
     *
     * @type {Object}
     */
    this.colorData = {};
    /**
     * Metadata of the range bars, used to re-apply meta after updating HOT settings.
     *
     * @type {Object}
     */
    this.rangeBarMeta = Object.create(null);
  }

  /**
   * Check if the dependencies are met, if not, throws a warning.
   */
  checkDependencies() {
    if (!this.hot.getSettings().colHeaders) {
      console.warn('You need to enable the colHeaders property in your Gantt Chart Handsontable in order for it to work properly.');
    }
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled() {
    return !!this.hot.getSettings().ganttChart;
  }

  /**
   * Enable the plugin
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.checkDependencies();

    this.parseSettings();

    this.currentYear = this.settings.startYear || new Date().getFullYear();

    this.dateCalculator = new DateCalculator(this.currentYear, this.settings.allowSplitWeeks);
    this.dateCalculator.setFirstWeekDay(this.settings.firstWeekDay);

    this.monthList = this.dateCalculator.getMonthList();
    this.monthHeadersArray = this.generateMonthHeaders();
    this.weekHeadersArray = this.generateWeekHeaders();

    this.overallWeekSectionCount = this.dateCalculator.countWeekSections();

    this.assignGanttSettings();

    if (this.nestedHeadersPlugin) {
      this.applyDataSource();

      if (this.colorData) {
        this.setRangeBarColors(this.colorData);
      }
    }

    this.addHook('afterInit', () => this.onAfterInit());

    addClass(this.hot.rootElement, 'ganttChart');

    super.enablePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    if (this.internalUpdateSettings) {
      return;
    }

    if (this.dataFeed && this.dataFeed.hotSource) {
      this.dataFeed.removeSourceHotHooks(this.dataFeed.hotSource);
    }

    this.settings = {};
    this.dataFeed = {};
    this.currentYear = null;
    this.monthList = [];
    this.rangeBars = {};
    this.rangeList = {};
    this.rangeBarMeta = {};
    this.hotSource = null;

    this.deassignGanttSettings();

    this.hot.getPlugin('collapsibleColumns').disablePlugin();
    this.hot.getPlugin('nestedHeaders').disablePlugin();

    removeClass(this.hot.rootElement, 'ganttChart');

    super.disablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Parse the plugin settings.
   */
  parseSettings() {
    this.settings = this.hot.getSettings().ganttChart;

    if (typeof this.settings === 'boolean') {
      this.settings = {};
    }

    if (!this.settings.firstWeekDay) {
      this.settings.firstWeekDay = 'monday';
    }

    if (this.settings.allowSplitWeeks === void 0) {
      this.settings.allowSplitWeeks = true;
    }

    if (typeof this.settings.weekHeaderGenerator !== 'function') {
      this.settings.weekHeaderGenerator = null;
    }
  }

  /**
   * Apply the data source provided in the plugin settings.
   *
   * @private
   */
  applyDataSource() {
    if (this.settings.dataSource) {
      let source = this.settings.dataSource;

      if (source.instance) {
        this.loadData(source.instance, source.startDateColumn, source.endDateColumn, source.additionalData, source.asyncUpdates);
      } else {
        this.loadData(source);
      }
    }
  }

  /**
   * Load chart data to the Handsontable instance.
   *
   * @private
   * @param {Array|Object} data Array of objects containing the range data OR another Handsontable instance, to be used as the data feed
   * @param {Number} [startDateColumn] Index of the start date column (Needed only if the data argument is a HOT instance).
   * @param {Number} [endDateColumn] Index of the end date column (Needed only if the data argument is a HOT instance).
   * @param {Object} [additionalData] Object containing additional data labels and their corresponding column indexes (Needed only if the data argument is a HOT instance).
   *
   */
  loadData(data, startDateColumn, endDateColumn, additionalData, asyncUpdates) {
    if (data.length > 1) {
      this.hot.alter('insert_row', 0, data.length - 1, `${this.pluginName}.loadData`);
    }

    this.dataFeed = new GanttChartDataFeed(this.hot, data, startDateColumn, endDateColumn, additionalData, asyncUpdates);

    this.hot.render();
  }

  /**
   * Clear the range bars list.
   *
   * @private
   */
  clearRangeBars() {
    this.rangeBars = {};
  }

  /**
   * Clear the range list.
   *
   * @private
   */
  clearRangeList() {
    this.rangeList = {};
  }

  /**
   * Get a range bar coordinates by the provided row.
   *
   * @param {Number} row Range bar's row.
   * @returns {Object}
   */
  getRangeBarCoordinates(row) {
    return this.rangeList[row];
  }

  /**
   * Generate headers for the year structure.
   *
   * @private
   * @param {String} type Granulation type ('months'/'weeks'/'days')
   */
  generateHeaderSet(type) {
    const weekHeaderGenerator = this.settings.weekHeaderGenerator;
    let headers = [];

    objectEach(this.monthList, (month, index) => {
      let areDaysBeforeFullWeeks = month.daysBeforeFullWeeks > 0 ? 1 : 0;
      let areDaysAfterFullWeeks = month.daysAfterFullWeeks > 0 ? 1 : 0;
      let headerCount = month.fullWeeks + (this.settings.allowSplitWeeks ? areDaysBeforeFullWeeks + areDaysAfterFullWeeks : 0);
      let monthNumber = parseInt(index, 10);
      let allowSplitWeeks = this.settings.allowSplitWeeks;
      let headerLabel = '';


      if (type === 'months') {
        headers.push({
          label: month.name,
          colspan: headerCount
        });

      } else if (type === 'weeks') {

        for (let i = 0; i < headerCount; i++) {
          let start = null;
          let end = null;

          // Mixed month's only column
          if (!allowSplitWeeks && month.fullWeeks === 1) {
            [start, end] = this.getWeekColumnRange(month, monthNumber, i, true);

            // Standard week column
          } else {
            [start, end] = this.getWeekColumnRange(month, monthNumber, i);
          }

          if (start === end) {
            headerLabel = start;

          } else {
            headerLabel = `${start} -  ${end}`;
          }

          headers.push(weekHeaderGenerator ? weekHeaderGenerator.call(this, start, end) : headerLabel);

          this.dateCalculator.addDaysToCache(monthNumber, headers.length - 1, start, end);
        }
      }
    });

    return headers;
  }

  /**
   * Get the week column range.
   *
   * @private
   * @param {Object} monthObject The month object.
   * @param {Number} monthNumber Index of the month.
   * @param {Number} headerIndex Index of the header.
   * @param {Boolean} mixedMonth `true` if the header is the single header of a mixed month.
   * @returns {Array}
   */
  getWeekColumnRange(monthObject, monthNumber, headerIndex, mixedMonth) {
    const allowSplitWeeks = this.settings.allowSplitWeeks;
    const areDaysBeforeFullWeeks = monthObject.daysBeforeFullWeeks > 0 ? 1 : 0;
    const areDaysAfterFullWeeks = monthObject.daysAfterFullWeeks > 0 ? 1 : 0;
    let headerCount = monthObject.fullWeeks + (this.settings.allowSplitWeeks ? areDaysBeforeFullWeeks + areDaysAfterFullWeeks : 0);

    let start = null;
    let end = null;

    if (mixedMonth) {
      if (monthNumber === 0) {
        end = this.monthList[monthNumber + 1].daysBeforeFullWeeks;
        start = DEC_LENGTH - (WEEK_LENGTH - end) + 1;

      } else if (monthNumber === this.monthList.length - 1) {
        end = WEEK_LENGTH - this.monthList[monthNumber - 1].daysAfterFullWeeks;
        start = this.monthList[monthNumber - 1].days - this.monthList[monthNumber - 1].daysAfterFullWeeks + 1;

      } else {
        end = this.monthList[monthNumber + 1].daysBeforeFullWeeks;
        start = this.monthList[monthNumber - 1].days - (WEEK_LENGTH - end) + 1;
      }

    } else if (allowSplitWeeks && areDaysBeforeFullWeeks && headerIndex === 0) {
      start = headerIndex + 1;
      end = monthObject.daysBeforeFullWeeks;

    } else if (allowSplitWeeks && areDaysAfterFullWeeks && headerIndex === headerCount - 1) {
      start = monthObject.days - monthObject.daysAfterFullWeeks + 1;
      end = monthObject.days;

    } else {
      start = null;
      if (allowSplitWeeks) {
        start = monthObject.daysBeforeFullWeeks + ((headerIndex - areDaysBeforeFullWeeks) * WEEK_LENGTH) + 1;
      } else {
        start = monthObject.daysBeforeFullWeeks + (headerIndex * WEEK_LENGTH) + 1;
      }
      end = start + WEEK_LENGTH - 1;
    }

    return [start, end];
  }

  /**
   * Generate the month header structure.
   *
   * @private
   */
  generateMonthHeaders() {
    return this.generateHeaderSet('months');
  }

  /**
   * Generate the week header structure.
   *
   * @private
   */
  generateWeekHeaders() {
    return this.generateHeaderSet('weeks');
  }

  /**
   * Generate the day header structure.
   *
   * @private
   */
  generateDayHeaders() {
    return this.generateHeaderSet('days');
  }

  /**
   * Assign the settings needed for the Gantt Chart plugin into the Handsontable instance.
   *
   * @private
   */
  assignGanttSettings() {
    this.initialSettings = deepClone(this.hot.getSettings());

    let additionalSettings = {
      data: createEmptySpreadsheetData(1, this.overallWeekSectionCount),
      readOnly: true,
      renderer: (instance, TD, row, col, prop, value, cellProperties) =>
        this.uniformBackgroundRenderer(instance, TD, row, col, prop, value, cellProperties),
      colWidths: 60,
      hiddenColumns: true,
      nestedHeaders: [
        this.monthHeadersArray.slice(),
        this.weekHeadersArray.slice()
      ],
      collapsibleColumns: true,
      columnSorting: false
    };

    this.internalUpdateSettings = true;
    this.hot.updateSettings(additionalSettings);
    this.internalUpdateSettings = void 0;
  }

  /**
   * Deassign the Gantt Chart plugin settings (revert to initial settings).
   *
   * @private
   */
  deassignGanttSettings() {
    this.internalUpdateSettings = true;

    if (this.initialSettings) {
      this.hot.updateSettings(this.initialSettings);
    }

    this.internalUpdateSettings = void 0;
  }

  /**
   * Add rangebar meta data to the cache.
   *
   * @param {Number} row
   * @param {Number} col
   * @param {String} key
   * @param {String|Number|Object|Array} value
   */
  cacheRangeBarMeta(row, col, key, value) {
    if (!this.rangeBarMeta[row]) {
      this.rangeBarMeta[row] = {};
    }

    if (!this.rangeBarMeta[row][col]) {
      this.rangeBarMeta[row][col] = {};
    }

    this.rangeBarMeta[row][col][key] = value;
  }

  /**
   * Apply the cached cell meta.
   */
  applyRangeBarMetaCache() {
    objectEach(this.rangeBarMeta, (rowArr, row) => {
      objectEach(rowArr, (cell, col) => {
        objectEach(cell, (value, key) => {
          this.hot.setCellMeta(row, col, key, value);
        });
      });
    });
  }

  /**
   * Create a new range bar.
   *
   * @param {Number} row Row index.
   * @param {Date|String} startDate Start date object/string.
   * @param {Date|String} endDate End date object/string.
   * @param {Object} additionalData Additional range data.
   * @returns {Array|Boolean} Array of the bar's row and column.
   */
  addRangeBar(row, startDate, endDate, additionalData) {
    let startDateColumn = this.dateCalculator.dateToColumn(startDate);
    let endDateColumn = this.dateCalculator.dateToColumn(endDate);

    if (!this.dateCalculator.isValidRangeBarData(startDate, endDate) || startDateColumn == null || endDateColumn == null) {
      return false;
    }

    if (!this.rangeBars[row]) {
      this.rangeBars[row] = {};
    }

    this.rangeBars[row][startDateColumn] = {
      barLength: endDateColumn - startDateColumn + 1,
      partialStart: !this.dateCalculator.isOnTheEdgeOfWeek(startDate)[0],
      partialEnd: !this.dateCalculator.isOnTheEdgeOfWeek(endDate)[1],
      additionalData: {}
    };

    objectEach(additionalData, (prop, i) => {
      this.rangeBars[row][startDateColumn].additionalData[i] = prop;
    });

    if (this.colorData[row]) {
      this.rangeBars[row][startDateColumn].colors = this.colorData[row];
    }

    this.rangeList[row] = [row, startDateColumn];

    this.renderRangeBar(row, startDateColumn, endDateColumn, additionalData);

    return [row, startDateColumn];
  }

  /**
   * Get the range bar data of the provided row and column.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {Object|Boolean} Returns false if no bar is found.
   */
  getRangeBarData(row, column) {
    let rangeBarCoords = this.getRangeBarCoordinates(row);

    if (!rangeBarCoords) {
      return false;
    }

    let rangeBarData = this.rangeBars[rangeBarCoords[0]][rangeBarCoords[1]];

    if (rangeBarData && row === rangeBarCoords[0] &&
      (column === rangeBarCoords[1] || column > rangeBarCoords[1] && column < rangeBarCoords[1] + rangeBarData.barLength)) {
      return rangeBarData;
    }

    return false;
  }

  /**
   * Update the range bar data by the provided object.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @param {Object} data Object with the updated data.
   */
  updateRangeBarData(row, column, data) {
    const rangeBar = this.getRangeBarData(row, column);

    objectEach(data, (val, prop) => {
      if (rangeBar[prop] !== val) {
        rangeBar[prop] = val;
      }
    });
  }

  /**
   * Add a range bar to the table.
   *
   * @param {Number} row Row index.
   * @param {Number} startDateColumn Start column index.
   * @param {Number} endDateColumn End column index.
   * @param {Object} additionalData Additional range data.
   */
  renderRangeBar(row, startDateColumn, endDateColumn, additionalData) {
    let currentBar = this.rangeBars[row][startDateColumn];

    for (let i = startDateColumn; i <= endDateColumn; i++) {
      let cellMeta = this.hot.getCellMeta(row, i);
      let newClassName = (cellMeta.className || '') + ' rangeBar';

      if ((i === startDateColumn && currentBar.partialStart) || (i === endDateColumn && currentBar.partialEnd)) {
        newClassName += ' partial';
      }

      if (i === endDateColumn) {
        newClassName += ' last';
      }

      this.hot.setCellMeta(row, i, 'originalClassName', cellMeta.className);
      this.hot.setCellMeta(row, i, 'className', newClassName);
      this.hot.setCellMeta(row, i, 'additionalData', currentBar.additionalData);

      // cache cell meta, used for updateSettings, related with a cell meta bug
      this.cacheRangeBarMeta(row, i, 'originalClassName', cellMeta.className);
      this.cacheRangeBarMeta(row, i, 'className', newClassName);
      this.cacheRangeBarMeta(row, i, 'additionalData', currentBar.additionalData);
    }
  }

  /**
   * Remove a range bar of the provided start date and row.
   *
   * @param {Number} row Row index.
   * @param {Date|String} startDate Start date.
   */
  removeRangeBarByDate(row, startDate) {
    let startDateColumn = this.dateCalculator.dateToColumn(startDate);

    this.removeRangeBarByColumn(row, startDateColumn);
  }

  /**
   * Remove a range bar of the provided row and start column.
   *
   * @param {Number} row Row index.
   * @param {Number} startDateColumn Column index.
   */
  removeRangeBarByColumn(row, startDateColumn) {
    let rangeBar = this.rangeBars[row][startDateColumn];

    if (!rangeBar) {
      return;
    }

    this.unrenderRangeBar(row, startDateColumn, startDateColumn + rangeBar.barLength - 1);
    this.rangeBars[row][startDateColumn] = null;

    objectEach(this.rangeList, (prop, i) => {
      i = parseInt(i, 10);

      if (JSON.stringify(prop) === JSON.stringify([row, startDateColumn])) {
        this.rangeList[i] = null;
      }
    });
  }

  /**
   * Remove all range bars from the chart-enabled Handsontable instance.
   */
  removeAllRangeBars() {
    objectEach(this.rangeBars, (row, i) => {
      objectEach(row, (bar, j) => {
        this.removeRangeBarByColumn(i, j);
      });
    });
  }

  /**
   * Remove a range bar from the table.
   *
   * @param {Number} row Row index.
   * @param {Number} startDateColumn Start column index.
   * @param {Number} endDateColumn End column index.
   */
  unrenderRangeBar(row, startDateColumn, endDateColumn) {
    for (let i = startDateColumn; i <= endDateColumn; i++) {
      let cellMeta = this.hot.getCellMeta(row, i);

      this.hot.setCellMeta(row, i, 'className', cellMeta.originalClassName);
      this.hot.setCellMeta(row, i, 'originalClassName', void 0);

      this.cacheRangeBarMeta(row, i, 'className', cellMeta.originalClassName);
      this.cacheRangeBarMeta(row, i, 'originalClassName', void 0);
    }

    this.hot.render();
  }

  /**
   * A default renderer of the range bars.
   *
   * @param {Object} instance HOT instance.
   * @param {HTMLElement} TD TD element.
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {String|Number} prop Object data property.
   * @param {String|Number} value Value to pass to the cell.
   * @param {Object} cellProperties Current cell properties.
   */
  uniformBackgroundRenderer(instance, TD, row, col, prop, value, cellProperties) {
    let rangeBarInfo = this.getRangeBarData(row, col);
    let rangeBarCoords = this.getRangeBarCoordinates(row);

    if (cellProperties.className) {
      TD.className = cellProperties.className;
    }

    let titleValue = '';

    objectEach(cellProperties.additionalData, (prop, i) => {
      titleValue += i + ': ' + prop + '\n';
    });

    titleValue = titleValue.replace(/\n$/, '');

    TD.title = titleValue;

    if (rangeBarInfo && rangeBarInfo.colors) {
      if (col === rangeBarCoords[1] && rangeBarInfo.partialStart ||
        col === (rangeBarCoords[1] + rangeBarInfo.barLength - 1) && rangeBarInfo.partialEnd) {
        TD.style.background = rangeBarInfo.colors[1];
      } else {
        TD.style.background = rangeBarInfo.colors[0];
      }
    } else {
      TD.style.background = '';
    }
  }

  /**
   * Set range bar colors.
   *
   * @param {Object} rows Object containing row color data, see example.
   * @example
   * ```js
   *  hot.getPlugin('ganttChart').setRangeBarColors({
   *    0: ['blue', 'lightblue'] // paints the bar in the first row blue, with partial sections colored light blue
    *   2: ['#2A74D0', '#588DD0'] // paints the bar in the thrid row with #2A74D0, with partial sections colored with #588DD0
   *  });
   * ```
   */
  setRangeBarColors(rows) {
    this.colorData = rows;

    objectEach(rows, (colors, i) => {
      let barCoords = this.getRangeBarCoordinates(i);

      if (barCoords) {
        this.updateRangeBarData(barCoords[0], barCoords[1], {
          colors: colors
        });
      }
    });

    this.hot.render();
  }

  /**
   * Update the chart with a new year.
   *
   * @param {Number} year New chart year.
   */
  setYear(year) {
    let newSettings = extend(this.hot.getSettings().ganttChart, {
      startYear: year
    });

    this.hot.updateSettings({
      ganttChart: newSettings
    });
  }

  /**
   * AfterInit hook callback.
   *
   * @private
   */
  onAfterInit() {
    this.nestedHeadersPlugin = this.hot.getPlugin('nestedHeaders');

    this.applyDataSource();
  }

  /**
   * Prevent update settings loop when assigning the additional internal settings.
   *
   * @private
   */
  onUpdateSettings() {
    if (this.internalUpdateSettings) {
      this.applyRangeBarMetaCache();

      return;
    }

    super.onUpdateSettings();
  }

  /**
   * Destroy the plugin
   *
   * @private
   */
  destroy() {
    if (this.hotSource) {
      this.dataFeed.removeSourceHotHooks(this.hotSource);
    }

    super.destroy();
  }
}

registerPlugin('ganttChart', GanttChart);

export default GanttChart;
