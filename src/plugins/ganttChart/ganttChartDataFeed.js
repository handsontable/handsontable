import { objectEach, clone } from '../../helpers/object';
import { arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { getAdditionalData, getEndDate, getStartDate, setEndDate, setStartDate } from './utils';

/**
 * This class handles the data-related calculations for the GanttChart plugin.
 *
 * @plugin GanttChart
 */
class GanttChartDataFeed {
  constructor(chartInstance, data, startDateColumn, endDateColumn, additionalData, asyncUpdates) {
    this.data = data;
    this.chartInstance = chartInstance;
    this.chartPlugin = this.chartInstance.getPlugin('ganttChart');
    this.hotSource = null;
    this.sourceHooks = {};
    this.ongoingAsync = false;

    this.applyData(data, startDateColumn, endDateColumn, additionalData, asyncUpdates || false);
  }

  /**
   * Parse data accordingly to it's type (HOT instance / data object).
   *
   * @param {Object} data The source Handsontable instance or a data object.
   * @param {Number} startDateColumn Index of the column containing the start dates.
   * @param {Number} endDateColumn Index of the column containing the end dates.
   * @param {Object} additionalData Object containing column and label information about additional data passed to the Gantt Plugin.
   * @param {Boolean} asyncUpdates If set to true, the source instance updates will be applied asynchronously.
   */
  applyData(data, startDateColumn, endDateColumn, additionalData, asyncUpdates) {
    if (Object.prototype.toString.call(data) === '[object Array]') {
      if (data.length > 1) {
        this.chartInstance.alter('insert_row', 0, data.length - 1, `${this.pluginName}.loadData`);
      }

      this.loadData(data);

    } else if (data instanceof this.chartInstance.constructor) {
      const sourceRowCount = data.countRows();

      if (sourceRowCount > 1) {
        this.chartInstance.alter('insert_row', 0, sourceRowCount - 1, `${this.pluginName}.loadData`);
      }

      this.bindWithHotInstance(data, startDateColumn, endDateColumn, additionalData, asyncUpdates);
    }
  }

  /**
   * Make another Handsontable instance be a live feed for the gantt chart.
   *
   * @param {Object} instance The source Handsontable instance.
   * @param {Number} startDateColumn Index of the column containing the start dates.
   * @param {Number} endDateColumn Index of the column containing the end dates.
   * @param {Object} additionalData Object containing column and label information about additional data passed to the
   * Gantt Plugin. See the example for more details.
   * @param {Boolean} asyncUpdates If set to true, the source instance updates will be applied asynchronously.
   *
   * @example
   * ```js
   * hot.getPlugin('ganttChart').bindWithHotInstance(sourceInstance, 4, 5, {
   *  vendor: 0, // data labeled 'vendor' is stored in the first sourceInstance column.
   *  format: 1, // data labeled 'format' is stored in the second sourceInstance column.
   *  market: 2 // data labeled 'market' is stored in the third sourceInstance column.
   * });
   * ```
   */
  bindWithHotInstance(instance, startDateColumn, endDateColumn, additionalData, asyncUpdates) {
    this.hotSource = {
      instance,
      startColumn: startDateColumn,
      endColumn: endDateColumn,
      additionalData,
      asyncUpdates
    };

    this.addSourceHotHooks();

    this.asyncCall(this.updateFromSource);
  }

  /**
   * Run the provided function asynchronously.
   *
   * @param {Function} func
   */
  asyncCall(func) {

    if (!this.hotSource.asyncUpdates) {
      func.call(this);

      return;
    }

    this.asyncStart();

    setTimeout(() => {
      func.call(this);

      this.asyncEnd();
    }, 0);
  }

  asyncStart() {
    this.ongoingAsync = true;
  }

  asyncEnd() {
    this.ongoingAsync = false;
  }

  /**
   * Add hooks to the source Handsontable instance.
   *
   * @private
   */
  addSourceHotHooks() {
    this.sourceHooks = {
      afterLoadData: () => this.onAfterSourceLoadData(),
      afterChange: changes => this.onAfterSourceChange(changes),
      afterColumnSort: () => this.onAfterColumnSort()
    };

    this.hotSource.instance.addHook('afterLoadData', this.sourceHooks.afterLoadData);
    this.hotSource.instance.addHook('afterChange', this.sourceHooks.afterChange);
    this.hotSource.instance.addHook('afterColumnSort', this.sourceHooks.afterColumnSort);
  }

  /**
   * Remove hooks from the source Handsontable instance.
   *
   * @private
   * @param {Object} hotSource The source Handsontable instance object.
   */
  removeSourceHotHooks(hotSource) {
    if (this.sourceHooks.afterLoadData) {
      hotSource.instance.removeHook('afterLoadData', this.sourceHooks.afterLoadData);
    }

    if (this.sourceHooks.afterChange) {
      hotSource.instance.removeHook('afterChange', this.sourceHooks.afterChange);
    }

    if (this.sourceHooks.afterColumnSort) {
      hotSource.instance.removeHook('afterColumnSort', this.sourceHooks.afterColumnSort);
    }
  }

  /**
   * Get data from the source Handsontable instance.
   *
   * @param {Number} [row] Source Handsontable instance row.
   * @returns {Array}
   */
  getDataFromSource(row) {
    let additionalObjectData = {};
    const hotSource = this.hotSource;
    let sourceHotRows;
    const rangeBarData = [];

    if (row === void 0) {
      sourceHotRows = hotSource.instance.getData(0, 0, hotSource.instance.countRows() - 1, hotSource.instance.countCols() - 1);

    } else {
      sourceHotRows = [];
      sourceHotRows[row] = hotSource.instance.getDataAtRow(row);
    }

    for (let i = row || 0, dataLength = sourceHotRows.length; i < (row ? row + 1 : dataLength); i++) {
      additionalObjectData = {};
      const currentRow = sourceHotRows[i];

      if (currentRow[hotSource.startColumn] === null || currentRow[hotSource.startColumn] === '') {
        /* eslint-disable no-continue */
        continue;
      }

      /* eslint-disable no-loop-func */
      objectEach(hotSource.additionalData, (prop, j) => {
        additionalObjectData[j] = currentRow[prop];
      });

      rangeBarData.push([
        i, currentRow[hotSource.startColumn],
        currentRow[hotSource.endColumn], additionalObjectData, i]);
    }

    return rangeBarData;
  }

  /**
   * Update the Gantt Chart-enabled Handsontable instance with the data from the source Handsontable instance.
   *
   * @param {Number} [row] Index of the row which needs updating.
   */
  updateFromSource(row) {
    const dataFromSource = this.getDataFromSource(row);

    if (!row && isNaN(row)) {
      this.chartPlugin.clearRangeBars();
      this.chartPlugin.clearRangeList();
    }

    this.loadData(dataFromSource);

    this.chartInstance.render();
  }

  /**
   * Load chart data to the Handsontable instance.
   *
   * @param {Array} data Array of objects containing the range data.
   *
   * @example
   * ```js
   * [
   *  {
   *    additionalData: {vendor: 'Vendor One', format: 'Posters', market: 'New York, NY'},
   *    startDate: '1/5/2015',
   *    endDate: '1/20/2015'
   *  },
   *  {
   *    additionalData: {vendor: 'Vendor Two', format: 'Malls', market: 'Los Angeles, CA'},
   *    startDate: '1/11/2015',
   *    endDate: '1/29/2015'
   *  }
   * ]
   * ```
   */
  loadData(data) {
    let allBars = [];

    arrayEach(data, (bar, i) => {
      bar.row = i;

      const bars = this.splitRangeIfNeeded(bar);

      allBars = allBars.concat(bars);
    });

    arrayEach(allBars, (bar) => {
      this.chartPlugin.addRangeBar(bar.row, getStartDate(bar), getEndDate(bar), getAdditionalData(bar));
      delete bar.row;
    });
  }

  /**
   * Split the provided range into maximum-year-long chunks.
   *
   * @param {Object} bar The range bar object.
   * @returns {Array} An array of slip chunks (or a single-element array, if no splicing occured)
   */
  splitRangeIfNeeded(bar) {
    const splitBars = [];
    const startDate = new Date(getStartDate(bar));
    const endDate = new Date(getEndDate(bar));

    if (typeof startDate === 'string' || typeof endDate === 'string') {
      return false;
    }

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    if (startYear === endYear) {
      return [bar];
    }

    rangeEach(startYear, endYear, (year) => {
      const newBar = clone(bar);

      if (year !== startYear) {
        setStartDate(newBar, `01/01/${year}`);
      }

      if (year !== endYear) {
        setEndDate(newBar, `12/31/${year}`);
      }

      splitBars.push(newBar);
    });

    return splitBars;
  }

  /**
   * afterChange hook callback for the source Handsontable instance.
   *
   * @private
   * @param {Array} changes List of changes.
   */
  onAfterSourceChange(changes) {
    this.asyncCall(() => {
      if (!changes) {
        return;
      }

      const changesByRows = {};

      for (let i = 0, changesLength = changes.length; i < changesLength; i++) {
        const currentChange = changes[i];
        const row = parseInt(currentChange[0], 10);
        const col = parseInt(currentChange[1], 10);

        if (!changesByRows[row]) {
          changesByRows[row] = {};
        }

        changesByRows[row][col] = [currentChange[2], currentChange[3]];
      }

      objectEach(changesByRows, (prop, i) => {
        const row = parseInt(i, 10);

        if (this.chartPlugin.getRangeBarCoordinates(row)) {
          this.chartPlugin.removeRangeBarByColumn(row, this.chartPlugin.rangeList[row][1]);
        }

        this.updateFromSource(i);
      });
    });
  }

  /**
   * afterLoadData hook callback for the source Handsontable instance.
   *
   * @private
   */
  onAfterSourceLoadData() {
    this.asyncCall(() => {
      this.chartPlugin.removeAllRangeBars();
      this.updateFromSource();
    });
  }

  /**
   * afterColumnSort hook callback for the source Handsontable instance.
   *
   * @private
   */
  onAfterColumnSort() {
    this.asyncCall(() => {
      this.chartPlugin.removeAllRangeBars();
      this.updateFromSource();
    });
  }
}

export default GanttChartDataFeed;
