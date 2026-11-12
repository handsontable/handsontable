import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consistencyFindings, duplicateTitleFindings, pageFindings, textKey, waysFindings } from '../site-structure.mjs';

// tests/AGENTS.md ("A11y: the site checks beyond axe", page structure): the verdicts behind 1.3.1, 2.4.1, 2.4.2,
// 2.4.4, 2.4.5, 2.4.6, 3.1.1, 3.2.3, 3.2.4 and 3.2.6 on a site's pages.

const SITE = { name: 'Handsontable DataGrid' };
const page = (fields = {}) => ({
  title: 'Rows sorting | Handsontable DataGrid',
  lang: 'en',
  mainLang: 'en',
  headings: [{ level: 1, name: 'Rows sorting', inMain: true }, { level: 2, name: 'Overview', inMain: true }],
  landmarks: [{ role: 'banner', name: '', top: true }, { role: 'navigation', name: 'Main', top: false }, { role: 'main', name: '', top: true },
    { role: 'contentinfo', name: '', top: true }],
  skipLinks: [{ name: 'Skip to content', href: '#_top', targetExists: true, targetInMain: true }],
  links: [{ name: 'Guides' }, { name: 'Sorting API' }],
  ...fields,
});
const kinds = findings => findings.map(finding => finding.kind).sort();

test('a page with a title, a language, one main heading, a main landmark and a skip link has no finding', () => {
  assert.deepEqual(pageFindings(page(), SITE), []);
});

test('2.4.2: no title, a title of the site alone, and, advisory, a title without the main heading', () => {
  assert.deepEqual(kinds(pageFindings(page({ title: '  ' }), SITE)), ['page-title-missing']);
  assert.deepEqual(kinds(pageFindings(page({ title: 'Handsontable DataGrid' }), SITE)), ['page-title-bare']);
  assert.deepEqual(pageFindings(page({ title: 'Handsontable DataGrid' }), { ...SITE, home: true }), [], 'the home page may carry the name alone');

  const differs = pageFindings(page({ title: 'Sorting | Handsontable DataGrid', headings: [{ level: 1, name: 'Order the rows', inMain: true }] }), SITE);

  assert.deepEqual(kinds(differs), ['page-title-differs-from-heading']);
  assert.equal(differs[0].severity, 'advisory');
  assert.deepEqual(pageFindings(page({ title: 'Rows sorting – Handsontable DataGrid' }), SITE), [], 'an en dash separates too');
});

test('2.4.2: a title another page shares, unless it is the same address at another viewport', () => {
  const titles = [
    { id: 'js-a', path: '/a/', title: 'Accessibility | Handsontable DataGrid' },
    { id: 'react-a', path: '/r/a/', title: 'Accessibility | Handsontable DataGrid' },
    { id: 'chrome-a', path: '/a/', title: 'Accessibility | Handsontable DataGrid' },
    { id: 'js-b', path: '/b/', title: 'Other | Handsontable DataGrid' },
  ];
  const [finding] = duplicateTitleFindings({ id: 'js-a', path: '/a/', title: 'Accessibility | Handsontable DataGrid' }, titles);

  assert.equal(finding.kind, 'page-title-duplicate');
  assert.deepEqual(finding.measured, { title: 'Accessibility | Handsontable DataGrid', shared: 1, with: 'react-a' });
  assert.deepEqual(duplicateTitleFindings({ id: 'js-b', path: '/b/', title: 'Other | Handsontable DataGrid' }, titles), []);
});

test('3.1.1: no lang, a lang that is no language tag, and main content in another primary language', () => {
  assert.deepEqual(kinds(pageFindings(page({ lang: null }), SITE)), ['page-lang-missing']);
  assert.deepEqual(kinds(pageFindings(page({ lang: 'english' }), SITE)), ['page-lang-invalid']);
  assert.deepEqual(kinds(pageFindings(page({ mainLang: 'pl' }), SITE)), ['page-lang-differs-from-content']);
  assert.deepEqual(pageFindings(page({ lang: 'en-US', mainLang: 'en' }), SITE), [], 'a region subtag is the same language');
  assert.deepEqual(pageFindings(page({ lang: 'en-US-x-hot', mainLang: 'en' }), SITE), [], 'a private-use singleton is a valid tag');
  assert.deepEqual(kinds(pageFindings(page({ lang: 'en--US' }), SITE)), ['page-lang-invalid'], 'an empty subtag is not');
});

