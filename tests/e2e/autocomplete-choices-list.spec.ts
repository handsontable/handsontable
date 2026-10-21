import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { AutocompleteChoicesListPage } from '../fixtures/pages/AutocompleteChoicesListPage';

const CHOICES = ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white', 'purple', 'lime', 'olive', 'cyan'];

/**
 * How many rows the list shows at once: the default of the `visibleRows` option, the same on every theme.
 * The inner grid draws a twelfth row of these choices too, but only as the buffer row below a sliver of the
 * eleventh: it sits on the edge of the drawn band, so a test does not read it from the DOM (`tests/AGENTS.md`,
 * "Never hardcode a row or column index that sits near the edge of the rendered band"). The list's data holds
 * every choice, and the drawn rows are compared for the ones the user sees.
 */
const VISIBLE_ROWS = 10;

/**
 * The list of choices an autocomplete cell opens: what it holds, in which order, how it marks the text
 * the user typed, and what it does with HTML entries.
 *
 * The list is drawn by the editor's inner grid after a query the editor defers a few milliseconds behind
 * the key press, so every read below is polled until the list answers the query the test sent. Nothing
 * here waits a fixed number of frames. No pixel is read, so one theme stands for all of them; the bundle
 * axis is declared because the full bundle is where this surface has flaked.
 */
test.describe('autocomplete choices list', { tag: BUNDLES_TAG }, () => {
  let grid: AutocompleteChoicesListPage;

  /**
   * One read of the open list: the order of the choices it holds, and the order of the rows it draws first.
   */
  async function listedChoices() {
    const { data, text } = await grid.listState();

    return { data: data.map(([choice]) => choice), drawn: text.slice(0, VISIBLE_ROWS) };
  }

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutocompleteChoicesListPage(page, theme, bundle);
    await grid.goto();
  });

  // A very long list (dev-handsontable#2313) opens: the editor opens and the list draws its rows. How
  // fast it does so is not asserted here, a timing budget belongs to `performance-tests/`; the poll's
  // own timeout is the only bound, and a list that took the page down would not get there.
  test('opens the editor and draws the list when the choice list is very long', async() => {
    // Distinct numbers, in an order that is not sorted, like the random ones the legacy case used.
    const options = Array.from({ length: 25000 }, (_, index) => ((index * 7919) % 25000) / 25000);

    await grid.initGrid({
      data: [[], [], [], [], []],
      columns: [
        {
          type: 'autocomplete',
          source: options,
        },
      ],
    });
    await grid.openEditor(0, 0);

    // One read for both facts: the list is loaded with every option and the inner grid has drawn rows of it.
    await expect.poll(async() => {
      const { rows, drawnRows } = await grid.listSize();

      return { rows, hasDrawnRows: drawnRows > 0 };
    }).toEqual({ rows: options.length, hasDrawnRows: true });
  });

  // With `sortByRelevance: true` the user sees the choices in the order the `source` gives them.
  test('lists the choices in source order when sortByRelevance is true', async() => {
    await grid.initGrid({
      editor: 'autocomplete',
      source: CHOICES,
      sortByRelevance: true,
      height: 1000,
    });
    await grid.openEditor(0, 0);

    await expect.poll(listedChoices).toEqual({ data: CHOICES, drawn: CHOICES.slice(0, VISIBLE_ROWS) });
  });

  // With `sortByRelevance: false` the user sees the choices sorted alphabetically.
  test('lists the choices alphabetically when sortByRelevance is false', async() => {
    const sortedChoices = [...CHOICES].sort();

    await grid.initGrid({
      editor: 'autocomplete',
      source: CHOICES,
      sortByRelevance: false,
      height: 1000,
    });
    await grid.openEditor(0, 0);

    await expect.poll(listedChoices).toEqual({ data: sortedChoices, drawn: sortedChoices.slice(0, VISIBLE_ROWS) });
  });

  test.describe('highlighting the typed phrase', () => {
    test.beforeEach(async() => {
      await grid.useFilteringSource(['Male', 'Female']);
      expect(await grid.dataAt(0, 0)).toBeNull();
      await grid.openEditor(0, 0);
    });

    // Typing `Male` marks the phrase wherever it sits in an entry: all of `Male`, the tail of `Female`.
    test('marks the matching phrase in the listed entries', async() => {
      await grid.type('Male');

      await expect.poll(async() => {
        const { query, html } = await grid.listState();

        return { query, html };
      }).toEqual({ query: 'Male', html: ['<strong>Male</strong>', 'Fe<strong>male</strong>'] });
    });

    // The typed text is a plain phrase, never a regular expression: `M|F` marks nothing, because no entry
    // contains those three characters, even though the filtering source reads it as a pattern that lists
    // both entries. The same list marks a plain phrase right after, so the missing marks are the editor's
    // doing and not a list that cannot mark at all.
    test('does not read the typed text as a regular expression when it highlights', async() => {
      await grid.type('M|F');

      await expect.poll(async() => {
        const { query, text, html } = await grid.listState();

        return { query, text, html };
      }).toEqual({ query: 'M|F', text: ['Male', 'Female'], html: ['Male', 'Female'] });

      await grid.press('Backspace');
      await grid.press('Backspace');

      await expect.poll(async() => {
        const { query, html } = await grid.listState();

        return { query, html };
      }).toEqual({ query: 'M', html: ['<strong>M</strong>ale', 'Fe<strong>m</strong>ale'] });
    });
  });

  test.describe('HTML entries (allowHtml)', () => {
    // With `allowHtml` the list narrows to the entries whose visible text holds what was typed, and the
    // choice the user picks is written to the cell as the markup it is.
    test('lists, narrows and commits HTML entries', async() => {
      await grid.initGrid({
        columns: [
          {
            type: 'autocomplete',
            source: ['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>'],
            allowHtml: true,
          },
        ],
      });
      expect(await grid.dataAt(0, 0)).toBeNull();
      await grid.openEditor(0, 0);

      await grid.type('b');

      await expect.poll(async() => {
        const { query, data } = await grid.listState();

        return { query, data };
      }).toEqual({ query: 'b', data: [['<i>bar</i>'], ['<strong>baz</strong>']] });

      await grid.type('ar');

      await expect.poll(async() => {
        const { query, data } = await grid.listState();

        return { query, data };
      }).toEqual({ query: 'bar', data: [['<i>bar</i>']] });

      await grid.pickFirstWithKeyboard();

      // The cell's dropdown arrow carries its own decorative `<i class="ht-icon">`, ahead of the cell's
      // content in the DOM, so it is left out to reach the `<i>` the picked entry injected.
      await expect(grid.cell(0, 0).locator('i:not(.ht-icon)')).toHaveText('bar');
      expect(await grid.dataAt(0, 0)).toBe('<i>bar</i>');
    });

    // `allowHtml` is an explicit opt-in to raw markup: the list writes the entries as they are, without
    // sanitizing them, so an `onerror` handler in one of them runs once the list opens.
    test('renders HTML entries without sanitizing their content', async() => {
      const entries = [
        '<b>foo <span>zip</span></b>',
        '<i>bar</i><img src onerror="__xssTestInjection = true">',
        '<strong>baz</strong>',
      ];

      await grid.initGrid({
        columns: [
          {
            type: 'autocomplete',
            source: entries,
            allowHtml: true,
          },
        ],
      });
      await grid.openEditor(0, 0);

      // The handler runs when the image fails to load, a task after the markup is written.
      await expect.poll(() => grid.injectedHandlerRan()).toBe(true);
      await expect.poll(async() => (await grid.listState()).data).toEqual(entries.map(entry => [entry]));
    });
  });
});
