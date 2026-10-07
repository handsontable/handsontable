import ExcelJS from 'exceljs';
import { test, expect } from '../fixtures/test';
import { awaitBundle } from '../fixtures/bundle';

/**
 * Export > To Excel, driven through the real context menu. The item shows on every grid that sets
 * `exportFile`, and nothing else on any tier clicked it: changing its format to `csv`, or dropping
 * the export options it builds from the selection, passed every other test.
 */
for (const engine of ['exceljs', 'native'] as const) {
  test.describe(`Export > To Excel (${engine})`, () => {
    test('downloads the selected rows as a workbook with the header row and the frozen pane', async ({
      page, theme, bundle,
    }) => {
      await page.goto(`/tests/fixtures/demo/xlsx-export-menu.html?theme=${theme}&bundle=${bundle}&engine=${engine}`);
      await awaitBundle(page);

      // The page loads ExcelJS on both legs, so count the worksheets it creates: the file below is
      // read back the same way whichever engine wrote it, and only this tells the legs apart.
      await page.evaluate(() => {
        const { prototype } = (window as any).ExcelJS.Workbook;
        const addWorksheet = prototype.addWorksheet;

        (window as any).addWorksheetCalls = 0;
        prototype.addWorksheet = function(...args: unknown[]) {
          (window as any).addWorksheetCalls += 1;

          return addWorksheet.apply(this, args);
        };
      });
      await page.evaluate(() => (window as any).hot.selectRows(0, 1));
      // Inside the selection, or the right-click replaces it. Row 1 is frozen, so the cell the user
      // sees is the one in the top overlay clone.
      await page.locator('.ht_clone_top').getByTestId('cell-1-1').click({ button: 'right' });
      await page.locator('.htContextMenu td', { hasText: 'Export' }).hover();

      const toExcel = page.locator('.htContextMenuSub_Export td', { hasText: 'To Excel' });
      const [download] = await Promise.all([page.waitForEvent('download'), toExcel.click()]);

      expect(download.suggestedFilename()).toMatch(/\.xlsx$/);

      const addWorksheetCalls = await page.evaluate(() => (window as any).addWorksheetCalls);

      if (engine === 'exceljs') {
        expect(addWorksheetCalls).toBeGreaterThan(0);
      } else {
        expect(addWorksheetCalls).toBe(0);
      }

      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.readFile(await download.path());

      const sheet = workbook.worksheets[0];

      // The header row and the two selected rows.
      expect(sheet.rowCount).toBe(3);
      expect(sheet.getRow(2).getCell(2).value).toBe('A1');
      // `fixedRowsTop: 4` frozen over a three-row sheet: only the rows the file holds count.
      expect(sheet.views[0]).toEqual(expect.objectContaining({ state: 'frozen', ySplit: 3 }));
    });
  });
}
