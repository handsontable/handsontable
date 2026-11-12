import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ADAPTERS, adapterFor } from '../src/adapters/index.mjs';
import vueAdapter from '../src/adapters/vue.mjs';
import { transformFile } from '../src/runner.mjs';
import { createRegistry } from '../src/transforms/index.mjs';

const RULE = { id: '18.0.0/x', kind: 'cssVariable', version: '18.0.0', guideUrl: null, safe: true };
const PLAN = { versions: [{ version: '18.0.0', rules: [RULE] }], rulesById: new Map([[RULE.id, RULE]]) };

/**
 * A transform that renames the identifier `foo` to `bar` in scripts and the property `--ht-a` to `--ht-b` in
 * styles, reporting the line of each edit. `scripts` and `styles` switch each half off.
 *
 * @param {{scripts?: boolean, styles?: boolean}} [only] Which half runs.
 * @returns {import('../src/types.mjs').Transform} The transform.
 */
function renamer({ scripts = true, styles = true } = {}) {
  return {
    kinds: ['cssVariable'],
    fileKinds: ['js', 'css'],
    apply(ctx) {
      if (ctx.fileKind === 'js' && scripts) {
        ctx.root.find(ctx.j.Identifier, { name: 'foo' }).forEach((path) => {
          path.node.name = 'bar';
          ctx.markChanged();
          ctx.report({ ruleId: RULE.id, severity: 'changed', line: path.node.loc.start.line, message: 'foo' });
        });
      }

      if (ctx.fileKind === 'css' && styles) {
        ctx.root.walkDecls('--ht-a', (declaration) => {
          declaration.prop = '--ht-b';
          ctx.markChanged();
          ctx.report({ ruleId: RULE.id, severity: 'changed', line: declaration.source.start.line, message: 'a' });
        });
      }
    },
  };
}

/**
 * Run a `.vue` source through `transformFile` with a transform.
 *
 * @param {string} source File text.
 * @param {import('../src/types.mjs').Transform} transform The transform.
 * @returns {Promise<object>} The `transformFile` result.
 */
function run(source, transform) {
  return transformFile({
    filePath: 'App.vue',
    source,
    plan: PLAN,
    registry: createRegistry([transform]),
  });
}

const TEMPLATE = '<template>\n  <hot-table :settings="settings" style="--ht-a: 1px" />\n</template>\n';
const SCRIPT = '<script>\nimport \'handsontable\';\n\nconst foo = 1;\n</script>\n';
const STYLE = '<style scoped lang="scss">\n// scss comment\n.a {\n  --ht-a: 2px;\n}\n</style>\n';

describe('vue adapter registration', () => {
  it('is implemented and found by extension', () => {
    assert.equal(adapterFor('App.vue'), vueAdapter);
    assert.equal(vueAdapter.implemented, true);
    assert.ok(ADAPTERS.includes(vueAdapter));
  });

  it('lets a file through the precheck when it mentions Handsontable or a theme variable', () => {
    assert.ok(vueAdapter.precheck.test('import { HotTable } from \'@handsontable/vue3\';'));
    assert.ok(vueAdapter.precheck.test('<style>.a { color: var(--ht-foreground-color); }</style>'));
    assert.ok(!vueAdapter.precheck.test('<template><div /></template>'));
  });
});

