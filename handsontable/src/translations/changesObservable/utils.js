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
export function arrayDiff(baseArray, newArray) {
  const changes = [];
  let i = 0;
  let j = 0;

  /* eslint-disable no-plusplus */
  for (; i < baseArray.length && j < newArray.length; i++, j++) {
    if (baseArray[i] !== newArray[j]) {
      changes.push({
        op: 'replace',
        index: j,
        oldValue: baseArray[i],
        newValue: newArray[j],
      });
    }
  }

  for (; i < newArray.length; i++) {
    changes.push({
      op: 'insert',
      index: i,
      oldValue: undefined,
      newValue: newArray[i],
    });
  }

  for (; j < baseArray.length; j++) {
    changes.push({
      op: 'remove',
      index: j,
      oldValue: baseArray[j],
      newValue: undefined,
    });
  }

  return changes;
}
