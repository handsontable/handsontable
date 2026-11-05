/**
 * Keeps the first click on a docs page from reaching its control two seconds late.
 *
 * `astro.config.mjs` loads Cookiebot's `uc.js` on every page. While the visitor has not answered
 * the banner and the banner runs in implied-consent mode, `uc.js` listens for clicks in the
 * capture phase of `document`. The first click on a button, a link, or an element with the class
 * `cookieconsent-implied-trigger` records consent, calls `stopPropagation()` and
 * `preventDefault()`, and removes the listener. Cookiebot then waits until the page stops loading
 * new resources (one second per round, six rounds at most) and dispatches a synthetic click on the
 * same element. So a control that was clicked first reacts about two seconds late, and a second
 * click made in the meantime lands on top of the late one and toggles the control twice.
 *
 * This module runs one step ahead of that listener. Window capture listeners run before document
 * capture listeners, whatever order they were added in. It watches each trusted click while
 * `Cookiebot.hasResponse` is still false. If the click never reaches the window's bubble phase,
 * `preventDefault()` was called, and `hasResponse` turned true within the same dispatch,
 * Cookiebot swallowed it, so the module dispatches the click again on the same element at once and
 * drops Cookiebot's late copy.
 *
 * A click made before the page has loaded is left to Cookiebot as well: the page's handlers are not
 * attached yet, so an immediate replay would reach nothing.
 *
 * Links are left to Cookiebot. A synthetic click on a link navigates, and Cookiebot's delay keeps
 * the navigation from cutting the consent request short. A button that navigates or submits a form
 * on click is in the same position, so it should be a link, or it will leave before Cookiebot has
 * stored consent.
 *
 * Cookiebot's late copy cannot be told from a click that page code makes, so for eight seconds
 * after a replay the first untrusted click on that same element is dropped, whoever made it.
 */

const INSTALL_FLAG = '__hotCookiebotFirstClick';

// Cookiebot retries its replay once per second, six times. A late copy that has not come by then
// is not coming.
const LATE_REPLAY_WINDOW_MS = 8000;

// The banner's own buttons record consent themselves, and replaying one would answer it twice.
const BANNER_SELECTOR = '#CybotCookiebotDialog, #CybotCookiebotDialogWrapper';

/**
 * Replays a click that Cookiebot's implied-consent listener stopped, once per window.
 *
 * @param {Window} [win] The window to guard.
 * @returns {boolean} `true` when this call installed the guard, `false` when it was already there.
 */
export function installFirstClickReplay(win = window) {
  if (win[INSTALL_FLAG]) {
    return false;
  }

  win[INSTALL_FLAG] = true;

  let watched = null;
  let replaying = false;
  let lateReplayTarget = null;

  // Before the load event the header, the search, and the sidebar have no click handlers yet. A
  // replay then reaches nothing, and dropping Cookiebot's later copy would lose the click for good.
  // Such a click stays with Cookiebot, which replays it after the page has loaded.
  let loaded = win.document?.readyState === 'complete';

  if (!loaded) {
    win.addEventListener('load', () => {
      // The page's own load handlers defer their setup by one task, so wait for it too.
      win.setTimeout(() => {
        loaded = true;
      }, 0);
    }, { once: true });
  }

  /**
   * Whether the click is one that Cookiebot's implied-consent listener could stop.
   *
   * @param {Event} event The click.
   * @returns {boolean}
   */
  const isCandidate = (event) => {
    const { target } = event;

    if (!loaded || !event.isTrusted || !target || typeof target.closest !== 'function') {
      return false;
    }

    const cookiebot = win.Cookiebot;

    if (!cookiebot || cookiebot.hasResponse !== false) {
      return false;
    }

    return !target.closest('a') && !target.closest(BANNER_SELECTOR);
  };

  /**
   * Re-dispatches the click that Cookiebot stopped, on the element it was made on.
   *
   * @param {Element} target The element the stopped click was made on, read while the click was
   * being dispatched. Cookiebot replays on that same element, not on the button around it.
   */
  const replay = (target) => {
    replaying = true;

    try {
      target.dispatchEvent(new win.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: win,
      }));
    } finally {
      replaying = false;
    }

    lateReplayTarget = target;
    win.setTimeout(() => {
      if (lateReplayTarget === target) {
        lateReplayTarget = null;
      }
    }, LATE_REPLAY_WINDOW_MS);
  };

  win.addEventListener('click', (event) => {
    if (event.isTrusted) {
      if (!isCandidate(event)) {
        return;
      }

      const entry = { event, target: event.target, reached: false };

      watched = entry;

      // Dispatch has finished by the next task, and so has Cookiebot's listener.
      win.setTimeout(() => {
        if (watched === entry) {
          watched = null;
        }

        if (!entry.reached && event.defaultPrevented && win.Cookiebot?.hasResponse === true) {
          replay(entry.target);
        }
      }, 0);

      return;
    }

    if (replaying || !lateReplayTarget) {
      return;
    }

    if (event.target === lateReplayTarget) {
      lateReplayTarget = null;
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);

  win.addEventListener('click', (event) => {
    if (watched && watched.event === event) {
      watched.reached = true;
    }
  }, false);

  return true;
}
