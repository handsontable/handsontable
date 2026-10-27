import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scanText, scanRepository, scanAccessibilityData, formatFindings, isAllowlisted, publicFiles, SCREEN_READER_NAMES,
} from '../accessibility-claims.mjs';
import {
  loadAccessibilityData, validateAccessibilityData, accessibilityTemplateValues, allowedScreenReaderNames,
  untestedScreenReaderNames, screenReadersSentence, browsersSentence, joinList, websiteStringsJson,
  matrixList, matrixTable,
} from '../../docs/src/plugins/accessibility-data.mjs';
import { compareWebsiteStrings } from '../../docs/scripts/export-accessibility-strings.mjs';
import { DOCS_PREFIX, READMES } from '../readme-check.mjs';

// docs/AGENTS.md, section 2.20: every public accessibility claim comes from
// docs/content/data/accessibility.json. The guide, the report page, the recipes, the READMEs, the
// core JSDoc and the website strings read it; nothing else may state a target, a report version,
// or a tested screen reader. These tests are the gate: the scanner's rules on fixtures first, then
// the real tree.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const data = loadAccessibilityData();
const tested = allowedScreenReaderNames(data);
const scan = (text, file = 'docs/content/guides/some-page/some-page.md') => scanText(text, {
  file,
  allowedScreenReaders: tested,
});
const rules = findings => findings.map(f => f.rule);
const lineRules = findings => findings
  .map(f => [f.line, f.rule])
  .sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]));

const GUIDE = 'docs/content/guides/accessibility/accessibility/accessibility.md';
const REPORT = 'docs/content/guides/accessibility/accessibility-conformance-report/accessibility-conformance-report.md';

test('the data file is valid, and the validator names what is wrong', () => {
  assert.deepEqual(validateAccessibilityData(data), []);

  const broken = structuredClone(data);

  broken.target.wording.long = 'meets WCAG 2.2 AA';
  broken.matrix[0].howTested = ['by hand'];
  delete broken.report.version;
  delete broken.knownLimitations[0].reportRef;

  const errors = validateAccessibilityData(broken);

  assert.ok(errors.some(e => e.includes('target.wording.long')), 'the wording must start with "targets"');
  assert.ok(errors.some(e => e.includes('matrix[0].howTested')), 'an unknown howTested value is rejected');
  assert.ok(errors.some(e => e.includes('report.version')), 'a missing report field is named');
  assert.ok(errors.some(e => e.includes('knownLimitations[0].reportRef')), 'a limitation names its report ref or null');
});

test('the validator requires a version for a tested screen reader and rejects inherited and null values', () => {
  const untestedVersion = structuredClone(data);

  untestedVersion.matrix[0].version = null;

  assert.ok(validateAccessibilityData(untestedVersion).some(e => e.includes('matrix[0].version')),
    'a tested entry renders its version, so null is allowed only for not-tested');

  const inherited = structuredClone(data);

  inherited.matrix[0].howTested = ['constructor'];

  assert.ok(validateAccessibilityData(inherited).some(e => e.includes('matrix[0].howTested has "constructor"')),
    'a howTested value is an own key of HOW_TESTED, not anything `in` finds on its prototype');

  const nullTarget = structuredClone(data);

  nullTarget.target = null;

  assert.ok(validateAccessibilityData(nullTarget).some(e => e.startsWith('target must be')),
    'a null object is named as the missing field instead of throwing on its first property');

  const arrayNotes = structuredClone(data);

  arrayNotes.notes = [];

  assert.ok(validateAccessibilityData(arrayNotes).some(e => e.startsWith('notes must be')),
    'an array is not an object');
});

