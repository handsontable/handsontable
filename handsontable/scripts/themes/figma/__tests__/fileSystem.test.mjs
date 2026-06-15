import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokensLoadErrorMessage } from '../utils/helpers/fileSystem.mjs';

test('tokensLoadErrorMessage reports a missing file for ENOENT', () => {
  const err = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
  const msg = tokensLoadErrorMessage(err, '/abs/tokens.json');

  assert.match(msg, /Tokens file not found/);
});

test('tokensLoadErrorMessage surfaces the real error for a corrupt/unreadable file', () => {
  const parseError = new SyntaxError('Unexpected token } in JSON at position 42');
  const msg = tokensLoadErrorMessage(parseError, '/abs/tokens.json');

  assert.match(msg, /Failed to read or parse the tokens file at \/abs\/tokens\.json/);
  assert.match(msg, /Unexpected token/);
  assert.doesNotMatch(msg, /not found/);
});
