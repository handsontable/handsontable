import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addedInError,
  allowedVersions,
  buildPageMarkdown,
  formatAddedIn,
  isValidVersion,
} from '../added-in.mjs';

test('isValidVersion accepts only a full MAJOR.MINOR.PATCH string', () => {
  assert.equal(isValidVersion('17.0.0'), true);
  assert.equal(isValidVersion('18.1.1'), true);
  assert.equal(isValidVersion('17.0'), false);
  assert.equal(isValidVersion('v17.0.0'), false);
  assert.equal(isValidVersion('17.0.0-rc.1'), false);
  // A YAML float (`addedIn: 17.0`) reaches the loader's fallback as a number.
  assert.equal(isValidVersion(17), false);
  assert.equal(isValidVersion(undefined), false);
  assert.equal(isValidVersion(null), false);
});

test('formatAddedIn renders the badge text or null', () => {
  assert.equal(formatAddedIn('17.0.0'), 'Added in Handsontable 17.0.0');
  assert.equal(formatAddedIn(17), null);
  assert.equal(formatAddedIn(undefined), null);
});

test('allowedVersions is the released set plus the next major, minor, and patch', () => {
  const allowed = allowedVersions(['17.1.0', '18.0.0', '18.1.0', '18.1.1']);

  assert.equal(allowed.has('17.1.0'), true);
  assert.equal(allowed.has('18.1.1'), true);
  assert.equal(allowed.has('19.0.0'), true, 'next major');
  assert.equal(allowed.has('18.2.0'), true, 'next minor');
  assert.equal(allowed.has('18.1.2'), true, 'next patch');
  assert.equal(allowed.has('18.3.0'), false, 'a skipped minor is not a release');
  assert.equal(allowed.has('17.2.0'), false, 'a minor that was never cut');
  assert.equal(allowed.has('20.0.0'), false);
});

test('allowedVersions ignores malformed input and copes with an empty list', () => {
  assert.deepEqual([...allowedVersions([])], []);
  assert.equal(allowedVersions(['18.1.1', 'next']).has('19.0.0'), true);
});

test('addedInError accepts an absent field and a released version', () => {
  const allowed = allowedVersions(['18.1.1']);

  assert.equal(addedInError(undefined, allowed), null);
  assert.equal(addedInError('18.1.1', allowed), null);
  assert.equal(addedInError('19.0.0', allowed), null);
});

test('addedInError explains a malformed value and an unknown version', () => {
  const allowed = allowedVersions(['18.1.1']);

  assert.match(addedInError(17, allowed), /quoted "MAJOR\.MINOR\.PATCH" string.*got 17/);
  assert.match(addedInError('17.0', allowed), /got "17\.0"/);
  assert.match(addedInError(null, allowed), /got null/);
  assert.match(addedInError('18.3.0', allowed), /18\.3\.0 is not a released Handsontable version/);
});

test('buildPageMarkdown puts the Added in sentence between the H1 and the body', () => {
  const md = buildPageMarkdown({ title: 'MultiSelect cell type', addedIn: '17.0.0' }, '\nBody text.\n');

  assert.equal(md, '# MultiSelect cell type\n\nAdded in Handsontable 17.0.0.\n\nBody text.');
});

test('buildPageMarkdown omits the sentence without a valid addedIn', () => {
  assert.equal(buildPageMarkdown({ title: 'Dropdown' }, 'Body.'), '# Dropdown\n\nBody.');
  // The loader's fallback can hand over a raw number; it must not leak into the Markdown.
  assert.equal(buildPageMarkdown({ title: 'Dropdown', addedIn: 17 }, 'Body.'), '# Dropdown\n\nBody.');
});

test('buildPageMarkdown applies the transform to the whole document', () => {
  const md = buildPageMarkdown({ title: 'T', addedIn: '17.0.0' }, 'x', (text) => text.toUpperCase());

  assert.equal(md, '# T\n\nADDED IN HANDSONTABLE 17.0.0.\n\nX');
});
