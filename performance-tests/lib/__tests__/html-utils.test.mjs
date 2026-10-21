// The one markup escaper both generated pages use. Pinned so the report and the history index
// cannot drift on which characters are escaped.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../html-utils.mjs';

describe('escapeHtml', () => {
  test('escapes the five characters that break out of text or either kind of attribute', () => {
    assert.equal(
      escapeHtml('<a href="x" title=\'y\'>&</a>'),
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    );
  });

  test('stringifies non-strings and leaves plain text alone', () => {
    assert.equal(escapeHtml(42), '42');
    assert.equal(escapeHtml('AMD EPYC 7763 64-Core Processor'), 'AMD EPYC 7763 64-Core Processor');
  });
});
