import { test } from 'node:test';
import assert from 'node:assert/strict';
import { featureEntries, formatReview } from '../readme-feature-review.mjs';

const added = (issueOrPR, title, framework = 'none') => ({ type: 'added', issueOrPR, title, framework });

test('featureEntries keeps only `added` entries', () => {
  assert.deepEqual(
    featureEntries([
      added(10, 'Added pagination.'),
      { type: 'fixed', issueOrPR: 11, title: 'Fixed a crash.' },
      { type: 'changed', issueOrPR: 12, title: 'Changed a default.' },
      { type: 'removed', issueOrPR: 13, title: 'Removed a plugin.' },
    ]).map(e => e.issueOrPR),
    [10],
  );
});

test('featureEntries sorts newest first and survives malformed input', () => {
  assert.deepEqual(
    featureEntries([added(7, 'a'), null, undefined, {}, added(99, 'b'), added(50, 'c')])
      .map(e => e.issueOrPR),
    [99, 50, 7],
  );
});

test('formatReview lists each feature and the list as it stands', () => {
  const text = formatReview([added(42, 'Added notifications.')], ['Themes', 'Sorting data']);

  assert.match(text, /1 feature\(s\) are shipping/);
  assert.match(text, /#42 {2}Added notifications\./);
  assert.match(text, /Themes · Sorting data/);
});

test('formatReview tags a framework-specific feature', () => {
  assert.match(formatReview([added(42, 'Added a hook.', 'react')], []), /#42 \[react\]/);
});

test('formatReview says so plainly when there is nothing to review', () => {
  assert.match(formatReview([], ['Themes']), /needs no review/);
});

test('featureEntries sorts numerically even if an entry id arrives as a string', () => {
  // `?? 0` relied on coercion during subtraction; one non-numeric value made every comparison NaN
  // and silently left the list in directory order.
  assert.deepEqual(
    featureEntries([added('7', 'a'), added(99, 'b'), added('50', 'c'), added(undefined, 'd')])
      .map(e => e.issueOrPR),
    [99, '50', '7', undefined],
  );
});
