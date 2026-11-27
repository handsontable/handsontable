import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  compareParts, findBrowserslistrc, judgeQueries, queriesOfPackage, queriesOfRc, splitQueries,
} from '../src/lib/browserslist.mjs';
import { loadManifest, VERSIONS_DIR, buildPlan } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { registry } from '../src/transforms/index.mjs';
import { inPlainProject, migrate } from './helpers/plain-project.mjs';

const manifest = await loadManifest(join(VERSIONS_DIR, '19.0.0'));
const RULE = manifest.rules.find(rule => rule.id === '19.0.0/browserslist-targets');
const SPEC = RULE.browserslist;

describe('the minimums of 19.0.0 come from the manifest', () => {
  it('names the five browsers of the guide, with the aliases Browserslist knows', () => {
    assert.deepEqual(SPEC.minimums, { chrome: '130', edge: '130', firefox: '132', safari: '18.2', ios_saf: '18.2' });
    assert.equal(SPEC.aliases.ios, 'ios_saf');
    assert.equal(RULE.safe, false);
    assert.equal(RULE.guide, 'the-minimum-browser-versions-are-higher');
  });

  it('is not in the list of the changes with no rule any more', () => {
    assert.equal(manifest.notAutomated.some(item => item.guide === 'the-minimum-browser-versions-are-higher'), false);
  });
});

describe('splitQueries() and the readers of a configuration', () => {
  it('splits on a comma and on "or", and drops what is empty', () => {
    assert.deepEqual(splitQueries('chrome >= 110, firefox >= 110'), ['chrome >= 110', 'firefox >= 110']);
    assert.deepEqual(splitQueries('chrome >= 110 or Firefox >= 110 OR safari 14'),
      ['chrome >= 110', 'Firefox >= 110', 'safari 14']);
    assert.deepEqual(splitQueries(' , ,defaults,'), ['defaults']);
    assert.deepEqual(splitQueries('> 0.5% and last 2 versions'), ['> 0.5% and last 2 versions']);
  });

  it('reads a .browserslistrc: comments, sections, one query per line, several per line', () => {
    const text = ['# c', '[production]', 'chrome >= 130 # trailing', '', '  firefox 109, safari 14.1  ', '[dev]',
      'last 1 chrome version', ''].join('\r\n');

    assert.deepEqual(queriesOfRc(text), [
      { query: 'chrome >= 130', line: 3 },
      { query: 'firefox 109', line: 5 },
      { query: 'safari 14.1', line: 5 },
      { query: 'last 1 chrome version', line: 7 },
    ]);
    assert.deepEqual(queriesOfRc(''), []);
    assert.deepEqual(queriesOfRc('# only a comment\n'), []);
  });

  it('reads the browserslist key of a package.json in each form it takes', () => {
    assert.deepEqual(queriesOfPackage('chrome >= 110, safari 14'), ['chrome >= 110', 'safari 14']);
    assert.deepEqual(queriesOfPackage(['chrome >= 110', 'ios 15']), ['chrome >= 110', 'ios 15']);
    assert.deepEqual(queriesOfPackage({ production: ['chrome 100'], test: 'firefox 90, safari 15', odd: [1, null] }),
      ['chrome 100', 'firefox 90', 'safari 15']);
    assert.deepEqual(queriesOfPackage(undefined), []);
    assert.deepEqual(queriesOfPackage(7), []);
  });

  it('compares versions number by number, a missing number being 0', () => {
    assert.equal(compareParts([18, 2], [18, 10]) < 0, true);
    assert.equal(compareParts([18], [18, 0]), 0);
    assert.equal(compareParts([130], [18, 2]) > 0, true);
  });
});

