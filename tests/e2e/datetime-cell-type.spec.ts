import { test, expect } from '../fixtures/test';
import { DatetimePage } from '../fixtures/pages/DatetimePage';

/**
 * Functional E2E for the intl-datetime cell type: Intl-formatted rendering,
 * the native datetime-local editor (raw ISO value + showPicker), commit
 * round-trip, chronological column sorting, and the datetime filter
 * conditions. The clock is pinned so the fixture's "today" row and the
 * "Today" filter condition are deterministic.
 */
test.describe('intl-datetime cell type', () => {
  let datetimeGrid: DatetimePage;

  test.beforeEach(async ({ page, theme }) => {
    await page.clock.install({ time: new Date('2025-05-05T12:00:00') });

    datetimeGrid = new DatetimePage(page, theme);
    await datetimeGrid.goto();
  });

  test('renders ISO source data formatted via Intl.DateTimeFormat', async () => {
    await expect(datetimeGrid.cell(0, 1)).toHaveText('06/10/2024, 14:30:45');
    await expect(datetimeGrid.cell(4, 1)).toHaveText('05/05/2025, 08:00:15');
  });

  test('opens a native datetime-local editor seeded with the raw ISO source value', async () => {
    await datetimeGrid.stubNativePicker();
    await datetimeGrid.openEditor(0, 1);

    await expect(datetimeGrid.editorInput).toHaveValue('2024-06-10T14:30:45');
    expect(await datetimeGrid.nativePickerCalls()).toBeGreaterThan(0);
  });

  test('commits an edited datetime and renders it formatted', async () => {
    await datetimeGrid.stubNativePicker();
    await datetimeGrid.editCell(2, 1, '2024-12-25T10:15:30');

    await expect(datetimeGrid.cell(2, 1)).toHaveText('12/25/2024, 10:15:30');
  });

  test('sorts the column chronologically on header click', async () => {
    await datetimeGrid.sortByColumn('Start');

    await expect(datetimeGrid.cell(0, 0)).toHaveText('Kickoff');
    await expect(datetimeGrid.cell(0, 1)).toHaveText('01/05/2024, 09:00:30');

    await datetimeGrid.sortByColumn('Start');

    await expect(datetimeGrid.cell(0, 0)).toHaveText('Standup');
    await expect(datetimeGrid.cell(0, 1)).toHaveText('05/05/2025, 08:00:15');
  });

  test('filters with the datetime "Today" condition regardless of the time part', async () => {
    await datetimeGrid.openDropdownMenu('Start');
    await datetimeGrid.applyFilterCondition('Today');

    await expect(datetimeGrid.rowLocator()).toHaveCount(1);
    await expect(datetimeGrid.cell(0, 0)).toHaveText('Standup');
  });
});
