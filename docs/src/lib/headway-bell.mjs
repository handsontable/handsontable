/**
 * The Headway changelog bell in the docs header.
 *
 * `astro.config.mjs` loads Headway's `widget.js` (a deferred head script, `#Headwayapp`) on every
 * page. The widget does nothing until `Headway.init()` runs with a `selector`, and this module is
 * the only caller. Four widget behaviors shape it:
 *
 * - `Headway.init()` destroys the previous widget first and detaches its iframe. A second init,
 *   or a `hide()` while the iframe is detached, throws on `this.iframe.contentWindow` (Sentry
 *   HANDSONTABLE-DOCS-76 on the old VuePress docs). So the widget is initialized once per page
 *   load, and the layout change moves the bell instead of re-initializing.
 * - `selector` is a single element. The header has a desktop and a mobile layout, one of them
 *   `display: none`, so there is one bell, moved into the slot of the current layout. Headway
 *   puts its badge inside the bell and positions the panel from the badge's live rect, so the
 *   panel follows the bell.
 * - The panel is an iframe appended at the end of `<body>`, and Headway's toggle does nothing
 *   until the widget is ready. So the bell stays hidden until then (a blocked CDN never leaves a
 *   dead button), opening the panel moves focus into it, and closing it returns focus to the bell.
 *   The frame does not close on Escape, and its focus cannot be read across origins, so focus
 *   guards on both sides of the panel catch Tab and Shift+Tab out of it, close it, and return to
 *   the bell.
 * - Headway runs every callback in a `setTimeout`, so state set in a callback lags the call that
 *   caused it. Code that needs the panel's state now reads `Headway.visible`. `onShowWidget`
 *   fires from `toggle()` only, never from `show()`, so the bell opens the panel through its
 *   `trigger`, not through `show()`.
 * - `init()` waits for the window's `load` event: the panel's iframe would otherwise hold that
 *   event back, and the header's navigation scripts start on it.
 */

export const HEADWAY_ACCOUNT = 'xaD6ry';

const BELL_NAME = 'Product updates';
const INIT_FLAG = '__hotHeadwayBellInit';

// Visually hidden and fixed, so focusing a guard never scrolls to the end of <body>.
const GUARD_STYLE = 'position:fixed;top:0;left:0;width:1px;height:1px;overflow:hidden;'
  + 'clip-path:inset(50%);white-space:nowrap;outline:none;';

/**
 * The bell's accessible name, with the unseen count when there is one.
 *
 * @param {number | undefined} count The number of unseen changelog entries.
 * @returns {string}
 */
export function bellLabel(count) {
  return count > 0 ? `${BELL_NAME} (${count} new)` : BELL_NAME;
}

/**
 * Initializes the Headway widget on the header bell, once per page load.
 *
 * @param {object} options Options.
 * @param {Window} options.win The window that holds (or will hold) `Headway`.
 * @param {Document} options.doc The document.
 * @param {HTMLButtonElement | null} options.bell The bell button. It needs an `id`.
 * @param {HTMLElement | null} [options.desktopSlot] Where the bell goes in the desktop layout.
 * @param {HTMLElement | null} [options.mobileSlot] Where the bell goes in the mobile layout.
 * @param {MediaQueryList} [options.mediaQuery] Matches the desktop layout.
 * @param {HTMLScriptElement | null} [options.script] Headway's `widget.js` script tag.
 * @returns {boolean} `true` when this call set the bell up, `false` when it did nothing.
 */
