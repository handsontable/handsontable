import {arrayEach} from 'handsontable/helpers/array';
import {objectEach} from 'handsontable/helpers/object';
import {getMixedMonthObject, getMixedMonthName} from './utils';

/**
 * This class handles the date-related calculations for the GanttChart plugin.
 *
 * @plugin GanttChart
 */
class DateCalculator {
  constructor(year, allowSplitWeeks) {
    /**
     * Year to base calculations on.
     *
     * @type {Number}
     */
    this.year = year;
    /**
     * First day of the week.
     *
     * @type {String}
     */
    this.firstWeekDay = 'monday';
    /**
     * The current `allowSplitWeeks` option state.
     */
    this.allowSplitWeeks = allowSplitWeeks === void 0 ? true : allowSplitWeeks;
    /**
     * Number of week sections (full weeks + incomplete week blocks in months).
     *
     * @type {Number}
     */
    this.weekSectionCount = 0;
    /**
     * List of months and their week/day related information.
     *
     * @type {Array}
     */
    this.monthList = this.calculateMonthData();
    /**
     * Object containing references to the year days and their corresponding columns.
     *
     * @type {Object}
     */
    this.daysInColumns = {};

    this.calculateWeekStructure();
  }

  /**
   * Set the year as a base for calculations.
   *
   * @param {Number} year
   */
  setYear(year) {
    this.year = year;

    this.monthList = this.calculateMonthData();
    this.calculateWeekStructure();
  }

  /**
   * Set the first week day.
   *
   * @param {String} day Day of the week. Available options: 'monday' or 'sunday'.
   */
  setFirstWeekDay(day) {
    const lowercaseDay = day.toLowerCase();

    if (lowercaseDay !== 'monday' && lowercaseDay !== 'sunday') {
      console.warn('First day of the week must be set to either Monday or Sunday');
    }

    this.firstWeekDay = lowercaseDay;

    this.calculateWeekStructure();
  }

  /**
   * Count week sections (full weeks + incomplete weeks in the months).
   *
   * @returns {Number} Week section count.
   */
  countWeekSections() {
    return this.weekSectionCount;
  }

  /**
   * Get the first week day.
   *
   * @returns {String}
   */
  getFirstWeekDay() {
    return this.firstWeekDay;
  }

  /**
   * Get the currently applied year.
   *
   * @returns {Number}
   */
  getYear() {
    return this.year;
  }

  /**
   * Get month list along with the month information.
   *
   * @returns {Array}
   */
  getMonthList() {
    return this.monthList;
  }

