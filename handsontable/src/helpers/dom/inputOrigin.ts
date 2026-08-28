/**
 * Helpers that tell where an input event came from. Deliberately NOT re-exported through
 * `Handsontable.dom` (see `src/index.ts`): the detection is a browser-quirk heuristic that may
 * change, so it stays internal.
 */

/**
 * How long (ms) after a touch gesture the browser-synthesized `mousedown`/`mouseup`/`click`
 * sequence is still expected when the engine does not report the input origin (WebKit,
 * Firefox). Shared by Walkontable's mouse listeners and TableView's outside-click handling so
 * both layers agree on which events are synthesized. WebKit delivers the sequence within
 * ~350 ms even with double-tap-zoom detection.
 */
export const TOUCH_SYNTHESIZED_MOUSE_WINDOW = 500;

/**
 * Shape of a UI event on engines that implement the InputDeviceCapabilities API (Blink).
 */
interface EventWithSourceCapabilities extends Event {
  sourceCapabilities?: { firesTouchEvents: boolean } | null;
}

/**
 * Checks whether the event carries the `sourceCapabilities` property.
 *
 * @param {Event} event The event object.
 * @returns {boolean}
 */
function hasSourceCapabilities(event: Event): event is EventWithSourceCapabilities {
  return 'sourceCapabilities' in event;
}

/**
 * Checks whether the browser reports that a mouse event was synthesized from a touch gesture.
 * Browsers that fire touch events synthesize a `mousedown`/`mouseup`/`click` sequence after
 * `touchend` for compatibility. Only Blink exposes the origin (`sourceCapabilities.firesTouchEvents`);
 * WebKit and Firefox do not, and script-dispatched events carry `null`. In those cases the function
 * returns `undefined` so the caller can fall back to a timing heuristic.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean|undefined} `true` when synthesized from touch, `false` when it comes from a
 *                              non-touch device, `undefined` when the browser does not tell.
 */
export function isTouchSynthesizedMouseEvent(event: Event): boolean | undefined {
  if (hasSourceCapabilities(event) && event.sourceCapabilities) {
    return event.sourceCapabilities.firesTouchEvents === true;
  }

  return undefined;
}