describe('vue adapter parse', () => {
  it('splits a script-only component into a js part with a file-relative line offset', () => {
    const source = `${TEMPLATE}\n${SCRIPT}`;
    const handle = vueAdapter.parse(source, 'App.vue');
    const [template, script] = handle.parts;

    assert.deepEqual(handle.parts.map(part => part.fileKind), ['template', 'js']);
    assert.equal(script.lineOffset, 4);
    assert.equal(source.split('\n')[script.lineOffset], '<script>');
    assert.equal(source.slice(script.start, script.end), script.source);
    assert.equal(template.lineOffset, 0);
  });

  it('exposes the template as a read-only part with its content and offset', () => {
    const source = `${TEMPLATE}${SCRIPT}`;
    const [template] = vueAdapter.parse(source, 'App.vue').parts;

    assert.equal(template.fileKind, 'template');
    assert.equal(template.j, null);
    assert.deepEqual(template.root, { content: '\n  <hot-table :settings="settings" style="--ht-a: 1px" />\n' });
    assert.equal(template.source, template.root.content);
    assert.equal(source.slice(template.start, template.end), template.source);
    assert.equal(template.changed, false);
  });

  it('parses script setup with lang ts through the ts parser', () => {
    const source = '<script setup lang="ts">\nimport { HotTable } from \'@handsontable/vue3\';\n'
      + 'const settings: Record<string, number> = { a: 1 };\n</script>\n';
    const [part] = vueAdapter.parse(source, 'App.vue').parts;

    assert.equal(part.fileKind, 'js');
    assert.equal(part.root.find(part.j.TSTypeAnnotation).length > 0, true);
  });

  it('gives both script blocks a part, in source order', () => {
    const source = '<script setup>\nimport \'handsontable\';\nconst a = 1;\n</script>\n\n'
      + '<script>\nimport \'handsontable\';\nexport default {};\n</script>\n';
    const handle = vueAdapter.parse(source, 'App.vue');

    assert.deepEqual(handle.parts.map(part => part.fileKind), ['js', 'js']);
    assert.ok(handle.parts[0].start < handle.parts[1].start);
    assert.equal(handle.parts[0].lineOffset, 0);
    assert.equal(handle.parts[1].lineOffset, 5);
  });

  it('parses scss and scoped style blocks with the right syntax', () => {
    const [part] = vueAdapter.parse(STYLE, 'App.vue').parts;

    assert.equal(part.fileKind, 'css');
    assert.equal(part.root.first.type, 'comment');
    assert.equal(part.root.nodes[1].selector, '.a');
  });

  it('skips less, stylus, indented sass, and src blocks, and lists them', () => {
    const source = '<style lang="less">\n.a { --ht-a: 1px; }\n</style>\n'
      + '<style lang="stylus">\n.a\n  --ht-a 1px\n</style>\n'
      + '<style lang="sass">\n.a\n  --ht-a: 1px\n</style>\n'
      + '<style src="./theme.css"></style>\n'
      + '<style>\n.a { --ht-a: 1px; }\n</style>\n';
    const handle = vueAdapter.parse(source, 'App.vue');

    assert.deepEqual(handle.parts.map(part => part.fileKind), ['css']);
    assert.deepEqual(handle.skippedBlocks, [
      { type: 'style', lang: 'less', line: 1, src: false, relevant: true },
      { type: 'style', lang: 'stylus', line: 4, src: false, relevant: true },
      { type: 'style', lang: 'sass', line: 8, src: false, relevant: true },
      { type: 'style', lang: null, line: 12, src: true, relevant: true },
    ]);
  });

  it('marks a skipped block relevant only when its own text, or for src= the file, mentions Handsontable', () => {
    const srcBlock = '<style src="./a.css"></style>\n';
    const quiet = vueAdapter.parse(`<style lang="less">\n.a { color: red; }\n</style>\n${srcBlock}`, 'App.vue');
    const loud = vueAdapter.parse(`<template lang="pug">\np handsontable\n</template>\n${srcBlock}`, 'App.vue');

    assert.deepEqual(quiet.skippedBlocks.map(block => block.relevant), [false, false]);
    assert.deepEqual(loud.skippedBlocks.map(block => [block.type, block.relevant]),
      [['template', true], ['style', true]]);
  });

  it('gives no part to a script or style block that cannot match any rule', () => {
    const source = '<script>\nexport default { name: \'plain\' };\n</script>\n<style>\n.a { color: red; }\n</style>\n'
      + '<template><div>handsontable</div></template>\n';
    const handle = vueAdapter.parse(source, 'App.vue');

    assert.deepEqual(handle.parts.map(part => part.fileKind), ['template']);
    assert.deepEqual(handle.skippedBlocks, []);
  });

  it('throws on a broken component so the runner reports a parse error', () => {
    assert.throws(() => vueAdapter.parse('<template><div></template>', 'App.vue'));
    assert.throws(() => vueAdapter.parse('<script>\nimport \'handsontable\';\nconst = ;\n</script>', 'App.vue'));
  });
});

