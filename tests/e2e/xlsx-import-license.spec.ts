import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import {
  ALL_XLSX_TOKENS, CORE_ONLY_KEY, keyWith, keyWithout, LEGACY_KEY, STANDARD_TOKENS,
} from '../fixtures/xlsxLicenseKeys';

test.describe('xlsx import license gate', { tag: BUNDLES_TAG }, () => {
  test('rejects the import without xlsx:import', async({ page, theme, bundle }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);

    await lic.goto();
    await lic.create(keyWith(['xlsx:export']));

    const bytes = await lic.exportBytes();

    await expect(lic.importBytes(bytes)).rejects.toThrow('does not unlock "xlsx:import"');
  });

  for (const [name, key] of [
    ['a key with xlsx:import', keyWith(['xlsx:import', 'xlsx:export'])],
    ['a key with no xlsx token', CORE_ONLY_KEY],
    ['the legacy key', LEGACY_KEY],
  ] as const) {
    test(`imports with ${name}`, async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle);

      await lic.goto();
      await lic.create(key);

      const result = await lic.importBytes(await lic.exportBytes());

      expect(result.data).toBeTruthy();
    });
  }
});

/**
 * The seven Pro tokens a Standard key lacks, in declaration order.
 */
const PRO_TOKENS = ALL_XLSX_TOKENS.filter(id => !(STANDARD_TOKENS as readonly string[]).includes(id));

/**
 * The tokens that gate a part of an import, every one but the two entry tokens.
 */
const IMPORT_FEATURE_TOKENS = ALL_XLSX_TOKENS.filter(id => id !== 'xlsx:import' && id !== 'xlsx:export');

/**
 * What the workbook is exported with: the header row, the hidden Region column written hidden,
 * live formulas, and a conditional formatting rule over the Amount column.
 */
const EXPORT_OPTIONS = {
  colHeaders: true,
  exportHiddenColumns: 'hide',
  exportFormulas: true,
  conditionalFormatting: [
    { cols: [1, 1], rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: ['1000'], style: {} }] },
  ],
};

/**
 * What the workbook is imported with: the header row promoted, and styles asked for, so the
 * license is the only thing that decides what lands.
 */
const IMPORT_OPTIONS = { colHeaders: 'firstRow', importStyles: true };

/**
 * A second import without styles: the styled cell is then reported as `cellStyles`, an entry of the
 * report that no other token decides, so it shows whether the report reached the result.
 */
const REPORT_OPTIONS = { colHeaders: 'firstRow' };

const LICENSE_WARNING_PREFIX = 'The xlsx import skipped features your license does not unlock: ';

type ImportResult = Record<string, any>;

/**
 * Every meta object of a result: the column-wide ones and the per-cell ones.
 */
function allMeta(result: ImportResult): Record<string, unknown>[] {
  return [
    ...(result.columns ?? []),
    ...(result.cellsMeta ?? []).map((entry: { meta: Record<string, unknown> }) => entry.meta),
  ];
}

/**
 * Reports, per token, whether the part it unlocks reached the import result. `xlsx:formulas` is
 * read on the full bundle only, the one whose target can hold a live formula. `xlsx:number_formats`
 * reports the dated column typed as a date, which no key may take away. `xlsx:import_report` is read
 * from `report`, the result of an import without styles.
 */
function importedFeatures(result: ImportResult, report: ImportResult, bundle: string): Record<string, boolean> {
  const features: Record<string, boolean> = {
    'xlsx:layout': result.mergeCells !== undefined && result.hiddenColumns !== undefined
      && result.colWidths !== undefined,
    'xlsx:number_formats': result.columns?.[2]?.type === 'date',
    'xlsx:comments': result.comments !== undefined,
    'xlsx:import_report': report.dropped.includes('cellStyles'),
    'xlsx:styles': result.styles !== undefined,
    'xlsx:conditional_formatting': result.conditionalFormatting !== undefined,
    'xlsx:data_validation': allMeta(result).some(meta => meta.type === 'dropdown'),
    'xlsx:protection': allMeta(result).some(meta => meta.readOnly === true),
  };

  if (bundle === 'full-min') {
    features['xlsx:formulas'] = result.data.flat().some((value: unknown) => value === '=B1+B2');
  }

  return features;
}

/**
 * Imports `bytes` twice under the current key, with and without styles, and reports the parts
 * that reached the result, plus the result of the styled import.
 */
