import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fenceForSummary, scrubSecrets } from '../lib/docs-sync/log.mjs';

test('a tokenized remote URL is scrubbed', () => {
  const text = "Command failed: git push --quiet origin HEAD:refs/heads/docs-sync/prod-docs-18.1\nfatal: unable to access 'https://x-access-token:ghs_abc123DEF456@github.com/handsontable/handsontable.git/': stale lease";

  assert.equal(
    scrubSecrets(text),
    "Command failed: git push --quiet origin HEAD:refs/heads/docs-sync/prod-docs-18.1\nfatal: unable to access 'https://x-access-token:***@github.com/handsontable/handsontable.git/': stale lease",
  );
});

test('text without a token is returned unchanged', () => {
  const text = 'Target prod-docs/18.1 (released 18.1.0), sync branch docs-sync/prod-docs-18.1.';

  assert.equal(scrubSecrets(text), text);
});

test('a Bearer credential echoed in an error body is redacted', () => {
  const text = 'LiteLLM responded 401: {"error":"invalid api key","request":{"Authorization":"Bearer sk-litellm-abc123"}}';

  assert.equal(
    scrubSecrets(text),
    'LiteLLM responded 401: {"error":"invalid api key","request":{"Authorization":"Bearer ***"}}',
  );
});

test('a literal secret is redacted wherever it appears, even without a Bearer prefix', () => {
  const key = 'sk-litellm-abc123';
  const text = `LiteLLM responded 403: <title>Blocked</title> key=${key} for ${key}`;

  assert.equal(
    scrubSecrets(text, [key]),
    'LiteLLM responded 403: <title>Blocked</title> key=*** for ***',
  );
});

test('empty or undefined secrets are ignored', () => {
  const text = 'nothing to scrub here';

  assert.equal(scrubSecrets(text, ['', undefined]), text);
});

test('a pathologically short secret is left alone so it cannot shred the log', () => {
  // A one-character GH_TOKEN (as the CLI test uses) would otherwise replace
  // every occurrence of that character in every line.
  const text = 'Target prod-docs/18.1, sync branch docs-sync/prod-docs-18.1.';

  assert.equal(scrubSecrets(text, ['x']), text);
});

test('fenceForSummary fences short text whole and bounds long text with a distinct pointer', () => {
  const short = fenceForSummary('short and fine', 100);

  assert.equal(short, '````\nshort and fine\n````');

  // Distinguishable content, so a slice that kept too much (a `max + 10` bug)
  // would fail the exact-length check on the fenced line.
  const capped = fenceForSummary('ab'.repeat(25), 20);
  const lines = capped.split('\n');

  assert.equal(lines[0], '````', 'opens with the four-backtick fence');
  assert.equal(lines[1], 'ab'.repeat(10), 'exactly the first 20 characters are kept');
  assert.match(capped, /\[cut for the step summary; full text in the job log\]/);
  assert.equal(lines.at(-1), '````', 'the closing fence survives the cut');
  // The marker deliberately avoids the `[truncated:` prefix classify.mjs uses,
  // so a log-scanning assertion never confuses the two.
  assert.doesNotMatch(capped, /\[truncated:/);
});
