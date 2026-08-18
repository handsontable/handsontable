/**
 * Throws an Error with a Handsontable-specific cause for easy identification.
 *
 * Use this helper instead of `throw new Error()` to ensure all Handsontable errors
 * can be recognized by checking `error.cause?.handsontable === true`.
 *
 * The cause is assigned after construction rather than passed as the `new Error(message, options)`
 * options bag: that overload is ES2022 (Chrome 94 / Firefox 91 / Safari 15.0), above the floor
 * declared in `../../../browser-targets.js`. Engines below it ignore the second argument silently,
 * which would leave `error.cause` undefined and break detection with no visible failure.
 *
 * @param message The error message to display.
 * @throws {Error} Always throws an Error with `cause: { handsontable: true }`.
 */
export function throwWithCause(message: string): never {
  const error: Error & { cause?: unknown } = new Error(message);

  error.cause = { handsontable: true };

  throw error;
}
