/**
 * Renders a rejected setting value for a warning message.
 *
 * Nothing here may throw. The callers run inside a settings getter during a draw or inside
 * `updateSettings`, and only on the path that is already falling back, so a throw would turn a soft
 * fallback into a dead grid.
 *
 * `JSON.stringify` throws on a `BigInt` and on a circular object. `String()` is not safe either: it
 * throws on an object with no prototype (`Object.create(null)`) and on one whose `toString`,
 * `valueOf`, or `Symbol.toPrimitive` throws – and a framework can hand any of those to a setting.
 * `Object.prototype.toString` never calls user code, so it is the fallback.
 *
 * @param {*} value The value that could not be read.
 * @returns {string}
 */
export function describeValue(value: unknown): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }

  try {
    return String(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}
