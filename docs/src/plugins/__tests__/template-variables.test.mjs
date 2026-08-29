import assert from 'node:assert/strict';
import test from 'node:test';
import { replaceTemplateVariables } from '../template-variables.mjs';
import {
  CURRENT_DOCS_VERSION,
  CURRENT_DOCS_MINOR_VERSION,
  CURRENT_EXAMPLES_BRANCH,
} from '../docs-version.mjs';
import { LATEST_CHANGELOG_MAJOR } from '../changelog-parser.mjs';

const values = {
  basePath: '/docs',
  version: '18.0.2',
  minorVersion: 'prod-docs/18.0',
  examplesBranch: 'prod-examples/18',
};

test('resolves every supported template variable', () => {
  const md = [
    '![shot]({{$basePath}}/img/pages/shot.png)',
    'Install handsontable@{{$currentVersion}}.',
    '[source](https://github.com/handsontable/handsontable/tree/{{$currentMinorVersion}}/docs)',
    '[starter](https://github.com/handsontable/examples/tree/{{$examplesBranch}}/examples/mui)',
  ].join('\n');

  const result = replaceTemplateVariables(md, values);

  assert.ok(result.includes('![shot](/docs/img/pages/shot.png)'));
  assert.ok(result.includes('handsontable@18.0.2'));
  assert.ok(result.includes('handsontable/tree/prod-docs/18.0/docs'));
  assert.ok(result.includes('examples/tree/prod-examples/18/examples/mui'));
  assert.ok(!result.includes('{{'), 'no unresolved template variable should remain');
});

test('tolerates whitespace inside the braces', () => {
  const result = replaceTemplateVariables(
    'a {{ $examplesBranch }} b {{  $currentVersion  }}',
    values
  );

  assert.equal(result, 'a prod-examples/18 b 18.0.2');
});

test('replaces every occurrence, not only the first', () => {
  const result = replaceTemplateVariables(
    '{{$examplesBranch}} {{$examplesBranch}} {{$examplesBranch}}',
    values
  );

  assert.equal(result, 'prod-examples/18 prod-examples/18 prod-examples/18');
});

test('{{$basePath}} defaults to an empty string so page paths stay root-relative', () => {
  assert.equal(
    replaceTemplateVariables('![shot]({{$basePath}}/img/pages/shot.png)'),
    '![shot](/img/pages/shot.png)'
  );
});

test('defaults come from the resolved build constants', () => {
  const result = replaceTemplateVariables(
    '{{$currentVersion}}|{{$currentMinorVersion}}|{{$examplesBranch}}'
  );

  assert.equal(
    result,
    `${CURRENT_DOCS_VERSION}|${CURRENT_DOCS_MINOR_VERSION}|${CURRENT_EXAMPLES_BRANCH}`
  );
});

test('a $ in a replacement value is not read as a replacement pattern', () => {
  const result = replaceTemplateVariables('v{{$currentVersion}}', {
    ...values,
    version: '18.0.0-$&-$1',
  });

  assert.equal(result, 'v18.0.0-$&-$1');
});

test('resolves {{$latestChangelogVersion}} to the highest existing changelog major', () => {
  assert.equal(
    replaceTemplateVariables('changelog-{{$latestChangelogVersion}}'),
    `changelog-${LATEST_CHANGELOG_MAJOR}`
  );
  assert.equal(
    replaceTemplateVariables('changelog-{{$latestChangelogVersion}}', { latestChangelogVersion: 42 }),
    'changelog-42'
  );
});

test('leaves unknown variables untouched', () => {
  assert.equal(replaceTemplateVariables('{{$notAVariable}}', values), '{{$notAVariable}}');
});
