import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DECISIONS, buildUserMessage, cacheKey, collectUnreleased, loadPrompt, parseDecision, promptHash,
} from '../lib/docs-sync/classify.mjs';

const released = { major: 18, minor: 1, patch: 0 };

test('the prompt loads and hashes stably', async() => {
  const prompt = await loadPrompt();

  assert.match(prompt, /"decision"/);
  assert.equal(promptHash(prompt), promptHash(prompt));
  assert.match(promptHash(prompt), /^[0-9a-f]{12}$/);
  assert.equal(cacheKey('abc', 'def'), 'abc:def');
});

test('unreleased features come from pending entries and newer changelog sections', () => {
  const pendingEntries = [
    { type: 'added', title: 'Added the `renderMode` option.', issueOrPR: 13384 },
    { type: 'fixed', title: 'Fixed a thing.', issueOrPR: 13400 },
  ];
  const changelogMarkdown = [
    '## [18.2.0] - 2026-10-01',
    '### Added',
    '- Added the `moveCells` option. [#1](x)',
    '## [18.1.0] - 2026-09-01',
    '### Added',
    '- Added the `colorScheme` option. [#2](x)',
  ].join('\n');

  const text = collectUnreleased({ pendingEntries, changelogMarkdown, released });

  assert.match(text, /renderMode/);
  assert.match(text, /Fixed a thing/);
  assert.match(text, /18\.2\.0/);
  assert.match(text, /moveCells/);
  assert.doesNotMatch(text, /colorScheme/);
});

test('collectUnreleased says so when nothing is pending', () => {
  assert.match(collectUnreleased({ pendingEntries: [], changelogMarkdown: '## [18.1.0] - x\n- a', released }), /nothing/i);
});

test('the user message carries every input and truncates long parts', () => {
  const message = buildUserMessage({
    pr: { number: 13444, title: 'DEV-2076: Clarify plugins', body: 'b'.repeat(10) },
    files: ['docs/content/guides/a.md'],
    diff: 'd'.repeat(100),
    releasedVersion: '18.1.0',
    target: 'prod-docs/18.1',
    unreleased: '- Added X',
  }, { maxBody: 4, maxDiff: 10 });

  assert.match(message, /prod-docs\/18\.1/);
  assert.match(message, /18\.1\.0/);
  assert.match(message, /#13444/);
  assert.match(message, /docs\/content\/guides\/a\.md/);
  assert.match(message, /- Added X/);
  assert.match(message, /bbbb\n\[truncated: 6 more characters\]/);
  assert.match(message, /dddddddddd\n\[truncated: 90 more characters\]/);
});

test('parseDecision accepts a bare object and a fenced one, and falls back to unsure', () => {
  assert.deepEqual(parseDecision('{"decision":"include","reason":"typo"}'), { decision: 'include', reason: 'typo' });
  assert.deepEqual(parseDecision('```json\n{"decision":"exclude","reason":"18.2"}\n```'), { decision: 'exclude', reason: '18.2' });
  assert.equal(parseDecision('maybe').decision, 'unsure');
  assert.equal(parseDecision('{"decision":"yes","reason":"x"}').decision, 'unsure');
  assert.equal(parseDecision('{"decision":"include"}').decision, 'unsure');
  assert.deepEqual(DECISIONS, ['include', 'exclude', 'unsure']);
});
