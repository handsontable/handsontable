import {arrayEach} from 'handsontable/helpers/array';
import {objectEach} from 'handsontable/helpers/object';

/**
 * This class handles the date-related calculations for the GanttChart plugin.
 *
 * @plugin GanttChart
 */
class DateCalculator {
  constructor(year) {
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

    let month = date.getMonth();
    let day = date.getDate() - 1;
    let monthCache = this.daysInColumns[month];
    let resultColumn = null;

    objectEach(monthCache, (column, index) => {
      if (column.indexOf(day + 1) > -1) {
        resultColumn = parseInt(index, 10);

        return false;
      }
    });

    return resultColumn;
  }

  /**
   * Convert a column index to a certain date.
   *
   * @param {Number} column
   * @param {Boolean} forceReturnArray Force the return value to be an array;
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

    return this.daysInColumns[month][column];
  }

  /**
   * Check if the provided date is a starting or an ending day of a week.
   *
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
    let monthCache = this.daysInColumns[month];
    let isOnTheEdgeOfWeek = false;

    objectEach(monthCache, (column) => {
      let indexOfDay = column.indexOf(day + 1);

      if ((indexOfDay === 0)) {
        isOnTheEdgeOfWeek = [1, 0];
        return false;

      } else if (indexOfDay === column.length - 1) {
        isOnTheEdgeOfWeek = [0, 1];
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
    for (let j = start; j <= end; j++) {
      this.daysInColumns[monthNumber][columnNumber].push(j);
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
    ];
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
   */
  calculateWeekStructure() {
    let weekOffset = 0;
    let weekSectionCount = 0;
    let firstWeekDay = this.getFirstWeekDay();
    let monthList = this.getMonthList();
    let currentYear = this.getYear();

    if (firstWeekDay === 'monday') {
      weekOffset = 1;
    }

    arrayEach(monthList, (currentMonth, i) => {
      let firstMonthDay = new Date(currentYear, i, 1).getDay();

      currentMonth.daysBeforeFullWeeks = (7 - firstMonthDay + weekOffset) % 7;
      currentMonth.fullWeeks = Math.floor((currentMonth.days - currentMonth.daysBeforeFullWeeks) / 7);
      currentMonth.daysAfterFullWeeks = currentMonth.days - currentMonth.daysBeforeFullWeeks - (7 * currentMonth.fullWeeks);

      weekSectionCount += currentMonth.fullWeeks + (currentMonth.daysBeforeFullWeeks ? 1 : 0) + (currentMonth.daysAfterFullWeeks ? 1 : 0);
    });

    this.weekSectionCount = weekSectionCount;
  }

}

export default DateCalculator;
