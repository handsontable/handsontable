import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { EmptyDataStateShortcutsPage } from '../fixtures/pages/EmptyDataStateShortcutsPage';

/**
 * The empty data state's message is a tab stop when it has no buttons: Tab from the column headers
 * lands on `div.ht-empty-data-state__content-wrapper-inner`. That `div` had no role and no name, so the
 * accessibility tree gave a screen reader nothing to say about the focused element (NVDA with Firefox
 * read only `section`, VoiceOver with WebKit read the title and dropped the description). The element is
 * now a group named by the title and the description together, for the no-data message and the loading
 * message alike. Both are in the name because a description is not read on arrival by every reader.
 */
test.describe('the empty data state message that takes the focus', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: EmptyDataStateShortcutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EmptyDataStateShortcutsPage(page, theme, bundle);
    await grid.goto();
  });

  test('is a group named by the title and the description', async() => {
    await grid.loadEmptyDataAndLeaveFocus();

    await expect(grid.messageTarget).toHaveAttribute('role', 'group');
    await expect(grid.messageTarget).toHaveAccessibleName('No data available There\u2019s nothing to display yet.');
  });

  test('is reached by the keyboard with that role and name', async({ page }) => {
    await grid.loadEmptyDataAndLeaveFocus();
    await grid.focusMessageWithTab();

    await expect(grid.messageTarget).toBeFocused();
    await expect(page.getByRole('group', { name: /^No data available/ })).toBeFocused();
  });

  test('keeps the role, the name and the busy state while it shows the loading message', async() => {
    await grid.startDataProviderFetch();

    await expect(grid.messageTarget).toHaveAttribute('role', 'group');
    await expect(grid.messageTarget).toHaveAttribute('aria-busy', 'true');
    await expect(grid.messageTitle).not.toHaveText('');
    await expect(grid.messageTarget).toHaveAccessibleName(
      `${await grid.messageTitle.textContent()} ${await grid.messageDescription.textContent()}`);
  });

  test('names itself by the ids of its own title and description', async() => {
    await grid.loadEmptyDataAndLeaveFocus();

    const titleId = await grid.messageTitle.getAttribute('id');
    const descriptionId = await grid.messageDescription.getAttribute('id');

    expect(titleId, 'the title carries an id').toBeTruthy();
    expect(descriptionId, 'the description carries an id').toBeTruthy();
    expect(titleId).not.toBe(descriptionId);
    await expect(grid.messageTarget).toHaveAttribute('aria-labelledby', `${titleId} ${descriptionId}`);
  });
});
