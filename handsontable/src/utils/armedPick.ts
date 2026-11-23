/**
 * The single-pointer alternative to a drag: "click, then click". A click on a grab handle arms the gesture, the
 * next click picks the target, and Escape cancels. The helper owns the listening; the caller owns what the
 * target means and what is committed.
 */
export interface ArmedPickOptions {
  /**
   * The document the gesture listens on.
   */
  doc: Document;
  /**
   * Tells whether a target belongs to the control that armed the gesture. A press on it is left alone, so the
   * control can end the gesture itself (a second click on it, or a press that starts a drag).
   */
  isAnchor: (target: EventTarget | null) => boolean;
  /**
   * Called with the click that picked the target. Anything the browser would do with that click is already
   * prevented.
   */
  onPick: (event: MouseEvent) => void;
  /**
   * Called once when the gesture ends. The reason is `picked` for the click that chose a target, `escape` for the
   * user cancelling it, and `abandoned` for the caller ending it (`cancel()`), which the user did not ask for.
   */
  onEnd: (reason: ArmedPickEnd) => void;
}

export type ArmedPickEnd = 'picked' | 'escape' | 'abandoned';

export interface ArmedPick {
  /**
   * Ends the gesture without picking a target. Does nothing when it has ended already.
   */
  cancel: () => void;
}

/**
 * Resolves the element an event came from, through the shadow roots of a grid hosted in one.
 *
 * @param {Event} event The event.
 * @returns {EventTarget | null}
 */
function getOriginTarget(event: Event): EventTarget | null {
  return event.composedPath?.()[0] ?? event.target;
}

/**
 * Starts listening for the click that picks a target.
 *
 * The press that precedes the click is swallowed (`pointerdown` and `mousedown`), so a pick does not also select a
 * cell, open an editor or start another gesture. The click is the commit, so a press that moves away from the
 * target before the release picks nothing the user did not see.
 *
 * @param {ArmedPickOptions} options The options.
 * @returns {ArmedPick}
 */
export function armPick(options: ArmedPickOptions): ArmedPick {
  const { doc, isAnchor, onPick, onEnd } = options;
  let ended = false;

  const end = (reason: ArmedPickEnd) => {
    if (ended) {
      return;
    }

    ended = true;
    doc.removeEventListener('pointerdown', onPress, true);
    doc.removeEventListener('mousedown', onPress, true);
    doc.removeEventListener('touchstart', onTouch, true);
    doc.removeEventListener('touchend', onTouch, true);
    doc.removeEventListener('pointercancel', onCancel, true);
    doc.removeEventListener('click', onClick, true);
    doc.removeEventListener('keydown', onKey, true);
    onEnd(reason);
  };
  // The click of the gesture that armed the pick can come after it (the release that armed it may land beside the
  // control), and it must not pick. Only a click whose press this listener saw picks.
  let pressed = false;
  const onPress = (event: Event) => {
    if (isAnchor(getOriginTarget(event))) {
      return;
    }

    pressed = true;
    event.preventDefault();
    event.stopPropagation();
  };
  // The grid selects the cell under a tap from its own touch listeners (a tap is a `touchend` there, not a click), so
  // they must not see the taps that pick. Only propagation is stopped: the default stays, or the tap would not scroll
  // and would not produce the click that picks.
  const onTouch = (event: Event) => {
    if (!isAnchor(getOriginTarget(event))) {
      event.stopPropagation();
    }
  };
  // a touch the browser took over for scrolling is not a tap, so its click never comes
  const onCancel = () => {
    pressed = false;
  };
  const onClick = (event: MouseEvent) => {
    if (isAnchor(getOriginTarget(event)) || !pressed) {
      return;
    }

    pressed = false;

    event.preventDefault();
    event.stopPropagation();
    onPick(event);
    end('picked');
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      end('escape');
    }
  };

  doc.addEventListener('pointerdown', onPress, true);
  doc.addEventListener('mousedown', onPress, true);
  doc.addEventListener('touchstart', onTouch, true);
  doc.addEventListener('touchend', onTouch, true);
  doc.addEventListener('pointercancel', onCancel, true);
  doc.addEventListener('click', onClick, true);
  doc.addEventListener('keydown', onKey, true);

  return { cancel: () => end('abandoned') };
}
