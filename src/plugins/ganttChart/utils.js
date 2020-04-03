/**
 * Day count for December.
 *
 * @type {number}
 */
export const DEC_LENGTH = 31;
/**
 * Day count for a week.
 *
 * @type {number}
 */
export const WEEK_LENGTH = 7;

/**
 * Generate a mixed month object.
 *
 * @private
 * @param {string} monthName The month name.
 * @param {number} index Index for the mixed month.
 * @returns {object} The month object.
 */
export function getMixedMonthObject(monthName, index) {
  return {
    name: monthName,
    days: WEEK_LENGTH,
    daysBeforeFullWeeks: 0,
    daysAfterFullWeeks: 0,
    fullWeeks: 1,
    index
  };
}

/**
 * Generate the name for a mixed month.
 *
 * @private
 * @param {number} afterMonthIndex Index of the month after the mixed one.
 * @param {Array} monthList List of the months.
 * @returns {string} Name for the mixed month.
 */
export function getMixedMonthName(afterMonthIndex, monthList) {
  let mixedMonthName = null;
  const afterMonthShorthand = getShorthand(monthList[afterMonthIndex].name);
  const beforeMonthShorthand = afterMonthIndex > 0 ? getShorthand(monthList[afterMonthIndex - 1].name) : null;
  const firstMonthShorthand = getShorthand(monthList[0].name);
  const lastMonthShorthand = getShorthand(monthList[monthList.length - 1].name);

  if (afterMonthIndex > 0) {
    mixedMonthName = `${beforeMonthShorthand}/${afterMonthShorthand}`;

  } else if (afterMonthIndex === monthList.length - 1) {
    mixedMonthName = `${afterMonthShorthand}/${firstMonthShorthand}`;

  } else {
    mixedMonthName = `${lastMonthShorthand}/${afterMonthShorthand}`;
  }

  return mixedMonthName;
}

/**
 * Get the three first letters from the provided month name.
 *
 * @private
 * @param {string} monthName The month name.
 * @returns {string} The three-lettered shorthand for the month name.
 */
export function getShorthand(monthName) {
  const MONTH_SHORT_LEN = 3;
  return monthName.substring(0, MONTH_SHORT_LEN);
}

/**
 * Get the start date of the provided range bar.
 *
 * @param {object} rangeBar The range bar object.
 * @returns {Date} The start date.
 */
export function getStartDate(rangeBar) {
  return parseDate(Array.isArray(rangeBar) ? rangeBar[1] : rangeBar.startDate);
}

/**
 * Get the end date of the provided range bar.
 *
 * @param {object} rangeBar The range bar object.
 * @returns {Date} The end date.
 */
export function getEndDate(rangeBar) {
  return parseDate(Array.isArray(rangeBar) ? rangeBar[2] : rangeBar.endDate);
}

/**
 * Get the additional data object of the provided range bar.
 *
 * @param {object} rangeBar The range bar object.
 * @returns {object} The additional data object.
 */
export function getAdditionalData(rangeBar) {
  return Array.isArray(rangeBar) ? rangeBar[3] : rangeBar.additionalData;
}

/**
 * Set the start date of the provided range bar.
 *
 * @param {object} rangeBar The range bar object.
 * @param {Date} value The new start date value.
 */
export function setStartDate(rangeBar, value) {
  if (Array.isArray(rangeBar)) {
    rangeBar[1] = value;

  } else {
    rangeBar.startDate = value;
  }
}

/**
 * Set the end date of the provided range bar.
 *
 * @param {object} rangeBar The range bar object.
 * @param {Date} value The new end date value.
 */
export function setEndDate(rangeBar, value) {
  if (Array.isArray(rangeBar)) {
    rangeBar[2] = value;

  } else {
    rangeBar.endDate = value;
  }
}

/**
 * Parse the provided date and check if it's valid.
 *
 * @param {string|Date} date Date string or object.
 * @returns {Date|null} Parsed Date object or null, if not a valid date string.
 */
export function parseDate(date) {
  let newDate = date;

  if (newDate === null) {
    return null;
  }

  if (!(newDate instanceof Date)) {
    newDate = new Date(newDate);

    if (newDate.toString() === 'Invalid Date') {
      return null;
    }
  }

  return newDate;
}

/**
 * Get the year of the provided date.
 *
 * @param {Date|string} date Date to get the year from.
 * @returns {number|null} The year from the provided date.
 */
export function getDateYear(date) {
  const newDate = parseDate(date);

  return newDate ? newDate.getFullYear() : null;
}
