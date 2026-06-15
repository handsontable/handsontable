import assert from 'node:assert/strict';
import test from 'node:test';
import { supportsModernRegex } from '../supports-modern-regex.mjs';

test('supportsModernRegex returns a boolean', () => {
  assert.equal(typeof supportsModernRegex(), 'boolean');
});
