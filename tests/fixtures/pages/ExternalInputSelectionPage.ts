import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

type SelectionMethod = 'selectRows' | 'selectColumns' | 'selectAll';

interface Highlight {
  row: number;
  col: number;
}

/**
 * Where the browser focus sits after a selection call fired from the external input.
 */
export interface ExternalInputFocusState {
  external: boolean;
  onHighlight: boolean;
  listening: boolean;
  row: number | null;
  col: number | null;
}

/**
 * Page object for a grid with a text field outside it. The field's first keyup calls one
 * selection method, which is the reported way an application highlights a row while the user
 * is still typing.
 */
export class ExternalInputSelectionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly externalInput: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.externalInput = page.getByTestId('ext');
  }

  /**
   * Opens the fixture and waits until the first cell is rendered.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/external-input-selection.html?theme=${this.theme}&bundle=${this.bundle}`,
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Calls one selection method on each of the input's next keyups, then removes the listener.
   * Pass `false` to send `changeListener: false` on the first call. `followUp`, when set,
   * runs on the next keyup as a default call.
   *
   * @param method Which selection method the first keyup calls.
   * @param changeListener Pass `false` to opt out of moving focus. Omit it for the default call.
   * @param followUp A second selection method, called on the following keyup without the flag.
   */
  async armSelectionOnFirstKeyup(
    method: SelectionMethod,
    changeListener?: false,
    followUp?: SelectionMethod,
  ): Promise<void> {
    await this.page.evaluate(({ method: selectionMethod, changeListener: listen, followUp: nextMethod }) => {
      const input = document.querySelector('[data-testid="ext"]');

      if (!(input instanceof HTMLInputElement)) {
        throw new Error('External input is missing');
      }

      const call = (name: SelectionMethod, withFalse: boolean) => {
        if (name === 'selectRows') {
          if (withFalse) {
            window.hot.selectRows(2, undefined, undefined, false);
          } else {
            window.hot.selectRows(2);
          }
        } else if (name === 'selectColumns') {
          if (withFalse) {
            window.hot.selectColumns(1, undefined, undefined, false);
          } else {
            window.hot.selectColumns(1);
          }
        } else if (withFalse) {
          window.hot.selectAll(undefined, undefined, undefined, false);
        } else {
          window.hot.selectAll();
        }
      };

      const steps: Array<{ name: SelectionMethod; withFalse: boolean }> = [
        { name: selectionMethod, withFalse: listen === false },
      ];

      if (nextMethod) {
        steps.push({ name: nextMethod, withFalse: false });
      }

      let index = 0;

      const onKeyUp = () => {
        const step = steps[index];

        index += 1;
        call(step.name, step.withFalse);

        if (index >= steps.length) {
          input.removeEventListener('keyup', onKeyUp);
        }
      };

      input.addEventListener('keyup', onKeyUp);
    }, { method, changeListener, followUp });
  }

  /**
   * On the next keyup, calls `selectCells([[0, 0]], true, false)`. An `afterSelection`
   * hook at order -1 then calls `inner` once, with no `changeListener` argument.
   * That inner call fires the hook again, so the hook returns and does not recurse.
   *
   * @param inner Which plain call the hook makes. Defaults to `selectRows`.
   */
  async armSelectCellsWithNestedSelectRows(
    inner: 'selectRows' | 'selectCell' = 'selectRows',
  ): Promise<void> {
    await this.page.evaluate((nestedCall) => {
      const input = document.querySelector('[data-testid="ext"]');

      if (!(input instanceof HTMLInputElement)) {
        throw new Error('External input is missing');
      }

      let nested = false;

      window.hot.addHook('afterSelection', () => {
        if (nested) {
          return;
        }

        nested = true;

        if (nestedCall === 'selectCell') {
          window.hot.selectCell(1, 1);
        } else {
          window.hot.selectRows(2);
        }
      }, -1);

      const onKeyUp = () => {
        input.removeEventListener('keyup', onKeyUp);
        window.hot.selectCells([[0, 0]], true, false);
      };

      input.addEventListener('keyup', onKeyUp);
    }, inner);
  }

  /**
   * Selects inside `batch()`. Pass `false` to call with `changeListener: false`.
   *
   * @param method `selectRows` or `selectCells`.
   * @param changeListener Pass `false` to opt out of moving focus. Omit it for the default call.
   */
  async selectInsideBatch(method: 'selectRows' | 'selectCells', changeListener?: false): Promise<void> {
    await this.page.evaluate(({ method: selectionMethod, changeListener: listen }) => {
      window.hot.batch(() => {
        if (selectionMethod === 'selectRows') {
          if (listen === false) {
            window.hot.selectRows(2, 2, 0, false);
          } else {
            window.hot.selectRows(2);
          }
        } else if (listen === false) {
          window.hot.selectCells([[1, 1]], true, false);
        } else {
          window.hot.selectCells([[1, 1]]);
        }
      });
    }, { method, changeListener });
  }

  /**
   * The current selection, or `null` when nothing is selected.
   */
  async selected(): Promise<number[][] | null> {
    return this.page.evaluate(() => window.hot.getSelected() ?? null);
  }

  /**
   * Whether the external input is focused, whether focus sits on the highlighted cell, and
   * whether the grid is listening for keyboard input.
   */
  async focusState(): Promise<ExternalInputFocusState> {
    return this.page.evaluate(() => {
      const input = document.querySelector('[data-testid="ext"]');
      const highlight: Highlight | undefined = window.hot.getSelectedRangeActive()?.highlight;
      const highlightCell = highlight ? window.hot.getCell(highlight.row, highlight.col, true) : null;

      return {
        external: document.activeElement === input,
        onHighlight: highlightCell !== null && document.activeElement === highlightCell,
        listening: window.hot.isListening(),
        row: highlight?.row ?? null,
        col: highlight?.col ?? null,
      };
    });
  }
}
