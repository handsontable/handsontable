/**
 * Throws an Error with a Handsontable-specific cause for easy identification.
 *
 * Use this helper instead of `throw new Error()` to ensure all Handsontable errors
 * can be recognized by checking `error.cause?.handsontable === true`.
 *
 * @param message The error message to display.
 * @throws {Error} Always throws an Error with `cause: { handsontable: true }`.
 */
export function throwWithCause(message: string): never {
  // eslint-disable-next-line handsontable/no-native-error-throw
  throw new Error(message, {
    cause: { handsontable: true }
  });
}
