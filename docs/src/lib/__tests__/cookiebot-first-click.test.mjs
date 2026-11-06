import assert from 'node:assert/strict';
import test from 'node:test';
import { installFirstClickReplay } from '../cookiebot-first-click.mjs';

/**
 * A minimal event: enough of the DOM Event surface for the module and for the fake Cookiebot.
 */
class FakeEvent {
  constructor({ isTrusted = false } = {}) {
    this.type = 'click';
    this.isTrusted = isTrusted;
    this.bubbles = true;
    this.cancelable = true;
    this.target = null;
    this.defaultPrevented = false;
    this.propagationStopped = false;
    this.immediatePropagationStopped = false;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }

  stopImmediatePropagation() {
    this.propagationStopped = true;
    this.immediatePropagationStopped = true;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }
}

/**
 * Builds a window, a clock, and a way to fire clicks through the three phases that matter:
 * window capture, document capture (where Cookiebot listens), the target, and window bubble.
 */
function createHarness() {
  const windowCapture = [];
  const windowBubble = [];
  const documentCapture = [];
  const timers = [];
  let now = 0;

  class FakeMouseEvent extends FakeEvent {}

  const loadListeners = [];

  const win = {
    MouseEvent: FakeMouseEvent,
    document: { readyState: 'complete' },
    addEventListener(type, listener, capture) {
      if (type === 'load') {
        loadListeners.push(listener);

        return;
      }

      assert.equal(type, 'click');
      (capture ? windowCapture : windowBubble).push(listener);
    },
    setTimeout(callback, delay = 0) {
      timers.push({ callback, at: now + delay });
    },
  };

  /**
   * Runs the listeners of one click in dispatch order and honors stopPropagation.
   *
   * @param {FakeEvent} event The click.
   * @param {object} target The element that was clicked.
   */
  function dispatch(event, target) {
    event.target = target;

    const run = (listeners) => {
      for (const listener of listeners) {
        if (event.immediatePropagationStopped) {
          return;
        }

        listener(event);
      }
    };

    run(windowCapture);

    if (event.propagationStopped) {
      return;
    }

    run(documentCapture);

    if (event.propagationStopped) {
      return;
    }

    run(target.handlers);

    if (event.propagationStopped) {
      return;
    }

    run(windowBubble);
  }

  /**
   * A target that records how many clicks reached it.
   *
   * @param {string[]} [closestable] Selectors that `closest()` answers for.
   * @param {(event: FakeEvent) => void} [onClick] Extra handler.
   */
  function createTarget(closestable = [], onClick = () => {}) {
    const target = {
      clicks: 0,
      handlers: [(event) => {
        target.clicks += 1;
        onClick(event);
      }],
      closest(selector) {
        return selector.split(',').some(part => closestable.includes(part.trim())) ? target : null;
      },
      dispatchEvent(event) {
        dispatch(event, target);

        return true;
      },
    };

    return target;
  }

  /**
   * Cookiebot's implied-consent listener as measured on the live docs: a capture-phase
   * `document` listener that records consent, stops the click, and replays it later as an
   * untrusted click on the same target.
   */
  function installFakeCookiebot({ replayAfter = 2000 } = {}) {
    const cookiebot = { hasResponse: false };

    win.Cookiebot = cookiebot;
    documentCapture.push((event) => {
      if (cookiebot.hasResponse) {
        return;
      }

      cookiebot.hasResponse = true;
      const { target } = event;

      win.setTimeout(() => dispatch(new FakeMouseEvent(), target), replayAfter);
      event.stopPropagation();
      event.preventDefault();
    });

    return cookiebot;
  }

  return {
    win,
    createTarget,
    installFakeCookiebot,
    click(target) {
      dispatch(new FakeEvent({ isTrusted: true }), target);
    },
    untrustedClick(target) {
      dispatch(new FakeMouseEvent(), target);
    },
    fireLoad() {
      win.document.readyState = 'complete';
      loadListeners.splice(0).forEach(listener => listener());
    },
    advance(ms) {
      now += ms;

      for (;;) {
        const due = timers.filter(timer => timer.at <= now).sort((a, b) => a.at - b.at)[0];

        if (!due) {
          return;
        }

        timers.splice(timers.indexOf(due), 1);
        due.callback();
      }
    },
  };
}

