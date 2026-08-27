/**
 * A button type supported by the built-in UI components (`dialog`, `emptyDataState`,
 * `notification`). Each type maps to the `ht-button--<type>` modifier class.
 */
export type ButtonType = 'primary' | 'secondary';

/**
 * The supported button types. Kept module-local so the allowlist cannot be mutated from the
 * outside; use `isButtonType()` to test a value against it.
 */
const BUTTON_TYPES: readonly ButtonType[] = ['primary', 'secondary'];

/**
 * The button type used when the configured one is not recognized.
 */
const DEFAULT_BUTTON_TYPE: ButtonType = 'secondary';

/**
 * Checks whether the passed value is one of the supported button types.
 *
 * Both the settings validators and the render sites go through this, so a value the validator
 * accepts is exactly a value the markup can carry.
 */
export function isButtonType(type: unknown): type is ButtonType {
  return typeof type === 'string' && (BUTTON_TYPES as readonly string[]).includes(type);
}

/**
 * Resolves a caller-supplied button type to one of the supported values, falling back to
 * `secondary` for anything else.
 *
 * The UI components build their `ht-button--<type>` class from this value, so resolving it at the
 * render site keeps an unexpected value from breaking out of the class name (and, once that markup
 * is built with DOM APIs instead, from throwing `InvalidCharacterError` in `classList.add()`).
 */
export function resolveButtonType(type: unknown): ButtonType {
  return isButtonType(type) ? type : DEFAULT_BUTTON_TYPE;
}
