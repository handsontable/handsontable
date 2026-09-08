import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractOptionNames,
  extractHookNames,
  extractPluginNames,
  extractApiFileSlugs,
  buildKnownFileSlugs,
  collectAddedSectionLines,
  collectBullets,
  resolveApiTarget,
  resolveMisspelledApiTarget,
  findUnlinkedApiNames,
  findBrokenApiLinks,
  formatSummary,
} from '../check-changelog-api-links.mjs';

const api = {
  optionNames: new Set(['renderAllColumns', 'minRowHeights', 'rowHeights', 'filters']),
  hookNames: new Set(['beforeBeginEditing', 'beforeCompositionStart']),
  pluginNames: new Map([['Filters', 'filters'], ['NestedRows', 'nestedRows']]),
  fileSlugs: new Set(['options', 'hooks', 'core', 'filters', 'nestedRows']),
};

test('extractOptionNames reads the property that follows a @memberof Options# block', () => {
  const source = [
    '    /**',
    '     * The `activeHeaderClassName` option.',
    '     *',
    '     * @memberof Options#',
    '     * @type {string}',
    '     */',
    "    activeHeaderClassName: 'ht__active_highlight',",
  ].join('\n');

  assert.deepEqual([...extractOptionNames(source)], ['activeHeaderClassName']);
});

test('extractOptionNames accepts the method-shorthand options', () => {
  const source = [
    '    /**',
    '     * @memberof Options#',
    '     */',
    '    isEmptyCol(this: HotInstance, col: number) {',
    '      return true;',
    '    },',
  ].join('\n');

  assert.deepEqual([...extractOptionNames(source)], ['isEmptyCol']);
});

test('extractOptionNames ignores a property whose block carries no @memberof Options# tag', () => {
  const source = [
    '    /**',
    '     * An internal property, not a documented option.',
    '     */',
    '    _internalFlag: false,',
  ].join('\n');

  assert.deepEqual([...extractOptionNames(source)], []);
});

test('extractHookNames takes REGISTERED_HOOKS and ignores quoted words inside its JSDoc blocks', () => {
  const source = [
    'export const REGISTERED_HOOKS = [',
    '  /**',
    '   * @event Hooks#afterChange',
    '   * @example',
    "   * hot.addHook('afterChange', () => {});",
    '   */',
    "  'afterChange',",
    "  'beforeChange',",
    '];',
    '',
    'export const REMOVED_HOOKS = new Map([',
    "  ['modifyRow', '14.0.0'],",
    ']);',
  ].join('\n');

  assert.deepEqual([...extractHookNames(source)], ['afterChange', 'beforeChange']);
});

test('extractPluginNames maps a class name to its directory, for both import and export forms', () => {
  const source = [
    "import { AutoColumnSize } from './autoColumnSize';",
    "export { BasePlugin } from './base';",
    "import { registerPlugin } from '../plugins';",
  ].join('\n');

  assert.deepEqual([...extractPluginNames(source)], [['AutoColumnSize', 'autoColumnSize'], ['BasePlugin', 'base']]);
});

test('extractApiFileSlugs reads every children list of the api sidebar', () => {
  const source = [
    'module.exports = {',
    '  sidebar: [',
    "    { title: 'Core API', children: ['core', 'hooks', 'options'] },",
    "    { title: 'Cells', children: ['autofill', 'comments'] },",
    '  ],',
    '};',
  ].join('\n');

  assert.deepEqual([...extractApiFileSlugs(source)], ['core', 'hooks', 'options', 'autofill', 'comments']);
});

test('buildKnownFileSlugs accepts a plugin page the api sidebar does not list', () => {
  const sidebar = "sidebar: [{ title: 'Core API', children: ['core', 'options'] }]";
  const plugins = "import { DataProvider } from './dataProvider';";
  const slugs = buildKnownFileSlugs(sidebar, plugins);

  assert.deepEqual([...slugs].sort(), ['core', 'dataProvider', 'options']);
});