test('1.3.1 and 2.4.6: no main heading, an empty heading, and, advisory, several main headings or a skipped level', () => {
  assert.deepEqual(kinds(pageFindings(page({ headings: [{ level: 2, name: 'Overview', inMain: true }] }), SITE)), ['heading-h1-missing']);
  assert.deepEqual(kinds(pageFindings(page({ headings: [{ level: 1, name: 'Rows sorting', inMain: true }, { level: 2, name: ' ', inMain: true }] }), SITE)),
    ['heading-empty']);

  const skipped = pageFindings(page({ headings: [{ level: 2, name: 'On this page', inMain: false }, { level: 1, name: 'Rows sorting', inMain: true },
    { level: 3, name: 'Deep', inMain: true }, { level: 3, name: 'Deeper', inMain: true }, { level: 1, name: 'Again', inMain: true }] }), SITE);

  assert.deepEqual(kinds(skipped), ['heading-h1-multiple', 'heading-level-skipped']);
  assert.ok(skipped.every(finding => finding.severity === 'advisory'));
  assert.equal(skipped.find(finding => finding.kind === 'heading-level-skipped').step, 'h1 to h3', 'a heading outside main is not part of the outline');
});

test('1.3.1: no main landmark, several, a repeated banner, and two landmarks of one role under one name', () => {
  const landmarks = page().landmarks;

  assert.deepEqual(kinds(pageFindings(page({ landmarks: landmarks.filter(item => item.role !== 'main') }), SITE)), ['landmark-main-missing']);
  assert.deepEqual(kinds(pageFindings(page({ landmarks: [...landmarks, { role: 'main', name: '', top: true }] }), SITE)), ['landmark-main-multiple']);
  assert.deepEqual(kinds(pageFindings(page({ landmarks: [...landmarks, { role: 'banner', name: '', top: true }] }), SITE)), ['landmark-repeated']);
  assert.deepEqual(pageFindings(page({ landmarks: [...landmarks, { role: 'banner', name: '', top: false }] }), SITE), [],
    'a header inside another landmark is not the page\'s banner');

  const repeated = pageFindings(page({ landmarks: [...landmarks, { role: 'complementary', name: 'Tip', top: false },
    { role: 'complementary', name: 'Tip', top: false }, { role: 'navigation', name: 'Footer', top: false }] }), SITE);

  assert.deepEqual(kinds(repeated), ['landmark-name-repeated']);
  assert.equal(repeated[0].step, '"Tip"');
});

test('2.4.1: a skip link to nothing, one to outside main, and a page with no way to bypass its blocks', () => {
  assert.deepEqual(kinds(pageFindings(page({ skipLinks: [{ name: 'Skip', href: '#x', targetExists: false, targetInMain: false }] }), SITE)),
    ['skip-link-target-missing']);
  assert.deepEqual(kinds(pageFindings(page({ skipLinks: [{ name: 'Skip', href: '#nav', targetExists: true, targetInMain: false }] }), SITE)),
    ['skip-link-target-outside-main']);
  assert.deepEqual(pageFindings(page({ skipLinks: [] }), SITE), [], 'a main landmark bypasses the blocks on its own');
  assert.deepEqual(kinds(pageFindings(page({ skipLinks: [], landmarks: [] }), SITE)), ['bypass-missing', 'landmark-main-missing']);
});

test('2.4.4: a link name that says nothing on its own is advisory, one finding per name with its count', () => {
  const findings = pageFindings(page({ links: [{ name: 'Read more' }, { name: 'read more…' }, { name: 'Here' }, { name: 'Sorting API' }] }), SITE);

  assert.deepEqual(findings.map(finding => [finding.kind, finding.step, finding.measured.count, finding.severity]),
    [['link-name-generic', '"read more"', 2, 'advisory'], ['link-name-generic', '"here"', 1, 'advisory']]);
});

test('2.4.5: navigation and search are two ways; one of them alone is a finding', () => {
  assert.deepEqual(waysFindings({ inNavigation: true }, { search: true }), []);
  assert.deepEqual(waysFindings({ inNavigation: true }, { search: false }).map(finding => finding.measured.ways), ['navigation']);
  assert.deepEqual(waysFindings({ inNavigation: false }, { search: false }).map(finding => finding.measured.ways), ['none']);
});

