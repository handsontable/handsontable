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
   * On the input's next keyup, calls the named selection method once.
   * `changeListener: false` is passed as the trailing argument. Omitting it calls the method
   * the way existing code does, with no extra argument.
   *
   * @param method Which selection method the keyup calls.
   * @param changeListener Pass `false` to opt out of moving focus. Omit it for the default call.
   */
  async armSelectionOnFirstKeyup(method: SelectionMethod, changeListener?: false): Promise<void> {
    await this.page.evaluate(({ method: selectionMethod, changeListener: listen }) => {
      const input = document.querySelector('[data-testid="ext"]');

      if (!(input instanceof HTMLInputElement)) {
        throw new Error('External input is missing');
      }

      const onKeyUp = () => {
        input.removeEventListener('keyup', onKeyUp);

        if (selectionMethod === 'selectRows') {
          if (listen === false) {
            window.hot.selectRows(2, undefined, undefined, false);
          } else {
            window.hot.selectRows(2);
          }
        } else if (selectionMethod === 'selectColumns') {
          if (listen === false) {
            window.hot.selectColumns(1, undefined, undefined, false);
          } else {
            window.hot.selectColumns(1);
          }
        } else if (listen === false) {
          window.hot.selectAll(undefined, undefined, undefined, false);
        } else {
          window.hot.selectAll();
        }
      };

      input.addEventListener('keyup', onKeyUp);
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
