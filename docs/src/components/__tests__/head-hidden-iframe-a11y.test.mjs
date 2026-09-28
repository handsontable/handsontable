import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const headPath = fileURLToPath(new URL('../Head.astro', import.meta.url));
const headSource = readFileSync(headPath, 'utf8');

/**
 * Extracts the inline head script that gives an accessible name to the third-party utility
 * iframes (Headway's changelog panel and the Visual Website Optimizer communication proxy).
 *
 * @returns {string} The script body, without the surrounding `<script>` tags.
 */
function readIframeGuardScript() {
  const blocks = headSource.match(/<script is:inline>[\s\S]*?<\/script>/g) ?? [];
  const guardBlocks = blocks.filter((block) => block.includes('HW_frame'));

  assert.equal(guardBlocks.length, 1, 'Head.astro must contain exactly one hidden-iframe a11y guard script');

  return guardBlocks[0].replace(/^<script is:inline>/, '').replace(/<\/script>$/, '');
}

/**
 * Builds a stand-in for an iframe element that records the attributes the guard sets.
 *
 * @param {string} id The element id.
 * @param {Record<string, string>} [initialAttrs] Attributes present before the guard runs.
 * @returns {object} The fake iframe.
 */
function createFakeIframe(id, initialAttrs = {}) {
  const attrs = { ...initialAttrs };

  return {
    id,
    attrs,
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    setAttribute(name, value) {
      attrs[name] = String(value);
    },
  };
}

/**
 * Builds a fake DOM plus a MutationObserver double, so the guard script can run outside a
 * browser. `insert()` registers an element by id and fires the observer callback, mimicking the
 * asynchronous injection the guard is written to catch.
 *
 * @returns {object} The harness: `document`, `MutationObserver`, and inspection helpers.
 */
function createHarness() {
  const byId = new Map();
  const observeCalls = [];
  const consentListeners = [];
  let observerCallback = null;
  let connected = false;
  let disconnectCount = 0;
  let deadlineCallback = null;

  const document = {
    documentElement: { tagName: 'HTML' },
    getElementById(id) {
      return byId.get(id) ?? null;
    },
  };

  // Mirrors a real MutationObserver: once disconnected it stops delivering callbacks, so a test
  // can prove the guard truly stopped reacting after the deadline, not merely that disconnect()
  // was called.
  class FakeMutationObserver {
    constructor(callback) {
      observerCallback = callback;
    }

    observe(target, options) {
      connected = true;
      observeCalls.push({ target, options });
    }

    disconnect() {
      connected = false;
      disconnectCount += 1;
    }
  }

  const window = {
    addEventListener(type, handler) {
      if (type === 'CookiebotOnAccept') {
        consentListeners.push(handler);
      }
    },
  };

  return {
    document,
    window,
    MutationObserver: FakeMutationObserver,
    // Capture the deadline callback instead of scheduling it, so the test controls when the
    // bounded-lifetime disconnect fires and no real timer is left dangling.
    setTimeout(callback) {
      deadlineCallback = callback;
      return 1;
    },
    clearTimeout() {
      deadlineCallback = null;
    },
    register(element) {
      byId.set(element.id, element);
    },
    insert(element) {
      byId.set(element.id, element);

      if (connected) {
        observerCallback?.();
      }
    },
    fireDeadline() {
      deadlineCallback?.();
    },
    fireConsent() {
      for (const handler of consentListeners) {
        handler();
      }
    },
    observeCall: () => observeCalls[0],
    observeCallCount: () => observeCalls.length,
    disconnectCount: () => disconnectCount,
    isConnected: () => connected,
  };
}

/**
 * Runs the guard script against a fresh harness.
 *
 * @param {object} harness The harness from `createHarness()`.
 */
function runGuard(harness) {
  const runGuardScript = new Function(
    'document',
    'MutationObserver',
    'setTimeout',
    'clearTimeout',
    'window',
    readIframeGuardScript()
  );

  runGuardScript(harness.document, harness.MutationObserver, harness.setTimeout, harness.clearTimeout, harness.window);
}

test('the VWO communication proxy is titled and removed from the a11y tree and tab order', () => {
  const harness = createHarness();

  runGuard(harness);

  const proxy = createFakeIframe('_vwo_communication_proxy');

  harness.insert(proxy);

  assert.equal(proxy.getAttribute('title'), 'A/B testing communication frame');
  assert.equal(proxy.getAttribute('aria-hidden'), 'true');
  assert.equal(proxy.getAttribute('tabindex'), '-1');
});

