import assert from 'node:assert/strict';
import test from 'node:test';
import { HEADWAY_ACCOUNT, bellLabel, initHeadwayBell } from '../headway-bell.mjs';

/**
 * Lets the callbacks the fake widget deferred with `setTimeout(0)` run, as the real widget's
 * `triggerCallback` defers every callback.
 *
 * @returns {Promise<void>}
 */
const flush = () => new Promise(resolve => setTimeout(resolve, 5));

/**
 * Builds a stand-in for a DOM element: attributes, `hidden`, a parent, listeners, sibling
 * insertion (enough to see where the focus guards land), and focus tracking that fires
 * `focus` on the new element and `focusout` (with `relatedTarget`) on the old one.
 *
 * @param {object} doc The fake document.
 * @param {string | null} id The element id, registered for `getElementById`.
 * @returns {object} The fake element.
 */
function createElement(doc, id) {
  const attrs = {};
  const listeners = [];
  const element = {
    id,
    hidden: false,
    parentNode: null,
    children: [],
    placed: [],
    removed: false,
    // Whether the element has a box. A browser blurs a focused element whose group becomes
    // `display: none`.
    rendered: true,
    getClientRects() {
      return element.rendered ? [{}] : [];
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    setAttribute(name, value) {
      attrs[name] = String(value);
    },
    addEventListener(type, listener, options) {
      listeners.push({ type, listener, once: Boolean(options?.once) });
    },
    dispatch(type, event = {}) {
      const full = { type, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...event };

      listeners.filter(entry => entry.type === type).forEach((entry) => {
        if (entry.once) {
          listeners.splice(listeners.indexOf(entry), 1);
        }

        entry.listener(full);
      });

      return full;
    },
    appendChild(child) {
      if (child.parentNode) {
        child.parentNode.children.splice(child.parentNode.children.indexOf(child), 1);
      }

      // A browser drops focus to <body> when it moves the focused element.
      if (doc.activeElement === child) {
        doc.activeElement = doc.body;
      }

      child.parentNode = element;
      element.children.push(child);

      return child;
    },
    before(node) {
      element.placed.push({ side: 'before', node });
    },
    after(node) {
      element.placed.push({ side: 'after', node });
    },
    remove() {
      element.removed = true;
    },
    focus() {
      const previous = doc.activeElement;

      if (previous === element) {
        return;
      }

      doc.activeElement = element;
      previous?.dispatch?.('focusout', { relatedTarget: element });
      element.dispatch('focus', { relatedTarget: previous });
    },
  };

  if (id) {
    doc.byId.set(id, element);
  }

  return element;
}

/**
 * Builds a fake page and a fake Headway that behaves like widget.js where the module depends on
 * it: `init()` creates the panel container and frame synchronously, `toggle()` does nothing
 * until the widget is ready, `show()`/`hide()` flip the frame's `tabindex` and `aria-hidden`
 * and set `visible` at once, `onShowWidget` fires from `toggle()` only, and every callback runs
 * later, in a `setTimeout`.
 *
 * @param {object} [options] Options.
 * @param {boolean} [options.headwayLoaded=true] Whether `window.Headway` exists at start.
 * @param {boolean} [options.desktop=true] Whether the desktop media query matches at start.
 * @param {string} [options.readyState='complete'] The document's `readyState` at start.
 * @returns {object} The harness.
 */
function createHarness({ headwayLoaded = true, desktop = true, readyState = 'complete' } = {}) {
  const doc = {
    byId: new Map(),
    readyState,
    activeElement: null,
    getElementById(id) {
      return this.byId.get(id) ?? null;
    },
    createElement() {
      return createElement(doc, null);
    },
  };

  doc.body = createElement(doc, null);
  doc.activeElement = doc.body;

  const bell = createElement(doc, 'headway-bell');
  const desktopSlot = createElement(doc, null);
  const mobileSlot = createElement(doc, null);
  const script = createElement(doc, 'Headwayapp');
  const pageLink = createElement(doc, 'page-link');

  bell.hidden = true;
  bell.setAttribute('aria-expanded', 'false');
  desktopSlot.appendChild(bell);

  const mediaListeners = [];
  const mediaQuery = {
    matches: desktop,
    addEventListener(type, listener) {
      mediaListeners.push(listener);
    },
  };

  const initCalls = [];
  let config = null;
  let unseen = 0;
  const later = (name, ...args) => setTimeout(() => config.callbacks[name]?.(...args), 0);
  const headway = {
    visible: undefined,
    widgetIsReady: false,
    frame: null,
    init(cfg) {
      initCalls.push(cfg);
      config = cfg;
      this.visible = false;
      createElement(doc, 'HW_frame_cont');
      this.frame = createElement(doc, 'HW_frame');
      this.frame.setAttribute('tabindex', '-1');
      this.frame.setAttribute('aria-hidden', 'true');
    },
    getUnseenCount() {
      return unseen;
    },
    show() {
      this.visible = true;
      this.frame.setAttribute('tabindex', '0');
      this.frame.setAttribute('aria-hidden', 'false');
    },
    hide() {
      if (this.visible) {
        this.visible = false;
        this.frame.setAttribute('tabindex', '-1');
        this.frame.setAttribute('aria-hidden', 'true');
        later('onHideWidget');
      }
    },
    toggle() {
      if (!this.widgetIsReady) {
        return;
      }

      if (this.visible) {
        this.hide();
      } else {
        // widget.js calls `onShowWidget` from `toggle()` only, never from `show()`.
        this.show();
        later('onShowWidget');
      }
    },
  };
  const loadListeners = [];
  const win = {
    addEventListener(type, listener) {
      if (type === 'load') {
        loadListeners.push(listener);
      }
    },
  };

  if (headwayLoaded) {
    win.Headway = headway;
  }

  return {
    win,
    doc,
    bell,
    desktopSlot,
    mobileSlot,
    pageLink,
    headway,
    initCalls,
    init() {
      return initHeadwayBell({ win, doc, bell, desktopSlot, mobileSlot, mediaQuery, script });
    },
    // The window's `load` event: the document is complete from here on.
    fireWindowLoad() {
      doc.readyState = 'complete';
      loadListeners.splice(0).forEach(listener => listener());
    },
    loadScript({ defineHeadway = true } = {}) {
      if (defineHeadway) {
        win.Headway = headway;
      }

      script.dispatch('load');
    },
    async widgetReady(count = 0) {
      unseen = count;
      headway.widgetIsReady = true;
      later('onWidgetReady', headway);
      later('onWidgetUpdate', headway);
      await flush();
    },
    setUnseen(count) {
      unseen = count;
    },
    // Headway's `trigger` listener on the bell: one toggle per click.
    async clickBell() {
      bell.dispatch('click');
      headway.toggle();
      await flush();
    },
    guards() {
      return (doc.getElementById('HW_frame_cont')?.placed ?? []).filter(entry => !entry.node.removed);
    },
    async setDesktop(matches) {
      mediaQuery.matches = matches;
      mediaListeners.forEach(listener => listener({ matches }));
      await flush();
    },
  };
}

test('the bell label carries the unseen count only when there is one', () => {
  assert.equal(bellLabel(0), 'Product updates');
  assert.equal(bellLabel(undefined), 'Product updates');
  assert.equal(bellLabel(3), 'Product updates (3 new)');
});

test('initializes Headway once, on the bell, with the docs account', () => {
  const harness = createHarness();

  assert.equal(harness.init(), true);
  assert.equal(harness.init(), false, 'a second call must not initialize Headway again');
  assert.equal(harness.initCalls.length, 1);

  const [config] = harness.initCalls;

  assert.equal(config.account, HEADWAY_ACCOUNT);
  assert.equal(HEADWAY_ACCOUNT, 'xaD6ry');
  assert.equal(config.selector, '#headway-bell');
  assert.equal(config.trigger, '#headway-bell');
});

test('never initializes a widget that already exists on the page', () => {
  const harness = createHarness();

  createElement(harness.doc, 'HW_badge_cont');

  assert.equal(harness.init(), false);
  assert.equal(harness.initCalls.length, 0);
});

test('focus survives the browser blurring the bell when its header group is hidden', async () => {
  // Widening the window hides the mobile group, and Chrome blurs the bell before the media query
  // listener runs, so the bell cannot be checked for focus when it moves.
  const harness = createHarness({ desktop: false });

  harness.init();
  await harness.widgetReady();
  harness.bell.focus();

  harness.bell.rendered = false;
  harness.doc.activeElement = harness.doc.body;
  harness.bell.dispatch('focusout', { relatedTarget: null });
  harness.bell.rendered = true;

  await harness.setDesktop(true);

  assert.equal(harness.bell.parentNode, harness.desktopSlot);
  assert.equal(harness.doc.activeElement, harness.bell);
});

test('a bell the user tabbed away from does not take focus back when it moves', async () => {
  const harness = createHarness({ desktop: false });

  harness.init();
  await harness.widgetReady();
  harness.bell.focus();
  harness.pageLink.focus();

  await harness.setDesktop(true);

  assert.equal(harness.doc.activeElement, harness.pageLink);
});

test('does not init Headway before the window load event', () => {
  // An iframe added before `load` holds the event back until its page answers, and the header's
  // mobile navigation starts on `load`.
  const harness = createHarness({ readyState: 'loading' });

  assert.equal(harness.init(), true);
  assert.equal(harness.initCalls.length, 0, 'init must wait for the load event');
  assert.equal(harness.doc.getElementById('HW_frame'), null, 'no iframe before load');

  harness.fireWindowLoad();

  assert.equal(harness.initCalls.length, 1);
});

test('still waits for the Headway script when the window has already loaded', () => {
  const harness = createHarness({ headwayLoaded: false, readyState: 'loading' });

  harness.init();
  harness.fireWindowLoad();
  assert.equal(harness.initCalls.length, 0);

  harness.loadScript();
  assert.equal(harness.initCalls.length, 1);
});

test('the bell is placed in its slot before the window load event', () => {
  const harness = createHarness({ readyState: 'loading', desktop: false });

  harness.init();

  assert.equal(harness.bell.parentNode, harness.mobileSlot);
});

test('waits for the Headway script to load when it has not run yet', () => {
  const harness = createHarness({ headwayLoaded: false });

  harness.init();
  assert.equal(harness.initCalls.length, 0);

  harness.loadScript();
  assert.equal(harness.initCalls.length, 1);
});

test('a script that loads without defining Headway leaves the bell hidden and inits nothing', async () => {
  const harness = createHarness({ headwayLoaded: false });

  harness.init();
  harness.loadScript({ defineHeadway: false });
  await flush();

  assert.equal(harness.initCalls.length, 0);
  assert.equal(harness.bell.hidden, true);
});

test('titles the frame right after init, without waiting for the head guard', () => {
  const harness = createHarness();

  harness.init();

  assert.equal(harness.headway.frame.getAttribute('title'), 'Product updates');
});

test('keeps the bell hidden until the widget is ready, then names it with the unseen count', async () => {
  const harness = createHarness();

  harness.init();
  assert.equal(harness.bell.hidden, true, 'a bell shown before the widget is ready does nothing');

  await harness.widgetReady(3);
  assert.equal(harness.bell.hidden, false);
  assert.equal(harness.bell.getAttribute('aria-label'), 'Product updates (3 new)');
  assert.equal(harness.bell.getAttribute('title'), 'Product updates (3 new)');
});

test('closing the panel refreshes the label, because opening it marks the entries seen', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(3);
  await harness.clickBell();

  harness.setUnseen(0);
  await harness.clickBell();

  assert.equal(harness.bell.getAttribute('aria-label'), 'Product updates');
});

