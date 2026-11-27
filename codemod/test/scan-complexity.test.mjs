import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import templateAdapter from '../src/adapters/template.mjs';
import { addFact, factSite } from '../src/lib/facts.mjs';
import { createLineCounter, scanScripts, scanStyles } from '../src/lib/inline-script.mjs';
import { templateOptionSites } from '../src/lib/option-sites.mjs';
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
const { PathVisitor } = createRequire(createRequire(import.meta.url).resolve('jscodeshift'))('ast-types');

/**
 * Count the traversals of a syntax tree that a function makes (one for each `root.find()` and each walk of the tree).
 * The work meter counts string operations and cannot see a walk of the tree, which is the cost of a rule that asks the
 * whole file a question for each item.
 *
 * @param {() => Promise<void>} body The function to run.
 * @returns {Promise<number>} The number of walks it started.
 */
async function countTraversals(body) {
  const visit = PathVisitor.prototype.visit;
  let count = 0;

  PathVisitor.prototype.visit = function(...args) {
    count += 1;

    return visit.apply(this, args);
  };

  try {
    await body();
  } finally {
    PathVisitor.prototype.visit = visit;
  }

  return count;
}

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

describe('templateOptionSites() reads the text of a template once', () => {
  const template = attributes => `<hot-table\n${Array.from({ length: attributes },
    (_, index) => `  :unrelated-${index}="x"\n`).join('')}  :numeric-format="f"\n></hot-table>\n`;

  it('one wrapper tag with thousands of attributes', async() => {
    await measureGrowth({
      input: template,
      run: async(source) => {
        templateOptionSites(source, ['numericFormat']);
      },
      size: 500,
    });
    assert.deepEqual(templateOptionSites(template(8000), ['numericFormat']).map(site => site.line), [8002]);
  });

  it('many wrapper tags, each with a few attributes', async() => {
    const tag = '<hot-column\n  :a="1"\n  :numeric-format="f"\n/>\n';
    const many = tags => tag.repeat(tags);

    await measureGrowth({
      input: many,
      run: async(source) => {
        templateOptionSites(source, ['numericFormat']);
      },
      size: 500,
    });
    assert.deepEqual(templateOptionSites(many(3), ['numericFormat']).map(site => site.line), [3, 7, 11]);
  });
});

describe('addFact() does not read the facts it already holds', () => {
  const record = async(count) => {
    const ctx = { facts: new Set(), filePath: 'src/a.js', lineOffset: 0 };

    for (let index = 0; index < count; index += 1) {
      addFact(ctx, `fact-${index}`, 1);
    }
  };

  it('thousands of facts with a line each', async() => {
    // A linear version reads almost nothing, so the work meter's floor for `measureGrowth()` does not apply.
    const small = await measureWork(() => record(500));
    const large = await measureWork(() => record(2000));

    assert.ok(large <= (small * 5) + 100, `the work grew from ${small} to ${large} for 4 times the facts`);
  });

  it('keeps the first line of a fact for a directory, and one site per directory', () => {
    const ctx = { facts: new Set(), filePath: 'a/x.js', lineOffset: 2 };

    addFact(ctx, 'seen');
    addFact(ctx, 'seen', 4);
    addFact(ctx, 'seen', 9);
    ctx.filePath = 'a/y.js';
    addFact(ctx, 'seen', 1);
    ctx.filePath = 'b/z.js';
    addFact(ctx, 'seen', 7);

    const sites = [...ctx.facts].filter(fact => fact.startsWith('site:seen@'));

    assert.deepEqual(sites, ['site:seen@a=a/x.js:6', 'site:seen@b=b/z.js:9']);
    assert.equal(factSite({ facts: ctx.facts, filePath: 'a/package.json' }, 'seen'), 'a/x.js:6');
  });
});

