/**
 * Presses whose listener asked `TableView` to keep the page's text selection.
 *
 * `TableView` clears the page's text selection on a press that does not allow text selection. A
 * listener that claims the press and keeps a text field's caret alive (the FormulaBuilder reference
 * pick) marks it here instead of reusing `isImmediatePropagationStopped()`: other plugins set that flag
 * on their own presses, and those still clear the selection. The set holds events weakly, so a mark
 * goes away with its event.
 */
const keptSelectionEvents = new WeakSet<Event>();

/**
 * Marks a press so that `TableView` keeps the page's text selection for it.
 *
 * @param {Event} event The press event.
 */
export function keepPageTextSelection(event: Event): void {
  keptSelectionEvents.add(event);
}

/**
 * Checks whether a press was marked by `keepPageTextSelection()`.
 *
 * @param {Event} event The press event.
 * @returns {boolean}
 */
export function isPageTextSelectionKept(event: Event): boolean {
  return keptSelectionEvents.has(event);
}