test('opening the panel moves focus into it and sets aria-expanded', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  harness.bell.focus();

  await harness.clickBell();

  assert.equal(harness.bell.getAttribute('aria-expanded'), 'true');
  assert.equal(harness.doc.activeElement, harness.headway.frame, 'the panel sits at the end of <body>, so Tab cannot reach it');
  assert.equal(harness.headway.visible, true, 'moving focus into the panel must not close it');
});

test('closing the panel while focus is inside it returns focus to the bell', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  await harness.clickBell();
  assert.equal(harness.doc.activeElement, harness.headway.frame);

  // The frame can close itself (it posts a `hide` message), with focus still inside it.
  harness.headway.hide();
  await flush();

  assert.equal(harness.doc.activeElement, harness.bell);
  assert.equal(harness.bell.getAttribute('aria-expanded'), 'false');
});

test('closing the panel does not steal focus that already moved elsewhere', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  await harness.clickBell();

  harness.doc.body.focus();
  harness.headway.hide();
  await flush();

  assert.equal(harness.doc.activeElement, harness.doc.body);
});

test('Escape on the bell closes an open panel, reading the widget state, not the lagging attribute', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  harness.bell.focus();
  harness.bell.dispatch('click');
  harness.headway.toggle();
  // Headway's onShowWidget has not run yet, so aria-expanded still says "false".
  assert.equal(harness.bell.getAttribute('aria-expanded'), 'false');

  const event = harness.bell.dispatch('keydown', { key: 'Escape' });

  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.headway.visible, false);
});

