import { type Locator, type Page, type CDPSession } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { CollapsibleColumnsA11yPage } from '../fixtures/pages/CollapsibleColumnsA11yPage';
import { NestedRowsPage } from '../fixtures/pages/NestedRowsPage';
import { CheckboxHeaderPage } from '../fixtures/pages/CheckboxHeaderPage';
import { RowSelectionPage } from '../fixtures/pages/RowSelectionPage';
import {
  PointerCancellationTogglesPage,
  type PointerCancellationVariant,
} from '../fixtures/pages/PointerCancellationTogglesPage';

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
 * The clock the long-press cases start from. The grid's timers run on it, so the 500 ms hold is driven by
 * `page.clock` instead of waited out.
 */
const CLOCK_START = new Date('2026-08-28T10:00:00Z');
/**
 * Longer than the grid's long-press delay, so the hold has run out.
 */
const LONG_PRESS_HOLD_MS = 700;

/**
 * Puts a finger down, or lifts it, through the Chrome DevTools Protocol, which `page.touchscreen` cannot do
 * (it only taps).
 */
async function touch(cdp: CDPSession, type: 'touchStart' | 'touchEnd', point?: { x: number; y: number }) {
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: point ? [{ x: point.x, y: point.y, radiusX: 4, radiusY: 4, force: 1, id: 1 }] : [],
  });
}

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

        // The long press is replayed as a press while the finger is still down, so a control that acts on the
        // release must ignore it. The tap above is the positive control: the same control does toggle.
        test('a long press toggles nothing, while the finger is down or after it is lifted',
          async({ page, theme, bundle }) => {
            await page.clock.install({ time: CLOCK_START });

            const { control, state, selection } = await open(page, theme, bundle);

            await page.clock.pauseAt(CLOCK_START.getTime() + 60_000);

            const initial = await state();
            const initialSelection = await selection();
            const point = await centerOf(control);
            const cdp = await page.context().newCDPSession(page);

            // The positive control: the hold did replay the press to the plugins, which then left it alone.
            await page.evaluate(() => {
              const win = window as unknown as { hot: { addHook(name: string, callback: () => void): void } };

              (window as unknown as { replayedPresses: number }).replayedPresses = 0;
              win.hot.addHook('beforeOnCellMouseDown', () => {
                (window as unknown as { replayedPresses: number }).replayedPresses += 1;
              });
            });
            await touch(cdp, 'touchStart', point);
            await page.clock.runFor(LONG_PRESS_HOLD_MS);

            expect(await page.evaluate(() => (window as unknown as { replayedPresses: number }).replayedPresses))
              .toBe(1);
            expect(await state()).toEqual(initial);
            expect(await selection()).toEqual(initialSelection);

            await touch(cdp, 'touchEnd');
            await page.clock.runFor(LONG_PRESS_HOLD_MS);

            expect(await state()).toEqual(initial);
            expect(await selection()).toEqual(initialSelection);

            await cdp.detach();
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

/**
 * The same controls in the layouts that move them: a right to left grid, frozen columns (the headers and
 * checkboxes are drawn by overlay clones, and the user presses the clone's copy), and a grid inside a shadow
 * root, where `event.target` is retargeted to the host.
 */
const LAYOUTS: PointerCancellationVariant[] = ['rtl', 'frozen', 'shadow'];

interface LayoutControl {
  name: string;
  control(grid: PointerCancellationTogglesPage): Locator;
  state(grid: PointerCancellationTogglesPage): Promise<unknown>;
  toggled: unknown;
}

const LAYOUT_CONTROLS: LayoutControl[] = [
  {
    name: 'collapse indicator',
    control: grid => grid.groupIndicator(),
    state: grid => grid.collapsedColumns(),
    toggled: [3, 4],
  },
  {
    name: 'Done column header checkbox',
    control: grid => grid.doneHeaderCheckbox(),
    state: grid => grid.doneValues(),
    toggled: [true, true, true, true, true, true],
  },
  {
    name: 'row checkbox',
    control: grid => grid.rowCheckbox(1),
    state: grid => grid.selectedRows(),
    toggled: [1],
  },
  {
    name: '"select all" checkbox',
    control: grid => grid.selectAllCheckbox(),
    state: grid => grid.selectedRows(),
    toggled: [0, 1, 2, 3, 4, 5],
  },
];

test.describe('Toggle controls and pointer cancellation in other layouts', { tag: THEMES_TAG }, () => {
  for (const variant of LAYOUTS) {
    for (const { name, control, state, toggled } of LAYOUT_CONTROLS) {
      test(`${name}: does nothing on the press alone and toggles on the release over it (${variant})`,
        async({ page, theme, bundle }) => {
          const grid = new PointerCancellationTogglesPage(page, theme, bundle, variant);

          await grid.goto();

          const initial = await state(grid);
          const initialSelection = await grid.cellSelection();

          await pressOn(page, control(grid));

          expect(await state(grid)).toEqual(initial);
          expect(await grid.cellSelection()).toEqual(initialSelection);

          await page.mouse.up();

          await expect.poll(() => state(grid)).toEqual(toggled);
          expect(await grid.cellSelection()).toEqual(initialSelection);
        });

      test(`${name}: is cancelled when the pointer is released over a cell or outside the grid (${variant})`,
        async({ page, theme, bundle }) => {
          const grid = new PointerCancellationTogglesPage(page, theme, bundle, variant);

          await grid.goto();

          const initial = await state(grid);

          await pressOn(page, control(grid));
          await releaseOn(page, grid.cell(2, 3));

          expect(await state(grid)).toEqual(initial);

          await pressOn(page, control(grid));
          await releaseOutsideGrid(page);

          expect(await state(grid)).toEqual(initial);

          // The cancelled presses left nothing armed: the next click works.
          await control(grid).click();

          await expect.poll(() => state(grid)).toEqual(toggled);
        });
    }
  }
});
