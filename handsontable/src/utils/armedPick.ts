/**
 * The single-pointer alternative to a drag: "click, then click". A click on a grab handle arms the gesture, the
 * next click on the grid picks the target, and Escape cancels. The helper owns the listening; the caller owns what the
 * target means and what is committed.
 */
export interface ArmedPickOptions {
  /**
   * The document the gesture listens on.
   */
  doc: Document;
  /**
   * The grid's root element. A press or a click outside it is not for the grid: it ends the gesture and goes on to the
   * page untouched, so arming by accident never costs the user their next click on a button or a link.
   */
  root: Element;
  /**
   * Tells whether a target belongs to a control that can arm the gesture. A press on it is left alone, so the control
   * can end the gesture itself (a second click on it, a press that starts a drag, or a press that arms another one).
   */
  isAnchor: (target: EventTarget | null) => boolean;
  /**
   * Called with the click that picked the target. Anything the browser would do with that click is already
   * prevented. The gesture ends after it returns, or throws.
   */
  onPick: (event: MouseEvent) => void;
  /**
   * Called once when the gesture ends. The reason is `picked` for the click that chose a target, `escape` for the
   * user cancelling it, and `abandoned` for the caller ending it (`cancel()`) or a press outside the grid, which the
   * user did not ask to cancel.
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
 * target before the release picks nothing the user did not see. Only the primary button takes part: a right press
 * opens the context menu as usual.
 *
 * @param {ArmedPickOptions} options The options.
 * @returns {ArmedPick}
 */
export function armPick(options: ArmedPickOptions): ArmedPick {
  const { doc, root, isAnchor, onPick, onEnd } = options;
  let ended = false;

  const isInsideRoot = (event: Event) => {
    const origin = getOriginTarget(event);

    return event.composedPath?.().includes(root) || (origin instanceof Node && root.contains(origin));
  };
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

    if (!isInsideRoot(event)) {
      end('abandoned');

      return;
    }

    if ('button' in event && event.button !== 0) {
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
    if (!isAnchor(getOriginTarget(event)) && isInsideRoot(event)) {
      event.stopPropagation();
    }
  };
  // a touch the browser took over for scrolling is not a tap, so its click never comes
  const onCancel = () => {
    pressed = false;
  };
  const onClick = (event: MouseEvent) => {
    if (isAnchor(getOriginTarget(event))) {
      return;
    }

    if (!isInsideRoot(event)) {
      end('abandoned');

      return;
    }

    if (!pressed) {
      return;
    }

    pressed = false;

    event.preventDefault();
    event.stopPropagation();

    try {
      onPick(event);
    } finally {
      end('picked');
    }
  };
  // Escape is not stopped: it may be what closes a dialog or an editor around the grid, and a pick that is cancelled
  // along with it is not a loss.
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
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
