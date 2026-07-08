import assert from 'node:assert/strict';
import test from 'node:test';
import { applyOptionsToPlugins } from '../applyOptionsToPlugins.mjs';

const [memorizeOptions, applyPluginOptions] = applyOptionsToPlugins;

const buildOptionsData = (...options) => [
  {
    meta: {
      filename: 'metaSchema.js',
    },
  },
  ...options
];

const buildPluginData = plugin => [
  {
    customTags: [
      {
        tag: 'plugin',
        value: plugin,
      },
    ],
  },
  {
    kind: 'constructor',
    name: plugin,
  },
  {
    kind: 'function',
    name: 'someMethod',
  },
];

const buildPluginDataWithoutCustomTags = plugin => [
  {
    kind: 'member',
    memberof: plugin,
    name: 'someMember',
  },
  {
    kind: 'constructor',
    name: plugin,
  },
  {
    kind: 'function',
    memberof: plugin,
    name: 'someMethod',
  },
];

test('splices options into matching plugin data after the constructor', () => {
  const option = {
    category: 'SplicedOptionsPlugin',
    description: 'Plugin option description.',
    name: 'splicedOptionsPlugin',
  };

  memorizeOptions(buildOptionsData(option));

  const pluginData = buildPluginData('SplicedOptionsPlugin');
  const result = applyPluginOptions(pluginData);

  assert.equal(result[2].name, 'splicedOptionsPlugin');
  assert.equal(result[2].isOption, true);
  assert.equal(result[2].category, undefined);
  assert.equal(result[2].memberof, 'SplicedOptionsPlugin');
  assert.equal(result[3].name, 'someMethod');
});

test('splices options into plugin data identified by member ownership', () => {
  const option = {
    category: 'MemberOwnedOptionsPlugin',
    description: 'Member-owned plugin option description.',
    name: 'memberOwnedOptionsPlugin',
  };

  memorizeOptions(buildOptionsData(option));

  const result = applyPluginOptions(buildPluginDataWithoutCustomTags('MemberOwnedOptionsPlugin'));

  assert.equal(result[2].name, 'memberOwnedOptionsPlugin');
  assert.equal(result[2].isOption, true);
  assert.equal(result[2].memberof, 'MemberOwnedOptionsPlugin');
});

test('does not splice options into a different plugin', () => {
  memorizeOptions(buildOptionsData({
    category: 'OtherOptionsPlugin',
    description: 'Other option description.',
    name: 'otherOptionsPlugin',
  }));

  const pluginData = buildPluginData('PluginWithoutOptions');
  const result = applyPluginOptions(pluginData);

  assert.deepEqual(result, pluginData);
});

test('normalizes self-links and option anchors only in injected option descriptions', () => {
  const option = {
    category: 'CollapsibleColumns',
    description: [
      'The `collapsibleColumns` option configures the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin.',
      '',
      'Read more:',
      '- [Plugins: `CollapsibleColumns`](@/api/collapsibleColumns.md)',
      '- [`nestedHeaders`](#nestedHeaders)',
    ].join('\n'),
    name: 'collapsibleColumns',
  };

  memorizeOptions(buildOptionsData(option));

  const result = applyPluginOptions(buildPluginData('CollapsibleColumns'));
  const injectedOption = result.find(member => member.name === 'collapsibleColumns');

  assert.equal(
    option.description,
    [
      'The `collapsibleColumns` option configures the [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin.',
      '',
      'Read more:',
      '- [Plugins: `CollapsibleColumns`](@/api/collapsibleColumns.md)',
      '- [`nestedHeaders`](#nestedHeaders)',
    ].join('\n')
  );
  assert.equal(
    injectedOption.description,
    [
      'The `collapsibleColumns` option configures the `CollapsibleColumns` plugin.',
      '',
      'Read more:',
      '- [`nestedHeaders`](@/api/options.md#nestedheaders)',
    ].join('\n')
  );
});
