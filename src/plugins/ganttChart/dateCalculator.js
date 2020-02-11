import { arrayEach } from '../../helpers/array';
import { objectEach } from '../../helpers/object';
import { warn } from '../../helpers/console';
import { getMixedMonthObject, getMixedMonthName, parseDate, DEC_LENGTH, WEEK_LENGTH } from './utils';

/**
 * This class handles the date-related calculations for the GanttChart plugin.
 *
 * @plugin GanttChart
 */
class DateCalculator {
  constructor({ year, allowSplitWeeks = true, hideDaysBeforeFullWeeks = false, hideDaysAfterFullWeeks = false }) {
    /**
     * Year to base calculations on.
     *
     * @type {number}
     */
    this.year = year;
    /**
     * First day of the week.
     *
     * @type {string}
     */
    this.firstWeekDay = 'monday';
    /**
     * The current `allowSplitWeeks` option state.
     */
    this.allowSplitWeeks = allowSplitWeeks;
    /**
     * The current `hideDaysBeforeFullWeeks` option state.
     */
    this.hideDaysBeforeFullWeeks = hideDaysBeforeFullWeeks;
    /**
     * The current `hideDaysAfterFullWeeks` option state.
     */
    this.hideDaysAfterFullWeeks = hideDaysAfterFullWeeks;
    /**
     * Number of week sections (full weeks + incomplete week blocks in months).
     *
     * @type {number}
     */
    this.weekSectionCount = 0;
    /**
     * Cache of lists of months and their week/day related information.
     * It's categorized by year, so month information for a certain year is stored under `this.monthListCache[year]`.
     *
     * @type {object}
     */
    this.monthListCache = {};
    /**
     * Object containing references to the year days and their corresponding columns.
     *
     * @type {object}
     */
    this.daysInColumns = {};

    this.calculateWeekStructure();
  }

  /**
   * Set the year as a base for calculations.
   *
   * @param {number} year The year.
   */
  setYear(year) {
    this.year = year;

    this.monthListCache[year] = this.calculateMonthData(year);
    this.calculateWeekStructure(year);
  }

  /**
   * Set the first week day.
   *
   * @param {string} day Day of the week. Available options: 'monday' or 'sunday'.
   */
  setFirstWeekDay(day) {
    const lowercaseDay = day.toLowerCase();

    if (lowercaseDay !== 'monday' && lowercaseDay !== 'sunday') {
      warn('First day of the week must be set to either Monday or Sunday');
    }

    this.firstWeekDay = lowercaseDay;

    this.calculateWeekStructure();
  }

  /**
   * Count week sections (full weeks + incomplete weeks in the months).
   *
   * @returns {number} Week section count.
   */
  countWeekSections() {
    return this.weekSectionCount;
  }

  /**
   * Get the first week day.
   *
   * @returns {string}
   */
  getFirstWeekDay() {
    return this.firstWeekDay;
  }

  /**
   * Get the currently applied year.
   *
   * @returns {number}
   */
  getYear() {
    return this.year;
  }

  /**
   * Get month list along with the month information.
   *
   * @param {number} [year] Year for the calculation.
   * @returns {Array}
   */
  getMonthList(year = this.year) {
    if (!this.monthListCache[year]) {
      this.monthListCache[year] = this.calculateMonthData(year);
    }

    return this.monthListCache[year];
  }

  /**
   * Get month lists for all years declared in the range bars.
   *
   * @returns {object}
   */
  getFullMonthList() {
    return this.monthListCache;
  }

  /**
   * Convert a date to a column number.
   *
   * @param {string|Date} date The date to convert.
   * @returns {number|boolean}
   */
  dateToColumn(date) {
    const convertedDate = parseDate(date);

    if (!convertedDate) {
      return false;
    }

    const month = convertedDate.getMonth();
    const day = convertedDate.getDate() - 1;
    const year = convertedDate.getFullYear();

    return this.getWeekColumn(day, month, year);
  }