test('Escape on the bell with the panel closed leaves the event alone', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);

  const event = harness.bell.dispatch('keydown', { key: 'Escape' });

  assert.equal(event.defaultPrevented, false);
});

test('focus leaving the bell for the page closes an open panel', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  harness.bell.focus();
  harness.bell.dispatch('click');
  harness.headway.toggle();

  // Tab onward from the bell before the panel took focus.
  harness.pageLink.focus();
  await flush();
  await flush();

  assert.equal(harness.headway.visible, false, 'an open panel over the content would be out of reach of Escape');
  // The show callback queued by the click ran after the close: it must not pull focus back.
  assert.equal(harness.doc.activeElement, harness.pageLink);
  assert.equal(harness.bell.getAttribute('aria-expanded'), 'false');
  assert.equal(harness.guards().length, 0);
});

test('focus leaving the window keeps the panel open', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  harness.bell.focus();
  harness.bell.dispatch('click');
  harness.headway.toggle();

  // Switching to another window blurs the bell, but it stays the document's active element.
  harness.bell.dispatch('focusout', { relatedTarget: null });
  await flush();

  assert.equal(harness.headway.visible, true);
});

test('an open panel is wrapped in hidden focus guards; Tab past its end returns to the bell and closes it', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  await harness.clickBell();

  const guards = harness.guards();

  assert.deepEqual(guards.map(entry => entry.side), ['before', 'after']);
  guards.forEach(({ node }) => {
    assert.equal(node.tabIndex, 0);
    assert.match(node.getAttribute('style'), /position:fixed/, 'a guard in the flow at the end of <body> scrolls the page there');
  });

  // Headway's frame does not close on Escape, so this is how a keyboard user leaves it.
  guards[1].node.focus();
  assert.equal(harness.headway.visible, false);
  assert.equal(harness.doc.activeElement, harness.bell);

  await flush();
  assert.equal(harness.guards().length, 0, 'the guards leave with the panel');
});

