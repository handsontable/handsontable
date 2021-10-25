/**
 * An array diff implementation. The function iterates through the arrays and depends
 * on the diff results, collect the changes as a list of the objects.
 *
 * Each object contains information about the differences in the indexes of the arrays.
 * The changes also contain data about the new and previous array values.
 *
 * @private
 * @param {Array} baseArray The base array to diff from.
 * @param {Array} newArray The new array to compare with.
 * @returns {Array}
 */
export function arrayDiff(baseArray: any[], newArray: any[]): any[];