  /**
   * Get the column index for the provided day and month indexes.
   *
   * @private
   * @param {number} dayIndex The index of the day.
   * @param {number} monthIndex The index of the month.
   * @param {number} [year] Year for the calculation.
   * @returns {number} Returns the column index.
   */
  getWeekColumn(dayIndex, monthIndex, year = this.getYear()) {
    let resultColumn = null;
    const monthCacheArray = this.getMonthCacheArray(monthIndex, year);

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
   * @param {number} monthIndex Index of the Month.
   * @param {number} [year] Year for the calculation.
   * @returns {Array}
   */
  getMonthCacheArray(monthIndex, year = this.getYear()) {
    const monthList = this.getMonthList(year);
    const resultArray = [];

    if (this.allowSplitWeeks) {
      resultArray.push(this.daysInColumns[year][monthIndex]);

    } else {
      let fullMonthCount = -1;
      objectEach(this.daysInColumns[year], (month, i) => {
        const monthObject = monthList[i];

        if (Object.keys(month).length > 1) {
          fullMonthCount += 1;
        }

        if (fullMonthCount === monthIndex) {
          if (monthObject.daysBeforeFullWeeks > 0) {
            resultArray.push(this.daysInColumns[year][parseInt(i, 10) - 1]);
          }

          resultArray.push(month);

          if (monthObject.daysAfterFullWeeks > 0) {
            resultArray.push(this.daysInColumns[year][parseInt(i, 10) + 1]);
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
   * @param {number} column Column index.
   * @param {number} [year] Year to be used.
   * @returns {object} Object in a form of {start: startDate, end: endDate}.
   */
  columnToDate(column, year = this.getYear()) {
    let month = null;

    objectEach(this.daysInColumns[year], (monthCache, index) => {
      if (monthCache[column]) {
        month = index;

        return false;
      }
    });

    const monthSection = this.daysInColumns[year][month][column];

    if (monthSection.length === 1) {
      const resultingDate = new Date(year, month, monthSection[0]);

      return {
        start: resultingDate,
        end: resultingDate,
      };
    }

    return {
      start: new Date(year, month, monthSection[0]),
      end: new Date(year, month, monthSection[monthSection.length - 1])
    };
  }

  /**
   * Check if the provided date is a starting or an ending day of a week.
   *
   * @private
   * @param {Date|string} date The date to check.
   * @returns {Array|boolean} Returns null, if an invalid date was provided or an array of results ( [1,0] => is on the beginning of the week, [0,1] => is on the end of the week).
   */
  isOnTheEdgeOfWeek(date) {
    const convertedDate = parseDate(date);

    if (!convertedDate) {
      return null;
    }

    const month = convertedDate.getMonth();
    const day = convertedDate.getDate() - 1;
    const year = convertedDate.getFullYear();
    const monthCacheArray = this.getMonthCacheArray(month, year);
    let isOnTheEdgeOfWeek = false;

    arrayEach(monthCacheArray, (monthCache) => {
      objectEach(monthCache, (column) => {

        if (!this.allowSplitWeeks && column.length !== 7) {
          if (day === 0 || day === new Date(convertedDate.getYear(), convertedDate.getMonth() + 1, 0).getDate() - 1) {
            return true;
          }
        }

        const indexOfDay = column.indexOf(day + 1);

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
   * Generate headers for the year structure.
   *
   * @private
   * @param {string} type Granulation type ('months'/'weeks'/'days').
   * @param {Function|null} weekHeaderGenerator Function generating the looks of the week headers.
   * @param {number} [year=this.year] The year for the calculation.
   * @returns {Array} The header array.
   */
  generateHeaderSet(type, weekHeaderGenerator, year = this.year) {
    const monthList = this.getMonthList(year);
    const headers = [];

    objectEach(monthList, (month, index) => {
      const areDaysBeforeFullWeeks = month.daysBeforeFullWeeks > 0 ? 1 : 0;
      const areDaysAfterFullWeeks = month.daysAfterFullWeeks > 0 ? 1 : 0;
      const areDaysBeforeFullWeeksVisible = this.hideDaysBeforeFullWeeks ? 0 : areDaysBeforeFullWeeks;
      const areDaysAfterFullWeeksVisible = this.hideDaysAfterFullWeeks ? 0 : areDaysAfterFullWeeks;
      const headerCount = month.fullWeeks + (this.allowSplitWeeks ? areDaysBeforeFullWeeksVisible + areDaysAfterFullWeeksVisible : 0);
      const monthNumber = parseInt(index, 10);
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
          if (!this.allowSplitWeeks && month.fullWeeks === 1) {
            [start, end] = this.getWeekColumnRange({
              monthObject: month,
              monthNumber,
              headerIndex: i,
              headerCount,
              areDaysBeforeFullWeeksVisible,
              areDaysAfterFullWeeksVisible,
              mixedMonth: true,
              year
            });

            // Standard week column
          } else {
            [start, end] = this.getWeekColumnRange({
              monthObject: month,
              monthNumber,
              headerIndex: i,
              areDaysBeforeFullWeeksVisible,
              areDaysAfterFullWeeksVisible,
              headerCount,
              year
            });
          }

          if (start === end) {
            headerLabel = `${start}`;

          } else {
            headerLabel = `${start} -  ${end}`;
          }

          headers.push(weekHeaderGenerator ? weekHeaderGenerator.call(this, start, end) : headerLabel);

          this.addDaysToCache(monthNumber, headers.length - 1, start, end, year);
        }
      }
    });

    return headers;
  }

  /**
   * Get the week column range.
   *
   * @private
   * @param {object} options The options object.
   * @param {object} options.monthObject The month object.
   * @param {number} options.monthNumber Index of the month.
   * @param {number} options.headerIndex Index of the header.
   * @param {boolean} options.areDaysBeforeFullWeeksVisible `true` if the days before full weeks are to be visible.
   * @param {boolean} options.areDaysAfterFullWeeksVisible `true` if the days after full weeks are to be visible.
   * @param {number} options.headerCount Number of headers to be generated for the provided month.
   * @param {boolean} [options.mixedMonth=false] `true` if the header is the single header of a mixed month.
   * @param {number} [options.year] Year for the calculation.
   * @returns {Array}
   */
  getWeekColumnRange({
    monthObject,
    monthNumber,
    headerIndex,
    headerCount,
    areDaysBeforeFullWeeksVisible,
    areDaysAfterFullWeeksVisible,
    mixedMonth = false,
    year = this.year
  }) {
    const monthList = this.getMonthList(year);
    const allowSplitWeeks = this.allowSplitWeeks;

    let start = null;
    let end = null;

    if (mixedMonth) {
      if (monthNumber === 0) {
        end = monthList[monthNumber + 1].daysBeforeFullWeeks;
        start = DEC_LENGTH - (WEEK_LENGTH - end) + 1;

      } else if (monthNumber === monthList.length - 1) {
        end = WEEK_LENGTH - monthList[monthNumber - 1].daysAfterFullWeeks;
        start = monthList[monthNumber - 1].days - monthList[monthNumber - 1].daysAfterFullWeeks + 1;

      } else {
        end = monthList[monthNumber + 1].daysBeforeFullWeeks;
        start = monthList[monthNumber - 1].days - (WEEK_LENGTH - end) + 1;
      }

    } else if (allowSplitWeeks && areDaysBeforeFullWeeksVisible && headerIndex === 0) {
      start = headerIndex + 1;
      end = monthObject.daysBeforeFullWeeks;

    } else if (allowSplitWeeks && areDaysAfterFullWeeksVisible && headerIndex === headerCount - 1) {
      start = monthObject.days - monthObject.daysAfterFullWeeks + 1;
      end = monthObject.days;

    } else {
      start = null;
      if (allowSplitWeeks) {
        start = monthObject.daysBeforeFullWeeks + ((headerIndex - areDaysBeforeFullWeeksVisible) * WEEK_LENGTH) + 1;
      } else {
        start = monthObject.daysBeforeFullWeeks + (headerIndex * WEEK_LENGTH) + 1;
      }
      end = start + WEEK_LENGTH - 1;
    }

    return [start, end];
  }

  /**
   * Add days to the column/day cache.
   *
   * @private
   * @param {number} monthNumber Index of the month.
   * @param {number} columnNumber Index of the column.
   * @param {number} start First day in the column.
   * @param {number} end Last day in the column.
   * @param {number} [year] Year to process.
   */
  addDaysToCache(monthNumber, columnNumber, start, end, year = this.getYear()) {
    if (!this.daysInColumns[year]) {
      this.daysInColumns[year] = {};
    }

    if (!this.daysInColumns[year][monthNumber]) {
      this.daysInColumns[year][monthNumber] = {};
    }

    if (!this.daysInColumns[year][monthNumber][columnNumber]) {
      this.daysInColumns[year][monthNumber][columnNumber] = [];
    }

    if (start <= end) {
      for (let dayIndex = start; dayIndex <= end; dayIndex++) {
        this.daysInColumns[year][monthNumber][columnNumber].push(dayIndex);
      }

    } else {
      const previousMonthDaysCount = monthNumber - 1 >= 0 ? this.countMonthDays(monthNumber) : 31;

      for (let dayIndex = start; dayIndex <= previousMonthDaysCount; dayIndex++) {
        this.daysInColumns[year][monthNumber][columnNumber].push(dayIndex);
      }

      for (let dayIndex = 1; dayIndex <= end; dayIndex++) {
        this.daysInColumns[year][monthNumber][columnNumber].push(dayIndex);
      }
    }
  }

  /**
   * Check if the provided dates can be used in a range bar.
   *
   * @param {Date|string} startDate Range start date.
   * @param {Date|string} endDate Range end date.
   * @returns {boolean}
   */
  isValidRangeBarData(startDate, endDate) {
    const startDateParsed = parseDate(startDate);
    const endDateParsed = parseDate(endDate);

    return startDateParsed && endDateParsed && startDateParsed.getTime() <= endDateParsed.getTime();
  }

  /**
   * Calculate the month/day related information.
   *
   * @param {number} [year] Year to be used.
   * @returns {Array}
   */
  calculateMonthData(year = this.year) {
    return [
      { name: 'January', days: 31 },
      { name: 'February', days: new Date(year, 2, 0).getDate() },
      { name: 'March', days: 31 },
      { name: 'April', days: 30 },
      { name: 'May', days: 31 },
      { name: 'June', days: 30 },
      { name: 'July', days: 31 },
      { name: 'August', days: 31 },
      { name: 'September', days: 30 },
      { name: 'October', days: 31 },
      { name: 'November', days: 30 },
      { name: 'December', days: 31 }
    ].slice(0);
  }

  /**
   * Count the number of months.
   *
   * @param {number} [year] Year to be used.
   * @returns {number}
   */
  countMonths(year = this.getYear()) {
    return this.monthListCache[year].length;
  }

  /**
   * Count days in a month.
   *
   * @param {number} month Month index, where January = 1, February = 2, etc.
   * @param {number} [year] Year to be used.
   * @returns {number}
   */
  countMonthDays(month, year = this.getYear()) {
    return this.monthListCache[year][month - 1].days;
  }

  /**
   * Count full weeks in a month.
   *
   * @param {number} month Month index, where January = 1, February = 2, etc.
   * @param {number} [year] Year to be used.
   * @returns {number}
   */
  countMonthFullWeeks(month, year = this.getYear()) {
    return this.monthListCache[year][month - 1].fullWeeks;
  }

  /**
   * Calculate week structure within defined months.
   *
   * @private
   * @param {number} [year] Year for the calculation.
   */
  calculateWeekStructure(year = this.getYear()) {
    this.monthListCache[year] = this.calculateMonthData(year);

    const firstWeekDay = this.getFirstWeekDay();
    const monthList = this.getMonthList(year);
    const mixedMonthToAdd = [];
    const daysBeforeFullWeeksRatio = this.hideDaysBeforeFullWeeks ? 0 : 1;
    const daysAfterFullWeeksRatio = this.hideDaysAfterFullWeeks ? 0 : 1;
    let weekOffset = 0;
    let weekSectionCount = 0;

    if (firstWeekDay === 'monday') {
      weekOffset = 1;
    }

    arrayEach(monthList, (currentMonth, monthIndex) => {
      const firstMonthDay = new Date(year, monthIndex, 1).getDay();
      let mixedMonthsAdded = 0;

      currentMonth.daysBeforeFullWeeks = (7 - firstMonthDay + weekOffset) % 7;

      if (!this.allowSplitWeeks && currentMonth.daysBeforeFullWeeks) {
        mixedMonthToAdd.push(getMixedMonthObject(getMixedMonthName(monthIndex, monthList), monthIndex));
        mixedMonthsAdded += 1;
      }

      currentMonth.fullWeeks = Math.floor((currentMonth.days - currentMonth.daysBeforeFullWeeks) / 7);
      currentMonth.daysAfterFullWeeks = currentMonth.days - currentMonth.daysBeforeFullWeeks - (7 * currentMonth.fullWeeks);

      if (!this.allowSplitWeeks) {
        if (monthIndex === monthList.length - 1 && currentMonth.daysAfterFullWeeks) {
          mixedMonthToAdd.push(getMixedMonthObject(getMixedMonthName(monthIndex, monthList), null));
          mixedMonthsAdded += 1;
        }

        weekSectionCount += currentMonth.fullWeeks + mixedMonthsAdded;

      } else {
        const numberOfPartialWeeksBefore = (daysBeforeFullWeeksRatio * (currentMonth.daysBeforeFullWeeks ? 1 : 0));
        const numberOfPartialWeeksAfter = (daysAfterFullWeeksRatio * (currentMonth.daysAfterFullWeeks ? 1 : 0));

        weekSectionCount += currentMonth.fullWeeks + numberOfPartialWeeksBefore + numberOfPartialWeeksAfter;
      }
    });

    arrayEach(mixedMonthToAdd, (monthObject, monthIndex) => {
      const index = monthObject.index;

      delete monthObject.index;

      this.addMixedMonth(index === null ? index : monthIndex + index, monthObject, year);
    });

    if (year === this.getYear()) {
      this.weekSectionCount = weekSectionCount;
    }
  }

  /**
   * Add a mixed (e.g. 'Jan/Feb') month to the month list.
   *
   * @private
   * @param {number} index Index for the month.
   * @param {object} monthObject The month object.
   * @param {number} [year] Year for the calculation.
   */
  addMixedMonth(index, monthObject, year) {
    if (index === null) {
      this.monthListCache[year].push(monthObject);

    } else {
      this.monthListCache[year].splice(index, 0, monthObject);
    }
  }

}

export default DateCalculator;
