import type { HeaderCheckboxSummary } from '../../utils/rowScope';

/**
 * The row selection of a server-backed grid, in a form a server can apply: either "these rows" or
 * "every row except these". Returned by {@link RowSelection#getServerSelection}.
 */
export interface ServerRowSelection {
  /**
   * `true`: every row matching the current query is selected, except `toggledRowIds`.
   * `false`: only `toggledRowIds` are selected.
   */
  selectAll: boolean;
  /**
   * Row ids (as the `dataProvider.rowId` option resolves them) that differ from `selectAll`.
   */
  toggledRowIds: unknown[];
}

/**
 * Keeps a row selection by row id, with an exclusion model, so it survives page changes and
 * reloads, and a "select all" never needs the rows the server did not send.
 *
 * A row is selected when `selectAll` differs from whether its id is toggled.
 */
export class RowIdSelection {
  /**
   * Whether every row is selected, except the toggled ones.
   */
  #selectAll = false;

  /**
   * The row ids whose state differs from `#selectAll`.
   */
  #toggledRowIds = new Set<unknown>();

  /**
   * Checks whether the row with the id is selected.
   *
   * @param {*} rowId The row id.
   * @returns {boolean}
   */
  isSelected(rowId: unknown): boolean {
    return this.#selectAll !== this.#toggledRowIds.has(rowId);
  }

  /**
   * Selects or deselects the row with the id.
   *
   * @param {*} rowId The row id.
   * @param {boolean} selected The new state.
   */
  set(rowId: unknown, selected: boolean) {
    if (selected === this.#selectAll) {
      this.#toggledRowIds.delete(rowId);
    } else {
      this.#toggledRowIds.add(rowId);
    }
  }

  /**
   * Selects every row, or clears the selection.
   *
   * @param {boolean} selected `true` to select every row, `false` to clear the selection.
   */
  setAll(selected: boolean) {
    this.#selectAll = selected;
    this.#toggledRowIds.clear();
  }

  /**
   * Tells whether nothing is selected and nothing is toggled.
   *
   * @returns {boolean}
   */
  isEmpty(): boolean {
    return !this.#selectAll && this.#toggledRowIds.size === 0;
  }

  /**
   * Summarizes the selection against the number of rows matching the query. With `selectAll`, the
   * count assumes every toggled id still matches the query; the server is the only one that knows.
   *
   * @param {number} totalRows The number of rows matching the query.
   * @returns {HeaderCheckboxSummary}
   */
  summarize(totalRows: number): HeaderCheckboxSummary {
    const total = Math.max(0, totalRows);
    const selected = this.#selectAll ?
      Math.max(0, total - this.#toggledRowIds.size) : Math.min(total, this.#toggledRowIds.size);
    let state: HeaderCheckboxSummary['state'] = 'mixed';

    if (total === 0) {
      state = 'disabled';
    } else if (selected === 0) {
      state = 'unchecked';
    } else if (selected === total) {
      state = 'checked';
    }

    return { state, selected, total };
  }

  /**
   * Exports the selection.
   *
   * @returns {ServerRowSelection}
   */
  export(): ServerRowSelection {
    return { selectAll: this.#selectAll, toggledRowIds: Array.from(this.#toggledRowIds) };
  }

  /**
   * Replaces the selection.
   *
   * @param {ServerRowSelection} selection The selection to apply.
   */
  import(selection: ServerRowSelection) {
    this.#selectAll = selection.selectAll === true;
    this.#toggledRowIds = new Set(Array.isArray(selection.toggledRowIds) ? selection.toggledRowIds : []);
  }
}
