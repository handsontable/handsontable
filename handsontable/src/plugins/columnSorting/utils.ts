import moment from 'moment';
import { isObject } from '../../helpers/object';
import { isRightClick } from '../../helpers/dom/event';
import { eventTargetEl, isBottomMostColumnHeader } from '../../helpers/dom/element';
import { isEmpty } from '../../helpers/mixed';
import { parseToLocalDate, parseToLocalTime } from '../../helpers/dateTime';
import { DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND } from './sortService';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';

export const ASC_SORT_STATE = 'asc';
export const DESC_SORT_STATE = 'desc';
export const HEADER_SPAN_CLASS = 'colHeader';

/**
 * Get if column state is valid.
 *
 * @param {number} columnState Particular column state.
 * @returns {boolean}
 */
function isValidColumnState(columnState: unknown): columnState is { column: number; sortOrder: string } {
  if (isObject(columnState) === false) {
    return false;
  }

  const { column, sortOrder } = columnState as { column: unknown; sortOrder: unknown };

  return Number.isInteger(column) && [ASC_SORT_STATE, DESC_SORT_STATE].includes(sortOrder as string);
}

/**
 * Get if all sorted columns states are valid.
 *
 * @param {Array} sortStates The sort state collection.
 * @returns {boolean}
 */
export function areValidSortStates(sortStates: unknown[]) {
  if (sortStates.some((columnState: unknown) => isValidColumnState(columnState) === false)) {
    return false;
  }

  const validStates = sortStates.filter(isValidColumnState);
  const sortedColumns = validStates.map(state => state.column);

  // Indexes occurs only once.
  return new Set(sortedColumns).size === sortedColumns.length;
}

/**
 * Get next sort order for particular column. The order sequence looks as follows: 'asc' -> 'desc' -> undefined -> 'asc'.
 *
 * @param {string|undefined} sortOrder Sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
 * @returns {string|undefined} Next sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
 */
export function getNextSortOrder(sortOrder?: string) {
  if (sortOrder === DESC_SORT_STATE) {
    return;

  } else if (sortOrder === ASC_SORT_STATE) {
    return DESC_SORT_STATE;
  }

  return ASC_SORT_STATE;
}

/**
 * Get `span` DOM element inside `th` DOM element.
 *
 * @param {Element} TH Th HTML element.
 * @returns {Element | null}
 */
export function getHeaderSpanElement(TH: HTMLTableCellElement): HTMLElement | null {
  const headerSpanElement = TH.querySelector<HTMLElement>(`.${HEADER_SPAN_CLASS}`);

  return headerSpanElement;
}

/**
 *
 * Get if handled header is first level column header.
 *
 * @param {number} column Visual column index.
 * @param {Element} TH Th HTML element.
 * @returns {boolean}
 */
export function isFirstLevelColumnHeader(column: number, TH: HTMLTableCellElement) {
  if (column < 0) {
    return false;
  }

  return isBottomMostColumnHeader(TH);
}

/**
 *  Get if header was clicked properly. Click on column header and NOT done by right click return `true`.
 *
 * @param {number} row Visual row index.
 * @param {number} column Visual column index.
 * @param {Event} clickEvent Click event.
 * @returns {boolean}
 */
export function wasHeaderClickedProperly(row: number, column: number, clickEvent: Event) {
  if (column < 0 || row >= 0 || isRightClick(clickEvent)) {
    return false;
  }

  if (row === -1) {
    return true;
  }

  const targetHeader = typeof eventTargetEl(clickEvent)?.closest === 'function'
    ? eventTargetEl(clickEvent)!.closest('th')
    : null;

  return targetHeader !== null && isBottomMostColumnHeader(targetHeader);
}

/**
 * Creates date or time sorting compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {string} format Date or time format.
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function createDateTimeCompareFunction(
  sortOrder: string, format: string, columnPluginSettings: Record<string, unknown>
) {
  return function(value: unknown, nextValue: unknown) {
    const { sortEmptyCells } = columnPluginSettings;

    if (value === nextValue) {
      return DO_NOT_SWAP;
    }

    if (isEmpty(value)) {
      if (isEmpty(nextValue)) {
        return DO_NOT_SWAP;
      }

      // Just fist value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (isEmpty(nextValue)) {
      // Just second value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    const firstDate = moment(String(value), format);
    const nextDate = moment(String(nextValue), format);

    if (!firstDate.isValid()) {
      return FIRST_AFTER_SECOND;
    }

    if (!nextDate.isValid()) {
      return FIRST_BEFORE_SECOND;
    }

    if (nextDate.isAfter(firstDate)) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    if (nextDate.isBefore(firstDate)) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };
}

/**
 * Creates intl-date sorting compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {string} format Date or time format.
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function createIntlDateCompareFunction(
  sortOrder: string,
  format: Intl.DateTimeFormatOptions | string,
  columnPluginSettings: Record<string, unknown>
): (value: unknown, nextValue: unknown) => number {
  return function(value: unknown, nextValue: unknown) {
    const { sortEmptyCells } = columnPluginSettings;

    if (value === nextValue) {
      return DO_NOT_SWAP;
    }

    if (isEmpty(value)) {
      if (isEmpty(nextValue)) {
        return DO_NOT_SWAP;
      }

      // Just fist value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (isEmpty(nextValue)) {
      // Just second value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    const firstDate = parseToLocalDate(value);
    const nextDate = parseToLocalDate(nextValue);

    if (firstDate === null) {
      return FIRST_AFTER_SECOND;
    }

    if (nextDate === null) {
      return FIRST_BEFORE_SECOND;
    }

    if (nextDate > firstDate) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    if (nextDate < firstDate) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };
}

/**
 * Creates intl-time sorting compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {string} format Date or time format.
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function createIntlTimeCompareFunction(
  sortOrder: string,
  format: Intl.DateTimeFormatOptions | string,
  columnPluginSettings: Record<string, unknown>
): (value: unknown, nextValue: unknown) => number {
  return function(value: unknown, nextValue: unknown) {
    const { sortEmptyCells } = columnPluginSettings;

    if (value === nextValue) {
      return DO_NOT_SWAP;
    }

    if (isEmpty(value)) {
      if (isEmpty(nextValue)) {
        return DO_NOT_SWAP;
      }

      // Just fist value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (isEmpty(nextValue)) {
      // Just second value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    const firstDate = parseToLocalTime(value);
    const nextDate = parseToLocalTime(nextValue);

    if (firstDate === null) {
      return FIRST_AFTER_SECOND;
    }

    if (nextDate === null) {
      return FIRST_BEFORE_SECOND;
    }

    if (nextDate > firstDate) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    if (nextDate < firstDate) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };
}

/**
 * Warn users about problems when using `columnSorting` and `multiColumnSorting` plugins simultaneously.
 *
 * @param {string} workingPlugin The plugin that will work.
 * @param {string} disabledPlugin The plugin that will remain disabled.
 */
export function warnAboutPluginsConflict(workingPlugin: string, disabledPlugin: string) {
  warn(toSingleLine`Plugins \`columnSorting\` and \`multiColumnSorting\` should not be enabled simultaneously.\x20
    Only \`${workingPlugin}\` will work. The \`${disabledPlugin}\` plugin will remain disabled.`);
}
