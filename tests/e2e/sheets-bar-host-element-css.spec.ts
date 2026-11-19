import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * The sheets bar's rename field and all-sheets menu keep their size under host element rules.
 *
 * A host page's bare `span {}` and `input {}` rules (specificity (0,0,1)) reach every span and
 * input the bar renders. The rename field and the menu's name and check-mark spans must declare
 * the box properties such a rule could set, so the bar and the menu render at the size they have
 * on a page without the rule.
 */
const HOSTILE_HOST_CSS = `
  span { padding: 12px; line-height: 40px; border: 2px solid red; margin: 6px; }
  input { height: 40px; min-height: 40px; padding: 10px; margin: 6px; border: 2px solid red; }
`;

test.describe('Sheets bar under host element rules', { tag: THEMES_TAG }, () => {
  test('the rename field keeps its height under host `input` and `span` rules', async({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const clean = await bar.renameGeometry(0);

    await page.keyboard.press('Escape');
    await expect(bar.renameInput).toHaveCount(0);

    await bar.addHostStyles(HOSTILE_HOST_CSS);

    const hostile = await bar.renameGeometry(0);

    expect(hostile).toEqual(clean);
  });

  test('the all-sheets menu keeps its row heights under a host `span` rule', async({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const clean = await bar.allSheetsMenuGeometry();

    expect(clean.rows.length).toBeGreaterThan(1);

    await page.keyboard.press('Escape');
    await expect(bar.allSheetsMenu).toHaveCount(0);

    await bar.addHostStyles(HOSTILE_HOST_CSS);

    const hostile = await bar.allSheetsMenuGeometry();

    expect(hostile).toEqual(clean);
  });
});
