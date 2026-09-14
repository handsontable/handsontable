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
  let observerCallback = null;
  let disconnectCount = 0;
  let deadlineCallback = null;

  const document = {
    documentElement: { tagName: 'HTML' },
    getElementById(id) {
      return byId.get(id) ?? null;
    },
  };

  class FakeMutationObserver {
    constructor(callback) {
      observerCallback = callback;
    }

    observe(target, options) {
      observeCalls.push({ target, options });
    }

    disconnect() {
      disconnectCount += 1;
    }
  }

  return {
    document,
    MutationObserver: FakeMutationObserver,
    // Capture the deadline callback instead of scheduling it, so the test controls when the
    // bounded-lifetime disconnect fires and no real timer is left dangling.
    setTimeout(callback) {
      deadlineCallback = callback;
      return 0;
    },
    register(element) {
      byId.set(element.id, element);
    },
    insert(element) {
      byId.set(element.id, element);
      observerCallback?.();
    },
    fireDeadline() {
      deadlineCallback?.();
    },
    observeCall: () => observeCalls[0],
    disconnectCount: () => disconnectCount,
  };
}

/**
 * Runs the guard script against a fresh harness.
 *
 * @param {object} harness The harness from `createHarness()`.
 */
function runGuard(harness) {
  const runGuardScript = new Function('document', 'MutationObserver', 'setTimeout', readIframeGuardScript());

  runGuardScript(harness.document, harness.MutationObserver, harness.setTimeout);
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

test('the observer disconnects at the deadline even if a target never appears', () => {
  // An ad blocker or declined analytics consent means a target iframe is never injected, and
  // #_vwo_communication_proxy never appears off production. The observer must not stay live for
  // the whole page lifetime churning MutationRecords - the bounded deadline disconnects it.
  const harness = createHarness();

  runGuard(harness);

  harness.insert(createFakeIframe('HW_frame'));

  assert.equal(harness.disconnectCount(), 0, 'must keep watching while VWO is still pending');

  harness.fireDeadline();

  assert.equal(harness.disconnectCount(), 1, 'the deadline must disconnect the still-pending observer');
});

test('the observer watches the whole document subtree so it catches iframes appended to body', () => {
  const harness = createHarness();

  runGuard(harness);

  const call = harness.observeCall();

  assert.equal(call.target, harness.document.documentElement);
  assert.equal(call.options.childList, true);
  assert.equal(call.options.subtree, true);
});
