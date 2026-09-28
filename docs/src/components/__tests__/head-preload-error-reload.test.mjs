import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const headPath = fileURLToPath(new URL('../Head.astro', import.meta.url));
const headSource = readFileSync(headPath, 'utf8');

/**
 * Extracts the inline head script that reloads the page once when Vite fails to preload a
 * stale `_astro/` chunk (DEV-3058, Sentry HANDSONTABLE-DOCS-22T).
 *
 * @returns {string} The script body, without the surrounding `<script>` tags.
 */
function readPreloadErrorScript() {
  const blocks = headSource.match(/<script is:inline>[\s\S]*?<\/script>/g) ?? [];
  const reloadBlocks = blocks.filter((block) => block.includes('vite:preloadError'));

  assert.equal(reloadBlocks.length, 1, 'Head.astro must contain exactly one vite:preloadError script');

  return reloadBlocks[0].replace(/^<script is:inline>/, '').replace(/<\/script>$/, '');
}

/**
 * Runs the shipped script against a fake window and returns a way to fire the event.
 *
 * @param {object} sessionStorage The storage double the script reads and writes.
 * @returns {{ fire: () => { prevented: boolean }, reloads: () => number }} The harness.
 */
function runScript(sessionStorage) {
  const listeners = [];
  let reloadCount = 0;
  const window = {
    addEventListener(type, listener) {
      listeners.push({ type, listener });
    },
    location: {
      reload() {
        reloadCount += 1;
      },
    },
  };

  new Function('window', 'sessionStorage', readPreloadErrorScript())(window, sessionStorage);

  return {
    fire() {
      const event = {
        prevented: false,
        preventDefault() {
          this.prevented = true;
        },
      };

      listeners.filter(({ type }) => type === 'vite:preloadError').forEach(({ listener }) => listener(event));

      return event;
    },
    reloads: () => reloadCount,
  };
}

function createStorage() {
  const values = new Map();

  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('reloads the page and suppresses the error on the first preload failure', () => {
  const harness = runScript(createStorage());
  const event = harness.fire();

  assert.equal(harness.reloads(), 1);
  assert.equal(event.prevented, true);
});

test('lets a second preload failure in the same session through without reloading', () => {
  const storage = createStorage();

  runScript(storage).fire();

  const harness = runScript(storage);
  const event = harness.fire();

  assert.equal(harness.reloads(), 0);
  assert.equal(event.prevented, false);
});

test('does not reload when sessionStorage throws', () => {
  const harness = runScript({
    getItem() {
      throw new Error('SecurityError');
    },
    setItem() {
      throw new Error('SecurityError');
    },
  });
  const event = harness.fire();

  assert.equal(harness.reloads(), 0);
  assert.equal(event.prevented, false);
});
