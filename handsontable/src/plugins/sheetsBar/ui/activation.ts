/**
 * Tells a keyboard activation of a button apart from a pointer one.
 *
 * A `click` fired by Enter or Space reports a `detail` of 0, while a pointer click reports how
 * many times the button was pressed. The distinction decides whether a menu opening from the
 * button preselects its first item: a keyboard user needs somewhere for focus to land and a
 * screen reader needs a `menuitem` to announce, whereas doing it for a mouse user leaves an
 * item looking pressed that nobody asked for.
 *
 * @param {MouseEvent} event The click event to classify.
 * @returns {boolean} `true` when the click came from the keyboard.
 */
export function isKeyboardActivation(event: MouseEvent): boolean {
  return event.detail === 0;
}