  /**
   * Parse the provided date and check if it's valid.
   *
   * @param {String|Date} date Date string or object.
   * @returns {Date|null} Parsed Date object or null, if not a valid date string.
   */
  parseDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);

      if (date.toString() === 'Invalid Date') {
        return null;
      }
    }

    return date;
  }

  /**
   * Convert a date to a column number.
   *
   * @param {String|Date} date
   * @returns {Number|Boolean}
   */
  dateToColumn(date) {
    date = this.parseDate(date);
    if (!date || date.getFullYear() !== this.year) {
      return false;
    }

    const month = date.getMonth();
    const day = date.getDate() - 1;

    return this.getWeekColumn(day, month);
  }

  /**
   * Get the column index for the provided day and month indexes.
   *
   * @private
   * @param {Number} dayIndex The index of the day.
   * @param {Number} monthIndex The index of the month.
   * @returns {Number} Returns the column index.
   */
  getWeekColumn(dayIndex, monthIndex) {
    let resultColumn = null;
    let monthCacheArray = this.getMonthCacheArray(monthIndex);

    arrayEach(monthCacheArray, (monthCache) => {
      objectEach(monthCache, (column, index) => {
        if (column.indexOf(dayIndex + 1) > -1) {
          resultColumn = parseInt(index, 10);

          return false;
        }
      });

      if (resultColumn) {
        return false;
      }
    });

    return resultColumn;
  }

  /**
   * Get the cached day array for the provided month.
   *
   * @private
   * @param {Number} monthIndex Index of the Month
   * @returns {Array}
   */
  getMonthCacheArray(monthIndex) {
    const monthList = this.getMonthList();
    const resultArray = [];

    if (this.allowSplitWeeks) {
      resultArray.push(this.daysInColumns[monthIndex]);

    } else {
      let fullMonthCount = -1;
      objectEach(this.daysInColumns, (month, i) => {
        const monthObject = monthList[i];

        if (Object.keys(month).length > 1) {
          fullMonthCount++;
        }

        if (fullMonthCount === monthIndex) {
          if (monthObject.daysBeforeFullWeeks > 0) {
            resultArray.push(this.daysInColumns[parseInt(i, 10) - 1]);
          }

          resultArray.push(month);

          if (monthObject.daysAfterFullWeeks > 0) {
            resultArray.push(this.daysInColumns[parseInt(i, 10) + 1]);
          }

          return false;
        }
      });
    }

    return resultArray;
  }

  /**
   * Convert a column index to a certain date.
   *
   * @param {Number} column
   * @returns {Date|Array}
   */
  columnToDate(column) {
    let month = null;

    objectEach(this.daysInColumns, (monthCache, index) => {
      if (monthCache[column]) {
        month = index;

        return false;
      }
    });

    if (this.daysInColumns[month][column].length === 1) {
      return new Date(this.year, month, this.daysInColumns[month][column][0]);
    }

    // TODO: this should look like {start: startDate, end: endDate}
    return this.daysInColumns[month][column];
  }

  /**
   * Check if the provided date is a starting or an ending day of a week.
   *
   * @private
   * @param {Date|String} date
   * @returns {Array|Boolean} Returns null, if an invalid date was provided or an array of results ( [1,0] => is on the beginning of the week, [0,1] => is on the end of the week).
   */
  isOnTheEdgeOfWeek(date) {
    date = this.parseDate(date);

    if (!date) {
      return null;
    }

    let month = date.getMonth();
    let day = date.getDate() - 1;
    let monthCacheArray = this.getMonthCacheArray(month);
    let isOnTheEdgeOfWeek = false;

    arrayEach(monthCacheArray, (monthCache) => {
      objectEach(monthCache, (column) => {

        if (!this.allowSplitWeeks && column.length !== 7) {
          if (day === 0 || day === new Date(date.getYear(), date.getMonth() + 1, 0).getDate() - 1) {
            return true;
          }
        }

        let indexOfDay = column.indexOf(day + 1);

        if (indexOfDay === 0) {
          isOnTheEdgeOfWeek = [1, 0];
          return false;

        } else if (indexOfDay === column.length - 1) {
          isOnTheEdgeOfWeek = [0, 1];
          return false;
        }
      });

      // break the iteration
      if (isOnTheEdgeOfWeek) {
        return false;
      }
    });

    return isOnTheEdgeOfWeek;
  }

  /**
   * Add days to the column/day cache.
   *
   * @private
   * @param {Number} monthNumber Index of the month.
   * @param {Number} columnNumber Index of the column.
   * @param {Number} start First day in the column.
   * @param {Number} end Last day in the column.
   */
  addDaysToCache(monthNumber, columnNumber, start, end) {
    if (!this.daysInColumns[monthNumber]) {
      this.daysInColumns[monthNumber] = {};
    }
    if (!this.daysInColumns[monthNumber][columnNumber]) {
      this.daysInColumns[monthNumber][columnNumber] = [];
    }

    if (start <= end) {
      for (let dayIndex = start; dayIndex <= end; dayIndex++) {
        this.daysInColumns[monthNumber][columnNumber].push(dayIndex);
      }

    } else {
      let previousMonthDaysCount = monthNumber - 1 >= 0 ? this.countMonthDays(monthNumber) : 31;

      for (let dayIndex = start; dayIndex <= previousMonthDaysCount; dayIndex++) {
        this.daysInColumns[monthNumber][columnNumber].push(dayIndex);
      }

      for (let dayIndex = 1; dayIndex <= end; dayIndex++) {
        this.daysInColumns[monthNumber][columnNumber].push(dayIndex);
      }
    }
  }

  /**
   * Check if the provided dates can be used in a range bar.
   *
   * @param {Date|String} startDate Range start date.
   * @param {Date|String} endDate Range end date.
   * @returns {Boolean}
   */
  isValidRangeBarData(startDate, endDate) {
    let startDateParsed = this.parseDate(startDate);
    let endDateParsed = this.parseDate(endDate);

    return startDateParsed && endDateParsed && startDateParsed.getTime() <= endDateParsed.getTime();
  }

  /**
   * Calculate the month/day related information.
   *
   * @returns {Array}
   */
  calculateMonthData() {
    return [
      {name: 'January', days: 31},
      {name: 'February', days: new Date(this.year, 2, 0).getDate()},
      {name: 'March', days: 31},
      {name: 'April', days: 30},
      {name: 'May', days: 31},
      {name: 'June', days: 30},
      {name: 'July', days: 31},
      {name: 'August', days: 31},
      {name: 'September', days: 30},
      {name: 'October', days: 31},
      {name: 'November', days: 30},
      {name: 'December', days: 31}
    ].slice(0);
  }

  /**
   * Count the number of months.
   *
   * @returns {Number}
   */
  countMonths() {
    return this.monthList.length;
  }

  /**
   * Count days in a month.
   *
   * @param {Number} month Month index, where January = 1, February = 2, etc.
   * @returns {Number}
   */
  countMonthDays(month) {
    return this.monthList[month - 1].days;
  }

  /**
   * Count full weeks in a month.
   *
   * @param {Number} month Month index, where January = 1, February = 2, etc.
   * @returns {Number}
   */
  countMonthFullWeeks(month) {
    return this.monthList[month - 1].fullWeeks;
  }

  /**
   * Calculate week structure within defined months.
   *
   * @private
   */
  calculateWeekStructure() {
    this.monthList = this.calculateMonthData();

    const firstWeekDay = this.getFirstWeekDay();
    const monthList = this.getMonthList();
    const currentYear = this.getYear();
    const mixedMonthToAdd = [];
    let weekOffset = 0;
    let weekSectionCount = 0;

    if (firstWeekDay === 'monday') {
      weekOffset = 1;
    }

    arrayEach(monthList, (currentMonth, monthIndex) => {
      let firstMonthDay = new Date(currentYear, monthIndex, 1).getDay();
      let mixedMonthsAdded = 0;
      let mixedMonthName = null;

      currentMonth.daysBeforeFullWeeks = (7 - firstMonthDay + weekOffset) % 7;

      if (!this.allowSplitWeeks && currentMonth.daysBeforeFullWeeks) {
        mixedMonthName = getMixedMonthName(monthIndex, monthList);

        mixedMonthToAdd.push(getMixedMonthObject(mixedMonthName, monthIndex));

        mixedMonthsAdded++;
      }

      currentMonth.fullWeeks = Math.floor((currentMonth.days - currentMonth.daysBeforeFullWeeks) / 7);
      currentMonth.daysAfterFullWeeks = currentMonth.days - currentMonth.daysBeforeFullWeeks - (7 * currentMonth.fullWeeks);

      if (!this.allowSplitWeeks) {
        if (monthIndex === monthList.length - 1 && currentMonth.daysAfterFullWeeks) {
          mixedMonthName = getMixedMonthName(monthIndex, monthList);

          mixedMonthToAdd.push(getMixedMonthObject(mixedMonthName, null));

          mixedMonthsAdded++;
        }

        weekSectionCount += currentMonth.fullWeeks + mixedMonthsAdded;

      } else {
        weekSectionCount += currentMonth.fullWeeks + (currentMonth.daysBeforeFullWeeks ? 1 : 0) + (currentMonth.daysAfterFullWeeks ? 1 : 0);
      }
    });

    arrayEach(mixedMonthToAdd, (monthObject, monthIndex) => {
      const index = monthObject.index;

      delete monthObject.index;

      this.addMixedMonth(index === null ? index : monthIndex + index, monthObject);
    });

    this.weekSectionCount = weekSectionCount;
  }

  /**
   * Add a mixed (e.g. 'Jan/Feb') month to the month list.
   *
   * @private
   * @param {Number} index Index for the month.
   * @param {Object} monthObject The month object.
   */
  addMixedMonth(index, monthObject) {
    if (index === null) {
      this.monthList.push(monthObject);

    } else {
      this.monthList.splice(index, 0, monthObject);
    }
  }

}

export default DateCalculator;
