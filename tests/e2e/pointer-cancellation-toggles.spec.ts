import { type Locator, type Page } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { CollapsibleColumnsA11yPage } from '../fixtures/pages/CollapsibleColumnsA11yPage';
import { NestedRowsPage } from '../fixtures/pages/NestedRowsPage';
import { CheckboxHeaderPage } from '../fixtures/pages/CheckboxHeaderPage';
import { RowSelectionPage } from '../fixtures/pages/RowSelectionPage';

/**
 * WCAG 2.5.2 Pointer Cancellation for the controls that toggle something: the collapse indicator of a
 * column group, the collapse button of a nested row, the header checkbox of a checkbox column, and the
 * "select all" and row checkboxes of the row selection. A press claims the control, and the action runs
 * when the pointer is released over the same control, so moving off it before letting go cancels it.
 *
 * Every case drives the raw mouse (`down`, `move`, `up`), because `click()` presses and releases in one
 * step and cannot tell the two apart.
 */

/**
 * A toggle control under test: how to open its fixture, find it, and read what it changes.
 */
interface Control {
  name: string;
  /**
   * Opens the fixture.
   */
  open(page: Page, theme: string, bundle: string): Promise<ControlHandle>;
}

interface ControlHandle {
  /**
   * The control a press lands on.
   */
  control: Locator;
  /**
   * Somewhere else in the grid, that is not the control.
   */
  elsewhere: Locator;
  /**
   * What the control changes, in a form `toEqual` can compare.
   */
  state(): Promise<unknown>;
  /**
   * The state after one toggle.
   */
  toggled: unknown;
  /**
   * The state after a second toggle, when it is not the initial one (a column of mixed checkboxes
   * first checks them all, then clears them all).
   */
  toggledTwice?: unknown;
  /**
   * The cell selection, which a press on the control must leave alone.
   */
  selection(): Promise<unknown>;
  /**
   * The same toggle from the keyboard, ending with the state `toggled`.
   */
  byKeyboard(): Promise<void>;
}

const CONTROLS: Control[] = [
  {
    name: 'collapsible column indicator',
    async open(page, theme, bundle) {
      const grid = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await grid.goto({ navigableHeaders: 'off' });

      return {
        control: grid.indicator('Sub 1'),
        elsewhere: grid.cell(1, 3),
        state: () => grid.hiddenColumns(),
        toggled: [2],
        selection: () => grid.selectedCell(),
        async byKeyboard() {
          await grid.clickCell(1, 1);
          await page.keyboard.press('Shift+Alt+ArrowUp');
        },
      };
    },
  },
  {
    name: 'nested rows collapse button',
    async open(page, theme, bundle) {
      const grid = new NestedRowsPage(page, theme, bundle);

      await grid.goto();

      return {
        control: grid.collapseButton(0),
        elsewhere: grid.cell(2, 0),
        state: () => grid.collapsedParents(),
        toggled: [0],
        selection: () => grid.selectedRange(),
        async byKeyboard() {
          await grid.selectCell(0, 0);
          await page.keyboard.press('Shift+Alt+ArrowLeft');
        },
      };
    },
  },
  {
    name: 'checkbox column header checkbox',
    async open(page, theme, bundle) {
      const grid = new CheckboxHeaderPage(page, theme, bundle);

      await grid.goto();

      return {
        control: grid.headerCheckbox(),
        elsewhere: grid.cell(1, 0),
        state: () => grid.doneValues(),
        toggled: [true, true, false, true, true, true],
        toggledTwice: [false, false, false, false, false, false],
        selection: () => grid.cellSelection(),
        async byKeyboard() {
          await grid.cell(0, 0).click();
          await page.keyboard.press('ArrowUp');
          await page.keyboard.press('ArrowRight');
          await page.keyboard.press('Space');
        },
      };
    },
  },
  {
    name: 'row selection "select all" checkbox',
    async open(page, theme, bundle) {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto();

      return {
        control: grid.headerCheckbox(),
        elsewhere: grid.cell(1, 0),
        state: () => grid.selectedRows(),
        toggled: [0, 1, 2, 4, 5, 6, 7],
        selection: () => grid.cellSelection(),
        async byKeyboard() {
          await grid.focusCell(-1, -1);
          await page.keyboard.press('Space');
        },
      };
    },
  },
  {
    name: 'row selection row checkbox',
    async open(page, theme, bundle) {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto();

      return {
        control: grid.rowCheckbox(1),
        elsewhere: grid.cell(4, 0),
        state: () => grid.selectedRows(),
        toggled: [1],
        selection: () => grid.cellSelection(),
        async byKeyboard() {
          await grid.focusCell(1, -1);
          await page.keyboard.press('Space');
        },
      };
    },
  },
];

/**
 * The center of a locator's box.
 */
