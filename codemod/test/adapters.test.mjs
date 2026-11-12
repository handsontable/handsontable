import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import cssAdapter from '../src/adapters/css.mjs';
import { ADAPTERS, adapterFor, isCandidate } from '../src/adapters/index.mjs';
import jsAdapter, { detectQuote, parserFor } from '../src/adapters/js.mjs';
import jsonAdapter, { detectIndent } from '../src/adapters/json.mjs';

describe('adapter registry', () => {
  it('finds an adapter by extension, case-insensitively', () => {
    assert.equal(adapterFor('a.ts'), jsAdapter);
    assert.equal(adapterFor('a.MJS'), jsAdapter);
    assert.equal(adapterFor('a.scss'), cssAdapter);
    assert.equal(adapterFor('a.vue').fileKind, 'vue');
    assert.equal(adapterFor('a.html').fileKind, 'template');
    assert.equal(adapterFor('a.md'), null);
  });

  it('offers only package.json among JSON files', () => {
    assert.equal(isCandidate('package.json'), true);
    assert.equal(isCandidate('apps/web/package.json'), true);
    assert.equal(isCandidate('tsconfig.json'), false);
    assert.equal(isCandidate('README.md'), false);
  });

  it('implements every adapter', () => {
    const stubs = ADAPTERS.filter(adapter => !adapter.implemented).map(adapter => adapter.fileKind);

    assert.deepEqual(stubs, []);
  });

  it('gives every adapter the documented interface', () => {
    for (const adapter of ADAPTERS) {
      assert.ok(adapter.extensions.every(extension => extension.startsWith('.')));
      assert.ok(adapter.skipReason ? adapter.fileKinds.length === 0 : adapter.fileKinds.includes(adapter.fileKind));
      assert.ok(adapter.precheck instanceof RegExp);
      assert.equal(typeof adapter.parse, 'function');
      assert.equal(typeof adapter.print, 'function');
    }
  });
});

describe('js adapter', () => {
  it('chooses the parser by extension', () => {
    assert.equal(parserFor('a.ts'), 'ts');
    assert.equal(parserFor('a.mts'), 'ts');
    assert.equal(parserFor('a.tsx'), 'tsx');
    assert.equal(parserFor('a.js'), 'babylon');
    assert.equal(parserFor('a.jsx'), 'babylon');
    assert.equal(parserFor('a.mjs'), 'babylon');
  });

  it('parses JSX inside a .js file', () => {
    const handle = jsAdapter.parse('const App = () => <HotTable settings={{ rowHeaders: true }} />;', 'App.js');

    assert.equal(handle.parts[0].fileKind, 'js');
    assert.equal(handle.parts[0].root.find(handle.parts[0].j.JSXElement).length, 1);
  });

  it('parses top-level await in a .mjs file', () => {
    const handle = jsAdapter.parse('const mod = await import(\'handsontable\');\nexport default mod;\n', 'a.mjs');

    assert.equal(handle.parts[0].root.find(handle.parts[0].j.AwaitExpression).length, 1);
  });

  it('parses TypeScript and TSX', () => {
    const typescript = 'import type { A } from \'x\';\nenum E { A }\nconst a: number = 1;';

    assert.doesNotThrow(() => jsAdapter.parse(typescript, 'a.ts'));
    assert.doesNotThrow(() => jsAdapter.parse('const a = <T,>(x: T) => <div>{x}</div>;', 'a.tsx'));
  });

  it('throws on a syntax error so the runner can report it', () => {
    assert.throws(() => jsAdapter.parse('const = ;', 'a.ts'));
  });

  it('prints an untouched tree to the exact original text', () => {
    const source = 'import   Handsontable from  \'handsontable\';\n\n\nconst   x = {a:1,\n   b:2};\n';
    const handle = jsAdapter.parse(source, 'a.js');

    assert.equal(jsAdapter.print(handle, source), source);
  });

  it('prints created nodes in the quote style of the file', () => {
    const source = 'import Handsontable from \'handsontable\';\n';
    const handle = jsAdapter.parse(source, 'a.js');
    const { j, root } = handle.parts[0];

    root.get().node.program.body.push(j.importDeclaration([], j.literal('handsontable/base')));

    assert.match(jsAdapter.print(handle, source), /import 'handsontable\/base';/);
  });

  it('detects the quote style', () => {
    assert.equal(detectQuote('import a from \'a\';\nimport b from \'b\';'), 'single');
    assert.equal(detectQuote('import a from "a";'), 'double');
    assert.equal(detectQuote('const x = 1;'), 'single');
  });

  it('lets a file through the precheck when it mentions Handsontable or a theme variable', () => {
    assert.ok(jsAdapter.precheck.test('import Handsontable from \'handsontable\';'));
    assert.ok(jsAdapter.precheck.test('import { HotTable } from \'@handsontable/react-wrapper\';'));
    assert.ok(jsAdapter.precheck.test('el.style.setProperty(\'--ht-border-radius\', \'4px\');'));
    assert.ok(!jsAdapter.precheck.test('import React from \'react\';'));
  });
});

describe('css adapter', () => {
  it('round-trips CSS and SCSS byte for byte when nothing changed', () => {
    const css = '.a  {\n    color : red ;\n}\n/* c */\n';
    const scss = '// line comment\n.a {\n  &:hover { color: red; }\n  @include mixin($x);\n}\n';

    assert.equal(cssAdapter.print(cssAdapter.parse(css, 'a.css')), css);
    assert.equal(cssAdapter.print(cssAdapter.parse(scss, 'a.scss')), scss);
  });

  it('does not require the word handsontable in a stylesheet', () => {
    assert.ok(cssAdapter.precheck.test('a { color: var(--ht-foreground-color); }'));
    assert.ok(cssAdapter.precheck.test('.htCore { margin: 0; }'));
    assert.ok(cssAdapter.precheck.test('.ht-theme-main { margin: 0; }'));
    assert.ok(!cssAdapter.precheck.test('a { color: red; } /* html https */'));
  });

  it('throws on broken CSS', () => {
    assert.throws(() => cssAdapter.parse('a { color: red;', 'a.css'));
  });
});

describe('json adapter', () => {
  it('detects tabs, spaces, and the default indent', () => {
    assert.equal(detectIndent('{\n\t"a": 1\n}'), '\t');
    assert.equal(detectIndent('{\n    "a": 1\n}'), 4);
    assert.equal(detectIndent('{"a":1}'), 2);
  });

  it('keeps indent, trailing newline, and CRLF', () => {
    const sources = [
      '{\n  "name": "x"\n}\n',
      '{\n    "name": "x"\n}',
      '{\n\t"name": "x"\n}\n',
      '{\r\n  "name": "x"\r\n}\r\n',
    ];

    for (const source of sources) {
      const handle = jsonAdapter.parse(source);

      assert.equal(jsonAdapter.print(handle, source), source);
    }
  });

  it('prints an edited value with the original layout', () => {
    const source = '{\n    "dependencies": {\n        "handsontable": "^17.1.0"\n    }\n}\n';
    const handle = jsonAdapter.parse(source);

    handle.parts[0].root.dependencies.handsontable = '^18.0.0';

    assert.equal(jsonAdapter.print(handle, source), source.replace('^17.1.0', '^18.0.0'));
  });
});
