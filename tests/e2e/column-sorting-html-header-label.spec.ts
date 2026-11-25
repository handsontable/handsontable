import { test, expect, THEMES_TAG } from '../fixtures/test';
import { ColumnSortingPointerCancellationPage } from '../fixtures/pages/ColumnSortingPointerCancellationPage';

/**
 * A header label may carry markup (`colHeaders: ['<b>Age</b> in <i>years</i>']`). A click anywhere on a
 * sortable label sorts, not only on the bare text of `span.colHeader`. Markup that handles a press on
 * its own (a link, a button, a form field) keeps doing that and does not sort.
 *
 * The second column's label is `<b>Age</b> in <i>years</i>`.
 */
test.describe('column sorting: HTML inside a header label', { tag: THEMES_TAG }, () => {
  const AGE = 'Age in years';
  const LABELS = ['A', '<b>Age</b> in <i>years</i>', 'C', 'D'];

  /**
   * Markup that handles a press itself, each followed by a plain `<b>` that does not. The `<b>` is the
   * positive control: the same label still sorts from there.
   */
  const INTERACTIVE_MARKUP = [
    ['a link', '<a href="#top">link</a>', 'a'],
    ['an anchor without `href`', '<a>anchor</a>', 'a'],
    ['a button', '<button type="button">button</button>', 'button'],
    ['a label', '<label>label</label>', 'label'],
    ['an element with a button role', '<span role="button">role</span>', '[role="button"]'],
    ['a text field', '<input type="text" value="field" size="4">', 'input'],
  ] as const;

  for (const variant of ['column', 'multi'] as const) {
    test.describe(`${variant} sorting`, () => {
      let grid: ColumnSortingPointerCancellationPage;

      test.beforeEach(async({ page, theme, bundle }) => {
        grid = new ColumnSortingPointerCancellationPage(page, theme, bundle);
        await grid.goto(variant);
        await grid.setColHeaders(LABELS);
        await expect(grid.sortLabel(AGE).locator('b')).toBeVisible();
      });

      test('a click on the bold part of the label sorts, a click on the italic part reverses it', async() => {
        await grid.clickOn(grid.sortLabel(AGE).locator('b'));

        await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);

        await grid.clickOn(grid.sortLabel(AGE).locator('i'));

        await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
        expect(await grid.sortCount()).toBe(2);
      });

      test('a click on the plain text of the label still sorts', async() => {
        await grid.clickOn(grid.sortLabel('D'));

        await expect.poll(() => grid.sortConfig()).toEqual([{ column: 3, sortOrder: 'asc' }]);
      });

      for (const [description, markup, selector] of INTERACTIVE_MARKUP) {
        test(`a press on ${description} inside the label does not sort, the bold text next to it does`, async() => {
          await grid.setColHeaders(['A', `${markup} <b>plain</b>`, 'C', 'D']);

          const label = grid.headerOverlay.locator('span.colHeader', { has: grid.page.locator('b', { hasText: 'plain' }) });

          await expect(label.locator('b')).toBeVisible();

          await grid.clickOn(label.locator(selector));

          expect(await grid.sortCount()).toBe(0);
          expect(await grid.sortConfig()).toEqual([]);

          await grid.clickOn(label.locator('b'));

          await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
        });
      }

      test('with `headerAction: false` a click on the markup does not sort, and does once it is on again', async() => {
        const key = variant === 'multi' ? 'multiColumnSorting' : 'columnSorting';

        await grid.page.evaluate((pluginKey) => {
          (window as unknown as { hot: any }).hot.updateSettings({ [pluginKey]: { headerAction: false } });
        }, key);

        await grid.clickOn(grid.sortLabel(AGE).locator('b'));

        expect(await grid.sortCount()).toBe(0);
        expect(await grid.sortConfig()).toEqual([]);

        await grid.page.evaluate((pluginKey) => {
          (window as unknown as { hot: any }).hot.updateSettings({ [pluginKey]: { headerAction: true } });
        }, key);

        await grid.clickOn(grid.sortLabel(AGE).locator('b'));

        await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
      });

      test('a host element with the class `colHeader` around the grid does not make the header padding sort', async() => {
        // A header cell carries `tabindex="-1"`, and the gate stops at any element with a `tabindex`. That would
        // end the press early for another reason, so the attribute is dropped to leave the label match alone.
        await grid.page.evaluate(() => {
          const host = document.getElementById('grid-host')!;

          host.classList.add('colHeader');
          host.querySelectorAll('[tabindex]').forEach(element => element.removeAttribute('tabindex'));
        });

        // The corner of the header cell, outside its label.
        await grid.sortLabel('D').locator('xpath=ancestor::th').click({ position: { x: 1, y: 1 } });

        expect(await grid.sortCount()).toBe(0);
        expect(await grid.sortConfig()).toEqual([]);

        await grid.clickOn(grid.sortLabel('D'));

        await expect.poll(() => grid.sortConfig()).toEqual([{ column: 3, sortOrder: 'asc' }]);
      });

      test.describe('touch', () => {
        test.use({ hasTouch: true });

        test('a tap on the bold part of the label sorts', async() => {
          await grid.tapOn(grid.sortLabel(AGE).locator('b'));

          await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
        });
      });
    });
  }

  test.describe('multi sorting with Ctrl', () => {
    let grid: ColumnSortingPointerCancellationPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new ColumnSortingPointerCancellationPage(page, theme, bundle);
      await grid.goto('multi');
      await grid.setColHeaders(LABELS);
      await expect(grid.sortLabel(AGE).locator('b')).toBeVisible();
    });

    test('a Ctrl+click on the markup adds its column to the sort', async({ page }) => {
      await grid.clickOn(grid.sortLabel('D'));
      await expect.poll(() => grid.sortConfig()).toEqual([{ column: 3, sortOrder: 'asc' }]);

      await page.keyboard.down('Control');
      await grid.clickOn(grid.sortLabel(AGE).locator('b'));
      await page.keyboard.up('Control');

      await expect.poll(() => grid.sortConfig()).toEqual([
        { column: 3, sortOrder: 'asc' },
        { column: 1, sortOrder: 'asc' },
      ]);
    });
  });
});