export function initHeadwayBell({ win, doc, bell, desktopSlot, mobileSlot, mediaQuery, script }) {
  if (!bell || win[INIT_FLAG] || doc.getElementById('HW_badge_cont')) {
    return false;
  }

  win[INIT_FLAG] = true;

  let headway = null;
  const guards = [];

  const getFrame = () => doc.getElementById('HW_frame');
  const isOpen = () => Boolean(headway?.visible);

  const setLabel = () => {
    const label = bellLabel(headway?.getUnseenCount?.());

    bell.setAttribute('aria-label', label);
    bell.setAttribute('title', label);
  };

  const closeToBell = () => {
    bell.focus();
    headway?.hide();
  };

  const removeGuards = () => {
    guards.splice(0).forEach(guard => guard.remove());
  };

  const addGuards = () => {
    const container = doc.getElementById('HW_frame_cont');

    if (!container || guards.length > 0) {
      return;
    }

    ['before', 'after'].forEach((side) => {
      const guard = doc.createElement('span');

      guard.tabIndex = 0;
      guard.className = 'headway-focus-guard';
      guard.setAttribute('style', GUARD_STYLE);
      guard.addEventListener('focus', closeToBell);
      container[side](guard);
      guards.push(guard);
    });
  };

  // True from the bell gaining focus until it loses focus while still rendered. A blur from the
  // bell's group becoming `display: none` leaves it true.
  let bellFocused = false;

  const placeBell = () => {
    const slot = mediaQuery?.matches ? desktopSlot : mobileSlot;

    if (!slot || bell.parentNode === slot) {
      return;
    }

    // Moving a focused element drops its focus to <body>, and a browser that hides the group
    // the bell sits in blurs the bell before the media query listener runs, so `activeElement`
    // alone misses it. `bellFocused` is the last focus state the user left the bell in.
    const hadFocus = bellFocused || doc.activeElement === bell;

    slot.appendChild(bell);

    if (hadFocus) {
      bell.focus();
    }
  };

  placeBell();
  mediaQuery?.addEventListener('change', () => {
    // The panel is positioned next to the bell, so close it before the bell moves.
    headway?.hide();
    placeBell();
  });

  bell.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      headway.hide();
    }
  });

  // An open panel whose bell lost focus to the page (Tab onward) would stay over the content,
  // out of reach of Escape. Focus moving into the panel is the one move that keeps it open.
  // `relatedTarget` is not used: browsers differ on it when focus enters a cross-origin frame,
  // while the frame element is the document's active element in all of them, one task later.
  bell.addEventListener('focus', () => {
    bellFocused = true;
  });

  bell.addEventListener('focusout', () => {
    if (bell.getClientRects().length > 0) {
      bellFocused = false;
    }

    setTimeout(() => {
      const active = doc.activeElement;

      if (isOpen() && active !== bell && active !== getFrame()) {
        headway.hide();
      }
    }, 0);
  });

  const start = () => {
    const candidate = win.Headway;

    if (!candidate || typeof candidate.init !== 'function') {
      return;
    }

    headway = candidate;
    headway.init({
      selector: `#${bell.id}`,
      trigger: `#${bell.id}`,
      account: HEADWAY_ACCOUNT,
      callbacks: {
        onWidgetReady() {
          setLabel();
          bell.hidden = false;
        },
        onWidgetUpdate() {
          setLabel();
        },
        onShowWidget() {
          // The callback runs a task after `show()`. A Tab or Escape in between either closed
          // the panel or moved focus to the page; focusing the frame now would pull it back.
          if (!isOpen()) {
            return;
          }

          const active = doc.activeElement;

          if (active && active !== bell && active !== doc.body && active !== getFrame()) {
            headway.hide();

            return;
          }

          bell.setAttribute('aria-expanded', 'true');
          addGuards();
          // The panel sits at the end of <body>, so Tab from the bell would never reach it.
          getFrame()?.focus();
        },
        onHideWidget() {
          bell.setAttribute('aria-expanded', 'false');
          removeGuards();
          // Opening the panel marks its entries seen without a callback of its own.
          setLabel();

          const frame = getFrame();

          if (frame && doc.activeElement === frame) {
            bell.focus();
          }
        },
      },
    });

    // `init()` creates the frame synchronously. The head guard in `Head.astro` (§2.17) titles it
    // too, but stops watching 15 seconds after the head is parsed, and widget.js can arrive later.
    const frame = getFrame();

    if (frame && !frame.getAttribute('title')) {
      frame.setAttribute('title', BELL_NAME);
    }
  };

  const startWhenReady = () => {
    if (win.Headway) {
      start();
    } else {
      // The module script and the deferred head script have no guaranteed order.
      script?.addEventListener('load', start, { once: true });
    }
  };

  // `init()` adds the panel's iframe at once, and an iframe added before the window's `load`
  // holds that event back until its own page answers. The header's mobile navigation, the ToC
  // and sidebar toggles, and the Ask AI buttons start on `load`, so they would stay dead for as
  // long as headway-widget.net takes (a long timeout behind a proxy that drops it).
  if (doc.readyState === 'complete') {
    startWhenReady();
  } else {
    win.addEventListener('load', startWhenReady, { once: true });
  }

  return true;
}
