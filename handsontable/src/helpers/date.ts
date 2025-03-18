/**
 * Get normalized Date object for the ISO formatted date strings.
 * Natively, the date object parsed from a ISO 8601 string will be offsetted by the timezone difference, which may result in returning a wrong date.
 * See: Github issue #3338.
 *
 * @param {string} dateString String representing the date.
 * @returns {Date} The proper Date object.
 */
export function getNormalizedDate(dateString) {
  const nativeDate = new Date(dateString);

  // NaN if dateString is not in ISO format
  if (!isNaN(new Date(`${dateString}T00:00`).getDate())) {

    // Compensate timezone offset
    return new Date(nativeDate.getTime() + (nativeDate.getTimezoneOffset() * 60000));
  }

  return nativeDate;
}