test('collectAddedSectionLines keeps only the Added section and stops at the next heading', () => {
  const markdown = [
    '#### Added',
    '- an added entry',
    '',
    '#### Fixed',
    '- a fixed entry',
  ].join('\n');

  assert.deepEqual(collectAddedSectionLines(markdown), [
    { line: 2, text: '- an added entry' },
    { line: 3, text: '' },
  ]);
});

test('collectAddedSectionLines skips a fenced code block inside an Added section', () => {
  const markdown = [
    '#### Added',
    '```js',
    '- not a bullet: `renderAllColumns`',
    '```',
    '- a real bullet',
  ].join('\n');

  assert.deepEqual(collectAddedSectionLines(markdown), [{ line: 5, text: '- a real bullet' }]);
});

test('collectBullets joins a bullet that wraps over several lines', () => {
  const bullets = collectBullets([
    { line: 4, text: '- Added a new option,' },
    { line: 5, text: '  `renderAllColumns`, which helps.' },
    { line: 6, text: '- A second bullet.' },
  ]);

  assert.deepEqual(bullets, [
    { line: 4, text: '- Added a new option, `renderAllColumns`, which helps.' },
    { line: 6, text: '- A second bullet.' },
  ]);
});

test('resolveApiTarget prefers the plugin page over an option of the same word', () => {
  assert.deepEqual(resolveApiTarget('Filters', api), { file: 'filters', anchor: '' });
  assert.deepEqual(resolveApiTarget('filters', api), { file: 'options', anchor: 'filters' });
});

test('resolveApiTarget lowercases the anchor and returns null for an unknown name', () => {
  assert.deepEqual(resolveApiTarget('minRowHeights', api), { file: 'options', anchor: 'minrowheights' });
  assert.deepEqual(resolveApiTarget('beforeBeginEditing', api), { file: 'hooks', anchor: 'beforebeginediting' });
  assert.equal(resolveApiTarget('paginationButtonHoverBackground', api), null);
});

test('resolveMisspelledApiTarget corrects a name that differs only in case', () => {
  assert.deepEqual(resolveMisspelledApiTarget('beforeCompositionstart', api), {
    file: 'hooks',
    anchor: 'beforecompositionstart',
    canonicalName: 'beforeCompositionStart',
  });
  assert.equal(resolveMisspelledApiTarget('beforeCompositionStart', api), null);
});

test('findUnlinkedApiNames reports an option named in backticks without a link', () => {
  const markdown = [
    '#### Added',
    '- Added a new `renderAllColumns` option. [#10599](https://github.com/handsontable/handsontable/pull/10599)',
  ].join('\n');

  assert.deepEqual(findUnlinkedApiNames(markdown, api), [{
    line: 2,
    name: 'renderAllColumns',
    misspelled: false,
    suggestion: '[`renderAllColumns`](@/api/options.md#renderallcolumns)',
  }]);
});

test('findUnlinkedApiNames leaves an already linked name alone, whichever form the link takes', () => {
  const markdown = [
    '#### Added',
    '- Added [`renderAllColumns`](@/api/options.md#renderallcolumns).',
    '- Added [`minRowHeights`](https://handsontable.com/docs/javascript-data-grid/api/options/#minrowheights).',
  ].join('\n');

  assert.deepEqual(findUnlinkedApiNames(markdown, api), []);
});

test('findUnlinkedApiNames does not report a name that has no reference page', () => {
  const markdown = [
    '#### Added',
    '- Added dedicated `paginationButtonHover` theme tokens and the `SanitizerContext` type.',
    '- Added support for `Intl.NumberFormat` options.',
  ].join('\n');

  assert.deepEqual(findUnlinkedApiNames(markdown, api), []);
});

test('findUnlinkedApiNames reports a plugin class, a hook, and a method-call name', () => {
  const markdown = [
    '#### Added',
    '- Added a public API to the `NestedRows` plugin: `collapseAll()`, and the new `beforeBeginEditing` hook.',
  ].join('\n');
  const findings = findUnlinkedApiNames(markdown, api);

  assert.deepEqual(findings.map(({ name, suggestion }) => [name, suggestion]), [
    ['NestedRows', '[`NestedRows`](@/api/nestedRows.md)'],
    ['beforeBeginEditing', '[`beforeBeginEditing`](@/api/hooks.md#beforebeginediting)'],
  ]);
});

