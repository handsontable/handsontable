import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const headPath = fileURLToPath(new URL('../Head.astro', import.meta.url));
const headSource = readFileSync(headPath, 'utf8');

// The script that groups .source-code-link / .ask-about-api-btn elements under their
// preceding heading queries the headings with querySelectorAll. Using the `:is()`
// pseudo-class there throws a SyntaxError DOMException on browsers/crawlers that don't
// support it (Sentry HANDSONTABLE-DOCS-1HP / 1HN), crashing the rest of the script.
const headingActionsBlock = headSource.slice(
  headSource.indexOf('.api-member-actions container inside their preceding heading.'),
  headSource.indexOf('docs-assistant:ask')
);

test('heading-actions grouping does not use :is() inside querySelectorAll', () => {
  // Regression guard for HANDSONTABLE-DOCS-1HP / 1HN: :is() in a querySelectorAll argument
  // throws SyntaxError in browsers without :is() support.
  assert.doesNotMatch(
    headingActionsBlock,
    /querySelectorAll[\s\S]*?:is\(/,
    'querySelectorAll must not use the :is() pseudo-class (unsupported in older browsers)'
  );
});

test('heading-actions grouping selects h2, h3, h4 via an expanded selector list', () => {
  assert.match(
    headingActionsBlock,
    /\.sl-markdown-content h2,\s*\.sl-markdown-content h3,\s*\.sl-markdown-content h4/
  );
});
