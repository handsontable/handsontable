import assert from 'node:assert/strict';
import test from 'node:test';
import { canTakeFocus } from '../can-take-focus.mjs';

const element = ({ connected = true, boxes = 1, inertAncestor = false } = {}) => ({
  isConnected: connected,
  getClientRects: () => Array.from({ length: boxes }, () => ({})),
  closest: selector => (selector === '[inert]' && inertAncestor ? {} : null),
});

test('accepts a connected, rendered element outside an inert subtree', () => {
  assert.equal(canTakeFocus(element()), true);
});

test('does not need Element#checkVisibility, which Chrome < 105 and Safari < 17.4 lack', () => {
  const target = element();

  assert.equal('checkVisibility' in target, false);
  assert.doesNotThrow(() => canTakeFocus(target));
  assert.equal(canTakeFocus(target), true);
});

test('rejects an element that renders no box (display: none on it or an ancestor)', () => {
  assert.equal(canTakeFocus(element({ boxes: 0 })), false);
});

test('rejects an element inside an inert subtree', () => {
  assert.equal(canTakeFocus(element({ inertAncestor: true })), false);
});

test('rejects an element removed from the page', () => {
  assert.equal(canTakeFocus(element({ connected: false })), false);
});

test('rejects no element', () => {
  assert.equal(canTakeFocus(null), false);
  assert.equal(canTakeFocus(undefined), false);
});
