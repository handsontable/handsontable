import { test, expect } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

/**
 * The sheets bar names the grid after the active sheet and steps aside while the `ariaLabel` or
 * `ariaLabelledby` option names it. Clearing the option (`null` or an empty string) hands the name
 * back to the bar. The bar used to stop watching the root once the option's name appeared, so a
 * cleared option left the treegrid with no name at all.
 */
test.describe('the grid name with the bar and the aria options', () => {
  let fixture: SheetsBarUiPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    fixture = new SheetsBarUiPage(page, theme, bundle);
    await fixture.goto();
    await fixture.addNameElement('report-title', 'Quarterly report');
  });

  test('the bar names the grid after the active sheet', async() => {
    await expect(fixture.grid()).toHaveAccessibleName('Sheet 1');
  });

  test('ariaLabelledby names the grid, and clearing it hands the name back to the bar', async() => {
    await fixture.updateGridSettings({ ariaLabelledby: 'report-title' });

    await expect(fixture.grid()).toHaveAccessibleName('Quarterly report');

    await fixture.updateGridSettings({ ariaLabelledby: null });

    await expect(fixture.grid()).toHaveAccessibleName('Sheet 1');
  });

  test('ariaLabel names the grid, and an empty string hands the name back to the bar', async() => {
    await fixture.updateGridSettings({ ariaLabel: 'Budget' });

    await expect(fixture.grid()).toHaveAccessibleName('Budget');

    await fixture.updateGridSettings({ ariaLabel: '' });

    await expect(fixture.grid()).toHaveAccessibleName('Sheet 1');
  });

  test('after the option is cleared a sheet switch names the grid after the new sheet', async() => {
    await fixture.updateGridSettings({ ariaLabelledby: 'report-title' });
    await expect(fixture.grid()).toHaveAccessibleName('Quarterly report');
    await fixture.updateGridSettings({ ariaLabelledby: null });
    await expect(fixture.grid()).toHaveAccessibleName('Sheet 1');

    await fixture.tab(1).click();

    await expect(fixture.grid()).toHaveAccessibleName('Sheet 2');
  });
});
