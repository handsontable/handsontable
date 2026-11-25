import assert from 'node:assert/strict';
import test from 'node:test';
import { scrollableBlockNames } from '../scrollable-block-names.mjs';

const heading = text => ({ type: 'heading', text });
const code = { type: 'block', kind: 'code' };
const table = { type: 'block', kind: 'table' };

test('names a block after its kind and the nearest heading before it', () => {
  assert.deepEqual(
    scrollableBlockNames([heading('Enable sorting'), code, heading('Configure sorting'), table]),
    ['Code: Enable sorting', 'Table: Configure sorting'],
  );
});

test('numbers the blocks of one kind below the same heading', () => {
  assert.deepEqual(
    scrollableBlockNames([heading('Replace DetailedSettings'), code, code, code]),
    ['Code: Replace DetailedSettings', 'Code 2: Replace DetailedSettings', 'Code 3: Replace DetailedSettings'],
  );
});

test('keeps numbering when another section repeats the heading text', () => {
  assert.deepEqual(
    scrollableBlockNames([
      heading('How to migrate'), code, code,
      heading('Who is affected'), code,
      heading('How to migrate'), code, table,
      heading('Who is affected'), code,
    ]),
    [
      'Code: How to migrate', 'Code 2: How to migrate',
      'Code: Who is affected',
      'Code 3: How to migrate', 'Table: How to migrate',
      'Code 2: Who is affected',
    ],
  );
});

test('counts the kinds separately', () => {
  assert.deepEqual(
    scrollableBlockNames([heading('Limits'), code, table, table, code]),
    ['Code: Limits', 'Table: Limits', 'Table 2: Limits', 'Code 2: Limits'],
  );
});

test('gives every block a number, so a block keeps its name whichever blocks overflow', () => {
  const names = scrollableBlockNames([heading('Update the theme'), code, code, code, code]);

  assert.equal(names[2], 'Code 3: Update the theme');
  assert.equal(new Set(names).size, names.length);
});

test('uses the kind alone before the first heading', () => {
  assert.deepEqual(
    scrollableBlockNames([code, table, code, heading('Overview'), code]),
    ['Code', 'Table', 'Code 2', 'Code: Overview'],
  );
});

test('uses the kind alone below a heading with no text', () => {
  assert.deepEqual(scrollableBlockNames([code, heading('  '), code]), ['Code', 'Code 2']);
});

test('collapses whitespace in the heading text', () => {
  assert.deepEqual(scrollableBlockNames([heading('  Sort\n   data  '), code]), ['Code: Sort data']);
});

test('gives no two blocks of a page the same name', () => {
  const names = scrollableBlockNames([
    code, heading('Code'), code, heading('2'), code, heading('A'), code, table, heading('A'), table, code,
  ]);

  assert.equal(new Set(names).size, names.length);
});

test('rejects an unknown block kind', () => {
  assert.throws(() => scrollableBlockNames([{ type: 'block', kind: 'image' }]), /Unknown scrollable block kind/);
});
