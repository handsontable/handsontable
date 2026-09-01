import assert from 'node:assert/strict';
import test from 'node:test';
import { vuepressPreprocessor } from '../vuepress-preprocessor.mjs';
import {
  CURRENT_DOCS_VERSION,
  CURRENT_DOCS_MINOR_VERSION,
  CURRENT_EXAMPLES_BRANCH,
} from '../docs-version.mjs';

const plugin = vuepressPreprocessor({ framework: 'javascript' });

/**
 * Runs markdown through the plugin's transform hook the way Vite would.
 *
 * @param {string} md
 * @returns {string}
 */
function transform(md) {
  return plugin.transform(md, '/docs/content/recipes/themes/mui-theme/mui-theme.md').code;
}

test('resolves the template variables this pipeline shares with the content loader', () => {
  // The two pipelines are separate: a variable wired into framework-loader.mjs
  // alone stays a literal here. Guard both.
  const result = transform([
    '[starter](https://github.com/handsontable/examples/tree/{{$examplesBranch}}/examples/mui)',
    '[source](https://github.com/handsontable/handsontable/tree/{{$currentMinorVersion}}/docs)',
    'Install handsontable@{{$currentVersion}}.',
    '![shot]({{$basePath}}/img/pages/shot.png)',
  ].join('\n'));

  assert.ok(result.includes(`examples/tree/${CURRENT_EXAMPLES_BRANCH}/examples/mui`));
  assert.ok(result.includes(`handsontable/tree/${CURRENT_DOCS_MINOR_VERSION}/docs`));
  assert.ok(result.includes(`handsontable@${CURRENT_DOCS_VERSION}`));
  assert.ok(result.includes('![shot](/img/pages/shot.png)'));
  assert.ok(!result.includes('{{'), 'no unresolved template variable should remain');
});

test('skips files that are not markdown', () => {
  assert.equal(plugin.transform('{{$examplesBranch}}', '/docs/src/app.ts'), null);
});