describe('vue adapter print', () => {
  it('prints an untouched component to the exact original text', () => {
    const source = `${TEMPLATE}\n${SCRIPT}\n${STYLE}`;
    const handle = vueAdapter.parse(source, 'App.vue');

    handle.parts.forEach((part) => {
      part.changed = true;
    });

    assert.equal(vueAdapter.print(handle, source), source);
  });

  it('leaves the template and the style identical when a transform edits only the script', async() => {
    const source = `${TEMPLATE}\n${SCRIPT}\n${STYLE}`;
    const result = await run(source, renamer({ styles: false }));

    assert.equal(result.output, source.replace('const foo', 'const bar'));
    assert.equal(result.changed, true);
  });

  it('leaves the template and the script identical when a transform edits only the style', async() => {
    const source = `${TEMPLATE}\n${SCRIPT}\n${STYLE}`;
    const result = await run(source, renamer({ scripts: false }));

    assert.equal(result.output, source.replace('.a {\n  --ht-a: 2px;', '.a {\n  --ht-b: 2px;'));
  });

  it('edits a script and a style in one run and keeps the template bytes', async() => {
    const source = `${TEMPLATE}\n${SCRIPT}\n${STYLE}`;
    const result = await run(source, renamer());

    assert.equal(
      result.output,
      source.replace('const foo', 'const bar').replace('{\n  --ht-a: 2px;', '{\n  --ht-b: 2px;')
    );
    assert.ok(result.output.startsWith(TEMPLATE));
  });

  it('keeps the whitespace around block content, including indentation before the closing tag', async() => {
    const source = '<script>\r\n  import \'handsontable\';\r\n  const foo = 1;\r\n  </script>\r\n';
    const result = await run(source, renamer());

    assert.equal(result.output, source.replace('foo', 'bar'));
  });

  it('keeps CRLF line endings inside edited blocks and everywhere else', async() => {
    const source = `${TEMPLATE}\n${SCRIPT}\n${STYLE}`.replace(/\n/g, '\r\n');
    const result = await run(source, renamer());

    assert.equal(result.changed, true);
    assert.equal(result.output.replace(/\r\n/g, ''), result.output.replace(/\r\n/g, '').replace(/[\r\n]/g, ''));
    assert.equal(/(?<!\r)\n/.test(result.output), false);
    assert.equal(
      result.output,
      source.replace('const foo', 'const bar').replace('{\r\n  --ht-a: 2px;', '{\r\n  --ht-b: 2px;')
    );
  });

  it('leaves a file with nothing to edit byte for byte alone', async() => {
    const source = `${TEMPLATE}\n${SCRIPT}\n${STYLE}`;
    const result = await run(source, renamer({ scripts: false, styles: false }));

    assert.equal(result.changed, false);
    assert.equal(result.output, source);
  });

  it('writes the template back when a transform assigns new template text', () => {
    const source = `${TEMPLATE}${SCRIPT}`;
    const handle = vueAdapter.parse(source, 'App.vue');
    const [template] = handle.parts;

    template.root.content = template.root.content.replace('1px', '3px');
    template.changed = true;

    assert.equal(vueAdapter.print(handle, source), source.replace('1px', '3px'));
  });
});

describe('vue adapter report lines', () => {
  it('reports lines relative to the file, for scripts and styles alike', async() => {
    const source = `${TEMPLATE}\n${SCRIPT}\n${STYLE}`;
    const { entries } = await run(source, renamer());
    const lines = source.split('\n');

    assert.equal(entries.length, 2);

    for (const entry of entries) {
      const text = lines[entry.line - 1];

      assert.match(text, entry.message === 'foo' ? /const foo/ : /--ht-a: 2px/);
    }
  });
});
