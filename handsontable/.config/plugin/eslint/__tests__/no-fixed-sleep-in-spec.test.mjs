// RuleTester coverage for the frozen-tier determinism rule. Runs under
// `node --test` (root `npm run test:tooling`), so ESLint's RuleTester is pointed
// at node:test's describe/it instead of the Mocha globals it looks for by default.
import { describe, it } from 'node:test';
import eslint from 'eslint';
import rule from '../rules/no-fixed-sleep-in-spec.js';

const { RuleTester } = eslint;

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

tester.run('no-fixed-sleep-in-spec', rule, {
  valid: [
    // The condition-based replacement for every shape below.
    'await waitUntil(() => hot.getPlugin("filters").isEnabled());',
    'await waitUntil(() => spy.calls.count() === 1, 1000);',
    // A timer with no fixed duration is a scheduling hand-off, not a wait.
    'setTimeout(done);',
    // A computed delay is deliberate scheduling the rule cannot judge statically.
    'setTimeout(callback, delay);',
    'window.setTimeout(callback, hot.getSettings().debounce);',
    // Handsontable's own destroy-safe timer helper is not the global timer.
    'hot._registerTimeout(callback, 100);',
    // Spying on or clearing a timer does not wait on it.
    'spyOn(window, "setTimeout");',
    'clearTimeout(timerId);',
    // Naming the helper without calling it (a reference passed to a spy) waits on nothing.
    'const frames = waitForNextAnimationFrames;',
    'expect(typeof waitForNextAnimationFrames).toBe("function");',
    // Look-alikes of the banned names.
    'await sleepUntilIdle();',
    'await waitForNextAnimationFramesToSettle();',
  ],

  invalid: [
    {
      code: 'await sleep(100);',
      errors: [{ messageId: 'noSleep' }],
    },
    {
      code: 'await sleep();',
      errors: [{ messageId: 'noSleep' }],
    },
    {
      code: 'setTimeout(resolve, 100);',
      errors: [{ messageId: 'noSetTimeout' }],
    },
    {
      code: 'setTimeout(() => done(), 0);',
      errors: [{ messageId: 'noSetTimeout' }],
    },
    {
      code: 'window.setTimeout(resolve, 50);',
      errors: [{ messageId: 'noSetTimeout' }],
    },
    {
      code: 'await new Promise(resolve => setTimeout(resolve, 200));',
      errors: [{ messageId: 'noSetTimeout' }],
    },
    {
      code: 'await waitForNextAnimationFrames();',
      errors: [{ messageId: 'noFrameWait' }],
    },
    {
      code: 'await waitForNextAnimationFrames(3);',
      errors: [{ messageId: 'noFrameWait' }],
    },
    {
      // Every shape in one spec body reports once each, under its own message.
      code: [
        'it("waits blindly", async() => {',
        '  await sleep(100);',
        '  await new Promise(resolve => setTimeout(resolve, 100));',
        '  await waitForNextAnimationFrames(2);',
        '  expect(getDataAtCell(0, 0)).toBe("A1");',
        '});',
      ].join('\n'),
      errors: [
        { messageId: 'noSleep', line: 2 },
        { messageId: 'noSetTimeout', line: 3 },
        { messageId: 'noFrameWait', line: 4 },
      ],
    },
  ],
});
