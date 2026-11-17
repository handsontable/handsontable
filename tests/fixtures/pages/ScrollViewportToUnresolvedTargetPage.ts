import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * The ways the fixture grid can be made to have no row or column to scroll to.
 */
export type UnresolvedScenario =
  | 'row-out-of-range'
  | 'column-out-of-range'
  | 'all-rows-hidden'
  | 'all-columns-hidden'
  | 'zero-rows'
  | 'all-rows-trimmed';

/**
 * The way a probe passes the target: the options object, or the options object with hidden indexes left out of
 * the lookup (`considerHiddenIndexes: false`). The positional arguments form takes no callback (its second
 * argument is the column), so it is not a form of this call.
 */
export type CallForm = 'options' | 'options-without-hidden-indexes';

/**
 * What a probe read after the `scrollViewportTo()` call it made.
 */
export interface ProbeState {
  /**
   * How many times the callback ran.
   */
  calls: number;

  /**
   * How many times the callback had run when `scrollViewportTo()` returned. It stays 0 while the callback
   * is deferred to a microtask.
   */
  callsWhenCallReturned: number;

  /**
   * How many `afterScroll` listeners the call left registered, compared with before the call.
   */
  leakedListeners: number;

  /**
   * What `scrollViewportTo()` returned.
   */
  returned: boolean;
}

/**
 * Page Object for the grid that `scrollViewportTo()` is called on with a callback and a target that cannot
 * be resolved.
 */
export class ScrollViewportToUnresolvedTargetPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/scroll-viewport-to-unresolved-target.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Put the grid into `scenario`, then call `scrollViewportTo(target, callback)` with a counting callback.
   * The count and the listener difference are kept in the page, and read back with `readProbe()`.
   */
  async callWithUnresolvedTarget(
    scenario: UnresolvedScenario | 'no-target' | 'resolvable-target',
    target: { row?: number, col?: number },
    form: CallForm = 'options',
  ): Promise<void> {
    await this.page.evaluate(([name, options, callForm]) => {
      const win = window as any;
      const hot = win.hot;

      switch (name) {
        case 'all-rows-hidden':
          hot.getPlugin('hiddenRows').hideRows(Array.from({ length: hot.countRows() }, (_, index) => index));
          hot.render();
          break;
        case 'all-columns-hidden':
          hot.getPlugin('hiddenColumns').hideColumns(Array.from({ length: hot.countCols() }, (_, index) => index));
          hot.render();
          break;
        case 'zero-rows':
          win.htSavedData = hot.getSourceData();
          hot.loadData([]);
          break;
        case 'all-rows-trimmed':
          hot.getPlugin('trimRows').trimRows(Array.from({ length: hot.countRows() }, (_, index) => index));
          hot.render();
          break;
        default:
          break;
      }

      // The bucket keeps each hook as a linked list, so the listeners are counted by walking it.
      const countListeners = () => {
        let count = 0;
        let entry = win.Handsontable.hooks.getBucket(hot).getList('afterScroll')?.head ?? null;

        while (entry) {
          count += 1;
          entry = entry.next;
        }

        return count;
      };
      const listenersBefore = countListeners();
      const probe = { calls: 0, callsWhenCallReturned: 0, leakedListeners: 0, returned: false };
      const callback = () => {
        probe.calls += 1;
      };

      win.htProbe = probe;

      if (callForm === 'options-without-hidden-indexes') {
        probe.returned = hot.scrollViewportTo({ ...options, considerHiddenIndexes: false }, callback);
      } else {
        probe.returned = hot.scrollViewportTo(options, callback);
      }

      probe.callsWhenCallReturned = probe.calls;

      // The listener count is read right after the call: the callback is cleaned up synchronously or not
      // at all, so no wait is needed to tell the two apart.
      probe.leakedListeners = countListeners() - listenersBefore;
    }, [scenario, target, form] as const);
  }

  /**
   * Read what the last `callWithUnresolvedTarget()` recorded so far.
   */
  async readProbe(): Promise<ProbeState> {
    return this.page.evaluate(() => ({ ...(window as any).htProbe }));
  }

  /**
   * Undo the scenario, then make a scroll the probe did not ask for and wait until its `afterScroll` has run.
   * A callback that was left registered runs on it.
   */
  async restoreAndScrollUnrelated(scenario: UnresolvedScenario | 'no-target' | 'resolvable-target'): Promise<void> {
    await this.page.evaluate(async(name) => {
      const win = window as any;
      const hot = win.hot;

      switch (name) {
        case 'all-rows-hidden':
          hot.getPlugin('hiddenRows').showRows(Array.from({ length: hot.countRows() }, (_, index) => index));
          break;
        case 'all-columns-hidden':
          hot.getPlugin('hiddenColumns').showColumns(Array.from({ length: hot.countCols() }, (_, index) => index));
          break;
        case 'zero-rows':
          hot.loadData(win.htSavedData);
          break;
        case 'all-rows-trimmed':
          hot.getPlugin('trimRows').untrimAll();
          break;
        default:
          break;
      }

      hot.render();

      await new Promise<void>((resolve) => {
        hot.addHookOnce('afterScroll', () => resolve());
        hot.scrollViewportTo({ row: 150, col: 10 });
      });
    }, scenario);
  }
}
