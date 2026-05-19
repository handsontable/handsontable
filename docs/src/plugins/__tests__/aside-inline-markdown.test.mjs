import assert from 'node:assert/strict';
import test from 'node:test';
import {
  convertAsideBodyMarkdown,
  convertAsideInlineMarkdown,
} from '../aside-inline-markdown.mjs';

test('bold **text** becomes strong', () => {
  assert.equal(
    convertAsideInlineMarkdown('**DOMPurify will be removed.** After that, stop.'),
    '<strong>DOMPurify will be removed.</strong> After that, stop.'
  );
});

test('inline code is preserved and not bolded', () => {
  assert.equal(
    convertAsideInlineMarkdown('Use the `sanitizer` option.'),
    'Use the <code>sanitizer</code> option.'
  );
});

test('link label may contain inline code', () => {
  assert.equal(
    convertAsideInlineMarkdown('See [`sanitizer`](/api/options.md#sanitizer) for details.'),
    'See <a href="/api/options.md#sanitizer"><code>sanitizer</code></a> for details.'
  );
});

test('cell-renderer style caution line', () => {
  const line =
    '**DOMPurify will be removed in the next version.** After that, any string containing HTML will be stripped before rendering. To keep sanitized HTML (e.g. with DOMPurify), set the [`sanitizer`](@/api/options.md#sanitizer) option to your own sanitizer function.';

  const out = convertAsideInlineMarkdown(line);

  assert.match(out, /^<strong>DOMPurify will be removed in the next version\.<\/strong>/);
  assert.match(
    out,
    /set the <a href="@\/api\/options\.md#sanitizer"><code>sanitizer<\/code><\/a> option/
  );
});

test('bold wrapping a markdown link', () => {
  assert.equal(
    convertAsideInlineMarkdown('**See [docs](/guides/foo)** for more.'),
    '<strong>See <a href="/guides/foo">docs</a></strong> for more.'
  );
});

test('bold-wrapped link: query string is not double-escaped', () => {
  assert.equal(
    convertAsideInlineMarkdown('**See [docs](/guides/foo?a=1&b=2)** for more.'),
    '<strong>See <a href="/guides/foo?a=1&amp;b=2">docs</a></strong> for more.'
  );
});

test('markdown link wrapping bold label', () => {
  assert.equal(
    convertAsideInlineMarkdown('[**Important**](/warn)'),
    '<a href="/warn"><strong>Important</strong></a>'
  );
});

test('convertAsideBodyMarkdown maps each line', () => {
  assert.equal(
    convertAsideBodyMarkdown('Line one **bold**.\nLine two `code`.'),
    'Line one <strong>bold</strong>.\nLine two <code>code</code>.'
  );
});
