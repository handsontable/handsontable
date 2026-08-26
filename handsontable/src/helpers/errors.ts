/**
 * Throws an Error with a Handsontable-specific cause for easy identification.
 *
 * Use this helper instead of `throw new Error()` to ensure all Handsontable errors
 * can be recognized by checking `error.cause?.handsontable === true`.
 *
 * The cause is assigned after construction rather than passed as the `new Error(message, options)`
 * options bag. That overload is ES2022 (Chrome 94 / Firefox 91 / Safari 15.0) and sits well inside
 * the floor declared in `../../../browser-targets.js`, so this is no longer a compatibility
 * requirement. It stays because the failure mode has no symptom: an engine that accepts the second
 * argument and drops it leaves `error.cause` undefined, and every `error.cause?.handsontable ===
 * true` check then reads false with nothing thrown or logged.
 *
 * @param message The error message to display.
 * @throws {Error} Always throws an Error with `cause: { handsontable: true }`.
 */
export function throwWithCause(message: string): never {
  const error: Error & { cause?: unknown } = new Error(message);

  error.cause = { handsontable: true };

  throw error;
}
