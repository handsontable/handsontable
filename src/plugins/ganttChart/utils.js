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
