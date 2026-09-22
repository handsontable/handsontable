import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { AGENT_NOTE_HTML_COMMENT } from '../../agent-note.mjs';

const sourcePath = fileURLToPath(new URL('../../agent-note.mjs', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

test('agent-note.mjs stays a leaf module: no imports', () => {
  // Head.astro embeds this module on every rendered page. An import here can
  // (transitively) pull sidebar.mjs — whose createRequire(import.meta.url)
  // breaks inside the prerender bundle — which is why the module declares
  // itself import-free. Pin that so a convenience import does not regress it.
  assert.ok(!/^\s*import\b/m.test(source), 'agent-note.mjs must not import anything');
  assert.ok(!source.includes('require('), 'agent-note.mjs must not require anything');
});

test('the HTML-comment form is one well-formed comment with no inner --', () => {
  assert.ok(AGENT_NOTE_HTML_COMMENT.startsWith('<!-- '));
  assert.ok(AGENT_NOTE_HTML_COMMENT.endsWith(' -->'));

  // A -- sequence inside an HTML comment terminates it early, spilling the
  // rest as page content. This is why the HTML form carries no CLI flags.
  const inner = AGENT_NOTE_HTML_COMMENT.slice('<!--'.length, -'-->'.length);

  assert.ok(!inner.includes('--'), 'the comment body must not contain "--"');
});