describe('judgeQueries()', () => {
  const judge = (...queries) => judgeQueries(queries, SPEC);

  it('flags an explicit version below the minimum, in every form of the version', () => {
    assert.deepEqual(judge('chrome >= 110', 'Safari 14.1', 'ios_saf 15', 'firefox > 100', 'chrome 109').below,
      ['chrome >= 110', 'Safari 14.1', 'ios_saf 15', 'firefox > 100', 'chrome 109']);
    assert.deepEqual(judge('chrome 100-110', 'ios_saf 15.2-15.3', 'edge 18-129').below,
      ['chrome 100-110', 'ios_saf 15.2-15.3', 'edge 18-129']);
  });

  it('reads the names of a browser in any letter case, and the other names it has', () => {
    assert.deepEqual(judge('CHROME >= 110', 'iOS 15', 'ff >= 100', 'fx 100', 'Edge 120').below,
      ['CHROME >= 110', 'iOS 15', 'ff >= 100', 'fx 100', 'Edge 120']);
  });

  it('flags a version that is at or above the minimum for none of the forms', () => {
    const queries = ['chrome >= 130', 'chrome 130', 'chrome 131-140', 'chrome > 129', 'firefox >= 132',
      'safari 18.2', 'safari >= 18.2', 'safari > 18.1', 'ios >= 18.2', 'ios_saf 18.4', 'edge > 130'];

    assert.deepEqual(judge(...queries), { below: [], unchecked: [] });
  });

  it('counts "> n" as the first release above n, one step of the last number written', () => {
    assert.deepEqual(judge('chrome > 128').below, ['chrome > 128']);
    assert.deepEqual(judge('chrome > 129').below, []);
    assert.deepEqual(judge('safari > 18.0').below, ['safari > 18.0']);
    assert.deepEqual(judge('safari > 18.1').below, []);
    assert.deepEqual(judge('safari > 17').below, ['safari > 17']);
  });

  it('judges every comparison with whole numbers, for a browser with whole versions and one with minors', () => {
    // [query, below]. Chrome has whole versions only: `> 129.5` selects 130. Safari has minors: the last one below the
    // minimum 18.2 is 18.1, so `> 18` and `> 18.0` select it and `> 18.1` does not. Numbers are compared as integers,
    // so 18.10 is above 18.2.
    const table = [
      ['chrome > 129', false], ['chrome > 129.5', false], ['chrome > 128.9', true], ['chrome > 128', true],
      ['chrome >= 129.5', false], ['chrome >= 129', true], ['chrome >= 130', false], ['chrome >= 130.0', false],
      ['chrome 130', false], ['chrome 129', true], ['chrome < 130', true], ['chrome <= 131', true],
      ['chrome 129-131', true], ['chrome 130-140', false], ['firefox > 131.5', false], ['fx > 130', true],
      ['edge > 129', false], ['edge >= 131', false],
      ['safari > 18', true], ['safari > 18.0', true], ['safari > 18.1', false], ['safari > 18.1.5', false],
      ['safari > 17.6', true], ['safari > 17', true], ['safari > 18.2', false], ['safari >= 18.1', true],
      ['safari >= 18.2', false], ['safari >= 18.10', false], ['safari 18.10', false], ['safari 18.1', true],
      ['safari 18.0', true], ['safari 18', true], ['safari 18.2-18.4', false], ['safari 18.1-18.4', true],
      ['safari 18-18.4', true], ['ios_saf > 18', true], ['ios > 18', true], ['ios_saf > 18.1', false],
      ['ios_saf >= 18.2', false], ['ios_saf < 19', true], ['ios_saf <= 18.2', true],
    ];

    for (const [query, below] of table) {
      assert.deepEqual(judge(query).below, below ? [query] : [], query);
    }
  });

  it('flags "<" and "<=" always, because they take in every older version', () => {
    assert.deepEqual(judge('chrome < 140', 'firefox <= 200', 'safari < 19').below,
      ['chrome < 140', 'firefox <= 200', 'safari < 19']);
  });

  it('leaves a query with "not" out, as it only removes browsers, and so a browser with no minimum', () => {
    const queries = ['not dead', 'not ie 11', 'NOT chrome < 100', 'ie 11', 'samsung 12', 'node 18'];

    assert.deepEqual(judge(...queries), { below: [], unchecked: [] });
  });

  it('leaves out a query that names only browsers with no minimum, and keeps the ones it cannot place', () => {
    const never = ['op_mini all', 'Op_Mini all', 'maintained node versions', 'current node', 'node 18', 'node >= 18',
      'node current', 'dead', 'and_chr 100', 'and_chr >= 100', 'last 2 node versions', 'last 1 op_mini version',
      'last 2 ie versions', 'unreleased node versions', 'ie_mob 11', 'baidu 13.18'];
    const unknown = ['defaults', 'last 2 versions', 'last 2 chrome versions', 'unreleased versions', 'cover 99.5%',
      'supports es6-module', 'op_mini all and > 1%', 'not dead and defaults'];

    assert.deepEqual(judge(...never), { below: [], unchecked: [] });
    assert.deepEqual(judge(...unknown).unchecked, unknown.filter(query => !/^not /i.test(query)));
  });

  it('puts what needs the data of Browserslist, and a query with "and", in unchecked', () => {
    assert.deepEqual(judge('defaults', 'last 2 versions', '> 0.5%', 'extends @acme/browsers', 'cover 99.5%',
      'chrome >= 110 and > 1%', 'unreleased versions', 'since 2020').unchecked,
    ['defaults', 'last 2 versions', '> 0.5%', 'extends @acme/browsers', 'cover 99.5%', 'chrome >= 110 and > 1%',
      'unreleased versions', 'since 2020']);
  });

  it('puts a range with a comparison in unchecked, and keeps the order of the queries', () => {
    assert.deepEqual(judge('chrome >= 100-110', 'defaults', 'chrome 109'),
      { below: ['chrome 109'], unchecked: ['chrome >= 100-110', 'defaults'] });
  });
});

