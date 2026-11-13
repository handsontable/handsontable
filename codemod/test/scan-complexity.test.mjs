import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import templateAdapter from '../src/adapters/template.mjs';
import { createLineCounter, scanScripts } from '../src/lib/inline-script.mjs';
import { blankToolComments } from '../src/lib/tool-comments.mjs';
import { buildPlan, VERSIONS_DIR, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

// The expressions the scanners replaced, kept as the oracle for what they must still return.
const LEGACY_SCRIPT = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\b[^>]*>/gid;
const LEGACY_TOOL_COMMENT = (
  /\/\/[ \t]*TODO\(handsontable-codemod [^\r\n]*|\/\*[ \t]*TODO\(handsontable-codemod [\s\S]*?\*\//g
);
const MIB = 1024 * 1024;
// Linear code finishes these inputs in tens of milliseconds. The expressions took a minute.
const BUDGET_MS = 2000;

/**
 * A deterministic generator, so a failure names a seed that repeats.
 *
 * @param {number} seed The seed.
 * @returns {() => number} A function that returns numbers in `[0, 1)`.
 */
function random(seed) {
  const modulus = 2147483647;
  let state = (seed % (modulus - 1)) + 1;

  return () => {
    state = (state * 48271) % modulus;

    return (state - 1) / (modulus - 1);
  };
}

/**
 * Run a function and return how long it took.
 *
 * @param {() => void} body What to run.
 * @returns {number} Milliseconds.
 */
function timed(body) {
  const start = process.hrtime.bigint();

  body();

  return Number(process.hrtime.bigint() - start) / 1e6;
}

const legacyScripts = source => [...source.matchAll(LEGACY_SCRIPT)].map(match => ({
  index: match.index,
  attributes: match[1],
  body: match[2],
  bodyStart: match.indices[2][0],
  end: match.index + match[0].length,
}));

describe('scanScripts() returns what the regular expression returned', () => {
  const FRAGMENTS = [
    '<script', '<SCRIPT', '<Script', '<scripts', '<script>', '<script src="a.js">', '<script type=\'x\'>', '>', '"',
    '\'', '</script>', '</SCRIPT  >', '</script foo="1">', '</script', '</scriptx>', ' ', '\n',
    'new Handsontable(el, {});', 'a>b', 'Handsontable', '<', '/', '=',
  ];

  it('on random text built from tags, quotes, and end tags', () => {
    const next = random(20240601);

    for (let round = 0; round < 6000; round += 1) {
      let source = '';

      for (let part = 0; part < 1 + Math.floor(next() * 14); part += 1) {
        source += FRAGMENTS[Math.floor(next() * FRAGMENTS.length)];
      }

      assert.deepEqual(scanScripts(source), legacyScripts(source), JSON.stringify(source));
    }
  });

  it('on the shapes a page holds', () => {
    for (const source of [
      '<script>a()</script>',
      '<html>\n<script src="x.js"></script>\n<script>\nnew Handsontable(el, {});\n</script>\n</html>',
      '<SCRIPT TYPE="module">x</SCRIPT>',
      '<script data-a=">" data-b=\'>\'>body</script>',
      '<script>a</script  >b<script>c</script foo="bar">',
      '<script\n  async\n>x</script\n>',
      '<script>never closed',
      '<script x="unclosed>body</script>',
      '<scripty>no</scripty><script>yes</script>',
      // A start tag with no end tag after it, whose quoted attribute holds a complete element.
      '<Script"<script></script>" <scripts</script foo="1">',
    ]) {
      assert.deepEqual(scanScripts(source), legacyScripts(source), source);
    }
  });

  it('reads the end tag with white space or attributes, in any case', () => {
    const [first, second, third] = scanScripts('<script>a</script  ><script>b</SCRIPT foo="1"><script>c</Script\n>');

    assert.deepEqual([first.body, second.body, third.body], ['a', 'b', 'c']);
  });

  it('reports the offsets of the tag and of the text, in a text with characters that change length in lower case', () => {
    const source = 'İ<script data-x="İ">İİ</script>';
    const [script] = scanScripts(source);

    assert.equal(script.index, 1);
    assert.equal(source.slice(script.bodyStart, script.bodyStart + 2), 'İİ');
    assert.equal(source.slice(script.index, script.end), '<script data-x="İ">İİ</script>');
  });
});

describe('the scan of a page with many unclosed or odd tags is linear', () => {
  const inputs = {
    'unclosed <script> tags': '<script>'.repeat(MIB / 8),
    'start tags with no >': '<script '.repeat(MIB / 8),
    'start tags with a quote that never closes': '<script "'.repeat(MIB / 9),
    'start tags with quotes that close in the next tag': '<script \'>'.repeat(MIB / 10),
    'one quote per tag, alternating': '<script " <script \' '.repeat(MIB / 20),
    'complete elements': '<script>x</script>'.repeat(MIB / 18),
    'end tags with no > after them': '<script>a'.repeat(MIB / 16) + '</script'.repeat(MIB / 16),
  };

  for (const [name, source] of Object.entries(inputs)) {
    it(`${name}, 1 MiB`, () => {
      const ms = timed(() => scanScripts(source));

      assert.ok(ms < BUDGET_MS, `${ms.toFixed(0)} ms`);
    });
  }

  it('finds every element of a page of complete scripts', () => {
    assert.equal(scanScripts('<script>x</script>'.repeat(5000)).length, 5000);
  });

  it('reads a page through the adapter in the same bound, with a Handsontable call in every script', () => {
    const page = '<script>new Handsontable(el, {});'.repeat(MIB / 33);
    const ms = timed(() => templateAdapter.skipNotes(page));

    assert.ok(ms < BUDGET_MS, `${ms.toFixed(0)} ms`);
  });

  it('runs the detect rule that reads inline scripts over a page of unclosed tags in the same bound', async() => {
    const manifests = await loadManifests(VERSIONS_DIR);
    const plan = buildPlan(manifests, ['18.0.0/html-without-sanitizer']);
    const source = `<!-- Handsontable -->\n${'<script>new Handsontable(el, {});</script>\n'.repeat(MIB / 90)}`;
    const start = process.hrtime.bigint();
    const result = await transformFile({ filePath: 'a.html', source, plan });
    const ms = Number(process.hrtime.bigint() - start) / 1e6;

    assert.ok(ms < BUDGET_MS * 5, `${ms.toFixed(0)} ms`);
    assert.ok(result.entries.length > 0);
  });
});

describe('createLineCounter()', () => {
  it('gives the line that the slice-and-split form gave, for offsets that grow and for one that goes back', () => {
    const source = 'a\nbb\n\nccc\nd';
    const lineAt = createLineCounter(source);
    const expected = offset => source.slice(0, offset).split('\n').length;

    for (const offset of [0, 1, 2, 3, 5, 6, 7, 10, 11, 4, 0, 11]) {
      assert.equal(lineAt(offset), expected(offset), `offset ${offset}`);
    }
  });
});

describe('blankToolComments() returns what the regular expression returned', () => {
  const PIECES = [
    '// TODO(handsontable-codemod a/b): text See https://x', '/* TODO(handsontable-codemod a/b): text */',
    '/* TODO(handsontable-codemod ', '*/', '/*', '//', ' ', '\n', '\r\n', 'code();',
    '{/* TODO(handsontable-codemod a): x */}',
    '/*TODO(handsontable-codemod a)', '// TODO(handsontable-codemod ', '\t// TODO(handsontable-codemod x',
  ];
  const legacy = source => source.replace(LEGACY_TOOL_COMMENT, text => text.replace(/[^\r\n]/g, ' '));

  it('on random text built from comments of the tool, openings, and terminators', () => {
    const next = random(77);

    for (let round = 0; round < 6000; round += 1) {
      let source = '';

      for (let part = 0; part < 1 + Math.floor(next() * 12); part += 1) {
        source += PIECES[Math.floor(next() * PIECES.length)];
      }

      assert.equal(blankToolComments(source), legacy(source), JSON.stringify(source));
    }
  });

  it('keeps the length and the line breaks of the text', () => {
    const source = 'a();\n/* TODO(handsontable-codemod x): one\ntwo */\nb(); // TODO(handsontable-codemod y): z\n'
      + 'c();\n';
    const blanked = blankToolComments(source);

    assert.equal(blanked.length, source.length);
    assert.equal(blanked.split('\n').length, source.split('\n').length);
    assert.doesNotMatch(blanked, /TODO/);
  });

  it('leaves an opening with no terminator alone, and still blanks the line comments of the tool', () => {
    const source = '/* TODO(handsontable-codemod a): open\n// TODO(handsontable-codemod b): line\n';

    assert.equal(blankToolComments(source), legacy(source));
    assert.match(blankToolComments(source), /open/);
  });

  it('reads 1 MB of openings that never close in a bounded time', () => {
    const source = '/* TODO(handsontable-codemod x) '.repeat(MIB / 32);
    const ms = timed(() => blankToolComments(source));

    assert.ok(ms < BUDGET_MS, `${ms.toFixed(0)} ms`);
  });

  it('reads 1 MB of comments that do close in a bounded time', () => {
    const source = '/* TODO(handsontable-codemod x) */\n'.repeat(MIB / 35);
    const ms = timed(() => blankToolComments(source));

    assert.ok(ms < BUDGET_MS, `${ms.toFixed(0)} ms`);
    assert.doesNotMatch(blankToolComments(source), /TODO/);
  });

  it('reads 1 MB of line comments in a bounded time', () => {
    const source = '// TODO(handsontable-codemod x): y\n'.repeat(MIB / 35);
    const ms = timed(() => blankToolComments(source));

    assert.ok(ms < BUDGET_MS, `${ms.toFixed(0)} ms`);
  });
});
