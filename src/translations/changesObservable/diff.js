/**
 * An array diff implementation.
 *
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
      oldValue: void 0,
      newValue: newArray[i],
    });
  }

  for (; j < baseArray.length; j++) {
    changes.push({
      op: 'remove',
      index: j,
      oldVvalue: baseArray[j],
      newVvalue: void 0,
    });
  }

  return changes;
}