async function importAndMeasure(
  lic: XlsxLicensePage, bytes: Buffer, bundle: string,
): Promise<{ result: ImportResult; features: Record<string, boolean> }> {
  const result = await lic.importBytes(bytes, IMPORT_OPTIONS);
  const report = await lic.importBytes(bytes, REPORT_OPTIONS);

  return { result, features: importedFeatures(result, report, bundle) };
}

/**
 * Exports the fixture's source grid under the legacy key, so the file carries every part, and
 * returns its bytes.
 */
async function fullWorkbook(lic: XlsxLicensePage): Promise<Buffer> {
  await lic.create(LEGACY_KEY);

  return lic.exportBytes(EXPORT_OPTIONS);
}

for (const engine of ['native', 'exceljs'] as const) {
  test.describe(`xlsx import license feature gates (${engine})`, { tag: BUNDLES_TAG }, () => {
    test('a Standard key imports data with types, formulas and layout only', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();

      const bytes = await fullWorkbook(lic);

      await lic.create(LEGACY_KEY);

      const { result: full, features: fullFeatures } = await importAndMeasure(lic, bytes, bundle);

      // Every part is in the file: proven before a Standard key is asserted to drop it.
      expect(Object.values(fullFeatures).every(Boolean)).toBe(true);

      await lic.create(keyWith(STANDARD_TOKENS));

      const { result: standard, features } = await importAndMeasure(lic, bytes, bundle);

      expect(standard.data.length).toBe(full.data.length);
      expect(features['xlsx:layout']).toBe(true);
      expect(features['xlsx:number_formats']).toBe(true);

      if (bundle === 'full-min') {
        expect(features['xlsx:formulas']).toBe(true);
      }

      for (const token of PRO_TOKENS.filter(id => id !== 'xlsx:number_formats')) {
        expect(features[token], token).toBe(false);
      }

      expect(standard.dropped).toEqual(PRO_TOKENS.map(id => `license:${id}`));

      const warnings = await lic.warnings();

      // One per import call: `importAndMeasure` imports twice.
      expect(warnings.filter(message => message.startsWith(LICENSE_WARNING_PREFIX)))
        .toEqual(Array(2).fill(`${LICENSE_WARNING_PREFIX}${PRO_TOKENS.join(', ')}.`));
      expect(warnings.filter(message => message.includes('xlsx engine dropped features'))).toEqual([]);
    });

    test('each Pro token removes exactly its part', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();

      const bytes = await fullWorkbook(lic);

      for (const token of IMPORT_FEATURE_TOKENS) {
        await lic.create(keyWithout(token));

        const { result, features } = await importAndMeasure(lic, bytes, bundle);
        const expected = Object.fromEntries(Object.keys(features).map(id => [
          id,
          // A missing `xlsx:number_formats` never restricts the import.
          id !== token || id === 'xlsx:number_formats',
        ]));

        expect(features, token).toEqual(expected);
        expect(result.dropped.filter((name: string) => name.startsWith('license:')), token)
          .toEqual([`license:${token}`]);
      }
    });

    test('a full key imports the same result as the legacy key', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();

      const bytes = await fullWorkbook(lic);

      await lic.create(LEGACY_KEY);

      const legacy = await lic.importBytes(bytes, IMPORT_OPTIONS);

      await lic.create(keyWith(ALL_XLSX_TOKENS));

      const full = await lic.importBytes(bytes, IMPORT_OPTIONS);

      expect(full).toEqual(legacy);
      expect((await lic.warnings()).filter(message => message.startsWith(LICENSE_WARNING_PREFIX))).toEqual([]);
    });

    test('importStyles: true on a Standard key yields no styles and a license entry', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();

      const bytes = await fullWorkbook(lic);

      await lic.create(LEGACY_KEY);
      expect((await lic.importBytes(bytes, IMPORT_OPTIONS)).styles).toBeDefined();

      await lic.create(keyWith(STANDARD_TOKENS));

      const result = await lic.importBytes(bytes, IMPORT_OPTIONS);

      expect(result.styles).toBeUndefined();
      expect(result.customBorders).toBeUndefined();
      expect(allMeta(result).some(meta => meta.className !== undefined)).toBe(false);
      expect(result.dropped).toContain('license:xlsx:styles');
      expect(result.dropped).not.toContain('cellStyles');
    });
  });
}
