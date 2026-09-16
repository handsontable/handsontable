import assert from 'node:assert/strict';
import test from 'node:test';
import { transpileDocExample } from '../transpile-doc-example.mjs';

const REACT_SOURCE = `import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods']]}
      height="auto"
      colHeaders={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
`;

test('formats JSX one prop per line instead of collapsing it onto a single line', async () => {
  const output = await transpileDocExample(REACT_SOURCE, 'example.tsx');

  // The raw TypeScript printer emits `return (<HotTable ... />)` on one line; Prettier reflows it.
  assert.doesNotMatch(output, /return \(</);
  assert.match(output, /<HotTable\n/);
  assert.match(output, /\n {6}height="auto"\n/);
});

test('strips TypeScript types and keeps 2-space, single-quote output', async () => {
  const output = await transpileDocExample(REACT_SOURCE, 'example.tsx');

  assert.doesNotMatch(output, /: string|: number/);
  assert.doesNotMatch(output, /"@handsontable\/react-wrapper"/);
  assert.match(output, /'@handsontable\/react-wrapper'/);
});

test('preserves blank lines that sit in code', async () => {
  const output = await transpileDocExample(REACT_SOURCE, 'example.tsx');

  assert.match(output, /registerAllModules\(\);\n\nconst ExampleComponent/);
});

test('is idempotent -- re-running on the generated output changes nothing', async () => {
  const output = await transpileDocExample(REACT_SOURCE, 'example.tsx');
  const again = await transpileDocExample(output, 'example.jsx');

  assert.equal(again, output);
});

test('never leaks the blank-line sentinel into the output', async () => {
  const output = await transpileDocExample(REACT_SOURCE, 'example.tsx');

  assert.doesNotMatch(output, /HOT_BLANK/);
});

test('leaves blank lines inside template literals and JSX untouched, without corrupting them', async () => {
  const source = `const tpl: string = \`line one

line three\`;

const ExampleComponent = () => (
  <div>
    <span>first</span>

    <span>second</span>
  </div>
);

export default ExampleComponent;
`;
  const output = await transpileDocExample(source, 'example.tsx');

  // No sentinel comment ends up inside the string or the JSX.
  assert.doesNotMatch(output, /HOT_BLANK/);
  // The template literal keeps its interior blank line verbatim.
  assert.match(output, /`line one\n\nline three`/);
  // The blank line between the two spans survives as valid JSX, not a stray comment.
  assert.match(output, /<span>first<\/span>\n\n\s*<span>second<\/span>/);
});