test("Headway's changelog panel is titled but stays in the a11y tree and tab order", () => {
  // #HW_frame is real UI shown when the widget opens, so aria-hidden would hide a working
  // feature (a worse a11y bug than the missing name). It gets a title only.
  const harness = createHarness();

  runGuard(harness);

  const headway = createFakeIframe('HW_frame');

  harness.insert(headway);

  assert.equal(headway.getAttribute('title'), 'Product updates');
  assert.equal(headway.getAttribute('aria-hidden'), null);
  assert.equal(headway.getAttribute('tabindex'), null);
});

test('an iframe that already carries a title keeps it', () => {
  const harness = createHarness();

  runGuard(harness);

  const headway = createFakeIframe('HW_frame', { title: 'Changelog' });

  harness.insert(headway);

  assert.equal(headway.getAttribute('title'), 'Changelog');
});

test('an iframe already present when the guard runs is patched on the initial pass', () => {
  const harness = createHarness();

  const proxy = createFakeIframe('_vwo_communication_proxy');

  harness.register(proxy);
  runGuard(harness);

  assert.equal(proxy.getAttribute('title'), 'A/B testing communication frame');
  assert.equal(proxy.getAttribute('aria-hidden'), 'true');
});

test('the observer keeps watching until every target has appeared, then disconnects', () => {
  const harness = createHarness();

  runGuard(harness);

  assert.equal(harness.disconnectCount(), 0, 'must not disconnect before any target appears');

  harness.insert(createFakeIframe('_vwo_communication_proxy'));

  assert.equal(harness.disconnectCount(), 0, 'must keep watching while a target is still pending');

  harness.insert(createFakeIframe('HW_frame'));

  assert.equal(harness.disconnectCount(), 1, 'must disconnect once every target is patched');
});

test('the deadline disconnects the observer and leaves a later iframe untouched', () => {
  // An ad blocker or declined consent means a target iframe is never injected, and
  // #_vwo_communication_proxy never appears off production. The observer must not stay live for
  // the whole page lifetime churning MutationRecords - the bounded deadline disconnects it, and
  // after that an iframe that shows up is genuinely ignored (not merely "disconnect was called").
  const harness = createHarness();

  runGuard(harness);

  harness.insert(createFakeIframe('HW_frame'));

  assert.equal(harness.disconnectCount(), 0, 'must keep watching while VWO is still pending');

  harness.fireDeadline();

  assert.equal(harness.disconnectCount(), 1, 'the deadline must disconnect the still-pending observer');
  assert.equal(harness.isConnected(), false);

  const lateProxy = createFakeIframe('_vwo_communication_proxy');

  harness.insert(lateProxy);

  assert.equal(lateProxy.getAttribute('title'), null, 'an iframe arriving after the deadline is left alone');
});

test('consent re-arms the watcher so a proxy injected after the deadline is still patched', () => {
  // The VWO tag fires only after analytics consent, and the proxy injects asynchronously after
  // that - possibly past the initial deadline. Cookiebot's CookiebotOnAccept re-arms the watcher
  // so the late proxy is still named, which a fixed timer alone would miss.
  const harness = createHarness();

  runGuard(harness);

  harness.fireDeadline();

  assert.equal(harness.isConnected(), false, 'the initial observation window has closed');

  harness.fireConsent();

  assert.equal(harness.isConnected(), true, 'consent must re-arm the observer');

  const proxy = createFakeIframe('_vwo_communication_proxy');

  harness.insert(proxy);

  assert.equal(proxy.getAttribute('title'), 'A/B testing communication frame');
  assert.equal(proxy.getAttribute('aria-hidden'), 'true');
  assert.equal(proxy.getAttribute('tabindex'), '-1');
});

test('consent does not re-arm once every target is already patched', () => {
  const harness = createHarness();

  runGuard(harness);

  harness.insert(createFakeIframe('HW_frame'));
  harness.insert(createFakeIframe('_vwo_communication_proxy'));

  assert.equal(harness.disconnectCount(), 1, 'both patched disconnects the observer');

  const observeCallsBefore = harness.observeCallCount();

  harness.fireConsent();

  assert.equal(harness.observeCallCount(), observeCallsBefore, 'nothing left to watch, so no re-observe');
  assert.equal(harness.isConnected(), false);
});

test('the observer watches the whole document subtree so it catches iframes appended to body', () => {
  const harness = createHarness();

  runGuard(harness);

  const call = harness.observeCall();

  assert.equal(call.target, harness.document.documentElement);
  assert.equal(call.options.childList, true);
  assert.equal(call.options.subtree, true);
});
