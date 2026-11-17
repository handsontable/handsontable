import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import templateAdapter from '../src/adapters/template.mjs';
import { createLineCounter, scanScripts } from '../src/lib/inline-script.mjs';
import { blankToolComments } from '../src/lib/tool-comments.mjs';
import { buildPlan, VERSIONS_DIR, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { measureGrowth, measureWork } from './helpers/work-meter.mjs';

// The expressions the scanners replaced, kept as the oracle for what they must still return.
const LEGACY_SCRIPT = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\b[^>]*>/gid;
const LEGACY_TOOL_COMMENT = (
  /\/\/[ \t]*TODO\(handsontable-codemod [^\r\n]*|\/\*[ \t]*TODO\(handsontable-codemod [\s\S]*?\*\//g
);
const MIB = 1024 * 1024;

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

const legacyScripts = source => [...source.matchAll(LEGACY_SCRIPT)].map(match => ({
  index: match.index,
  attributes: match[1],
  body: match[2],
  bodyStart: match.indices[2][0],
  end: match.index + match[0].length,
}));

describe('the work meter', () => {
  it('counts a scan that starts again for each item as quadratic, and a single pass as linear', async() => {
    const text = bytes => 'ab\n'.repeat(bytes / 3);
    const again = async(bytes) => {
      const source = text(bytes);

      for (let at = 0; at < source.length; at += 3) {
        source.slice(0, at).split('\n');
      }
    };
    const once = async(bytes) => {
      const source = text(bytes);

      for (let at = source.indexOf('\n'); at !== -1; at = source.indexOf('\n', at + 1)) {
        source.slice(at, at + 3);
      }
    };

    await assert.rejects(measureGrowth({ input: bytes => bytes, run: again, size: 3000 }), /grew \d+\.\d times/);
    await measureGrowth({ input: bytes => bytes, run: once, size: 3000 });
  });

  it('restores the built-ins it wrapped, also when the function throws', async() => {
    const before = [String.prototype.slice, String.prototype.indexOf, RegExp.prototype.exec];

    await assert.rejects(measureWork(() => {
      throw new Error('boom');
    }), /boom/);
    assert.deepEqual([String.prototype.slice, String.prototype.indexOf, RegExp.prototype.exec], before);
  });
});

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
    'unclosed <script> tags': bytes => '<script>'.repeat(bytes / 8),
    'start tags with no >': bytes => '<script '.repeat(bytes / 8),
    'start tags with a quote that never closes': bytes => '<script "'.repeat(bytes / 9),
    'start tags with quotes that close in the next tag': bytes => '<script \'>'.repeat(bytes / 10),
    'one quote per tag, alternating': bytes => '<script " <script \' '.repeat(bytes / 20),
    'complete elements': bytes => '<script>x</script>'.repeat(bytes / 18),
    'end tags with no > after them': bytes => '<script>a'.repeat(bytes / 16) + '</script'.repeat(bytes / 16),
  };

  for (const [name, input] of Object.entries(inputs)) {
    it(`${name}: four times the text is four times the work`, async() => {
      await measureGrowth({ input, run: scanScripts, size: MIB / 128 });
    });

    // The scanner walks its own arrays, which the built-ins count cannot see, so it reports its steps.
    it(`${name}: four times the text is four times the steps of the scan`, () => {
      const stepsFor = (bytes) => {
        const stats = { steps: 0 };

        scanScripts(input(bytes), stats);

        return stats.steps;
      };
      const small = stepsFor(MIB / 128);
      const large = stepsFor(MIB / 32);

      assert.equal(small > 1000, true, `${small} steps`);
      assert.equal(large <= small * 5, true, `${small} steps for the text, ${large} for four times the text`);
    });
  }

  it('finds every element of a page of complete scripts', () => {
    assert.equal(scanScripts('<script>x</script>'.repeat(5000)).length, 5000);
  });

  it('reads a page through the adapter in the same bound, with a Handsontable call in every script', async() => {
    await measureGrowth({
      input: bytes => '<script>new Handsontable(el, {});'.repeat(bytes / 33),
      run: page => templateAdapter.skipNotes(page),
      size: MIB / 128,
    });
  });

  it('runs the detect rule that reads inline scripts over a page of unclosed tags in the same bound',
    async() => {
      const manifests = await loadManifests(VERSIONS_DIR);
      const plan = buildPlan(manifests, ['18.0.0/html-without-sanitizer']);
      const script = '<script>new Handsontable(el, {});</script>\n';
      const page = bytes => `<!-- Handsontable -->\n${script.repeat(bytes / 41)}`;
      const run = source => transformFile({ filePath: 'a.html', source, plan });

      await measureGrowth({ input: page, run, size: MIB / 128 });
      assert.ok((await run(page(MIB / 16))).entries.length > 0);
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

  it('reads the text once for the lines of many growing offsets', async() => {
    await measureGrowth({
      input: bytes => 'line\n'.repeat(bytes / 5),
      run: (source) => {
        const lineAt = createLineCounter(source);

        for (let offset = 0; offset < source.length; offset += 5) {
          lineAt(offset);
        }
      },
      size: MIB / 128,
    });
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

  it('reads openings that never close in linear work', async() => {
    await measureGrowth({
      input: bytes => '/* TODO(handsontable-codemod x) '.repeat(bytes / 32),
      run: blankToolComments,
      size: MIB / 128,
    });
  });

  it('reads comments that do close in linear work', async() => {
    await measureGrowth({
      input: bytes => '/* TODO(handsontable-codemod x) */\n'.repeat(bytes / 35),
      run: blankToolComments,
      size: MIB / 128,
    });
    assert.doesNotMatch(blankToolComments('/* TODO(handsontable-codemod x) */\n'.repeat(1000)), /TODO/);
  });

  it('reads line comments in linear work', async() => {
    await measureGrowth({
      input: bytes => '// TODO(handsontable-codemod x): y\n'.repeat(bytes / 35),
      run: blankToolComments,
      size: MIB / 128,
    });
  });
});

describe('a file with a long run of white space, many names in one value, or many edits is read in linear work', () => {
  /**
   * Run a whole file through the default rules.
   *
   * @param {string} filePath File name, which picks the adapter.
   * @param {string} source File text.
   * @returns {Promise<Awaited<ReturnType<typeof transformFile>>>} The outcome.
   */
  async function transformed(filePath, source) {
    const plan = buildPlan((await loadManifests(VERSIONS_DIR)).filter(manifest => manifest.status === 'released'));

    return transformFile({ filePath, source, plan, options: {}, facts: new Set(), phase: 1 });
  }

  it('a Vue script block that holds 120,000 spaces in a row (the edges of a block were read with /\\s*$/)',
    async() => {
      // The run sits inside the block, followed by code: `/\s*$/` fails at the end of it from every position of the run.
      const block = spaces => `<script>\nimport Handsontable from 'handsontable';\nconst a = 1;${' '.repeat(spaces)}`
        + 'const b = 2;\nnew Handsontable(el, { correctFormat: true });\n</script>\n';

      await measureGrowth({ input: block, run: source => transformed('a.vue', source), size: 30000 });

      const result = await transformed('a.vue', block(120000));

      assert.equal(result.changed, true);
      assert.equal(result.output.includes(`const a = 1;${' '.repeat(120000)}const b = 2;`), true,
        'the white space is kept');
    });

  it('one declaration that names the variable 4,000 times', async() => {
    const css = names => `a { box-shadow: ${'var(--ht-wrapper-border-radius), '.repeat(names)}0 0 red; }\n`;

    await measureGrowth({ input: css, run: source => transformed('a.css', source), size: 500 });
    assert.equal((await transformed('a.css', css(4000))).output.split('--ht-border-radius').length - 1, 4000);
  });

  it('declarations that are all renamed (the edits were spliced into the whole text one by one)', async() => {
    const css = count => `a {\n${'  border-radius: var(--ht-wrapper-border-radius);\n'.repeat(count)}}\n`;

    await measureGrowth({ input: css, run: source => transformed('a.css', source), size: 1000 });

    const result = await transformed('a.css', css(30000));

    assert.equal(result.output.split('--ht-border-radius').length - 1, 30000);
    assert.equal(result.output.length, css(30000).length - (30000 * 'wrapper-'.length));
  });

  it('names that sit between strings and url() are decided by position, in the same bound', async() => {
    const unit = 'url(--ht-wrapper-border-radius.png) "--ht-wrapper-border-radius" var(--ht-wrapper-border-radius) ';
    const css = count => `a { background: ${unit.repeat(count).trim()}; }\n`;

    await measureGrowth({ input: css, run: source => transformed('a.css', source), size: 250 });

    const result = await transformed('a.css', css(2000));

    assert.equal(result.output.split('var(--ht-border-radius)').length - 1, 2000, 'only the var() references change');
  });
});
