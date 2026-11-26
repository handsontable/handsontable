import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFrameworkMarkdownRoutes } from '../markdown-routes.mjs';

const PREFIXES = {
  javascript: 'javascript-data-grid',
  react: 'react-data-grid',
};

const BODY = [
  'Shared intro.',
  '',
  '::: only-for javascript',
  'Run the JavaScript build.',
  ':::',
  '',
  '::: only-for react',
  'Run the React build.',
  ':::',
  '',
  '::: only-for javascript react',
  'Both frameworks see this.',
  ':::',
].join('\n');

const identity = (text) => text;

test('buildFrameworkMarkdownRoutes keeps only each framework\'s own only-for blocks', () => {
  const routes = new Map(buildFrameworkMarkdownRoutes('custom-builds', BODY, PREFIXES, identity));

  const js = routes.get('javascript-data-grid/custom-builds.md');
  const react = routes.get('react-data-grid/custom-builds.md');

  assert.match(js, /Run the JavaScript build\./);
  assert.doesNotMatch(js, /Run the React build\./);
  assert.match(react, /Run the React build\./);
  assert.doesNotMatch(react, /Run the JavaScript build\./);

  for (const md of [js, react]) {
    assert.match(md, /Shared intro\./);
    assert.match(md, /Both frameworks see this\./);
    assert.doesNotMatch(md, /only-for/);
    assert.doesNotMatch(md, /^:::\s*$/m);
  }
});

test('buildFrameworkMarkdownRoutes writes one route per framework prefix', () => {
  const routes = buildFrameworkMarkdownRoutes('api/hidden-columns', BODY, PREFIXES, identity);

  assert.deepEqual(routes.map(([path]) => path), [
    'javascript-data-grid/api/hidden-columns.md',
    'react-data-grid/api/hidden-columns.md',
  ]);
});

test('buildFrameworkMarkdownRoutes builds each page from the filtered body', () => {
  const seen = [];
  const build = (content) => {
    seen.push(content);

    return `# Title\n\n${content}`;
  };

  const routes = new Map(buildFrameworkMarkdownRoutes('custom-builds', BODY, PREFIXES, build));

  assert.equal(seen.length, 2);
  assert.ok(seen.every((content) => !content.includes('only-for')));
  assert.ok(routes.get('react-data-grid/custom-builds.md').startsWith('# Title\n\n'));
});

test('buildFrameworkMarkdownRoutes keeps nested non-only-for blocks inside a kept block', () => {
  const body = [
    '::: only-for react',
    '::: tip',
    'React tip.',
    ':::',
    ':::',
  ].join('\n');

  const routes = new Map(buildFrameworkMarkdownRoutes('page', body, PREFIXES, identity));

  assert.equal(routes.get('react-data-grid/page.md'), '::: tip\nReact tip.\n:::');
  assert.equal(routes.get('javascript-data-grid/page.md'), '');
});
