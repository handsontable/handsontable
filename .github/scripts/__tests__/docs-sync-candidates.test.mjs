import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectProdRefs, isAlreadyOnProd, parseCherryOutput, parseSquashSubject,
} from '../lib/docs-sync/candidates.mjs';

test('the squash subject carries the pull request number at its end', () => {
  assert.equal(parseSquashSubject('DEV-2076: Clarify that dropdownMenu and contextMenu are independent plugins (#13444)'), 13444);
  assert.equal(parseSquashSubject('DEV-2762: Deprecate writing past the last column (#5409) (#13343)'), 13343);
  assert.equal(parseSquashSubject('18.1.0'), null);
  assert.equal(parseSquashSubject('Fix (#12) something'), null);
});

test('prod references come from parenthesized numbers in the subject and cherry-pick trailers', () => {
  const refs = collectProdRefs([
    { subject: 'Docs: publish llms.txt (#13441) (#13452)', body: '' },
    {
      subject: 'Sync docs content from develop to prod-docs/18.1 (#13460)',
      body: '* DEV-2076: Clarify plugins (#13444)\n\n(cherry picked from commit 5680ec8ae8f0000000000000000000000000abcd)\n* Fixes #999 in passing',
    },
  ]);

  // #13444 lives only in the body and is not collected: a squash body can
  // carry this tool's own sync report, whose non-included rows also name
  // pull requests that were never ported (see candidates.mjs).
  assert.deepEqual([...refs.prNumbers].sort((a, b) => a - b), [13441, 13452, 13460]);
  assert.deepEqual([...refs.shas], ['5680ec8ae8f0000000000000000000000000abcd']);
});

test('git cherry output yields the shas marked as already applied', () => {
  const text = '- aaaa1111\n+ bbbb2222\n- cccc3333\n';

  assert.deepEqual([...parseCherryOutput(text)], ['aaaa1111', 'cccc3333']);
});

test('a candidate is on prod by patch-id, by pull request number, or by trailer sha', () => {
  const refs = { prNumbers: new Set([13444]), shas: new Set(['5680ec8ae8f0000000000000000000000000abcd']) };
  const equivalent = new Set(['deadbeef']);

  assert.equal(isAlreadyOnProd({ sha: 'deadbeef', prNumber: 1 }, refs, equivalent), true);
  assert.equal(isAlreadyOnProd({ sha: 'other', prNumber: 13444 }, refs, equivalent), true);
  assert.equal(isAlreadyOnProd({ sha: '5680ec8ae8f0000000000000000000000000abcd', prNumber: 2 }, refs, equivalent), true);
  assert.equal(isAlreadyOnProd({ sha: 'fresh', prNumber: 3 }, refs, equivalent), false);
});