test('a matrix entry tested in its own browsers names them, and only a tested entry may', () => {
  const nightly = name => data.matrix
    .find(entry => entry.name === name && entry.howTested.includes('automated-nightly'));

  // tests/AGENTS.md, "Screen readers": both lanes run on the screen reader nightly, each in
  // Playwright's own browser builds rather than the audit's Chrome and Firefox.
  assert.deepEqual(nightly('VoiceOver')?.browsers, ['WebKit (Playwright)', 'Chromium'],
    'the VoiceOver nightly runs in Playwright\'s WebKit and Chromium, not in the audit\'s browsers');
  assert.deepEqual(nightly('NVDA')?.browsers, ['Chromium', 'Firefox (Playwright)'],
    'the NVDA nightly runs in Chromium and Playwright\'s Firefox, not in the audit\'s browsers');
  assert.match(matrixList(data),
    /^- VoiceOver on macOS 26, in WebKit \(Playwright\) and Chromium: automated nightly run\.$/m,
    'the list says which browsers the nightly ran in, so it never reads as the audit\'s Chrome and Firefox');
  assert.match(matrixList(data),
    /^- NVDA 2026\.2 on Windows Server 2025, in Chromium and Firefox \(Playwright\): automated nightly run\.$/m);
  assert.match(matrixTable(data),
    /^\| VoiceOver \| macOS 26 \| macOS \(WebKit \(Playwright\) and Chromium\) \| Automated nightly run \|$/m);
  assert.match(matrixList(data), /^- NVDA 2025\.3 on Windows 11: external audit/m,
    'an entry without browsers renders as before');
  assert.equal(screenReadersSentence(data), 'VoiceOver (macOS and iOS) and NVDA (Windows)',
    'a nightly on a platform family the audit already covers adds nothing to the sentence the website reads');

  [[], [''], 'Chromium', [3]].forEach((browsers) => {
    const broken = structuredClone(data);

    broken.matrix[0].browsers = browsers;

    assert.ok(validateAccessibilityData(broken).some(e => e.includes('matrix[0].browsers')),
      `browsers ${JSON.stringify(browsers)} is rejected: a non-empty array of names, or nothing`);
  });

  const untested = structuredClone(data);
  const jaws = untested.matrix.findIndex(entry => entry.howTested.includes('not-tested'));

  untested.matrix[jaws].browsers = ['Chrome'];

  assert.ok(validateAccessibilityData(untested).some(e => e.includes(`matrix[${jaws}].browsers names browsers`)),
    'a not-tested entry is never rendered, so it names no browsers');
});

test('report.next.sentence is empty when no next version is planned, and limitations cite the report ref', () => {
  const fixture = structuredClone(data);

  fixture.report.next = { version: '9.9', status: 'in preparation', scope: 'every criterion judged' };
  fixture.knownLimitations = [
    { id: 'sorting', text: 'Sorting is not announced.', criteria: ['4.1.3'], reportRef: '#2375' },
    { id: 'description', text: 'There is no description.', criteria: [], reportRef: null },
  ];

  const values = accessibilityTemplateValues(fixture);

  assert.equal(values['report.next.sentence'], 'Version 9.9 of this report is in preparation: every criterion judged.');
  assert.equal(values['knownLimitations.list'],
    '- Sorting is not announced (WCAG 4.1.3; ref. #2375 in the report).\n- There is no description.',
    'the ref is the report\'s own Ref. column, not a GitHub issue');

  fixture.report.next = null;

  assert.deepEqual(validateAccessibilityData(fixture), [], 'report.next may be null');
  assert.equal(accessibilityTemplateValues(fixture)['report.next.sentence'], '',
    'a null next version renders nothing, never "Version  is : ."');
});

test('the matrix decides which screen readers public text may name', () => {
  assert.deepEqual(tested, ['VoiceOver', 'NVDA']);
  assert.deepEqual(untestedScreenReaderNames(data), ['JAWS']);
  assert.equal(screenReadersSentence(data), 'VoiceOver (macOS and iOS) and NVDA (Windows)');
  assert.equal(browsersSentence(data), 'Chrome 141 and Firefox 143');
  assert.equal(joinList(['a', 'b', 'c']), 'a, b, and c');

  for (const name of tested) {
    assert.ok(SCREEN_READER_NAMES.includes(name), `${name} is in the matrix, so the scanner must know it by name`);
  }
});

test('scanText flags a superseded WCAG version in prose, a link, a tag, a sentence end, and spelled out', () => {
  const findings = scan([
    'Handsontable meets requirements outlined in the [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)' +
    ' guidelines.',
    'Test your code against WCAG 2.0 requirements.',
    'The target is WCAG 2.2 Level A and AA.',
  ].join('\n'));

  assert.deepEqual(rules(findings).sort(), [
    'meets-wcag', 'superseded-wcag-version', 'superseded-wcag-version', 'superseded-wcag-version',
  ]);
  assert.equal(findings.filter(f => f.line === 3).length, 0, 'WCAG 2.2 is the target and never a finding');

  // A version that ends a sentence and the spelled-out name make the same claim.
  const endings = scan([
    'Handsontable meets WCAG 2.1.',
    'WCAG 2.0.',
    'built to Web Content Accessibility Guidelines 2.1',
    'WCAG 2.2.',
  ].join('\n'));

  assert.deepEqual(endings.map(f => `${f.line} ${f.rule}`).sort(), [
    '1 meets-wcag', '1 superseded-wcag-version', '2 superseded-wcag-version', '3 superseded-wcag-version',
  ]);
});

test('scanText flags a superseded WCAG version whatever separates the name from the number', () => {
  const flagged = ['WCAG v2.1', 'WCAG version 2.1', 'WCAG-2.1', 'WCAG  2.1', '**WCAG** 2.1', 'WCAG&nbsp;2.1'];
  const notFlagged = ['WCAG 2.2', 'WCAG 2.1.1', 'WCAG 2.10'];

  for (const text of flagged) {
    assert.deepEqual(lineRules(scan(text)), [[1, 'superseded-wcag-version']], `"${text}" names WCAG 2.1`);
  }
  for (const text of notFlagged) {
    assert.deepEqual(scan(text), [], `"${text}" is not WCAG 2.0 or 2.1`);
  }
});

