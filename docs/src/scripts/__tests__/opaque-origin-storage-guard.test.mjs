import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const guardPath = fileURLToPath(new URL('../opaque-origin-storage-guard.js', import.meta.url));
const guardSource = readFileSync(guardPath, 'utf8');

const STORAGE_NAMES = ['localStorage', 'sessionStorage'];

/**
 * Runs the guard against a stand-in `window`, the way the inlined head script runs it.
 */
function runGuard(window) {
  vm.runInContext(guardSource, vm.createContext({ window }));

  return window;
}

/**
 * Builds a `window` that reproduces an opaque-origin document: reading the storage
 * property throws SecurityError instead of returning undefined.
 */
function opaqueOriginWindow({ configurable = true } = {}) {
  const window = {};

  STORAGE_NAMES.forEach((name) => {
    Object.defineProperty(window, name, {
      configurable,
      get() {
        throw new Error(
          `Failed to read the '${name}' property from 'Window': Access is denied for this document.`
        );
      },
    });
  });

  return window;
}

test('installs a working storage stand-in when the property read throws', () => {
  const window = runGuard(opaqueOriginWindow());

  STORAGE_NAMES.forEach((name) => {
    const storage = window[name];

    assert.equal(typeof storage, 'object', `${name} must be readable after the guard runs`);
    assert.equal(storage.getItem('starlight-theme'), null);

    storage.setItem('starlight-theme', 'light');
    assert.equal(storage.getItem('starlight-theme'), 'light');
    assert.equal(storage.length, 1);
    assert.equal(storage.key(0), 'starlight-theme');

    storage.setItem('sl-sidebar-state', 1);
    assert.equal(storage.getItem('sl-sidebar-state'), '1', 'values are coerced to strings');

    storage.removeItem('starlight-theme');
    assert.equal(storage.getItem('starlight-theme'), null);
    assert.equal(storage.length, 1);

    storage.clear();
    assert.equal(storage.length, 0);
    assert.equal(storage.key(0), null);
  });
});

test('the stand-in survives the guard used by Starlight without throwing', () => {
  const window = runGuard(opaqueOriginWindow());

  // Verbatim shape of @astrojs/starlight ThemeProvider / ThemeSelect, which throws on an
  // unguarded opaque-origin window because `typeof` still triggers the property getter.
  const readTheme = () =>
    typeof window.localStorage !== 'undefined' && window.localStorage.getItem('starlight-theme');

  assert.doesNotThrow(readTheme);
  assert.equal(readTheme(), null);
});

test('leaves native storage untouched in a normal document', () => {
  const nativeLocal = { getItem: () => 'dark' };
  const nativeSession = { getItem: () => '1' };
  const window = runGuard({ localStorage: nativeLocal, sessionStorage: nativeSession });

  assert.equal(window.localStorage, nativeLocal, 'persistent storage must not be replaced');
  assert.equal(window.sessionStorage, nativeSession, 'persistent storage must not be replaced');
});

test('does not throw when the storage property cannot be redefined', () => {
  const window = opaqueOriginWindow({ configurable: false });

  assert.doesNotThrow(() => runGuard(window));
});