test('findUnlinkedApiNames suggests the documented spelling for a miscased name', () => {
  const markdown = [
    '#### Added',
    '- Fixed the Comments plugin for IME editing and added a new `beforeCompositionstart` hook.',
  ].join('\n');

  assert.deepEqual(findUnlinkedApiNames(markdown, api), [{
    line: 2,
    name: 'beforeCompositionstart',
    misspelled: true,
    suggestion: '[`beforeCompositionStart`](@/api/hooks.md#beforecompositionstart)',
  }]);
});

test('findUnlinkedApiNames ignores a name outside an Added section', () => {
  const markdown = [
    '#### Fixed',
    '- Fixed the `renderAllColumns` option.',
  ].join('\n');

  assert.deepEqual(findUnlinkedApiNames(markdown, api), []);
});

test('findUnlinkedApiNames reports each name once per bullet', () => {
  const markdown = [
    '#### Added',
    '- Added `renderAllColumns`, because `renderAllColumns` helps.',
  ].join('\n');

  assert.equal(findUnlinkedApiNames(markdown, api).length, 1);
});

test('findBrokenApiLinks accepts a link whose file and anchor both resolve', () => {
  const markdown = '- Added [`renderAllColumns`](@/api/options.md#renderallcolumns) and [`Filters`](@/api/filters.md).';

  assert.deepEqual(findBrokenApiLinks(markdown, api), []);
});

test('findBrokenApiLinks reports a file slug that is neither a sidebar entry nor a plugin', () => {
  const markdown = '- Added [`thing`](@/api/notAPage.md#thing).';
  const findings = findBrokenApiLinks(markdown, api);

  assert.equal(findings.length, 1);
  assert.match(findings[0].reason, /neither an api sidebar entry nor a plugin/);
});

test('findBrokenApiLinks reports an anchor that is not lowercase', () => {
  const markdown = '- Added [`minRowHeights`](@/api/options.md#minRowHeights).';
  const findings = findBrokenApiLinks(markdown, api);

  assert.equal(findings.length, 1);
  assert.match(findings[0].reason, /must be lowercase - reference headings resolve to #minrowheights/);
});

test('findBrokenApiLinks reports an anchor that is not a member of the options or hooks page', () => {
  const markdown = '- See [the section](@/api/options.md#copypaste-additional-options).';
  const findings = findBrokenApiLinks(markdown, api);

  assert.equal(findings.length, 1);
  assert.deepEqual(findings[0], {
    line: 1,
    link: '@/api/options.md#copypaste-additional-options',
    reason: '#copypaste-additional-options is not a member of api/options.md',
  });
});

test('findBrokenApiLinks leaves an anchor on a page it cannot enumerate alone', () => {
  const markdown = '- Added [`collapseAll()`](@/api/nestedRows.md#collapseall).';

  assert.deepEqual(findBrokenApiLinks(markdown, api), []);
});

test('formatSummary states the clean case without a table', () => {
  const summary = formatSummary({ unlinked: [], broken: [] });

  assert.match(summary, /Every API name in an `Added` entry links to its reference page\./);
  assert.doesNotMatch(summary, /\| Page \|/);
});

test('formatSummary tabulates both kinds of finding and marks a miscased name', () => {
  const summary = formatSummary({
    unlinked: [{
      file: 'docs/content/guides/upgrade-and-migration/changelog-15/changelog-15.md',
      line: 35,
      name: 'beforeCompositionstart',
      misspelled: true,
      suggestion: '[`beforeCompositionStart`](@/api/hooks.md#beforecompositionstart)',
    }],
    broken: [{
      file: 'docs/content/guides/upgrade-and-migration/changelog-16/changelog-16.md',
      line: 42,
      link: '@/api/options.md#minRowHeights',
      reason: 'anchor #minRowHeights must be lowercase',
    }],
  });

  assert.match(summary, /1 API name\(s\) named without a reference link/);
  assert.match(summary, /cased differently in the source/);
  assert.match(summary, /1 `@\/api\/` link\(s\) that cannot resolve/);
});
