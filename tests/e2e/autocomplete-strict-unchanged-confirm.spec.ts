import { test, expect } from '../fixtures/test';
import { AutocompleteChoicesListPage } from '../fixtures/pages/AutocompleteChoicesListPage';

/**
 * Opening a strict autocomplete or dropdown cell and confirming without typing must keep the value the
 * cell holds, and write nothing. The list opens narrowed by that value and highlights the entry equal to
 * it, and strict mode used to commit the highlight, so a highlight that missed the equal entry wrote
 * another one: `'Metric'` became `'Metric ton'`, the first entry the list shows.
 *
 * Most cases list `'Metric ton'` before `'Metric'`, so the first entry and the equal one differ. The
 * keep-the-value cases confirm twice, with Enter and with a click outside the grid, and count the
 * `afterChange` calls, so a confirm that wrote an equal copy (which UndoRedo would record as a step) does
 * not pass. The typed cases are the positive control: they write, once. No pixel is read and no theme is
 * branched on, so the main theme stands for all of them.
 */
const SOURCE = ['Metric ton', 'Metric'];

/**
 * The two ways a user confirms an edit without the keyboard leaving the cell first.
 */
const CONFIRMS: { name: string, confirm: (grid: AutocompleteChoicesListPage) => Promise<void> }[] = [
  {
    name: 'Enter',
    confirm: async(grid) => {
      await grid.press('Enter');
      await expect(grid.editor).toBeHidden();
    },
  },
  {
    name: 'a click outside the grid',
    confirm: grid => grid.clickOutside(),
  },
];

test.describe('confirming a strict choice cell without typing', () => {
  let grid: AutocompleteChoicesListPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutocompleteChoicesListPage(page, theme, bundle);
    await grid.goto();
  });

  /**
   * Opens the editor on cell (0, 0), waits until the list answers the value the editor opened with, so
   * the highlight read next describes that value, and starts counting the changes written.
   *
   * @param {string} openedWith The text the editor opens with.
   */
  async function openAndWaitForList(openedWith: string): Promise<void> {
    await grid.openEditor(0, 0);
    await expect.poll(async() => (await grid.highlightState()).query).toBe(openedWith);
    await grid.countChanges();
  }

  /**
   * Waits until the list highlights `label`, and the editor input names that option to a screen reader.
   *
   * @param {string} label The label of the highlighted option.
   */
  async function expectHighlighted(label: string): Promise<void> {
    await expect.poll(async() => {
      const { highlighted, activeDescendant } = await grid.highlightState();

      return { highlighted, activeDescendant };
    }).toEqual({ highlighted: label, activeDescendant: label });
  }

  /**
   * Waits until the list answers `query` with nothing highlighted, and the editor input names no option.
   *
   * @param {string} query The text the list answers.
   */
  async function expectNothingHighlighted(query: string): Promise<void> {
    await expect.poll(() => grid.highlightState()).toEqual({ query, highlighted: null, activeDescendant: null });
  }

  /**
   * Waits until the cell holds `expected` and checks that the confirm wrote nothing.
   *
   * @param {unknown} expected The value the cell kept.
   */
  async function expectKept(expected: unknown): Promise<void> {
    await expect.poll(() => grid.sourceDataAt(0, 0)).toEqual(expected);
    expect(await grid.changeCount()).toBe(0);
  }

  for (const { name, confirm } of CONFIRMS) {
    test.describe(`with ${name}`, () => {
      test('keeps an autocomplete value whose label another entry starts with', async() => {
        await grid.initGrid({
          data: [['Metric']],
          columns: [{ type: 'autocomplete', source: SOURCE, strict: true }],
        });

        await openAndWaitForList('Metric');
        await expectHighlighted('Metric');

        await confirm(grid);

        await expectKept('Metric');
      });

      test('keeps a dropdown value whose label another entry starts with', async() => {
        await grid.initGrid({
          data: [['Metric']],
          columns: [{ type: 'dropdown', source: SOURCE }],
        });

        await openAndWaitForList('Metric');
        await expectHighlighted('Metric');

        await confirm(grid);

        await expectKept('Metric');
      });

      test('keeps a key/value entry', async() => {
        await grid.initGrid({
          data: [[{ key: 'm', value: 'Metric' }]],
          columns: [{
            type: 'autocomplete',
            strict: true,
            source: [{ key: 't', value: 'Metric ton' }, { key: 'm', value: 'Metric' }],
          }],
        });

        await openAndWaitForList('Metric');
        await expectHighlighted('Metric');

        await confirm(grid);

        await expectKept({ key: 'm', value: 'Metric' });
      });

      test('keeps a key/value entry whose object value is labeled by sourceLabel', async() => {
        await grid.initGrid({
          data: [[{ key: 'm', value: { name: 'Metric' } }]],
          columns: [{
            type: 'autocomplete',
            strict: true,
            sourceLabel: 'name',
            source: [{ key: 't', value: { name: 'Metric ton' } }, { key: 'm', value: { name: 'Metric' } }],
          }],
        });

        await openAndWaitForList('Metric');
        await expectHighlighted('Metric');

        await confirm(grid);

        await expectKept({ key: 'm', value: { name: 'Metric' } });
      });

      test('keeps a value no entry equals, and highlights no option', async() => {
        await grid.initGrid({
          data: [['Met']],
          columns: [{ type: 'autocomplete', source: SOURCE, strict: true }],
        });

        await openAndWaitForList('Met');

        // The list shows both entries (each contains the value), so a highlight is possible here, and
        // a screen reader is not pointed at an option the commit will not write.
        await expect.poll(async() => (await grid.listState()).data).toEqual([['Metric ton'], ['Metric']]);
        await expectNothingHighlighted('Met');

        await confirm(grid);

        await expectKept('Met');
      });
    });
  }

  test('keeps a dropdown value no entry equals', async() => {
    await grid.initGrid({
      data: [['Met']],
      columns: [{ type: 'dropdown', source: SOURCE }],
    });

    await openAndWaitForList('Met');
    await expectNothingHighlighted('Met');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expectKept('Met');
  });

  test('keeps the key/value entry the cell holds when another entry shares its label', async() => {
    await grid.initGrid({
      data: [[{ key: 'm2', value: 'Metric' }]],
      columns: [{
        type: 'autocomplete',
        strict: true,
        source: [{ key: 'm', value: 'Metric' }, { key: 'm2', value: 'Metric' }],
      }],
    });

    await openAndWaitForList('Metric');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expectKept({ key: 'm2', value: 'Metric' });
  });

  test('prefers the entry equal in case too over one equal only without it', async() => {
    await grid.initGrid({
      data: [['Metric']],
      columns: [{ type: 'autocomplete', source: ['metric', 'Metric'], strict: true }],
    });

    await openAndWaitForList('Metric');
    await expectHighlighted('Metric');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expectKept('Metric');
  });

  test('keeps a value an entry equals only without case, and highlights that entry', async() => {
    await grid.initGrid({
      data: [['metric']],
      columns: [{ type: 'autocomplete', source: SOURCE, strict: true }],
    });

    await openAndWaitForList('metric');
    await expectHighlighted('Metric');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expectKept('metric');
  });

  test('matches in case when filteringCaseSensitive is set', async() => {
    await grid.initGrid({
      data: [['metric']],
      columns: [{
        type: 'autocomplete',
        source: ['Metric ton', 'Metric', 'metric'],
        strict: true,
        filteringCaseSensitive: true,
      }],
    });

    await openAndWaitForList('metric');
    await expectHighlighted('metric');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expectKept('metric');
  });

  test('keeps the value once the user types and deletes back to it', async() => {
    await grid.initGrid({
      data: [['Met']],
      columns: [{ type: 'autocomplete', source: SOURCE, strict: true }],
    });

    await openAndWaitForList('Met');
    // The editor opens with its text selected, so End first: typing then extends `'Met'`.
    await grid.press('End');
    await grid.type('ric');
    await expectHighlighted('Metric');

    // Back to the text it opened with: the highlight and the option the input names both go.
    await grid.press('Backspace');
    await grid.press('Backspace');
    await grid.press('Backspace');
    await expectNothingHighlighted('Met');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expectKept('Met');
  });

  test('keeps the value an application wrote into the cell under the open editor', async() => {
    await grid.initGrid({
      data: [['Met']],
      columns: [{ type: 'autocomplete', source: SOURCE, strict: true }],
    });

    await openAndWaitForList('Met');

    // The open editor takes the written value as its own; confirming it unchanged must keep it.
    await grid.setSourceDataAt(0, 0, 'Metr');
    await expect(grid.editor).toHaveValue('Metr');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expectKept('Metr');
  });

  test('commits the first entry of an empty cell, as it always has', async() => {
    await grid.initGrid({
      data: [[null]],
      columns: [{ type: 'autocomplete', source: SOURCE, strict: true }],
    });

    await openAndWaitForList('');
    await expectHighlighted('Metric ton');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expect.poll(() => grid.sourceDataAt(0, 0)).toBe('Metric ton');
  });
});

