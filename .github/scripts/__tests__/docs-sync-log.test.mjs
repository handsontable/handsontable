import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrubSecrets } from '../lib/docs-sync/log.mjs';

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
