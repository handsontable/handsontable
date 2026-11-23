import type EventManager from '../../eventManager';
import type { HotInstance } from '../../core/types';
import { getComposedEventTargetEl } from './element';

/**
 * What {@link armPressRelease} is given.
 */
export interface PressReleaseOptions {
  /**
   * Tells whether the release landed on the control the press started on. Compare something the
   * renders keep (a coordinate, an index, a data attribute), not a DOM node, because a render
   * replaces the nodes between the press and the release.
   *
   * @param releaseTarget The element the release landed on, resolved through the shadow tree.
   * @param releaseEvent The `mouseup` event.
   */
  isSame: (releaseTarget: HTMLElement | null, releaseEvent: MouseEvent) => boolean;
  /**
   * Runs once when the press ends on the same control.
   *
   * @param releaseEvent The `mouseup` event.
   */
  onRelease: (releaseEvent: MouseEvent) => void;
  /**
   * Runs once when the press ends elsewhere, or is abandoned (Escape, a drag the browser starts, the
   * window losing the focus).
   */
  onCancel?: () => void;
}

/**
 * Resolves the coordinates of a cell or header only when it belongs to the given grid. A release can land on
 * another grid's cell, or on an unrelated table, whose coordinates would otherwise read as the pressed
 * control's own.
 *
 * @param hot The grid the press started in.
 * @param cell The cell or header the release landed on.
 * @returns The coordinates, or `null` for a missing cell or one of another grid.
 */
export function getCoordsWithinGrid(hot: Pick<HotInstance, 'rootElement' | 'getCoords'>, cell: HTMLElement | null) {
  return cell !== null && hot.rootElement.contains(cell) ? hot.getCoords(cell) : null;
}

/**
 * Defers the action of a pressed control to the release, so the user can cancel it by moving the pointer
 * off the control before letting go (WCAG 2.5.2, Pointer Cancellation). Call it from the `mousedown`
 * handler instead of acting there.
 *
 * It listens on the document in the capture phase, so a release outside the grid, or one a listener
 * stops, still ends the press. Only the release of the button that started the press counts. A release on
 * the same control calls `onRelease`; any other release, Escape, a browser drag start, or the window
 * losing the focus calls `onCancel`. Whichever comes first wins, and the listeners are gone after it.
 *
 * A tap needs none of this: Walkontable replays it at `touchend`, which already is the release. A long press
 * is the exception: Walkontable replays it while the finger is still down, with no release behind it yet. It
 * marks that replay (`markLongPressReplay()`, `helpers/dom/longPress.ts`), and a caller that acts on a touch
 * press skips the action when `isLongPressReplay(event)` is true. It still claims the press.
 *
 * @param eventManager The event manager the listeners belong to, so the owner's teardown removes them.
 * @param rootDocument The document of the grid.
 * @param pressEvent The `mousedown` event that started the press.
 * @param options The release and cancel callbacks.
 * @returns A function that drops the press without calling either callback.
 */
export function armPressRelease(
  eventManager: EventManager,
  rootDocument: Document,
  pressEvent: MouseEvent,
  options: PressReleaseOptions
): () => void {
  const removers: Array<() => void> = [];
  let isSettled = false;

  const dispose = () => {
    isSettled = true;
    removers.splice(0).forEach(remove => remove());
  };

  const settle = (callback: () => void) => {
    if (isSettled) {
      return;
    }

    dispose();
    callback();
  };

  const cancel = () => settle(() => options.onCancel?.());

  removers.push(
    eventManager.addEventListener<MouseEvent>(rootDocument, 'mouseup', (event) => {
      if (event.button !== pressEvent.button) {
        return;
      }

      if (options.isSame(getComposedEventTargetEl(event), event)) {
        settle(() => options.onRelease(event));
      } else {
        cancel();
      }
    }, true),
    eventManager.addEventListener<KeyboardEvent>(rootDocument, 'keydown', (event) => {
      if (event.key === 'Escape') {
        cancel();
      }
    }, true),
    eventManager.addEventListener(rootDocument, 'dragstart', cancel, true)
  );

  if (rootDocument.defaultView) {
    removers.push(eventManager.addEventListener(rootDocument.defaultView, 'blur', cancel));
  }

  return dispose;
}