test('replays a click that Cookiebot swallowed, at once and only once', () => {
  const harness = createHarness();
  const button = harness.createTarget();

  harness.installFakeCookiebot();
  installFirstClickReplay(harness.win);

  harness.click(button);
  assert.equal(button.clicks, 0, 'Cookiebot stops the click before it reaches the control');

  harness.advance(0);
  assert.equal(button.clicks, 1, 'the click reaches the control without waiting for Cookiebot');

  harness.advance(5000);
  assert.equal(button.clicks, 1, "Cookiebot's late replay does not toggle the control again");
});

test("drops Cookiebot's late replay once, and only on the replayed target", () => {
  const harness = createHarness();
  const button = harness.createTarget();
  const other = harness.createTarget();

  harness.installFakeCookiebot({ replayAfter: 100000 });
  installFirstClickReplay(harness.win);

  harness.click(button);
  harness.advance(0);
  assert.equal(button.clicks, 1);

  harness.untrustedClick(other);
  assert.equal(other.clicks, 1, 'an untrusted click on another control passes');

  harness.untrustedClick(button);
  assert.equal(button.clicks, 1, 'the first untrusted click on the replayed control is dropped');

  harness.untrustedClick(button);
  assert.equal(button.clicks, 2, 'a later untrusted click on it passes');
});

test('stops dropping untrusted clicks once the late replay can no longer arrive', () => {
  const harness = createHarness();
  const button = harness.createTarget();

  harness.installFakeCookiebot({ replayAfter: 100000 });
  installFirstClickReplay(harness.win);

  harness.click(button);
  harness.advance(0);
  harness.advance(8000);
  assert.equal(button.clicks, 1);

  harness.untrustedClick(button);
  assert.equal(button.clicks, 2, 'a programmatic click after the window passes');
});

test("drops Cookiebot's late copy at the slowest delay it uses, and not after the window", () => {
  const harness = createHarness();
  const button = harness.createTarget();

  harness.installFakeCookiebot({ replayAfter: 6000 });
  installFirstClickReplay(harness.win);

  harness.click(button);
  harness.advance(0);
  harness.advance(6000);
  assert.equal(button.clicks, 1, 'the late copy at six seconds is dropped');

  harness.untrustedClick(button);
  assert.equal(button.clicks, 2, 'the drop is spent after one copy');
});

test("replays on, and drops Cookiebot's copy for, the node that was clicked inside a control", () => {
  const harness = createHarness();
  const icon = harness.createTarget();
  const button = harness.createTarget();

  icon.handlers.push(() => {
    button.clicks += 1;
  });

  harness.installFakeCookiebot();
  installFirstClickReplay(harness.win);

  harness.click(icon);
  harness.advance(0);
  assert.equal(icon.clicks, 1);
  assert.equal(button.clicks, 1, 'the click reaches the control around the icon');

  harness.advance(5000);
  assert.equal(icon.clicks, 1, "Cookiebot's copy on the icon is dropped");
  assert.equal(button.clicks, 1);
});

test('does not replay a click that was stopped but not default-prevented', () => {
  const harness = createHarness();
  const cookiebot = { hasResponse: false };
  const control = harness.createTarget();

  harness.win.Cookiebot = cookiebot;
  installFirstClickReplay(harness.win);

  // A listener ahead of the control stops the click and flips the response without preventDefault.
  control.handlers.unshift((event) => {
    cookiebot.hasResponse = true;
    event.stopPropagation();
  });

  harness.click(control);
  harness.advance(10000);

  assert.equal(control.clicks, 1, 'only the original click ran, a replay would make it 2');
});

test('does not replay a click that reached window although it was prevented and consent flipped', () => {
  const harness = createHarness();
  const cookiebot = { hasResponse: false };
  const button = harness.createTarget([], (event) => {
    cookiebot.hasResponse = true;
    event.preventDefault();
  });

  harness.win.Cookiebot = cookiebot;
  installFirstClickReplay(harness.win);

  harness.click(button);
  harness.advance(10000);

  assert.equal(button.clicks, 1);
});