const chrome = (fields = {}) => ({
  url: 'https://docs.test/docs/javascript-data-grid/sorting/',
  navigation: { 'Main navigation': ['Guides', 'API', 'Recipes', 'Updates'] },
  chromeLinks: [{ name: 'Guides', href: 'https://docs.test/docs/javascript-data-grid/' }, { name: 'Handsontable DataGrid', href: 'https://docs.test/docs/javascript-data-grid/' },
    { name: 'Contact', href: 'https://docs.test/contact/' }],
  helps: ['Support', 'Open docs assistant', 'Contact'],
  ...fields,
});
const FRAMEWORK = /\/(?:javascript|react)-data-grid/;
const normalize = (href, here) => {
  const own = FRAMEWORK.exec(new URL(here).pathname)?.[0];
  const url = new URL(href, here);

  return own && url.pathname.includes(own) ? url.pathname.replace(own, '/<framework>') : url.pathname;
};

test('3.2.3: the shared links of a header navigation in another order; a link added or left out keeps the order', () => {
  assert.deepEqual(consistencyFindings(chrome({ navigation: { 'Main navigation': ['Guides', 'API', 'Blog', 'Updates'] } }), chrome(), normalize), []);

  const [finding] = consistencyFindings(chrome({ navigation: { 'Main navigation': ['API', 'Guides', 'Recipes', 'Updates'] } }), chrome(), normalize);

  assert.equal(finding.kind, 'navigation-order-differs');
  assert.deepEqual(finding.measured, { position: 1, here: 'api', reference: 'guides' });

  const missing = consistencyFindings(chrome({ navigation: {} }), chrome(), normalize);

  assert.deepEqual(missing.map(item => [item.kind, item.severity]), [['navigation-missing', 'advisory']]);
});

test('3.2.4: a target under a name the reference never gives it; a page in another framework is the same target', () => {
  const react = chrome({ url: 'https://docs.test/docs/react-data-grid/sorting/',
    chromeLinks: [{ name: 'Guides', href: 'https://docs.test/docs/react-data-grid/' }, { name: 'Get in touch', href: 'https://docs.test/contact/' }] });
  const findings = consistencyFindings(react, chrome(), normalize);

  assert.deepEqual(findings.map(item => [item.kind, item.selector, item.measured.here]), [['identification-differs', 'a[href="/contact/"]', 'Get in touch']]);
  assert.deepEqual(consistencyFindings(chrome(), chrome(), normalize), [], 'a page agrees with itself, a target with two names included');

  const switcher = chrome({ chromeLinks: [{ name: 'Switch to JavaScript', href: 'https://docs.test/docs/javascript-data-grid/', region: 'banner' }] });

  assert.deepEqual(consistencyFindings(switcher, chrome({ chromeLinks: [{ name: 'Guides', href: 'https://docs.test/docs/javascript-data-grid/', region: 'nav "Main navigation"' }] }), normalize), [],
    'two controls in two landmarks may point at one place under two names');

  const recipes = chrome({ url: 'https://docs.test/docs/javascript-data-grid/recipes/',
    chromeLinks: [{ name: 'Switch to JavaScript', href: 'https://docs.test/docs/javascript-data-grid/recipes/', region: 'banner' }] });

  assert.deepEqual(consistencyFindings(recipes, chrome({ chromeLinks: [{ name: 'Recipes', href: 'https://docs.test/docs/javascript-data-grid/recipes/', region: 'banner' }] }), normalize), [],
    'a link to the page it is on identifies nothing across pages');
});

test('3.2.6: the help controls in another order is a finding; one the page lacks is advisory', () => {
  const [order] = consistencyFindings(chrome({ helps: ['Open docs assistant', 'Support', 'Contact'] }), chrome(), normalize);

  assert.equal(order.kind, 'help-order-differs');
  assert.equal(order.criteria[0], '3.2.6');

  const missing = consistencyFindings(chrome({ helps: ['Support', 'Contact'] }), chrome(), normalize);

  assert.deepEqual(missing.map(item => [item.kind, item.severity]), [['help-missing', 'advisory']]);
});

test('text is compared without case or spacing', () => {
  assert.equal(textKey('  Rows\n  Sorting '), 'rows sorting');
});