test('scanText flags a phrase wrapped across lines once, at the line where it starts', () => {
  assert.deepEqual(lineRules(scan(' * It meets\n * WCAG 2.1 today.')), [
    [1, 'meets-wcag'], [2, 'superseded-wcag-version'],
  ], 'a hard-wrapped JSDoc line is read as one phrase');
  assert.deepEqual(lineRules(scan('Handsontable meets WCAG 2.1.')), [
    [1, 'meets-wcag'], [1, 'superseded-wcag-version'],
  ], 'the joined pass does not repeat what the per-line pass found');
  assert.deepEqual(scan('About accessibility.\n\nThe license keeps you compliant'), [],
    'a blank line ends the paragraph, so the context of one paragraph never reaches the next');
});

test('scanText flags the claim verbs and a compliant after the name', () => {
  const findings = scan([
    'Handsontable conforms to WCAG 2.2.',
    'The grid complies with the Web Content Accessibility Guidelines.',
    'We adhere to WCAG 2.2 Level AA.',
    'The grid is WCAG 2.2 AA compliant.',
    'The export conforms to the CSV standard.',
  ].join('\n'));

  assert.deepEqual(lineRules(findings), [
    [1, 'claims-conformance'],
    [2, 'claims-conformance'],
    [3, 'claims-conformance'],
    [4, 'compliant'],
    [4, 'conformance-with-wcag'],
  ]);
});

test('scanText flags meets, compliant, conformance with and certified only as accessibility claims', () => {
  const flagged = scan([
    'Targeting WCAG 2.2 AA compliance.',
    'The grid is compliant with WCAG 2.2.',
    'Accessibility: WCAG 2.2 AA certified.',
    'With version 14, Handsontable meets WCAG 2.2 at level AA.',
  ].join('\n'));

  assert.deepEqual(lineRules(flagged), [
    [1, 'compliant'],
    [2, 'compliant'],
    [2, 'conformance-with-wcag'],
    [3, 'certified'],
    [4, 'meets-wcag'],
  ]);

  const notFlagged = scan([
    'We use Fossa to stay compliant with third-party license terms.',
    'Find a certified reseller who speaks your language.',
    'The report states the conformance per success criterion.',
  ].join('\n'), 'docs/content/guides/security/security/security.md');

  assert.deepEqual(notFlagged, [], 'compliance with a license and a certified reseller are not accessibility claims');

  const bareStandards = scan(['Our grid is 508 compliant.', 'Level AA compliant grid.'].join('\n'));

  assert.deepEqual(bareStandards.map(f => [f.line, f.rule]), [[1, 'compliant'], [2, 'compliant']],
    'a bare 508 or Level AA puts compliant in an accessibility sentence');
});

test('scanText flags a screen reader the matrix does not list, in any case', () => {
  const findings = scan([
    '- NVDA (Windows)',
    '- JAWS (Windows)',
    '  - jaws',
    'Tested with VoiceOver on macOS.',
  ].join('\n'));

  assert.deepEqual(findings.map(f => [f.line, f.rule]), [
    [2, 'unlisted-screen-reader'], [3, 'unlisted-screen-reader'],
  ]);
});

test('the allowlist keeps historical text and the data file out of the scan', () => {
  assert.ok(isAllowlisted('docs/content/guides/upgrade-and-migration/changelog-14/changelog-14.md'));
  assert.ok(isAllowlisted('docs/content/data/version-highlights/14.0.json'));
  assert.ok(isAllowlisted('docs/content/data/accessibility.json'));
  assert.ok(!isAllowlisted(GUIDE));
  assert.ok(!isAllowlisted('README.md'));
});

test('the scan covers the docs content, the four READMEs and the core source, never tests or the API reference', () => {
  const files = publicFiles();

  assert.ok(files.includes(GUIDE));
  assert.ok(files.includes(REPORT));
  assert.ok(files.includes('docs/content/recipes/accessibility/aria-grid/aria-grid.md'));
  assert.ok(files.includes('docs/content/data/accessibility-website-strings.json'),
    'the website export is public text');
  assert.ok(files.includes('handsontable/src/dataMap/metaManager/metaSchema.ts'),
    'the JSDoc becomes the API reference');
  assert.ok(files.includes('docs/content/recipes/accessibility/aria-grid/javascript/example1.js'),
    'the example sources the pages embed are public text');

  for (const { file } of READMES) {
    assert.ok(files.includes(file), `${file} is scanned`);
  }

  assert.ok(!files.some(file => file.startsWith('docs/content/api/')),
    'the generated API reference is not scanned');
  assert.ok(!files.some(file => /\.(?:spec|unit)\.[jt]s$/.test(file)), 'tests are not public text');
});