test('does not drop an untrusted click while no replay has happened', () => {
  const harness = createHarness();
  const button = harness.createTarget();

  harness.win.Cookiebot = { hasResponse: false };
  installFirstClickReplay(harness.win);

  harness.untrustedClick(button);

  assert.equal(button.clicks, 1);
});

test('does nothing for a click that reached window, even with consent still pending', () => {
  const harness = createHarness();
  const button = harness.createTarget();

  harness.win.Cookiebot = { hasResponse: false };
  installFirstClickReplay(harness.win);

  harness.click(button);
  harness.advance(10000);

  assert.equal(button.clicks, 1);
});

test('does not replay a click that a page handler stopped while consent stays pending', () => {
  const harness = createHarness();
  const button = harness.createTarget([], (event) => {
    event.stopPropagation();
    event.preventDefault();
  });

  harness.win.Cookiebot = { hasResponse: false };
  installFirstClickReplay(harness.win);

  harness.click(button);
  harness.advance(10000);

  assert.equal(button.clicks, 1);
});

test('does not replay a click on a link: Cookiebot delays it so consent is stored first', () => {
  const harness = createHarness();
  const link = harness.createTarget(['a']);

  harness.installFakeCookiebot();
  installFirstClickReplay(harness.win);

  harness.click(link);
  harness.advance(0);
  assert.equal(link.clicks, 0);

  harness.advance(5000);
  assert.equal(link.clicks, 1, "only Cookiebot's own replay reaches the link");
});

test("does not replay a click inside Cookiebot's own dialog", () => {
  const harness = createHarness();
  const cookiebot = { hasResponse: false };
  const accept = harness.createTarget(['#CybotCookiebotDialog'], (event) => {
    cookiebot.hasResponse = true;
    event.stopPropagation();
    event.preventDefault();
  });

  harness.win.Cookiebot = cookiebot;
  installFirstClickReplay(harness.win);

  harness.click(accept);
  harness.advance(10000);

  assert.equal(accept.clicks, 1);
});

test('does nothing once consent has a response', () => {
  const harness = createHarness();
  const button = harness.createTarget();

  harness.win.Cookiebot = { hasResponse: true };
  installFirstClickReplay(harness.win);

  harness.click(button);
  harness.advance(10000);

  assert.equal(button.clicks, 1);
});

test('does nothing where Cookiebot is absent', () => {
  const harness = createHarness();
  const button = harness.createTarget();

  installFirstClickReplay(harness.win);

  harness.click(button);
  harness.untrustedClick(button);
  harness.advance(10000);

  assert.equal(button.clicks, 2);
});

test('leaves a click made before the page loaded to Cookiebot, and does not drop its copy', () => {
  const harness = createHarness();
  const button = harness.createTarget();

  harness.win.document.readyState = 'loading';
  harness.installFakeCookiebot();
  installFirstClickReplay(harness.win);

  harness.click(button);
  harness.advance(0);
  assert.equal(button.clicks, 0, 'no replay: the page handlers are not attached yet');

  harness.advance(5000);
  assert.equal(button.clicks, 1, "Cookiebot's own replay reaches the control");
});

test('replays a swallowed click once the load event and the task after it have passed', () => {
  const harness = createHarness();
  const button = harness.createTarget();

  harness.win.document.readyState = 'loading';
  harness.installFakeCookiebot();
  installFirstClickReplay(harness.win);
  harness.fireLoad();
  harness.advance(0);

  harness.click(button);
  harness.advance(0);
  assert.equal(button.clicks, 1, 'replayed at once');

  harness.advance(5000);
  assert.equal(button.clicks, 1, "Cookiebot's late copy is dropped");
});

test('installs once per window', () => {
  const harness = createHarness();

  assert.equal(installFirstClickReplay(harness.win), true);
  assert.equal(installFirstClickReplay(harness.win), false);
});
