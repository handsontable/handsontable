/**
 *
 * Deep search in object for specified symbol.
 *
 * @param {Object} object Object which is handled.
 * @param {Symbol} searchedSymbol Searched symbol.
 * @returns {*} Return null if key wasn't found.
 */
export default function getNestedObjectSymbols(object, searchedSymbol) {
  if (object[searchedSymbol]) {
    return object[searchedSymbol];
  }

  for (let symbol of Object.getOwnPropertySymbols(object)) {
    return getNestedObjectSymbols(object[symbol], searchedSymbol);
  }

  return null;
};
