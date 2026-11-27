import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests();
const HEAD = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { data: [] });\n';

/**
 * For each `detect` rule that matches a common key name and so relies on `requires: "option-object"`: a grid
 * option object that sets the key (the rule must report it), and a plain object of the project that sets the same
 * key in a file that also creates a grid (the rule must stay silent). Without the gate the second one is reported,
 * because the file is a Handsontable file.
 *
 * @type {Record<string, {positive: string, negative: string}>}
 */
const SAMPLES = {
  '18.0.0/moment-date-format': {
    positive: 'new Handsontable(el, { columns: [{ type: \'date\', dateFormat: \'DD/MM/YYYY\' }] });',
    negative: 'export const field = { dateFormat: \'DD/MM/YYYY\' };',
  },
  '18.0.0/moment-time-format': {
    positive: 'new Handsontable(el, { columns: [{ type: \'time\', timeFormat: \'h:mm a\' }] });',
    negative: 'export const field = { timeFormat: \'h:mm a\' };',
  },
  '18.0.0/date-default-format': {
    positive: 'new Handsontable(el, { columns: [{ type: \'date\' }] });',
    negative: 'export const field = { type: \'date\' };',
  },
  '18.0.0/time-default-format': {
    positive: 'new Handsontable(el, { columns: [{ type: \'time\' }] });',
    negative: 'export const field = { type: \'time\' };',
  },
  '18.1.0/loading-markup': {
    positive: 'new Handsontable(el, { loading: { title: \'<b>Wait</b>\' } });',
    negative: 'export const dialog = { loading: { title: \'<b>Wait</b>\' } };',
  },
  '19.0.0/size-css-keywords': {
    positive: 'new Handsontable(el, { width: \'inherit\' });',
    negative: 'export const card = { width: \'inherit\' };',
  },
  '19.0.0/width-outside-reference': {
    positive: 'new Handsontable(el, { width: \'var(--grid-width)\' });',
    negative: 'export const card = { width: \'var(--card-w)\' };',
  },
  '19.0.0/max-length-option': {
    positive: 'new Handsontable(el, { columns: [{ maxLength: 3 }] });',
    negative: 'export const field = { maxLength: 3 };',
  },
  '19.0.0/editor-false': {
    positive: 'new Handsontable(el, { columns: [{ editor: false }] });',
    negative: 'export const card = { editor: false };',
  },
  '19.0.0/row-heights-exact': {
    positive: 'new Handsontable(el, { rowHeights: 30 });',
    negative: 'export const card = { rowHeights: 30 };',
  },
  '19.0.0/height-auto': {
    positive: 'new Handsontable(el, { height: \'auto\' });',
    negative: 'export const card = { height: \'auto\' };',
  },
  '19.0.0/sizes-physical-index': {
    positive: 'new Handsontable(el, { colWidths: [100, 120] });',
    negative: 'export const card = { colWidths: [100, 120] };',
  },
  '19.0.0/hook-set-to-null': {
    positive: 'new Handsontable(el, { afterChange: null });',
    negative: 'export const callbacks = { afterChange: null };',
  },
};

/**
 * Run one shipped rule over a text.
 *
 * @param {string} id The rule id.
 * @param {string} source File text.
 * @returns {Promise<object[]>} The report entries of that rule.
 */
async function entriesOf(id, source) {
  const version = id.slice(0, id.indexOf('/'));
  const plan = buildPlan(manifests.filter(manifest => manifest.version === version), [id]);
  const result = await transformFile({ filePath: 'a.js', source, plan, options: { markers: false } });

  return result.entries.filter(entry => entry.ruleId === id);
}

describe('a detect rule that needs an option object ignores a plain object of the project', () => {
  const gated = manifests.flatMap(manifest => manifest.rules.filter(rule => rule.requires === 'option-object'))
    .map(rule => rule.id);

  it('has a sample for every rule that sets the gate, and for no other', () => {
    assert.equal(gated.length >= 11, true, 'the shipped rules were not collected');
    assert.deepEqual(Object.keys(SAMPLES).sort(), [...gated].sort());
  });

  for (const [id, { positive, negative }] of Object.entries(SAMPLES)) {
    it(`${id} reports a grid object and stays silent for an object of the project`, async() => {
      const found = await entriesOf(id, `${HEAD}${positive}\n`);
      const ignored = await entriesOf(id, `${HEAD}${negative}\n`);

      assert.equal(found.length >= 1, true, 'the grid object is reported');
      assert.deepEqual(ignored, [], 'the object of the project is not');
    });
  }
});
