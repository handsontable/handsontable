import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  RENDERED_HTML_MARKER_RE,
  setRenderedHtmlDirForTests,
  writeRenderedHtml,
  readRenderedHtml,
} from '../rendered-html-store.mjs';

const dir = mkdtempSync(join(tmpdir(), 'hot-rendered-store-'));

setRenderedHtmlDirForTests(dir);
test.after(() => rmSync(dir, { recursive: true, force: true }));

test('write returns a marker and read round-trips the HTML', () => {
  const html = '<h2>Cell type</h2><span class="hot-tk-2">const</span>';
  const marker = writeRenderedHtml('react-data-grid/cell-type', html);

  assert.equal(marker, '<!--hot-rendered:react-data-grid/cell-type-->');
  assert.equal(readRenderedHtml('react-data-grid/cell-type'), html);
});

test('the middleware regex extracts the entry id from a page body', () => {
  const page = '<html><body><main><!--hot-rendered:javascript-data-grid/intro--></main></body></html>';
  const matches = [...page.matchAll(RENDERED_HTML_MARKER_RE)];

  assert.equal(matches.length, 1);
  assert.equal(matches[0][1], 'javascript-data-grid/intro');
});

test('replacement content containing $-sequences survives String.replace with a function', () => {
  writeRenderedHtml('index', 'price is $& and ${x} and $1');
  const page = 'a <!--hot-rendered:index--> b';
  const replaced = page.replace(RENDERED_HTML_MARKER_RE, (marker, id) => readRenderedHtml(id));

  assert.equal(replaced, 'a price is $& and ${x} and $1 b');
});

test('reading a missing entry returns null', () => {
  assert.equal(readRenderedHtml('does-not-exist'), null);
});

test('ids differing only in separator shape never share a file', () => {
  writeRenderedHtml('react-data-grid/cell__type', 'slash then underscores');
  writeRenderedHtml('react-data-grid/cell/_type', 'nested');

  assert.equal(readRenderedHtml('react-data-grid/cell__type'), 'slash then underscores');
  assert.equal(readRenderedHtml('react-data-grid/cell/_type'), 'nested');
});

test('ids with empty or dot segments are rejected', () => {
  for (const id of ['../escape', 'a/../b', 'a//b', './a', 'a/.']) {
    assert.throws(() => writeRenderedHtml(id, 'x'), /Invalid rendered-HTML entry id/);
  }
});
