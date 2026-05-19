const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86400000;

/**
 * Converts a JavaScript `Date` to an Excel date serial number.
 *
 * @private
 * @param {Date} date The date to convert.
 * @returns {number}
 */
export function toExcelDateSerial(date) {
  const localDateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.round((localDateUtc - EXCEL_EPOCH_UTC) / MS_PER_DAY);
}

/**
 * Parses an ISO 8601 date string (`'YYYY-MM-DD'`) to an Excel date serial number.
 *
 * @private
 * @param {*} value Cell value — expected to be an ISO 8601 string.
 * @returns {number|null}
 */
export function parseIsoStringToSerial(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return toExcelDateSerial(date);
}

/**
 * Parses a time string to an Excel time serial number (fractional day: 0.0–1.0).
 *
 * Supports 24-hour formats (`'HH:mm'`, `'HH:mm:ss'`) and 12-hour formats
 * (`'h:mm AM/PM'`, `'h:mm:ss AM/PM'`).
 *
 * @private
 * @param {*} value Cell value — expected to be a time string.
 * @returns {number|null}
 */
export function parseTimeStringToSerial(value) {
  if (!value) {
    return null;
  }

  const str = String(value).trim();
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    const seconds = match24[3] ? parseInt(match24[3], 10) : 0;

    if (hours > 23 || minutes > 59 || seconds > 59) {
      return null;
    }

    return ((hours * 3600) + (minutes * 60) + seconds) / 86400;
  }

  const match12 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const seconds = match12[3] ? parseInt(match12[3], 10) : 0;
    const period = match12[4].toUpperCase();

    if (hours > 12 || minutes > 59 || seconds > 59) {
      return null;
    }

    if (period === 'AM' && hours === 12) {
      hours = 0;
    } else if (period === 'PM' && hours !== 12) {
      hours += 12;
    }

    return ((hours * 3600) + (minutes * 60) + seconds) / 86400;
  }

  return null;
}

/**
 * Returns the Excel `numFmt` string for a date cell (OOXML built-in format ID 14).
 *
 * @private
 * @returns {string}
 */
export function getDateNumFmt() {
  return 'mm-dd-yy';
}

/**
 * Returns the Excel `numFmt` string for a time cell.
 *
 * @private
 * @returns {string}
 */
export function getTimeNumFmt() {
  return 'h:mm:ss';
}
