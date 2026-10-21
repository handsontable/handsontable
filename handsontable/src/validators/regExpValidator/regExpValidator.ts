/**
 * Wraps a regular expression in a validator function.
 *
 * @private
 * @param {RegExp} expression The regular expression that a valid value must match.
 * @returns {Function} The validator function.
 */
export function regExpValidator(expression: RegExp) {
  return function(cellValue: unknown, validatorCallback: (valid: boolean) => void): void {
    // Global (`g`) and sticky (`y`) flags make `RegExp#test` stateful through
    // `lastIndex`. Reset before every cell so repeated `validateCells()` runs
    // (and cells that share one pattern) get a stable result (DEV-110).
    expression.lastIndex = 0;
    validatorCallback(expression.test(cellValue as string));
  };
}
