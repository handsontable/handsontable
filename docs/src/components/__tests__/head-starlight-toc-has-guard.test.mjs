import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const headPath = fileURLToPath(new URL('../Head.astro', import.meta.url));
const headSource = readFileSync(headPath, 'utf8');

/**
 * Extracts the inline head script that guards Starlight's table-of-contents custom elements
 * against the `:has()` SyntaxError.
 *
 * @returns {string} The script body, without the surrounding `<script>` tags.
 */
function readTocGuardScript() {
  const blocks = headSource.match(/<script is:inline>[\s\S]*?<\/script>/g) ?? [];
  const guardBlocks = blocks.filter((block) => block.includes('starlight-toc'));

  assert.equal(guardBlocks.length, 1, 'Head.astro must contain exactly one starlight-toc guard script');

  return guardBlocks[0].replace(/^<script is:inline>/, '').replace(/<\/script>$/, '');
}

class FakeHTMLElement {}

/**
 * Builds a stand-in for `window.customElements` that records definitions and resolves
 * `whenDefined()` promises, so the guard script can run outside a browser.
 *
 * @returns {object} The fake registry.
 */
function createRegistry() {
  const definitions = new Map();
  const waiters = new Map();

  return {
    define(name, constructor) {
      definitions.set(name, constructor);

      for (const resolve of waiters.get(name) ?? []) {
        resolve(constructor);
      }

      waiters.delete(name);
    },
    get(name) {
      return definitions.get(name);
    },
    whenDefined(name) {
      if (definitions.has(name)) {
        return Promise.resolve(definitions.get(name));
      }

      return new Promise((resolve) => {
        waiters.set(name, [...(waiters.get(name) ?? []), resolve]);
      });
    },
  };
}

/**
 * Mirrors the shape of Starlight's TOC element: `init` is an own instance field assigned in
 * the constructor, never a prototype method. A prototype-level patch cannot intercept it.
 *
 * @param {Error|undefined} errorToThrow Error the original `init` throws, if any.
 * @returns {Function} The class to register.
 */
function createStarlightTocClass(errorToThrow) {
  return class extends FakeHTMLElement {
    // The browser reads observedAttributes off the constructor the registry holds, so the
    // guard has to keep statics reachable from whatever it registers in place of this class.
    static observedAttributes = ['data-min-h', 'data-max-h'];

    constructor() {
      super();

      this.originalInitCallCount = 0;

      this.init = () => {
        this.originalInitCallCount += 1;

        if (errorToThrow) {
          throw errorToThrow;
        }

        return 'initialized';
      };
    }
  };
}

/**
 * Runs the guard script against a fresh registry, then registers a Starlight-shaped class
 * under `tagName` and returns an instance built from whatever the registry ended up holding.
 *
 * @param {object} options Test setup options.
 * @param {string} options.tagName Custom element name to register.
 * @param {Error} [options.errorToThrow] Error the original `init` throws.
 * @returns {Promise<object>} The constructed instance.
 */
async function setUpGuardedElement({ tagName, errorToThrow }) {
  const customElements = createRegistry();
  const runGuardScript = new Function('customElements', 'DOMException', readTocGuardScript());

  runGuardScript(customElements, DOMException);

  customElements.define(tagName, createStarlightTocClass(errorToThrow));

  // The pre-fix patch waited on `customElements.whenDefined()`, so let its microtasks settle
  // before the element is constructed.
  await Promise.resolve();
  await Promise.resolve();

  const RegisteredClass = customElements.get(tagName);

  return new RegisteredClass();
}

for (const tagName of ['starlight-toc', 'mobile-starlight-toc']) {
  test(`<${tagName}> swallows the :has() SyntaxError thrown by Starlight's init`, async () => {
    // Regression guard for HANDSONTABLE-DOCS-1GA: browsers without :has() support (Chrome < 105,
    // Safari < 15.4) throw a DOMException named "SyntaxError" from the querySelectorAll call in
    // Starlight's TOC init, which reaches window.onerror as an uncaught page error.
    const element = await setUpGuardedElement({
      tagName,
      errorToThrow: new DOMException('is not a valid selector', 'SyntaxError'),
    });

    assert.doesNotThrow(() => element.init());
    assert.equal(
      element.originalInitCallCount,
      1,
      "the guard must call Starlight's original init, not replace it with a no-op"
    );
  });

  test(`<${tagName}> still runs init normally when :has() is supported`, async () => {
    const element = await setUpGuardedElement({ tagName });

    assert.equal(element.init(), 'initialized');
    assert.equal(element.originalInitCallCount, 1);
  });

  test(`<${tagName}> rethrows errors unrelated to selector support`, async () => {
    const element = await setUpGuardedElement({
      tagName,
      errorToThrow: new TypeError('something else broke'),
    });

    assert.throws(() => element.init(), TypeError);
  });
}

test('Starlight keeps init as an own instance property, so a prototype patch cannot attach', () => {
  // This is the defect the guard exists for (Sentry HANDSONTABLE-DOCS-1GA, 21Y). The fix that
  // shipped before it patched `customElements.get('starlight-toc').prototype.init`, which is
  // undefined, so the patch attached to nothing and the error kept reaching window.onerror.
  const StarlightTocClass = createStarlightTocClass();

  assert.equal(StarlightTocClass.prototype.init, undefined);

  const instance = new StarlightTocClass();

  assert.ok(Object.hasOwn(instance, 'init'), 'init must be an own property of the instance');
});

test('the shipped guard does not rely on prototype.init', () => {
  // Comments are stripped first: the guard's own comment explains why the prototype approach
  // fails, so matching the raw source would flag the explanation instead of the code.
  const guardCode = readTocGuardScript().replace(/^\s*\/\/.*$/gm, '');

  assert.doesNotMatch(
    guardCode,
    /prototype\.init/,
    'init is a class field, so prototype.init is always undefined - wrap per instance instead'
  );
  assert.doesNotMatch(
    guardCode,
    /whenDefined/,
    'whenDefined resolves after the element class is registered, which is too late to reach an instance field'
  );
});

test('an error named SyntaxError that is not a DOMException still propagates', async () => {
  // The guard checks `instanceof DOMException` as well as the name. A plain SyntaxError means a
  // parse failure in code the site owns, and hiding it would hide a real regression.
  const element = await setUpGuardedElement({
    tagName: 'starlight-toc',
    errorToThrow: new SyntaxError('a real parse error'),
  });

  assert.throws(() => element.init(), { name: 'SyntaxError' });
});

test('the registered constructor keeps instanceof and static members intact', async () => {
  const customElements = createRegistry();
  const runGuardScript = new Function('customElements', 'DOMException', readTocGuardScript());

  runGuardScript(customElements, DOMException);

  const StarlightTocClass = createStarlightTocClass();

  customElements.define('starlight-toc', StarlightTocClass);

  const RegisteredClass = customElements.get('starlight-toc');

  assert.ok(new RegisteredClass() instanceof StarlightTocClass, 'the browser upgrades elements against the registered class');
  assert.deepEqual(RegisteredClass.observedAttributes, ['data-min-h', 'data-max-h']);
});

test('the guard leaves unrelated custom element definitions untouched', () => {
  const customElements = createRegistry();
  const runGuardScript = new Function('customElements', 'DOMException', readTocGuardScript());

  runGuardScript(customElements, DOMException);

  class UnrelatedElement extends FakeHTMLElement {}

  customElements.define('hot-version-switcher', UnrelatedElement);

  assert.equal(customElements.get('hot-version-switcher'), UnrelatedElement);
});