test('Shift+Tab out of the panel also returns to the bell', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  await harness.clickBell();

  harness.guards()[0].node.focus();

  assert.equal(harness.headway.visible, false);
  assert.equal(harness.doc.activeElement, harness.bell);
});

test('a repeated show callback does not add a second pair of guards', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  await harness.clickBell();

  harness.initCalls[0].callbacks.onShowWidget();

  assert.equal(harness.guards().length, 2);
});

test('the bell sits in the slot of the current layout and moves on a breakpoint change, without a re-init', async () => {
  const harness = createHarness({ desktop: false });

  harness.init();
  assert.equal(harness.bell.parentNode, harness.mobileSlot);

  await harness.widgetReady(1);
  await harness.clickBell();

  await harness.setDesktop(true);

  assert.equal(harness.bell.parentNode, harness.desktopSlot);
  assert.equal(harness.headway.visible, false, 'a panel anchored to the old position is closed');
  assert.equal(harness.initCalls.length, 1, 're-initializing Headway detaches its iframe (Sentry HANDSONTABLE-DOCS-76)');

  await harness.setDesktop(false);
  assert.equal(harness.bell.parentNode, harness.mobileSlot);
});

test('a breakpoint change keeps focus on the bell', async () => {
  const harness = createHarness();

  harness.init();
  await harness.widgetReady(1);
  harness.bell.focus();

  // Zooming to 200% crosses the rem breakpoint as well as a window resize does.
  await harness.setDesktop(false);

  assert.equal(harness.bell.parentNode, harness.mobileSlot);
  assert.equal(harness.doc.activeElement, harness.bell);
});

test('does nothing without a bell element', () => {
  const harness = createHarness();

  assert.equal(initHeadwayBell({ win: harness.win, doc: harness.doc, bell: null }), false);
  assert.equal(harness.initCalls.length, 0);
});
