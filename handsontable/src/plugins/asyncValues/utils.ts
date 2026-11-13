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
 * Builds the key that names a cell within one write: its row and column property.
 *
 * @param {number} row The row of the change.
 * @param {string|number} prop The column property of the change.
 * @returns {string}
 */
export function getChangeKey(row: number, prop: AsyncValueProp): string {
  return `${row}:${prop}`;
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