test('the data file\'s own text is scanned, and a finding names its key', () => {
  assert.deepEqual(scanAccessibilityData(data), [], 'the committed data makes no claim it does not back');

  const fixture = structuredClone(data);

  fixture.notes.mobile = 'Handsontable meets WCAG 2.1 AA on mobile.';

  const findings = scanAccessibilityData(fixture);

  assert.deepEqual(findings.map(f => [f.file, f.rule]).sort(), [
    ['docs/content/data/accessibility.json#notes.mobile', 'meets-wcag'],
    ['docs/content/data/accessibility.json#notes.mobile', 'superseded-wcag-version'],
  ]);
  assert.equal(scanRepository({ data: fixture, files: [] }).length, 2, 'scanRepository includes the data file\'s text');
});

test('no public text contradicts the accessibility data file', () => {
  const findings = scanRepository({ data });

  assert.equal(findings.length, 0,
    `${findings.length} claim(s) contradict docs/content/data/accessibility.json:\n${formatFindings(findings)}`);
});

test('every README carries the approved wording as a link to the conformance report, with its own docs prefix', () => {
  // The root README links the unprefixed docs elsewhere, but /docs/<slug>/ does not redirect for
  // this page (404 on 2026-10-22), so every README, the root included, uses its framework prefix.
  for (const { file, flavour } of READMES) {
    const url = `https://handsontable.com/docs/${DOCS_PREFIX[flavour]}/${data.report.slug}/`;
    const expected = `[${data.target.wording.short}](${url})`;

    assert.ok(read(file).includes(expected), `${file} must contain ${expected}`);
  }

  const javascriptUrl = `https://handsontable.com/docs/${DOCS_PREFIX.javascript}/${data.report.slug}/`;

  assert.equal(data.report.url, javascriptUrl, 'report.url is the JavaScript form of the same slug');
});

test('the guide and the report page read the target, the report version and the matrix from the data file', () => {
  const guide = read(GUIDE);
  const report = read(REPORT);

  const guideKeys = [
    'target.long', 'report.version', 'report.date', 'matrix.list', 'knownLimitations.list', 'notes.mobile',
    'report.next.sentence',
  ];
  const reportKeys = [
    'report.version', 'report.date', 'matrix.list', 'browsers.list', 'notes.mobile', 'report.next.sentence',
  ];

  for (const key of guideKeys) {
    assert.ok(guide.includes(`{{$a11y.${key}}}`), `${GUIDE} must render {{$a11y.${key}}}`);
  }
  for (const key of reportKeys) {
    assert.ok(report.includes(`{{$a11y.${key}}}`), `${REPORT} must render {{$a11y.${key}}}`);
  }

  // A literal copy of a value the variable carries is the drift this file exists to stop.
  for (const [file, text] of [[GUIDE, guide], [REPORT, report]]) {
    assert.ok(!text.includes('{{$a11y.report.next.version}}'),
      `${file}: compose the next version from {{$a11y.report.next.sentence}}, which a null next renders empty`);
    assert.ok(!text.includes(`Report version</strong></td><td>${data.report.version}`),
      `${file}: the report version is a variable, not a literal`);
    assert.ok(!/^- (?:NVDA|VoiceOver) \(/m.test(text),
      `${file}: the screen-reader list is {{$a11y.matrix.list}}, not a hand-written list`);
  }
});

test('every {{$a11y.*}} key the docs content uses exists, so no page can render a placeholder', () => {
  const values = accessibilityTemplateValues(data);
  const used = new Map();

  for (const file of publicFiles().filter(f => f.startsWith('docs/content/') && /\.md$/.test(f))) {
    for (const m of read(file).matchAll(/\{\{\s*\$a11y\.([\w.]+)\s*\}\}/g)) {
      used.set(m[1], file);
    }
  }

  assert.ok(used.size > 0, 'at least one page uses the variables');

  for (const [key, file] of used) {
    assert.ok(key in values,
      `${file} uses {{$a11y.${key}}}, which accessibility-data.mjs does not provide`);
  }

  for (const value of Object.values(values)) {
    assert.equal(typeof value, 'string');
    assert.ok(!value.includes('{{'), 'a value never carries another placeholder');
  }
});

test('the committed website strings export matches the data file', () => {
  const { fresh, committed } = compareWebsiteStrings();

  assert.equal(committed, fresh,
    'docs/content/data/accessibility-website-strings.json is stale: ' +
    'run `npm run docs:export-accessibility-strings --prefix docs`');
  assert.equal(fresh, websiteStringsJson(data));
});
