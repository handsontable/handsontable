import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutProblems } from '../example-grid-layout-problems.mjs';

// This judgement decides whether a docs seed may write its golden records: the render fails, and writes
// nothing, on any page it reports. So each fact is pinned by what it must catch and by what it must let
// through, and the second half matters as much. A fact that fires on a healthy page fails every seed
// forever, which is how the "whole row" fact first shipped: it fired on nine pages with empty grids on
// the last deploy before #13381.

/**
 * One grid that is laid out correctly: 300px tall, 600px wide in a 600px root, showing its rows.
 *
 * @param {object} [overrides] Facts to break.
 * @returns {object} A grid measurement.
 */
function grid(overrides = {}) {
  return {
    holderHeight: 300,
    holderWidth: 600,
    rootWidth: 600,
    rowCount: 10,
    showsARow: true,
    cutOffLeft: 0,
    cutOffRight: 0,
    ...overrides,
  };
}

test('a page whose every example laid out its grid has no problem', () => {
  assert.deepEqual(layoutProblems([
    { example: 'example1', grids: [grid()] },
    { example: 'example2', grids: [grid(), grid({ holderWidth: 400, rootWidth: 400 })] },
  ]), []);
});

test('a page with no example, or an example with no grid, is a problem', () => {
  // The runner clears the loading overlay whether or not the example mounted, so "no grid" has to be read.
  assert.deepEqual(layoutProblems([]), ['no example on the page']);
  assert.deepEqual(layoutProblems([{ example: 'example3', grids: [] }]), ['example3: no grid rendered']);
});

test('a collapsed holder is a problem, whether or not the grid has rows', () => {
  // The #13381 shape: every `height: 'auto'` grid at 0px.
  assert.deepEqual(layoutProblems([{ example: 'example1', grids: [grid({ holderHeight: 0, showsARow: false })] }]),
    ['example1: the master .wtHolder is 0px tall']);
  assert.deepEqual(layoutProblems([{ example: 'example1', grids: [grid({ holderHeight: 0, rowCount: 0, showsARow: false })] }]),
    ['example1: the master .wtHolder is 0px tall'], 'an empty grid can still collapse');
});

test('a holder too short to show a whole row is a problem only when the grid has rows', () => {
  assert.deepEqual(layoutProblems([{ example: 'example1', grids: [grid({ holderHeight: 12, showsARow: false })] }]),
    ['example1: the master .wtHolder is 12px tall, too short to show a whole row']);

  // An empty-data state, a loading state, a server-side grid before its data: nothing to show, so the
  // row fact cannot fail it. These are the nine healthy pages the first version of this check failed.
  assert.deepEqual(layoutProblems([
    { example: 'example1', grids: [grid({ holderHeight: 180, rowCount: 0, showsARow: false })] },
    { example: 'example6', grids: [grid({ holderHeight: 30, rowCount: 0, showsARow: false })] },
  ]), []);
});

test('a holder wider than its root is a problem, and is not also counted as the wrapper cutting it off', () => {
  // The width half of #13381, still on develop on 2026-09-28: 711 grids 33 to 35px wider than their root.
  // `.ht_master` clips the holder at the root's edge, so the measured cut-off is the root's, which is 0.
  assert.deepEqual(layoutProblems([{ example: 'example1', grids: [grid({ holderWidth: 634 })] }]),
    ['example1: the master .wtHolder is 634px wide in a 600px grid root']);
});

test('a root the example wrapper cuts off is a problem, on either side', () => {
  assert.deepEqual(layoutProblems([{ example: 'example2', grids: [grid({ cutOffLeft: 4, cutOffRight: 17 })] }]), [
    'example2: the example wrapper cuts 4px off the grid\'s left edge',
    'example2: the example wrapper cuts 17px off the grid\'s right edge',
  ]);
});

test('every broken fact of every grid is reported, in document order', () => {
  assert.deepEqual(layoutProblems([
    { example: 'example1', grids: [grid({ holderHeight: 0, holderWidth: 610 })] },
    { example: 'example2', grids: [grid(), grid({ cutOffRight: 2 })] },
  ]), [
    'example1: the master .wtHolder is 0px tall',
    'example1: the master .wtHolder is 610px wide in a 600px grid root',
    'example2: the example wrapper cuts 2px off the grid\'s right edge',
  ]);
});
