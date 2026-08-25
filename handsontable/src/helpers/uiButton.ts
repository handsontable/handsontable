/**
 * The button types supported by the built-in UI components (`dialog`, `emptyDataState`,
 * `notification`). Each type maps to the `ht-button--<type>` modifier class.
 */
export const BUTTON_TYPES = ['primary', 'secondary'];

/**
 * The button type used when the configured one is not recognized.
 */
export const DEFAULT_BUTTON_TYPE = 'secondary';

/**
 * Resolves a caller-supplied button type to one of the supported values, falling back to
 * `secondary` for anything else.
 *
 * The UI components build their `ht-button--<type>` class from this value, so resolving it at the
 * render site keeps an unexpected value from breaking out of the class name (and, once that markup
 * is built with DOM APIs instead, from throwing `InvalidCharacterError` in `classList.add()`).
 */
export function resolveButtonType(type: unknown): string {
  return typeof type === 'string' && BUTTON_TYPES.includes(type) ? type : DEFAULT_BUTTON_TYPE;
}
