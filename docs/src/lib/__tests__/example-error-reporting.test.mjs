import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  createExampleErrorReporter,
  isChunkLoadError,
  isExpectedDemoHttpError,
  isIntentionalHandsontableError,
} from '../example-error-reporting.mjs';

/**
 * Collects the arguments the reporter passes to Sentry.
 */
function createSentryStub() {
  const calls = [];

  return {
    calls,
    sentry: {
      captureException(err, hint) {
        calls.push({ err, hint });
      },
    },
  };
}

function createReporter(overrides = {}) {
  const { calls, sentry } = createSentryStub();
  const report = createExampleErrorReporter({ getSentry: () => sentry, ...overrides });

  return { calls, report };
}

const jsContext = { framework: 'javascript', phase: 'example-init', source: '/content/example.js' };

test('reports a real example failure to Sentry with framework and phase tags', () => {
  const { calls, report } = createReporter();
  // The failure class that produced zero Sentry events before this module existed
  // (HANDSONTABLE-DOCS-20K): a method the reader's engine does not implement.
  const err = new TypeError('hooks.toSorted is not a function');

  assert.equal(report(err, jsContext), 'reported');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].err, err);
  assert.deepEqual(calls[0].hint.tags, {
    hot_example: 'javascript',
    hot_example_phase: 'example-init',
  });
  assert.equal(calls[0].hint.extra.source, '/content/example.js');
});

test('does not report failed dynamic imports in any browser wording', () => {
  const { calls, report } = createReporter();
  const messages = [
    'Failed to fetch dynamically imported module: https://handsontable.com/docs/_astro/example2.js',
    'error loading dynamically imported module: https://handsontable.com/docs/_astro/vue.js',
    'Importing a module script failed.',
  ];

  for (const message of messages) {
    assert.equal(report(new TypeError(message), jsContext), 'skipped-chunk-load');
  }

  assert.equal(calls.length, 0);
});

test('does not report errors Handsontable throws on purpose', () => {
  const { calls, report } = createReporter();
  const err = new Error('The provided data type is not supported', { cause: { handsontable: true } });

  assert.equal(report(err, jsContext), 'skipped-intentional');
  assert.equal(calls.length, 0);
});

test('does not report the expected HTTP status of the server-side data examples', () => {
  const { calls, report } = createReporter();

  assert.equal(report(new Error('HTTP 404'), jsContext), 'skipped-demo-http');
  assert.equal(calls.length, 0);
});

test('reports each distinct failure once per page load', () => {
  const { calls, report } = createReporter();

  assert.equal(report(new TypeError('boom'), jsContext), 'reported');
  assert.equal(report(new TypeError('boom'), jsContext), 'skipped-duplicate');
  assert.equal(report(new TypeError('boom'), { ...jsContext, source: '/content/other.js' }), 'skipped-duplicate');
  assert.equal(report(new TypeError('different'), jsContext), 'reported');
  assert.equal(calls.length, 2);
});

test('caps the number of forwarded failures per page load', () => {
  const { calls, report } = createReporter({ maxReports: 2 });

  assert.equal(report(new TypeError('one'), jsContext), 'reported');
  assert.equal(report(new TypeError('two'), jsContext), 'reported');
  assert.equal(report(new TypeError('three'), jsContext), 'skipped-limit');
  assert.equal(calls.length, 2);
});

test('the same message under a different framework or phase is a separate failure', () => {
  const { calls, report } = createReporter();

  assert.equal(report(new TypeError('boom'), jsContext), 'reported');
  assert.equal(report(new TypeError('boom'), { framework: 'vue', phase: 'runtime-import' }), 'reported');
  assert.equal(calls.length, 2);
});

test('never throws when Sentry is missing or broken', () => {
  const missing = createExampleErrorReporter({ getSentry: () => undefined });

  assert.equal(missing(new TypeError('boom'), jsContext), 'skipped-unavailable');

  const blocked = createExampleErrorReporter({ getSentry: () => ({}) });

  assert.equal(blocked(new TypeError('boom'), jsContext), 'skipped-unavailable');

  const broken = createExampleErrorReporter({
    getSentry: () => ({
      captureException() {
        throw new Error('SDK not loaded');
      },
    }),
  });

  assert.equal(broken(new TypeError('boom'), jsContext), 'skipped-sentry-error');
});

test('handles non-Error rejection values', () => {
  const { calls, report } = createReporter();

  assert.equal(report('plain string failure', jsContext), 'reported');
  assert.equal(report('plain string failure', jsContext), 'skipped-duplicate');
  assert.equal(report(undefined, jsContext), 'reported');
  assert.equal(calls.length, 2);
});

test('predicates are individually correct', () => {
  assert.equal(isChunkLoadError(new Error('Failed to fetch dynamically imported module: x')), false);
  assert.equal(isChunkLoadError(new TypeError('Failed to fetch')), false);
  assert.equal(isIntentionalHandsontableError(new Error('boom')), false);
  assert.equal(isIntentionalHandsontableError(new Error('boom', { cause: new Error('inner') })), false);
  assert.equal(isExpectedDemoHttpError(new Error('HTTP 4040')), false);
  assert.equal(isExpectedDemoHttpError(new Error('HTTP 503')), true);
});