async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  await expect(locator).toBeVisible();

  const box = await locator.boundingBox();

  if (box === null) {
    throw new Error('The element has no bounding box');
  }

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Presses the left mouse button on a locator and holds it.
 */
async function pressOn(page: Page, locator: Locator): Promise<void> {
  const { x, y } = await centerOf(locator);

  await page.mouse.move(x, y);
  await page.mouse.down();
}

/**
 * Moves the held pointer over a locator, and lets go of the button there.
 */
async function releaseOn(page: Page, locator: Locator): Promise<void> {
  const { x, y } = await centerOf(locator);

  await page.mouse.move(x, y, { steps: 5 });
  await page.mouse.up();
}

/**
 * Moves the held pointer to the page margin, outside the grid, and lets go of the button there.
 */
async function releaseOutsideGrid(page: Page): Promise<void> {
  await page.mouse.move(2, 2, { steps: 5 });
  await page.mouse.up();
}

test.describe('Toggle controls and pointer cancellation', { tag: THEMES_TAG }, () => {
  for (const { name, open } of CONTROLS) {
    test.describe(name, () => {
      test('does nothing on the press alone, and toggles when the pointer is released over it',
        async({ page, theme, bundle }) => {
          const { control, state, toggled, selection } = await open(page, theme, bundle);
          const initial = await state();
          const initialSelection = await selection();

          await pressOn(page, control);

          // Neither the state nor the cell selection moves while the button is held.
          expect(await state()).toEqual(initial);
          expect(await selection()).toEqual(initialSelection);

          await page.mouse.up();

          await expect.poll(state).toEqual(toggled);
          // The press was claimed: it selected nothing either.
          expect(await selection()).toEqual(initialSelection);
        });

      test('is cancelled when the pointer is released over a cell', async({ page, theme, bundle }) => {
        const { control, elsewhere, state, toggled, selection } = await open(page, theme, bundle);
        const initial = await state();
        const initialSelection = await selection();

        await pressOn(page, control);
        await releaseOn(page, elsewhere);

        expect(await state()).toEqual(initial);
        expect(await selection()).toEqual(initialSelection);

        // The cancelled press left nothing armed: the next click works.
        await control.click();

        await expect.poll(state).toEqual(toggled);
      });

      test('is cancelled when the pointer is released outside the grid', async({ page, theme, bundle }) => {
        const { control, state, toggled, selection } = await open(page, theme, bundle);
        const initial = await state();
        const initialSelection = await selection();

        await pressOn(page, control);
        await releaseOutsideGrid(page);

        expect(await state()).toEqual(initial);
        expect(await selection()).toEqual(initialSelection);

        await control.click();

        await expect.poll(state).toEqual(toggled);
      });

      test('is cancelled by Escape while the button is held', async({ page, theme, bundle }) => {
        const { control, state } = await open(page, theme, bundle);
        const initial = await state();

        await pressOn(page, control);
        await page.keyboard.press('Escape');
        await page.mouse.up();

        expect(await state()).toEqual(initial);
      });

      test('toggles back with a second press and release over it', async({ page, theme, bundle }) => {
        const { control, state, toggled, toggledTwice } = await open(page, theme, bundle);
        const initial = await state();

        await control.click();
        await expect.poll(state).toEqual(toggled);

        await pressOn(page, control);
        expect(await state()).toEqual(toggled);

        await page.mouse.up();
        await expect.poll(state).toEqual(toggledTwice ?? initial);
      });

      test('still toggles from the keyboard', async({ page, theme, bundle }) => {
        const { state, toggled, byKeyboard } = await open(page, theme, bundle);

        await byKeyboard();

        await expect.poll(state).toEqual(toggled);
      });

      test.describe('on a touch screen', () => {
        test.use({ hasTouch: true });

        test('a tap toggles', async({ page, theme, bundle }) => {
          const { control, state, toggled } = await open(page, theme, bundle);

          await control.tap();

          await expect.poll(state).toEqual(toggled);
        });
      });
    });
  }

  test('a row selection Shift+press selects the range at the release, with the Shift key read at the press',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto();
      await grid.rowCheckbox(1).click();
      await expect.poll(() => grid.selectedRows()).toEqual([1]);

      const { x, y } = await centerOf(grid.rowCheckbox(4));

      await page.mouse.move(x, y);
      await page.keyboard.down('Shift');
      await page.mouse.down();
      await page.keyboard.up('Shift');

      expect(await grid.selectedRows()).toEqual([1]);

      await page.mouse.up();

      await expect.poll(() => grid.selectedRows()).toEqual([1, 2, 4]);
    });

  test('a row selection press released over another row checkbox toggles neither', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await pressOn(page, grid.rowCheckbox(1));
    await releaseOn(page, grid.rowCheckbox(2));

    expect(await grid.selectedRows()).toEqual([]);
  });
});