test.describe('confirming a strict choice cell after typing', () => {
  let grid: AutocompleteChoicesListPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutocompleteChoicesListPage(page, theme, bundle);
    await grid.goto();
    await grid.initGrid({
      data: [['Met']],
      columns: [{ type: 'autocomplete', source: SOURCE, strict: true }],
    });
    await grid.countChanges();
  });

  test('completes the typed text to the first entry it is part of', async() => {
    await grid.openEditor(0, 0);
    await grid.press('End');
    await grid.type('r');
    await expect.poll(async() => (await grid.highlightState()).highlighted).toBe('Metric ton');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expect.poll(() => grid.sourceDataAt(0, 0)).toBe('Metric ton');
    expect(await grid.changeCount()).toBe(1);
  });

  test('completes typed text the editor opened with on a fast edit', async() => {
    // Typing on a selected cell opens the editor with the typed text: it never held the cell's
    // value, so its text is the user's even where it equals that value.
    await grid.selectCell(0, 0);
    await grid.type('Met');
    await expect(grid.editor).toBeFocused();
    await expect.poll(async() => (await grid.highlightState()).highlighted).toBe('Metric ton');

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expect.poll(() => grid.sourceDataAt(0, 0)).toBe('Metric ton');
  });

  test('still completes the typed text after the editor is asked to begin editing again', async() => {
    await grid.openEditor(0, 0);
    await grid.press('End');
    await grid.type('r');
    await expect.poll(async() => (await grid.highlightState()).highlighted).toBe('Metric ton');

    // A double-click on the edited cell does this. The typed text is not where the edit began.
    await grid.beginEditingAgain();

    await grid.press('Enter');
    await expect(grid.editor).toBeHidden();

    await expect.poll(() => grid.sourceDataAt(0, 0)).toBe('Metric ton');
  });
});
