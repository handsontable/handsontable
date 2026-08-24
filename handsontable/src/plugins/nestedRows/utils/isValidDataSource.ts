import { isArrayOfObjects } from '../../../helpers/data';

/**
 * Checks whether the provided dataset can be handled by the Nested Rows plugin.
 *
 * @param {*} data Dataset to be checked.
 * @returns {boolean}
 */
export function isValidDataSource(data: unknown): boolean {
  return Array.isArray(data) && (data.length === 0 || isArrayOfObjects(data));
}