// ── Regression guard on the runner itself ──────────────────────────────────
// Sentry HANDSONTABLE-DOCS-1FX: the shared framework-runtime imports used to sit outside every
// try/catch, so one failed chunk escaped as an unhandled rejection and left every example of that
// framework stuck on its loading shimmer. They must stay inside loadRuntime().

const runnerFile = readFileSync(
  fileURLToPath(new URL('../../scripts/example-runner.ts', import.meta.url)),
  'utf8'
);

// Comments discuss the very imports these tests look for, so scan executable source only.
// The runner contains no string literal with `//` or `/*` in it, which keeps this strip safe.
const runnerSource = runnerFile
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '');

/**
 * Returns the source spans of every `loadRuntime(...)` call, paren-balanced so nested calls and
 * arrow-function bodies are included.
 */
function loadRuntimeSpans(source) {
  const spans = [];
  let from = 0;

  for (;;) {
    const start = source.indexOf('loadRuntime(', from);

    if (start === -1) break;

    let depth = 0;
    let end = source.indexOf('(', start);

    for (let i = end; i < source.length; i += 1) {
      if (source[i] === '(') depth += 1;
      if (source[i] === ')') {
        depth -= 1;

        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    spans.push([start, end]);
    from = end + 1;
  }

  return spans;
}

const guardedSpans = loadRuntimeSpans(runnerSource);

/**
 * Returns every index at which `needle` occurs in the runner source.
 */
function occurrences(needle) {
  const found = [];
  let from = 0;

  for (;;) {
    const at = runnerSource.indexOf(needle, from);

    if (at === -1) break;

    found.push(at);
    from = at + needle.length;
  }

  return found;
}

test('loadRuntime() spans are found in the runner source', () => {
  assert.equal(guardedSpans.length, 3, 'expected one loadRuntime() call per framework group');
});

for (const specifier of ['react-dom/client', 'react', 'vue', '@angular/compiler']) {
  test(`import('${specifier}') only runs inside a loadRuntime() call`, () => {
    const found = occurrences(`import('${specifier}')`);

    assert.ok(found.length > 0, `expected import('${specifier}') in example-runner.ts`);

    for (const at of found) {
      assert.ok(
        guardedSpans.some(([start, end]) => at > start && at < end),
        `import('${specifier}') at index ${at} escapes loadRuntime(); a failed chunk would become an unhandled rejection`
      );
    }
  });
}

test("import('zone.js') runs inside ensureZone(), which only runs inside loadRuntime()", () => {
  const zoneBodyStart = runnerSource.indexOf('async function ensureZone()');
  const zoneBodyEnd = runnerSource.indexOf('\n}', zoneBodyStart);

  assert.ok(zoneBodyStart > -1 && zoneBodyEnd > zoneBodyStart, 'expected an ensureZone() declaration');

  for (const at of occurrences("import('zone.js')")) {
    assert.ok(at > zoneBodyStart && at < zoneBodyEnd, "import('zone.js') must stay inside ensureZone()");
  }

  const calls = occurrences('ensureZone()').filter(at => at !== zoneBodyStart + 'async function '.length);

  assert.ok(calls.length > 0, 'expected at least one ensureZone() call');

  for (const at of calls) {
    assert.ok(
      guardedSpans.some(([start, end]) => at > start && at < end),
      'ensureZone() must be called inside loadRuntime()'
    );
  }
});

test('ensureZone() marks zone.js as loaded only after the import resolves', () => {
  const zoneBodyStart = runnerSource.indexOf('async function ensureZone()');
  const body = runnerSource.slice(zoneBodyStart, runnerSource.indexOf('\n}', zoneBodyStart));

  assert.ok(
    body.indexOf("import('zone.js')") < body.indexOf('zoneLoaded = true'),
    'setting the flag before awaiting the import makes a failed load unretryable'
  );
});

test('every framework runtime is loaded through loadRuntime()', () => {
  for (const framework of ['react', 'vue', 'angular']) {
    assert.match(
      runnerSource,
      new RegExp(`loadRuntime\\('${framework}'`),
      `expected loadRuntime('${framework}', ...) in example-runner.ts`
    );
  }
});

test('every framework loop skips an unresolvable module instead of reporting it', () => {
  // A src that matches no glob is a build-time mistake, not a runtime failure worth an event per
  // reader. Each loop must warn and continue before it calls the loader.
  for (const label of ['JS', 'JSX', 'Vue', 'Angular']) {
    assert.match(
      runnerSource,
      new RegExp(`if \\(!loader\\) \\{\\s*console\\.warn\\('\\[hot-example\\] No ${label} module for:'`),
      `expected a !loader early-out in the ${label} loop`
    );
  }
});

test('every per-example catch reports to Sentry', () => {
  const catches = runnerSource.match(/} catch \(err\) \{[\s\S]*?\n {4,6}}/g) ?? [];
  const exampleCatches = catches.filter(block => /console\.error\('\[hot-example\] (JS|JSX|Vue|Angular) failed/.test(block));

  assert.equal(exampleCatches.length, 4, 'expected the JS, JSX, Vue, and Angular example catch blocks');

  for (const block of exampleCatches) {
    assert.match(block, /reportExampleError\(err, \{/);
  }
});
