import assert from 'node:assert/strict';
import test from 'node:test';
import { transpileDocExample } from '../transpile-doc-example.mjs';

const REACT_SOURCE = `import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data: string[][] = [['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods']];

const ExampleComponent = () => {
  const rows: number = data.length;

  return (
    <HotTable
      data={data}
      height="auto"
      colHeaders={true}
      rowHeaders={rows > 0}
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

  // The fixture is typed (`: string[][]`, `: number`), so a real transpile must drop both.
  assert.doesNotMatch(output, /: string\[\]\[\]/);
  assert.doesNotMatch(output, /: number/);
  assert.match(output, /^const data = \[/m);
  // Two-space indentation inside the component body.
  assert.match(output, /\n {2}const rows = data\.length;/);
  assert.match(output, /\n {2}return \(/);
  assert.doesNotMatch(output, /"@handsontable\/react-wrapper"/);
  assert.match(output, /'@handsontable\/react-wrapper'/);
});

test('preserves blank lines that sit in code', async () => {
  const output = await transpileDocExample(REACT_SOURCE, 'example.tsx');

  assert.match(output, /registerAllModules\(\);\n\nconst data =/);
});

test('is idempotent -- re-running on the generated output changes nothing', async () => {
  const output = await transpileDocExample(REACT_SOURCE, 'example.tsx');
  const again = await transpileDocExample(output, 'example.tsx');

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

test('does not corrupt a blank line inside a raw block comment', async () => {
  const source = `/*
 first line of comment

 last line after a blank
*/
const value = 1;

export default value;
`;
  const output = await transpileDocExample(source, 'example.ts');

  // A sentinel inside the comment would close it early and make Prettier throw.
  assert.doesNotMatch(output, /HOT_BLANK/);
  assert.match(output, /first line of comment\n\n\s*last line after a blank/);
});

test('does not corrupt a blank line inside a JSX {/* ... */} comment with no expression', async () => {
  const source = `const ExampleComponent = () => (
  <div>
    {/* first line of comment

    last line of comment */}
    <span>hello</span>
  </div>
);

export default ExampleComponent;
`;
  const output = await transpileDocExample(source, 'example.tsx');

  assert.doesNotMatch(output, /HOT_BLANK/);
  assert.match(output, /first line of comment\n\n\s*last line of comment/);
});

test('finds a JSX comment even after a lone backtick in JSX text', async () => {
  // A stray backtick in JSX text must not hide a later comment from the protection pass.
  const source = `const ExampleComponent = () => (
  <div>
    <span>press the \` key</span>
    {/* first line of comment

    last line of comment */}
    <span>done</span>
  </div>
);

export default ExampleComponent;
`;
  const output = await transpileDocExample(source, 'example.tsx');

  assert.doesNotMatch(output, /HOT_BLANK/);
  assert.match(output, /first line of comment\n\n\s*last line of comment/);
});

test('restores a code blank line inside a JSX expression container callback', async () => {
  const source = `const ExampleComponent = () => (
  <ul>
    {['a', 'b'].map((item) => {
      const label = item.toUpperCase();

      return <li key={item}>{label}</li>;
    })}
  </ul>
);

export default ExampleComponent;
`;
  const output = await transpileDocExample(source, 'example.tsx');

  assert.doesNotMatch(output, /HOT_BLANK/);
  // The blank line between the two statements in the callback body is kept.
  assert.match(output, /const label = item\.toUpperCase\(\);\n\n\s*return <li/);
});
