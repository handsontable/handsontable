/**
 * Day count for December.
 *
 * @type {Number}
 */
export const DEC_LENGTH = 31;
/**
 * Day count for a week.
 *
 * @type {Number}
 */
export const WEEK_LENGTH = 7;

/**
 * Generate a mixed month object.
 *
 * @private
 * @param {String} monthName The month name.
 * @param {Number} index Index for the mixed month.
 * @returns {Object} The month object.
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
 * @param {Number} afterMonthIndex Index of the month after the mixed one.
 * @param {Array} monthList List of the months.
 * @returns {String} Name for the mixed month.
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
 * @param {String} monthName The month name.
 * @returns {String} The three-lettered shorthand for the month name.
 */
export function getShorthand(monthName) {
  const MONTH_SHORT_LEN = 3;
  return monthName.substring(0, MONTH_SHORT_LEN);
}
