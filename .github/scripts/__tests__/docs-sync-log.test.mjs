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
