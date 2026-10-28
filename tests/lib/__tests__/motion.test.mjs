import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forcedColorsFindings, isMotion, longRunningFindings, motionFindings } from '../motion.mjs';
import { EVIDENCE_SCHEMA, validatePart } from '../a11y-evidence.mjs';

// tests/AGENTS.md ("A11y: the checks beyond axe", forced colors and reduced motion): the verdicts
// behind 2.2.2, 2.3.3 and the forced-colors part of 1.4.1. The spec records every animation
// `document.getAnimations()` returns while it watches, and the forced-colors captures; the verdicts are here.

/**
 * An animation as the spec records it.
 *
 * @param {object} fields The fields to set.
 * @returns {object} The animation.
 */
function animation(fields = {}) {
  return {
    kind: 'CSSTransition', name: 'transform', properties: ['transform'], duration: 200, iterations: 1, target: 'div.ht-sheets-bar__tab-indicator',
    firstSeen: 0, lastSeen: 180, running: false, ...fields,
  };
}

test('motion is a change of position, size or transform; opacity and color are not motion', () => {
  assert.equal(isMotion(animation()), true);
  assert.equal(isMotion(animation({ properties: ['left', 'width'] })), true);
  assert.equal(isMotion(animation({ properties: ['opacity'] })), false);
  assert.equal(isMotion(animation({ properties: ['background-color', 'color'] })), false);
  assert.equal(isMotion(animation({ properties: ['translate'] })), true);
  assert.equal(isMotion(animation({ properties: ['max-height'] })), true, 'an expand or collapse driven by max-height');
  assert.equal(isMotion(animation({ properties: ['block-size'] })), true);
  assert.equal(isMotion(animation({ properties: ['padding-top'] })), true, 'a `transition: all` that moves the padding');
  assert.equal(isMotion(animation({ properties: ['background-position-x'] })), true, 'Chromium reports background-position as its longhands');
  assert.equal(isMotion(animation({ duration: 0.01 })), false, 'a duration a reduced-motion rule shrinks to nothing moves nothing');
});

test('under prefers-reduced-motion, a motion animation an interaction starts is a 2.3.3 finding', () => {
  const findings = motionFindings({
    reducedMotion: true,
    step: 'switch to the second sheet',
    animations: [animation(), animation({ properties: ['opacity'], target: 'div.ht-dialog' })],
  });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.severity, item.selector, item.step]), [
    ['motion-despite-reduced-motion', ['2.3.3'], 'moderate', 'div.ht-sheets-bar__tab-indicator', 'switch to the second sheet'],
  ]);
  assert.deepEqual(motionFindings({ reducedMotion: false, step: 's', animations: [animation()] }), [],
    'without the preference, motion is allowed');
});

test('content that moves for more than five seconds on its own is a 2.2.2 finding', () => {
  // The spec records an endless animation's iterations as 'Infinity', which its JSON detail keeps.
  const frames = { first: 0, last: 5000 };
  const spinner = animation({ kind: 'CSSAnimation', name: 'ht-loading-spin', properties: ['transform'], duration: 800, iterations: 'Infinity',
    target: 'div.ht-loading__icon', firstSeen: 0, lastSeen: 5000, running: true });
  const pulse = animation({ kind: 'CSSAnimation', name: 'pulse', properties: ['opacity'], duration: 1000, iterations: 'Infinity',
    target: 'span.htAsyncIndicator', firstSeen: 0, lastSeen: 5000, running: true });

  assert.deepEqual(longRunningFindings({ frames, animations: [spinner, pulse, animation()] })
    .map(item => [item.kind, item.criteria, item.severity, item.selector, item.measured.seen]), [
    ['moves-over-five-seconds', ['2.2.2'], 'moderate', 'div.ht-loading__icon', 5000],
    ['moves-over-five-seconds', ['2.2.2'], 'moderate', 'span.htAsyncIndicator', 5000],
  ], 'a pulse that blinks is covered too: 2.2.2 is about moving, blinking and scrolling content');
  assert.deepEqual(longRunningFindings({ frames, animations: [{ ...spinner, lastSeen: 3000, running: false }] }), [],
    'an animation that stopped within the window is not');
  assert.equal(longRunningFindings({ frames, animations: [{ ...spinner, iterations: Infinity }] }).length, 1,
    'the number Infinity is endless too');
  assert.deepEqual(longRunningFindings({ frames, animations: [{ ...spinner, iterations: 3 }] }), [],
    'three turns of 800 ms end within five seconds');
});

test('the watch\'s own frames bound "the whole window", and an instant is not long-running', () => {
  const spinner = animation({ kind: 'CSSAnimation', name: 'ht-loading-spin', duration: 800, iterations: 'Infinity',
    target: 'div.ht-loading__icon', firstSeen: 120, lastSeen: 5004, running: true });

  assert.equal(longRunningFindings({ frames: { first: 120, last: 5004 }, animations: [spinner] }).length, 1,
    'seen on every frame of a watch whose first frame came 120 ms late');
  assert.deepEqual(longRunningFindings({ frames: { first: 16, last: 5004 }, animations: [{ ...spinner, firstSeen: 300 }] }), [],
    'one that started after the watch\'s first frame was not seen for the whole watch');
  assert.deepEqual(longRunningFindings({ frames: { first: 120, last: 5004 }, animations: [{ ...spinner, duration: 0.01 }] }), [],
    'a duration a reduced-motion rule shrinks to (0.01 ms) moves nothing, endless or not, as in isMotion()');
});

test('in forced colors, a state or a focus that leaves no visible change is lost', () => {
  assert.deepEqual(forcedColorsFindings({ part: 'focus', selector: 'td', step: 'ArrowRight', changed: 0 })
    .map(item => [item.kind, item.criteria, item.severity]), [['focus-lost-in-forced-colors', ['2.4.7', '1.4.1'], 'serious']]);
  assert.deepEqual(forcedColorsFindings({ part: 'selection', selector: '.wtBorder.area', step: 'select', changed: 0 })
    .map(item => [item.kind, item.criteria]), [['selection-lost-in-forced-colors', ['1.4.1', '1.4.11']]]);
  assert.deepEqual(forcedColorsFindings({ part: 'icon', selector: '.changeType', step: 'at rest', changed: 0 })
    .map(item => [item.kind, item.criteria]), [['icon-lost-in-forced-colors', ['1.4.11']]]);
  assert.deepEqual(forcedColorsFindings({ part: 'focus', selector: 'td', step: 'ArrowRight', changed: 40 }), []);
});

test('the check\'s findings are valid evidence', () => {
  const findings = [
    ...motionFindings({ reducedMotion: true, step: 's', animations: [animation()] }),
    ...longRunningFindings({ frames: { first: 0, last: 5000 }, animations: [animation({ iterations: 'Infinity', lastSeen: 5000, running: true })] }),
    ...forcedColorsFindings({ part: 'menu', selector: 'td', step: 's', changed: 0 }),
  ];

  assert.deepEqual(validatePart({ schema: EVIDENCE_SCHEMA, target: { page: 'grid', theme: 'main' }, durationMs: 1, findings }), []);
});