describe('a js part is walked a fixed number of times, whatever the number of rules or of grids', () => {
  it('detect rules of one kind share the walks: 20 copies of each matcher cost what 2 copies cost', async() => {
    const matchers = [
      { property: 'correctFormat' },
      { call: 'updateSettings' },
      { hook: 'afterChange' },
      { string: 'x' },
      { namespaceMember: 'helper.sanitize' },
      { missingOption: 'licenseKey' },
    ];
    const planOf = copies => buildPlan([{
      version: '1.0.0',
      rules: Array.from({ length: copies }, (_, index) => matchers.map((match, kind) => ({
        id: `1.0.0/r${index}-${kind}`,
        kind: 'detect',
        version: '1.0.0',
        safe: false,
        guideUrl: null,
        files: ['js'],
        message: 'm',
        match,
      }))).flat(),
    }]);
    const source = 'import Handsontable from \'handsontable\';\n'
      + 'const hot = new Handsontable(el, { columns: [{ correctFormat: true }] });\n'
      + 'hot.updateSettings({ colHeaders: true });\nhot.addHook(\'afterChange\', () => {});\n'
      + 'const s = Handsontable.helper.sanitize(\'x\');\nconst text = `x`;\n';
    const walks = copies => countTraversals(async() => {
      const { entries } = await transformFile({ filePath: 'a.js', source, plan: planOf(copies) });

      // A rule that threw would end the part early, and the count would say nothing.
      assert.deepEqual(entries.filter(entry => entry.ruleId === 'transform-error'), []);
      assert.equal(entries.length >= copies, true, 'every copy of the rules ran');
    });
    const few = await walks(2);
    const many = await walks(20);

    assert.ok(many <= few + 2, `${few} walks for 2 copies of each rule, ${many} for 20`);
  });

  it('reads the tree for the rules of three migrations as it does for the same rules of one', async() => {
    const matchers = [
      { property: 'correctFormat' },
      { call: 'updateSettings' },
      { hook: 'afterChange' },
      { import: 'handsontable/common' },
      { namespaceMember: 'helper.sanitize' },
      { missingOption: 'licenseKey' },
    ];
    const ruleOf = (version, match, index) => ({
      id: `${version}/r${index}`,
      kind: 'detect',
      version,
      safe: false,
      guideUrl: null,
      files: ['js'],
      message: 'm',
      match,
    });
    const split = buildPlan(['1.0.0', '1.1.0', '1.2.0'].map((version, at) => ({
      version,
      rules: matchers.filter((_, index) => index % 3 === at).map((match, index) => ruleOf(version, match, index)),
    })));
    const joined = buildPlan([{
      version: '1.0.0',
      rules: matchers.map((match, index) => ruleOf('1.0.0', match, index)),
    }]);
    const source = 'import Handsontable from \'handsontable\';\n'
      + 'const hot = new Handsontable(el, { columns: [{ correctFormat: true }] });\n'
      + 'hot.updateSettings({ colHeaders: true });\nhot.addHook(\'afterChange\', () => {});\n'
      + 'const s = Handsontable.helper.sanitize(\'x\');\n';
    const walks = plan => countTraversals(async() => {
      const { entries } = await transformFile({ filePath: 'a.js', source, plan });

      assert.deepEqual(entries.filter(entry => entry.ruleId === 'transform-error'), []);
      assert.equal(entries.length >= 4, true, 'the rules ran');
    });
    const one = await walks(joined);
    const three = await walks(split);

    // What the bindings and the option objects read stays valid from one version to the next while nothing is edited.
    assert.ok(three <= one + 2, `${one} walks for the rules of one migration, ${three} for the same rules in three`);
  });

  it('a spread of a different constant in every grid reads the identifiers of the file once', async() => {
    const manifests = await loadManifests(VERSIONS_DIR);
    const plan = buildPlan(manifests, ['18.1.0/license-key-missing', '18.0.0/html-without-sanitizer']);
    const grid = index => `const base${index} = { rowHeaders: true };\n`
      + `new Handsontable(el${index}, { ...base${index}, data: [] });\n`;
    const sourceOf = grids => `import Handsontable from 'handsontable';\n${
      Array.from({ length: grids }, (_, index) => grid(index)).join('')}`;
    const walks = grids => countTraversals(async() => {
      await transformFile({ filePath: 'a.js', source: sourceOf(grids), plan });
    });
    const few = await walks(10);
    const many = await walks(80);

    assert.ok(many <= few + 2, `${few} walks for 10 grids, ${many} for 80`);
  });
});

describe('scanStyles() reads the style elements of a page once', () => {
  it('returns the body, the attributes, and the offset of each element, and skips look-alikes', () => {
    const source = '<STYLE media="a>b">.a {}</style ><styled>x</styled><style>.b {}';
    const styles = scanStyles(source);

    assert.deepEqual(styles.map(({ body }) => body), ['.a {}', '.b {}']);
    assert.equal(styles[0].attributes, ' media="a>b"');
    assert.equal(source.slice(styles[0].index, styles[0].index + 5), '.a {}');
    assert.deepEqual(scanStyles('<style class="open>.a {}'), []);
    assert.deepEqual(scanStyles('no styles here'), []);
  });

  for (const [name, input] of Object.entries({
    'many elements': bytes => '<style>.a{}</style>\n'.repeat(Math.ceil(bytes / 21)),
    'many unclosed tags': bytes => '<style'.repeat(Math.ceil(bytes / 6)),
    'one long body': bytes => `<style>${'.a{}'.repeat(Math.ceil(bytes / 4))}</style>`,
    'many look-alikes': bytes => '<styled>'.repeat(Math.ceil(bytes / 8)),
  })) {
    it(`${name}: four times the text is four times the work`, async() => {
      await measureGrowth({ input, run: scanStyles, size: MIB / 128 });
    });
  }
});
