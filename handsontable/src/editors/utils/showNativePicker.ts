/**
 * Shows the native picker of a date, time, or datetime-local input, unless the editor was opened with the keyboard.
 *
 * While Chromium shows a picker it takes the keys, so Tab, Escape, and the typed digits never reach the grid.
 * A keyboard user would meet that on the first key after Enter, so a keyboard open leaves the picker closed.
 * An open with a pointer, or with no event (the editor API), shows it. The native key of the browser
 * (for example Alt+ArrowDown in Chromium) shows the picker on demand.
 *
 * @param {HTMLInputElement} input The editor's native input.
 * @param {Event} [event] The event that opened the editor.
 */
export function showNativePicker(input: HTMLInputElement, event?: Event): void {
  // The type is read, not `instanceof`, so an event from another window (an iframe) counts too.
  if (event?.type.startsWith('key')) {
    return;
  }

  try {
    input.showPicker();
  } catch {
    // `showPicker()` throws without a user gesture, for example in tests.
  }
}

/**
 * Dismisses the native picker of a date, time, or datetime-local input that is still shown.
 *
 * There is no API to hide the picker, and Firefox keeps it open after the editor closes. Blurring the
 * input dismisses it.
 *
 * @param {HTMLInputElement} input The editor's native input.
 */
export function hideNativePicker(input: HTMLInputElement): void {
  try {
    if (input.matches(':open')) {
      input.blur();
    }
  } catch {
    // Engines without the `:open` pseudo-class (WebKit) throw on the selector
  }
}
