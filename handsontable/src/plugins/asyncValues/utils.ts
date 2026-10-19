import type { AsyncValueProp } from './types';

/**
 * One value to write: a row (visual or physical, by the write path), a column property, and the value.
 */
export type Change = [number, AsyncValueProp, unknown];

/**
 * Turns a rejection reason into the message shown on the cell.
 *
 * @param {*} error The rejection reason.
 * @returns {string}
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const { message } = error as { message?: unknown };

    return typeof message === 'string' ? message : '';
  }

  return error === undefined || error === null ? '' : String(error);
}

/**
 * Tells whether a value is a column property the plugin can address.
 *
 * @param {*} prop The value.
 * @returns {boolean}
 */
export function isProp(prop: unknown): prop is AsyncValueProp {
  return typeof prop === 'string' || typeof prop === 'number';
}

/**
 * Tells whether a value is array-like: an array, or an object with a non-negative integer `length`.
 *
 * @param {*} value The value.
 * @returns {boolean}
 */
export function isArrayLike(value: unknown): value is ArrayLike<unknown> {
  if (Array.isArray(value)) {
    return true;
  }

  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { length } = value as { length?: unknown };

  return Number.isInteger(length) && (length as number) >= 0;
}

/**
 * Pushes a change into the list of a write source.
 *
 * @param {Map} lists The lists, by write source.
 * @param {string} source The write source.
 * @param {Array} change The change.
 */
export function pushChange(lists: Map<string, Change[]>, source: string, change: Change): void {
  const list = lists.get(source);

  if (list) {
    list.push(change);

  } else {
    lists.set(source, [change]);
  }
}

/**
 * Lists the rows and the columns of copied ranges in the order the copied data lays them out.
 *
 * @param {object[]} ranges The copied ranges.
 * @returns {object}
 */
export function readCopiedAxes(ranges: Array<Record<string, number>>): { rows: number[]; columns: number[] } {
  const rows: number[] = [];
  const columns: number[] = [];
  const seenRows = new Set<number>();
  const seenColumns = new Set<number>();
  const add = (list: number[], seen: Set<number>, from: number, to: number) => {
    for (let index = Math.min(from, to); index <= Math.max(from, to); index++) {
      if (!seen.has(index)) {
        seen.add(index);
        list.push(index);
      }
    }
  };

  ranges.forEach((range) => {
    add(rows, seenRows, range.startRow, range.endRow);
    add(columns, seenColumns, range.startCol, range.endCol);
  });

  return { rows, columns };
}