describe('findBrowserslistrc()', () => {
  const inDir = async(body) => {
    const dir = await mkdtemp(join(tmpdir(), 'codemod-bl-'));

    try {
      await body(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  };

  it('reads the file next to the package.json, without a byte order mark, and says where it is', async() => {
    await inDir(async(dir) => {
      await mkdir(join(dir, 'packages/a'), { recursive: true });
      await writeFile(join(dir, '.browserslistrc'), '\ufeffchrome 100\n');
      await writeFile(join(dir, 'packages/a/.browserslistrc'), 'safari 15\n');

      assert.deepEqual(await findBrowserslistrc(dir, 'package.json', 1000),
        { file: '.browserslistrc', text: 'chrome 100\n' });
      assert.deepEqual(await findBrowserslistrc(dir, 'packages/a/package.json', 1000),
        { file: 'packages/a/.browserslistrc', text: 'safari 15\n' });
      assert.equal(await findBrowserslistrc(dir, 'packages/b/package.json', 1000), null);
    });
  });

  it('does not follow a link, and reads neither a file that is too large nor one that is not UTF-8', async() => {
    await inDir(async(dir) => {
      await writeFile(join(dir, 'real'), 'chrome 100\n');
      await symlink(join(dir, 'real'), join(dir, '.browserslistrc'));

      const link = await findBrowserslistrc(dir, 'package.json', 1000);

      assert.equal(link.file, '.browserslistrc');
      assert.equal(link.text, undefined);
      assert.match(link.skipped, /symbolic link/);

      await rm(join(dir, '.browserslistrc'));
      await writeFile(join(dir, '.browserslistrc'), `chrome 100\n${'# x\n'.repeat(100)}`);

      const large = await findBrowserslistrc(dir, 'package.json', 50);

      assert.equal(large.text, undefined);
      assert.match(large.skipped, /is 411 bytes, above the limit of 50 bytes/);
      assert.match(large.skipped, /--max-file-size/);
      await writeFile(join(dir, '.browserslistrc'), Buffer.from([0xff, 0xfe, 0x41]));
      assert.match((await findBrowserslistrc(dir, 'package.json', 1000)).skipped, /not valid UTF-8/);
    });
  });

  it('says nothing for a missing file, and names the reason for a directory and a file it cannot open', async() => {
    await inDir(async(dir) => {
      assert.equal(await findBrowserslistrc(dir, 'package.json', 1000), null);

      await mkdir(join(dir, '.browserslistrc'));
      assert.match((await findBrowserslistrc(dir, 'package.json', 1000)).skipped, /not a regular file/);
      await rm(join(dir, '.browserslistrc'), { recursive: true });
      await writeFile(join(dir, '.browserslistrc'), 'chrome 100\n', { mode: 0o000 });

      const result = await findBrowserslistrc(dir, 'package.json', 1000);

      // Running as root, a file with no permission is still readable.
      assert.ok(result.text !== undefined || /could not be read: EACCES/.test(result.skipped), JSON.stringify(result));
    });
  });
});

describe('the "browserslist" field of a dependency rule is checked when the manifest loads', () => {
  const problems = browserslist => registry.validate({ ...RULE, browserslist });

  it('accepts the field of the shipped rule', () => {
    assert.deepEqual(problems(SPEC), []);
    assert.deepEqual(problems({ minimums: { chrome: '130' }, release: 'X 1', onlyIfDependsOn: 'x' }), []);
  });

  it('refuses what a transform could not read', () => {
    const base = { minimums: { chrome: '130' }, release: 'X 1', onlyIfDependsOn: ['x'] };

    assert.match(problems('chrome')[0], /"browserslist" must be an object/);
    assert.match(problems({ ...base, minimums: {} })[0], /"minimums" must map/);
    assert.match(problems({ ...base, minimums: { chrome: 130 } })[0], /"minimums" must map/);
    assert.match(problems({ ...base, minimums: { chrome: 'latest' } })[0], /"minimums" must map/);
    assert.match(problems({ ...base, release: '' })[0], /"release" must name/);
    assert.match(problems({ ...base, onlyIfDependsOn: [] })[0], /"onlyIfDependsOn" must be/);
    assert.match(problems({ ...base, onlyIfDependsOn: undefined })[0], /"onlyIfDependsOn" must be/);
    assert.match(problems({ ...base, names: { chrome: 1 } })[0], /"names" must map a name to a display name/);
    assert.match(problems({ ...base, aliases: { ff: 'firefox' } })[0],
      /"aliases" must map a name to the name of a browser/);
  });
});

describe('the rule on a package.json', () => {
  const plan = buildPlan([manifest], ['19.0.0/browserslist-targets']);
  const run = (source, browserslistrc = null) => transformFile({
    filePath: 'package.json', source, plan, options: {}, phase: 2, browserslistrc,
  });

  it('checks a package that declares Handsontable or a wrapper, and no other', async() => {
    const old = '"browserslist": ["chrome >= 110"]';

    for (const name of ['handsontable', '@handsontable/react-wrapper', '@handsontable/angular-wrapper',
      '@handsontable/vue3']) {
      const { entries } = await run(`{ "devDependencies": { "${name}": "^19.0.0" }, ${old} }`);

      assert.equal(entries.length, 1, name);
    }

    const other = await run(`{ "description": "a handsontable demo", "dependencies": { "react": "^19" }, ${old} }`);

    assert.deepEqual(other.entries, []);
  });

  it('says nothing when there is no configuration, and never edits one', async() => {
    const none = await run('{ "dependencies": { "handsontable": "^19.0.0" } }');
    const source = '{\n  "dependencies": { "handsontable": "^19.0.0" },\n  "browserslist": ["chrome >= 110"]\n}\n';
    const old = await run(source, { file: '.browserslistrc', text: 'safari 14\n' });

    assert.deepEqual(none.entries, []);
    assert.equal(old.changed, false);
    assert.equal(old.output, source);
  });

  it('names the file, the line of each configuration, and the queries, as manual and as review', async() => {
    const source = [
      '{',
      '  "dependencies": { "handsontable": "^19.0.0" },',
      '  "browserslist": ["chrome >= 110", "defaults"]',
      '}',
      '',
    ].join('\n');
    const { entries } = await run(source, { file: 'sub/.browserslistrc', text: '# x\ndefaults\nsafari 14\n' });
    const [packageManual, packageReview, rcManual, rcReview] = entries;

    assert.deepEqual(entries.map(entry => [entry.severity, entry.file, entry.line]), [
      ['manual', 'package.json', 3],
      ['review', 'package.json', 3],
      ['manual', 'sub/.browserslistrc', 3],
      ['review', 'sub/.browserslistrc', 2],
    ]);
    assert.match(packageManual.message,
      /^Raise the Browserslist targets in package\.json to the Handsontable 19\.0 minimums: /);
    assert.match(packageManual.message, new RegExp('Chrome 130, Edge 130, Firefox 132, Safari 18\\.2, and iOS Safari '
      + '18\\.2\\. chrome >= 110 targets an older version'));
    assert.deepEqual(packageManual.quoted, ['chrome >= 110']);
    assert.match(packageReview.message,
      /^Check what defaults in package\.json selects, because the tool cannot judge that query/);
    assert.match(packageReview.message, / It is fine when no browser below /);
    assert.match(rcManual.message, /^Raise the Browserslist targets in sub\/\.browserslistrc /);
    assert.deepEqual(rcReview.quoted, ['defaults']);
    assert.ok(entries.every(entry => entry.guideUrl.endsWith('#the-minimum-browser-versions-are-higher')));
  });
});

describe('the rule in a run', () => {
  const FROM = ['--from', '18.1', '--only', '19.0.0/browserslist-targets', '--dry-run'];
  const PACKAGE = '{ "dependencies": { "handsontable": "^18.1.0" }, "browserslist": ["chrome >= 110"] }\n';

  it('checks every package.json of a monorepo with its own .browserslistrc, and edits no file', async() => {
    await inPlainProject({
      'package.json': '{ "name": "root", "private": true }\n',
      'packages/a/package.json': PACKAGE,
      'packages/b/package.json': '{ "dependencies": { "@handsontable/vue3": "^18.1.0" } }\n',
      'packages/b/.browserslistrc': 'ios_saf 15\nlast 2 versions\n',
      'packages/c/package.json':
        '{ "dependencies": { "handsontable": "^18.1.0" }, "browserslist": ["chrome >= 130"] }\n',
    }, async(dir) => {
      const { stdout, status } = await migrate(dir, [...FROM, '--json']);
      const document = JSON.parse(stdout);
      const files = document.entries.map(entry => `${entry.severity} ${entry.file}:${entry.line}`);

      assert.equal(status, 0);
      assert.deepEqual(files, [
        'manual packages/a/package.json:1',
        'manual packages/b/.browserslistrc:1',
        'review packages/b/.browserslistrc:2',
      ]);
      assert.deepEqual(document.changedFiles, []);
      assert.equal(await readFile(join(dir, 'packages/a/package.json'), 'utf8'), PACKAGE);
    });
  });

  it('reports the same on the second run, and a run that migrates leaves the configuration as it was', async() => {
    await inPlainProject({ 'package.json': PACKAGE, '.browserslistrc': 'safari 14\n' }, async(dir) => {
      const args = ['--from', '18.1', '--json'];
      const first = JSON.parse((await migrate(dir, args)).stdout);
      const second = JSON.parse((await migrate(dir, ['--from', '18.1', '--json'])).stdout);
      const pick = document => document.entries.filter(entry => entry.ruleId === '19.0.0/browserslist-targets')
        .map(entry => `${entry.severity} ${entry.file}:${entry.line}`);

      assert.deepEqual(pick(first), ['manual .browserslistrc:1', 'manual package.json:1']);
      assert.deepEqual(pick(second), pick(first));
      assert.equal(await readFile(join(dir, '.browserslistrc'), 'utf8'), 'safari 14\n');
      assert.match(await readFile(join(dir, 'package.json'), 'utf8'), /"chrome >= 110"/);
      assert.equal(second.counts.changed, 0);
    });
  });

  it('does not read a .browserslistrc that is a link, says so, and a project with no configuration gets no entry', async() => {
    const files = { 'package.json': '{ "dependencies": { "handsontable": "^18.1.0" } }\n', 'real.txt': 'safari 14\n' };

    await inPlainProject(files,
      async(dir) => {
        const none = JSON.parse((await migrate(dir, [...FROM, '--json'])).stdout);

        assert.deepEqual(none.entries, []);

        await symlink(join(dir, 'real.txt'), join(dir, '.browserslistrc'));

        const { entries } = JSON.parse((await migrate(dir, [...FROM, '--json'])).stdout);

        assert.deepEqual(entries.map(entry => [entry.ruleId, entry.file]), [['skipped-file', '.browserslistrc']]);
      });
  });

  it('is not run for a migration that does not include 19.0, and is a manual and a review entry for --fail-on-manual', async() => {
    await inPlainProject({ 'package.json': PACKAGE }, async(dir) => {
      const old = await migrate(dir, ['--from', '17.1', '--to', '18.1', '--dry-run', '--json']);
      const failing = await migrate(dir, [...FROM, '--fail-on-manual']);

      assert.deepEqual(JSON.parse(old.stdout).entries.filter(entry => entry.ruleId.startsWith('19.')), []);
      assert.equal(failing.status, 3);
    });
  });
});

describe('a .browserslistrc the tool cannot use is a skipped file, never a silent gap', () => {
  const ARGS = ['--from', '18.1', '--only', '19.0.0/browserslist-targets', '--dry-run'];
  const PACKAGE = '{ "dependencies": { "handsontable": "^18.1.0" } }\n';

  /**
   * Run in a project with the package and the given files, and read the JSON document.
   *
   * @param {Record<string, string|Uint8Array>} files The project files.
   * @param {string[]} [extra] More arguments.
   * @param {(dir: string) => Promise<void>} [prepare] Runs before the tool, for a link or a permission.
   * @returns {Promise<{document: object, status: number, stderr: string}>} The outcome.
   */
  async function runIn(files, extra = [], prepare = async() => {}) {
    let outcome;

    await inPlainProject({ 'package.json': PACKAGE, ...files }, async(dir) => {
      await prepare(dir);

      const { stdout, status, stderr } = await migrate(dir, [...ARGS, ...extra, '--json']);

      outcome = { document: JSON.parse(stdout), status, stderr };
    });

    return outcome;
  }

  const skipped = document => document.entries.filter(entry => entry.ruleId === 'skipped-file');

  it('names a file above --max-file-size and the way to raise the limit', async() => {
    const { document, status } = await runIn({ '.browserslistrc': `chrome 100\n${'# padding\n'.repeat(60)}` },
      ['--max-file-size', '500']);

    assert.equal(status, 0);
    assert.deepEqual(skipped(document).map(entry => [entry.severity, entry.file]), [['warning', '.browserslistrc']]);
    assert.match(skipped(document)[0].message, /above the limit of 500 bytes.*--max-file-size/);
    assert.equal(document.counts.warning, 1);
    assert.deepEqual(document.entries.filter(entry => entry.ruleId === '19.0.0/browserslist-targets'), []);
  });

  it('names a file that is not UTF-8', async() => {
    const { document } = await runIn({ '.browserslistrc': Buffer.from([0x63, 0xff, 0xfe, 0x0a]) });

    assert.match(skipped(document)[0].message, /not valid UTF-8/);
    assert.equal(skipped(document)[0].file, '.browserslistrc');
  });

  it('names a link and does not follow it', async() => {
    const { document } = await runIn({ 'real.txt': 'safari 14\n' }, [],
      dir => symlink(join(dir, 'real.txt'), join(dir, '.browserslistrc')));

    assert.match(skipped(document)[0].message, /symbolic link, which the tool does not follow/);
    assert.deepEqual(document.entries.filter(entry => entry.ruleId === '19.0.0/browserslist-targets'), []);
  });

  it('names a file it cannot read', { skip: process.platform === 'win32' || process.getuid?.() === 0 }, async() => {
    const { document, status } = await runIn({ '.browserslistrc': 'chrome 100\n' }, [],
      dir => chmod(join(dir, '.browserslistrc'), 0o000));

    assert.equal(status, 0);
    assert.match(skipped(document)[0].message, /could not be read: EACCES/);
  });

  it('says nothing about a package that does not use Handsontable', async() => {
    const { document } = await runIn({ 'package.json': '{ "name": "other" }\n',
      '.browserslistrc': Buffer.from([0xff]) });

    assert.deepEqual(skipped(document), []);
  });
});

describe('the message about a configuration stays short', () => {
  const plan = buildPlan([manifest], ['19.0.0/browserslist-targets']);
  const run = list => transformFile({
    filePath: 'package.json',
    source: JSON.stringify({ dependencies: { handsontable: '^19.0.0' }, browserslist: list }),
    plan,
    options: {},
    phase: 2,
  });

  it('lists a query once, however often the file repeats it', async() => {
    const { entries } = await run(Array.from({ length: 30000 }, () => 'last 2 versions'));

    assert.equal(entries.length, 1);
    assert.deepEqual(entries[0].quoted, ['last 2 versions']);
    assert.ok(entries[0].message.length < 700, `${entries[0].message.length} characters`);
  });

  it('lists at most 10 different queries, and counts the rest', async() => {
    const unjudged = Array.from({ length: 25 }, (_, index) => `last ${index + 3} versions`);
    const old = Array.from({ length: 13 }, (_, index) => `chrome ${100 + index}`);
    const { entries } = await run([...unjudged, ...old]);
    const review = entries.find(entry => entry.severity === 'review');
    const manual = entries.find(entry => entry.severity === 'manual');

    assert.equal(review.quoted.length, 10);
    assert.match(review.message, /last 12 versions, and 15 more in package\.json select, /);
    assert.doesNotMatch(review.message, /\d versions and \d+ more|, and last \d+ versions and/);
    assert.equal(manual.quoted.length, 10);
    assert.match(manual.message, /chrome 109, and 3 more target an older version/);
    assert.doesNotMatch(manual.message, /chrome \d+ and 3 more/);
    assert.ok(review.message.length < 800 && manual.message.length < 800);
  });

  it('does not say "and N more" when everything fits', async() => {
    const { entries } = await run(['chrome 100', 'chrome 101', 'chrome 100']);

    assert.deepEqual(entries[0].quoted, ['chrome 100', 'chrome 101']);
    assert.doesNotMatch(entries[0].message, /more/);
  });
});

describe('the Markdown report quotes the query of the user, not a prefix of the minimums', () => {
  const report = async(query) => {
    let text;

    await inPlainProject({
      'package.json': `{ "dependencies": { "handsontable": "^18.1.0" }, "browserslist": ["${query}"] }\n`,
    }, async(dir) => {
      await migrate(dir, ['--from', '18.1', '--only', '19.0.0/browserslist-targets', '--dry-run',
        '--report', 'r.md']);
      text = await readFile(join(dir, 'r.md'), 'utf8');
    });

    return text;
  };

  it('puts the span on the query, and leaves Safari 18.2 and Chrome 130 as plain text', async() => {
    const safari = await report('Safari 18');
    const chrome = await report('Chrome 13');

    assert.match(safari, /minimums: .*Safari 18\.2, and iOS Safari 18\.2\. `Safari 18` targets an older version/);
    assert.doesNotMatch(safari, /`Safari 18`\.2/);
    assert.match(chrome, /Chrome 130, Edge 130.*`Chrome 13` targets an older version/);
    assert.doesNotMatch(chrome, /`Chrome 13`0/);
  });
});
