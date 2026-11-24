import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import {
  ALL_XLSX_TOKENS, CORE_ONLY_KEY, keyWithTier, INVALID_KEY,
} from '../fixtures/xlsxLicenseKeys';
import {
  featuresMissingFrom, manifestTiers, requiredTierWithEvery,
} from '../fixtures/licenseTiers';

/**
 * The keys name the build's real tier, read from `dist/manifest.json` when a test runs. DataGrid has a single
 * tier, `professional`, that unlocks every feature (DEV-4198), so no real key can leave one xlsx feature out, and the
 * fixture cannot add a made-up tier to the bundle's XLSX tier table, as `license-capabilities.html` does for
 * plugins. The cases that need a partial tier live in the unit suite, which builds keys with made-up tiers: the
 * export refused and the menu item hidden without xlsx:export
 * (`handsontable/src/plugins/exportFile/__tests__/exportFile.unit.js`), and the parts and warnings without
 * xlsx:formulas or xlsx:layout (`handsontable/src/plugins/exportFile/__tests__/xlsxLicenseGates.unit.js`).
 */
test.describe('Export entry gate (xlsx:export)', { tag: BUNDLES_TAG }, () => {
  test('shows To Excel for an unrestricted key and for a key naming any tier that lists xlsx:export', async({
    page, theme, bundle,
  }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);
    const exportTiers = manifestTiers().filter(tier => featuresMissingFrom(tier, ['xlsx:export']).length === 0);

    expect(exportTiers.length).toBeGreaterThan(0);

    await lic.goto();

    // The menu is opened with a right click, so the key must not lock the grid: INVALID_KEY restricts
    // nothing either, but its lock screen covers the cell.
    for (const key of [CORE_ONLY_KEY, ...exportTiers.map(tier => keyWithTier([tier]))]) {
      await lic.create(key);
      expect(await lic.exportMenuItems()).toEqual(['To CSV', 'To Excel']);
      expect((await lic.exportBytes()).length).toBeGreaterThan(0);
    }
  });
});

/**
 * Every part a token gates, asked for: the column headers (their fill), the hidden Region column
 * written hidden, live formulas, and a conditional formatting rule over the Amount column.
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
 * A made-up sheet password. Tests compare it inside `toBe(true)`/`toBe(false)` assertions, so a
 * failure never prints it.
 */
const PASSWORD = 'q4-budget';
const PASSWORD_OPTIONS = { protection: { password: PASSWORD } };

/**
 * The export's missing-token warnings logged since the last `create()`.
 */
async function licenseWarnings(lic: XlsxLicensePage): Promise<string[]> {
  return (await lic.warnings()).filter(message => message.startsWith('The xlsx export skipped'));
}

for (const engine of ['native', 'exceljs'] as const) {
  test.describe(`xlsx export license gates (${engine})`, { tag: BUNDLES_TAG }, () => {
    // Compared on the built-in engine only, whose output carries nothing but the content.
    if (engine === 'native') {
      test('a tier that lists every xlsx feature writes the same sheet as an invalid key', async({ page, theme, bundle }) => {
        const lic = new XlsxLicensePage(page, theme, bundle, engine);
        const tier = requiredTierWithEvery(ALL_XLSX_TOKENS);

        await lic.goto();
        await lic.create(keyWithTier([tier]));

        const full = lic.sheetXml(await lic.exportBytes(EXPORT_OPTIONS));

        expect(await licenseWarnings(lic)).toEqual([]);

        await lic.create(INVALID_KEY);

        expect(lic.sheetXml(await lic.exportBytes(EXPORT_OPTIONS))).toBe(full);
      });
    }

    test('a password writes a SHA-512 sheet protection with a fresh salt', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(CORE_ONLY_KEY);

      const first = lic.sheetXml(await lic.exportBytes(PASSWORD_OPTIONS));
      const second = lic.sheetXml(await lic.exportBytes(PASSWORD_OPTIONS));
      const salt = (xml: string) => xml.match(/<sheetProtection[^>]*saltValue="([^"]+)"/)?.[1];

      expect(first).toMatch(/<sheetProtection[^>]*algorithmName="SHA-512"/);
      expect(first).toMatch(/<sheetProtection[^>]*spinCount="100000"/);
      expect(first).toMatch(/<sheetProtection[^>]*hashValue="[^"]+"/);
      expect(salt(first)).toBeTruthy();
      expect(salt(first)).not.toBe(salt(second));
      // Only the hash reaches the file.
      expect(first.includes(PASSWORD)).toBe(false);

      // Without the option the sheet is protected with no password, as before.
      expect(lic.sheetXml(await lic.exportBytes())).not.toMatch(/<sheetProtection[^>]*hashValue=/);
    });

    test('protection: null writes no sheetProtection and no locked cell', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(CORE_ONLY_KEY);

      const workbook = await lic.exportWorkbook({ protection: null });

      expect(lic.sheetXml(await lic.exportBytes({ protection: null }))).not.toContain('<sheetProtection');
      expect(workbook.worksheets[0].getCell('A1').protection?.locked).not.toBe(true);
    });

    test('a non-string password rejects the export without naming the value', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(CORE_ONLY_KEY);

      const error = await lic.exportBytes({ protection: { password: 1234 } }).then(() => null, (e: Error) => e);

      expect(error?.message).toContain('ExportFile: the "protection.password" option has to be a string.');
      // The message also carries the throw site's stack frames, and a line number in the bundle can hold
      // those digits (`handsontable.js:111234:46`). Only the first line is the library's own text.
      expect(error?.message.split('\n')[0]).not.toContain('1234');
    });

    test('a password-protected file imports its locked cells as read-only and reports sheetProtection:password',
      async({ page, theme, bundle }) => {
        const lic = new XlsxLicensePage(page, theme, bundle, engine);

        await lic.goto();
        await lic.create(CORE_ONLY_KEY);

        const result = await lic.importBytes(await lic.exportBytes(PASSWORD_OPTIONS));
        const cellsMeta = (result.cellsMeta ?? []) as { row: number; col: number; meta: Record<string, unknown> }[];

        // The fixture's read-only cell is A1 (no header row is exported here).
        expect(cellsMeta.some(({ row, col, meta }) => row === 0 && col === 0 && meta.readOnly === true)).toBe(true);
        expect(cellsMeta.some(({ row, col, meta }) => row === 1 && col === 0 && meta.readOnly === true)).toBe(false);
        expect(result.dropped).toContain('sheetProtection:password');
        expect(JSON.stringify(result).includes(PASSWORD)).toBe(false);
        expect((await lic.warnings()).some(message => message.includes(PASSWORD))).toBe(false);
      });

    // DEV-4198: DataGrid has a single tier, `professional`, so no real key can leave one xlsx feature out. A key that
    // names only a tier the build does not list (the removed `standard`) unlocks nothing: the plugin is off, so the export is
    // refused. The partial-tier cases (parts left out, the warning, the password) live in the unit suite, which
    // builds keys with made-up tiers.
    test('a key that names only the removed tier "standard" refuses the export', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWithTier(['standard']));

      await expect(lic.exportBytes(EXPORT_OPTIONS)).rejects.toThrow('does not include these features: Export to file (feat:export_file)');
    });
  });
}
