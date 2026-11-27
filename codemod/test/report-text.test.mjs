import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { codeSpan, markdownText, plainName, plainText } from '../src/lib/markdown.mjs';
import { Report, renderConsole, renderMarkdown } from '../src/report.mjs';
import { buildPlan } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { loadReleasedManifests } from './helpers/manifests.mjs';
import { inPlainProject, migrate } from './helpers/plain-project.mjs';

const ESC = String.fromCharCode(27);

/**
 * The Markdown a viewer would show as text outside every code span: the code spans cut out, as CommonMark reads them.
 *
 * @param {string} markdown The Markdown.
 * @returns {string} What is left.
 */
function outsideCodeSpans(markdown) {
  return markdown.replace(/(`+)(?!`)([\s\S]*?[^`])\1(?!`)/g, '');
}

/**
 * Check that no markup is left in text outside the code spans: an unescaped `<`, `*`, `_`, `[`, or `&` that is not an
 * entity, other than the list marker and the checkbox the renderer writes itself.
 *
 * @param {string} markdown The Markdown.
 * @returns {string[]} The offending lines.
 */
function markupLeft(markdown) {
  return outsideCodeSpans(markdown).split('\n')
    .map(line => line.replace(/^- \[[ x]\] /, '').replace(/\\[\\`*_[\]<>&|~]/g, '').replace(/&(?:amp|lt|gt);/g, ''))
    .filter(line => /[<>*_[\]|~]|&/.test(line) && !/^Guide: https?:\/\//.test(line));
}

describe('codeSpan()', () => {
  it('uses a fence one backtick longer than the longest run, and pads a text that touches the fence', () => {
    assert.equal(codeSpan('a.js'), '`a.js`');
    assert.equal(codeSpan('a`b'), '``a`b``');
    assert.equal(codeSpan('a``b`c'), '```a``b`c```');
    assert.equal(codeSpan('`a'), '`` `a ``');
    assert.equal(codeSpan('a`'), '`` a` ``');
  });

  it('reads back as the same text under CommonMark rules', () => {
    for (const text of ['x', 'a`b', '``', '`', 'a b', ' a ', '<b>*x*</b>', 'a_*b*_[x](y).js']) {
      const span = codeSpan(text);
      const fence = /^`+/.exec(span)[0];
      let inner = span.slice(fence.length, span.length - fence.length);

      // CommonMark removes one space on each side when both are there and the text is not all spaces.
      if (/^ .* $/.test(inner) && inner.trim() !== '') {
        inner = inner.slice(1, -1);
      }

      assert.equal(inner, text);
      assert.equal(fence.length > Math.max(0, ...(text.match(/`+/g) ?? []).map(run => run.length)), true);
    }
  });
});

describe('markdownText()', () => {
  it('writes a literal tag of the tool\'s own message as code', () => {
    const text = markdownText('A <style lang="less"> block was not analyzed. Move it out of the <script> element.');

    assert.equal(text, 'A `<style lang="less">` block was not analyzed. Move it out of the `<script>` element.');
  });

  it('keeps a code span the message already holds, and escapes markup around it', () => {
    assert.equal(markdownText('Use `a_b` and *this* or [that](x) & <b>.'),
      'Use `a_b` and \\*this\\* or \\[that\\](x) &amp; `<b>`.');
  });

  it('quotes a fragment that is text from the user\'s file, with a fence that fits it', () => {
    assert.equal(markdownText('Could not parse, at: a`b <i>x</i>', ['a`b <i>x</i>']),
      'Could not parse, at: ``a`b <i>x</i>``');
    assert.equal(markdownText('skipped, at: *x*_y_', ['*x*_y_']), 'skipped, at: `*x*_y_`');
  });

  it('does not open a heading, a list, an ordered list, or a rule at the start of a line', () => {
    assert.equal(markdownText('# not a heading'), '\\# not a heading');
    assert.equal(markdownText('- not a list'), '\\- not a list');
    assert.equal(markdownText('1. not a list'), '1\\. not a list');
    assert.equal(markdownText('---'), '\\---');
    assert.equal(markdownText('Rename --ht-a to --ht-b.'), 'Rename --ht-a to --ht-b.', 'a dash inside a line stays');
    assert.equal(markdownText('--ht-x is removed.'), '--ht-x is removed.');
  });

  it('leaves the text inside a code span alone when the span runs over a line break', () => {
    assert.equal(markdownText('Use `first\n# second\n- third\n1. fourth` here.'),
      'Use `first\n# second\n- third\n1. fourth` here.');
    assert.equal(markdownText('Use `a\n--- b` here.\n# real\n- item'), 'Use `a\n--- b` here.\n\\# real\n\\- item');
    assert.equal(markdownText('- `x\n# y` end'), '\\- `x\n# y` end', 'the line start of the prose is escaped');
    assert.equal(markdownText('Say: a`b\n# c', ['a`b\n# c']), 'Say: ``a`b # c``', 'a quoted fragment is one line');
  });

  it('spells out a control character instead of passing it on', () => {
    // The backslash of the spelled-out escape is itself escaped, so a viewer shows `\x1b`.
    assert.equal(markdownText(`a${ESC}[31mb`), 'a\\\\x1b\\[31mb');
    assert.equal(plainText(`a${ESC}[2Jb‮c`), 'a\\x1b[2Jb\\u202ec');
    assert.equal(plainText('a\r\nb\tc\n'), 'a\r\nb\tc\n', 'line breaks and tabs stay');
    assert.equal(plainText('a\rb'), 'a\\x0db', 'a lone carriage return overwrites the line');
    assert.equal(plainName('a\nb\tc'), 'a\\x0ab\\x09c');
  });

  it('spells out every control, format, line, and paragraph separator the same way, in a name and in a text', () => {
    // Categories Cc, Cf, Zl, and Zp, by code point: no escape sequence in this file, so a tool cannot decode one.
    const invisible = {
      0x2028: '\\u2028', // Zl, line separator
      0x2029: '\\u2029', // Zp, paragraph separator
      0x200b: '\\u200b', // Cf, zero width space
      0x200e: '\\u200e', // Cf, left-to-right mark
      0x200f: '\\u200f', // Cf, right-to-left mark
      0xfeff: '\\ufeff', // Cf, byte order mark
      0x00ad: '\\xad', // Cf, soft hyphen
      0x2060: '\\u2060', // Cf, word joiner
      0x0085: '\\x85', // Cc, next line
      0xe0041: '\\u{e0041}', // Cf outside the BMP, a tag character
    };

    for (const [code, spelled] of Object.entries(invisible)) {
      const char = String.fromCodePoint(Number(code));

      assert.equal(plainName(`a${char}b`), `a${spelled}b`, `plainName() spells U+${Number(code).toString(16)}`);
      assert.equal(plainText(`a${char}b`), `a${spelled}b`, `plainText() spells U+${Number(code).toString(16)}`);
    }

    assert.equal(plainName('a b'), 'a b', 'an ordinary space and a letter stay');
    assert.equal(plainText('é中\u{1f600}'), 'é中\u{1f600}', 'letters, ideographs, and emoji stay');
  });
});

describe('renderMarkdown() renders what it did not author as text', () => {
  /**
   * @param {Array<Partial<import('../src/types.mjs').ReportEntry>>} entries Entries.
   * @param {string[]} [notes] Notes of the run.
   * @returns {string} The Markdown.
   */
  function render(entries, notes = []) {
    const report = new Report();

    report.notes.push(...notes);
    entries.forEach(entry => report.add(entry));

    return renderMarkdown(report);
  }

  it('shows a file name full of Markdown as a code span', () => {
    const text = render([
      { ruleId: '18.0.0/x', severity: 'manual', file: 'src/a_*b*_[x](y).js', line: 3, message: 'Fix.' },
    ]);

    assert.match(text, /^- \[ \] `src\/a_\*b\*_\[x\]\(y\)\.js:3` Fix\.$/m);
    assert.deepEqual(markupLeft(text), []);
  });

  it('shows a file name that holds a backtick, a tag, and a line break without breaking the list', () => {
    const text = render([{ ruleId: '18.0.0/x', severity: 'manual', file: 'a`<b>\nb.js', line: 1, message: 'Fix.' }]);

    assert.match(text, /^- \[ \] ``a`<b>\\x0ab\.js:1`` Fix\.$/m);
    assert.deepEqual(markupLeft(text), []);
  });

  it('shows a parse-error snippet with tags and emphasis as code, and the tool\'s own tags as code', () => {
    const snippet = 'const a = {;<b>*x*</b> `y`';
    const text = render([
      { ruleId: 'parse-error',
        severity: 'warning',
        file: 'bad.js',
        line: 2,
        message: `The file could not be parsed and was skipped: Unexpected token, at: ${snippet}`,
        quoted: [snippet] },
      { ruleId: 'skipped-file',
        severity: 'warning',
        file: 'c.vue',
        line: 4,
        message: 'A <style lang="less"> block was not analyzed. Check it by hand.' },
    ], ['Read "<script>" first.']);

    assert.ok(text.includes('`` const a = {;<b>*x*</b> `y` ``'), text);
    assert.ok(text.includes('A `<style lang="less">` block was not analyzed.'), text);
    assert.ok(text.includes('Read "`<script>`" first.'), text);
    assert.deepEqual(markupLeft(text), []);
  });

  it('writes the files of a "Read once" note and the "Skipped files" section as code spans', () => {
    const text = render([
      { ruleId: '18.0.0/note', severity: 'manual', file: 'a_b.ts', message: 'Note.', scope: 'run' },
      { ruleId: 'skipped-file', severity: 'warning', file: '*.less', message: 'Not analyzed.' },
    ]);

    assert.match(text, /^ {2}- 1 file: `a_b\.ts`$/m);
    assert.match(text, /^- \[ \] `\*\.less` Not analyzed\.$/m);
    assert.deepEqual(markupLeft(text), []);
  });

  it('writes the tags of a message that several entries share, in its paragraph, as code', () => {
    const message = 'A <style lang="less"> block was not analyzed. Check it by hand.';
    const text = render([
      { ruleId: '18.0.0/x', severity: 'manual', file: 'a.vue', line: 1, message },
      { ruleId: '18.0.0/x', severity: 'manual', file: 'b.vue', line: 2, message },
    ]);

    assert.match(text, /^A `<style lang="less">` block was not analyzed\. Check it by hand\.$/m);
    assert.deepEqual(markupLeft(text), []);
  });

  it('leaves the text of a normal message as it was, and writes no stray escape', () => {
    const text = render([{ ruleId: '18.0.0/x',
      severity: 'changed',
      file: 'a.css',
      line: 2,
      message: 'Renamed --ht-wrapper-border-radius to --ht-border-radius.' }]);

    assert.match(text, /^- \[x\] `a\.css:2` Renamed --ht-wrapper-border-radius to --ht-border-radius\.$/m);
  });
});

describe('the console report and the CLI never print a control character from the project', () => {
  it('prints the file name of an entry with its escape sequence spelled out', () => {
    const report = new Report();

    report.add({ ruleId: '18.0.0/x', severity: 'manual', file: `src/${ESC}[31mred.js`, line: 1, message: 'Fix.' });
    report.add({ ruleId: 'skipped-file', severity: 'warning', file: `${ESC}]0;title\u0007.less`, message: 'No.' });

    const text = renderConsole(report);

    assert.equal(text.includes(ESC), false);
    assert.equal(text.includes('\u0007'), false);
    assert.ok(text.includes('src/\\x1b[31mred.js:1'), text);
  });

  it('prints a dry-run diff of a file that holds an escape character as text', async() => {
    await inPlainProject({
      'a.js': `import Handsontable from 'handsontable';\nconst note = '${ESC}[2J';\n`
        + 'new Handsontable(el, { correctFormat: true });\n',
    }, async(dir) => {
      const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--dry-run']);

      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout.includes(ESC), false, 'an escape sequence reached the terminal');
      assert.match(result.stdout, /\\x1b\[2J/);
    });
  });
});

describe('a report file written by the CLI renders as text', () => {
  it('quotes the line of a file that does not parse', async() => {
    const files = { 'bad.js': 'import Handsontable from \'handsontable\';\nconst a = {;<b>*x*</b>\n' };

    await inPlainProject(files, async(dir) => {
      const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--report', 'r.md']);
      const text = await readFile(join(dir, 'r.md'), 'utf8');

      assert.equal(result.status, 1, result.stderr);
      assert.match(text, /^- \[ \] `bad\.js:2` \(warning\) The file could not be parsed and was skipped: /m);
      assert.match(text, /, at: `const a = \{;<b>\*x\*<\/b>`$/m);
      assert.deepEqual(markupLeft(text), []);
    });
  });

  it('writes the literal tags of the tool\'s own messages as code', async() => {
    await inPlainProject({
      'a.vue': '<template><hot-table /></template>\n<style lang="less">\n'
        + '.a { --ht-wrapper-border-radius: 1px; }\n</style>\n',
    }, async(dir) => {
      await migrate(dir, ['--from', '17.1', '--to', '18.0', '--report', 'r.md']);

      const text = await readFile(join(dir, 'r.md'), 'utf8');

      assert.ok(text.includes('`<style lang="less">`'), text);
      assert.deepEqual(markupLeft(text), []);
    });
  });
});

describe('a Vue block that does not parse reports the line of the file', () => {
  it('for a script, with the text of that line', async() => {
    const plan = buildPlan(await loadReleasedManifests());
    const source = '<template>\n  <hot-table />\n</template>\n\n<script>\n'
      + 'import Handsontable from \'handsontable\';\nconst a = {;\n</script>\n';
    const result = await transformFile({ filePath: 'a.vue', source, plan, options: {}, facts: new Set(), phase: 1 });
    const [entry] = result.entries;

    assert.equal(entry.ruleId, 'parse-error');
    assert.equal(entry.line, 7);
    assert.match(entry.message, /at: const a = \{;$/);
    assert.deepEqual(entry.quoted, ['const a = {;']);
  });

  it('for a style, and for a script that is cut off, which is not the end of the file', async() => {
    const plan = buildPlan(await loadReleasedManifests());
    const style = await transformFile({
      filePath: 'a.vue',
      source: '<template><hot-table /></template>\n\n<style>\n.a {\n'
        + '  border-radius: var(--ht-wrapper-border-radius);\n</style>\n',
      plan,
      options: {},
      facts: new Set(),
      phase: 1,
    });
    const script = await transformFile({
      filePath: 'b.vue',
      source: '<template><hot-table /></template>\n<script>\nimport Handsontable from \'handsontable\';\n'
        + 'new Handsontable(el, {\n</script>\n<style>\na { color: red; }\n</style>\n',
      plan,
      options: {},
      facts: new Set(),
      phase: 1,
    });

    assert.equal(style.entries[0].ruleId, 'parse-error');
    assert.ok(style.entries[0].line >= 4, `line ${style.entries[0].line}`);
    assert.equal(script.entries[0].ruleId, 'parse-error');
    assert.ok(script.entries[0].line >= 4 && script.entries[0].line <= 5, `line ${script.entries[0].line}`);
    assert.doesNotMatch(script.entries[0].message, /unexpected end of file/);
  });
});
