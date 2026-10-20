import { BasePlugin } from '../base';
import type { HotInstance } from '../../core/types';
import {
  getGridViewState,
  setGridViewState,
  validateGridViewState,
  type GridViewState,
  type GridViewStateInput,
  type GridViewStateRestoreResult,
  type GridViewStateSetOptions,
  type GridViewStateValidationResult,
} from './gridViewState';

export const PLUGIN_KEY = 'viewState';
export const PLUGIN_PRIORITY = 920;

/**
 * @plugin ViewState
 * @class ViewState
 *
 * @description
 * The `ViewState` plugin captures the grid's view as a plain, JSON-serializable object, and restores it.
 *
 * The view state covers the row and column order, the sort, the filters, the hidden and trimmed rows, the
 * hidden columns, the collapsed nested rows, the manual column widths and row heights, the frozen rows and
 * columns, the pagination page and page size, the selection, and the scroll position. It never covers your
 * data, merged cells, custom borders, or cell meta.
 *
 * Use it to save a view and load it later, to share a view through a URL, to keep a user's layout across
 * sessions, or to apply a view that something else generated. A part that needs a plugin is read and
 * restored only while that plugin is enabled.
 *
 * The plugin has no setting of its own: it is on whenever its module is registered, the way
 * [`ExportFile`](@/api/exportFile.md) is.
 *
 * @example
 * ```js
 * const viewState = hot.getPlugin('viewState');
 *
 * // capture the view, and store it
 * localStorage.setItem('my-view', JSON.stringify(viewState.getViewState()));
 *
 * // restore it later, as one undo step
 * viewState.setViewState(JSON.parse(localStorage.getItem('my-view')), { undo: 'record' });
 * ```
 */
export class ViewState extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the setting keys that trigger a plugin update when changed via `updateSettings`. The plugin
   * has no setting, so none does.
   */
  static get SETTING_KEYS() {
    return [];
  }

  /**
   * Checks if the plugin is enabled. It always is: the plugin has no setting, and keeps no state.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return true;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Returns the grid's view state as a plain, JSON-serializable object: the column and row order,
   * the sort, the filters, the hidden and trimmed rows, the hidden columns, the collapsed nested
   * rows, the manual column widths and row heights, the frozen rows and columns, the pagination
   * page and page size, the selection, and the scroll position.
   *
   * A part that needs a plugin is included only while that plugin is enabled. On a grid that
   * loads its rows through [`dataProvider`](@/api/options.md#dataprovider), the sort, the filters,
   * and the page are left out, because the server owns them, and so are the row order, the hidden,
   * trimmed and collapsed rows, the row heights, and the selection: they address rows by their position in
   * the page the grid has loaded, and a state saved on one page would land on other records on another.
   *
   * Pass the object to {@link ViewState#setViewState} to restore the view, on this grid or another one.
   *
   * ```js
   * const viewState = hot.getPlugin('viewState').getViewState();
   *
   * localStorage.setItem('my-view', JSON.stringify(viewState));
   * ```
   *
   * @since 19.0.0
   * @returns {object} The view state. Its `version` property identifies the shape.
   */
  getViewState(): GridViewState {
    return getGridViewState(this.hot as HotInstance);
  }

  /**
   * Restores a view state that {@link ViewState#getViewState} returned.
   *
   * Only the parts the object carries are restored, so you can also pass a partial object, for
   * example `{ version: 1, sort: { columns: [{ column: 2, sortOrder: 'desc' }] } }`. Every other
   * part of the view stays as it is.
   *
   * An index that names a record or a column is physical, so a state keeps addressing the same data
   * whatever the row and column order: the row and column order, the sort, the filters, the hidden and
   * trimmed rows, the hidden columns, and the manual sizes. The selection, the scroll position, and the
   * frozen counts are visual: they describe what the user sees, and are read against the row and column
   * order in force after the restore.
   *
   * The sort, the filters, the hidden columns, and the column widths can also name a column by the
   * property its data is bound to, for example `{ column: 'amount', sortOrder: 'desc' }` or
   * `hiddenColumns: ['address.city']`. A property no column has is reported as `invalid`, and a property
   * of a column the grid does not show (a trimming map removed it, or it lies past `maxCols`) as
   * `outOfRange`, the same answer as for the column's index. `columnWidths` keeps a width for every
   * column, so there only a trimmed column named by property on a grid without a `columns` option is
   * `outOfRange`. The check reads the column order the grid has now, so a sort column that the same
   * state's `columnOrder` brings in under `maxCols` is `outOfRange` too. A property that two columns share names the
   * last of them. A string is always read as a property, so `'2'` from a URL is not the index `2`.
   * `getViewState()` always reports physical indexes.
   * The sort columns are physical too, unlike the visual ones that `getSortConfig()` of the sorting
   * plugins reports: convert those with {@link Core#toPhysicalColumn} before you pass them here.
   *
   * Every part is checked against the grid before anything changes, and a part that cannot be applied
   * is reported in the returned `skipped` list, never thrown on. Each entry is
   * `{ part, reason, path, message }`: `path` points into the state (`filters[2].conditions[0].args`),
   * and `message` says what to change, so a caller can correct the state and retry. The reasons are:
   * the plugin the part needs is disabled (`pluginDisabled`), the frozen rows would run next to
   * Pagination (`pluginConflict`), the grid loads its rows through `dataProvider`
   * (`externalDataSource`), a stored row or column order no longer matches the number of rows or
   * columns (`sizeMismatch`), the selection does not fit the grid (`outOfRange`), or the value is
   * wrong (`invalid`): for example a row order that does not name every row exactly once, a column
   * property no column has, one column named twice in `sort` or `columnWidths`, more than one sort column
   * without `MultiColumnSorting`, a filter condition that is not registered on the page, cannot take
   * its arguments, or is not one the column offers ({@link Filters#getAvailableConditions}), or a key that is not a part of the view state at all. A hidden or trimmed index, a
   * sort column, a size, or a scroll position past the end of the grid is `outOfRange`, and so is a
   * column in `sort`, `filters`, or `hiddenColumns`, by index or by property, that the grid does not show. With another `version`, every part is skipped as
   * `unsupportedVersion`, next to the `error`.
   *
   * A value that is not an object, such as the `null` that `JSON.parse(localStorage.getItem('my-view'))`
   * gives on a first visit, an object with another `version`, and (with `atomic`) a state with a
   * rejected part are not applied at all. The result carries an `error` then, and an empty `applied`.
   *
   * Restoring the filters moves a selected cell to the first row of its column, as any filtering
   * does, and restoring the page drops a selection the new page does not show. Include `selection`
   * in the state to control the selection either way.
   *
   * By default the restore is not recorded by the [`UndoRedo`](@/api/undoRedo.md) plugin, and the undo
   * steps recorded before it stay available, so an undo after a restore reverts an earlier action,
   * which may then apply to the restored view. Pass `{ undo: 'record' }` to record the restore as one
   * undo step instead: a single undo then reverts every restored part, and a redo applies them again.
   * Nothing is recorded while the UndoRedo plugin is disabled.
   * Every restore also returns `previous`, the view its parts had before, in the same shape: pass it
   * to `setViewState()` to revert without UndoRedo.
   *
   * Pass `{ atomic: true }` to apply nothing when any part is rejected by the checks made before the
   * restore starts. A step a listener vetoes (a `beforeFilter` that returns `false`, say) and a selection
   * the grid cannot show are only found while applying, and are reported after the rest was applied. So is
   * a selection or scroll position in a state that also changes the number of rows (`filters`, `trimmedRows`,
   * `collapsedRows`): it is measured against the rows that state leaves, so a view saved on the full grid
   * restores over a filtered one. To
   * check a state without applying it, use {@link ViewState#validateViewState}.
   *
   * ```js
   * const stored = localStorage.getItem('my-view');
   *
   * if (stored !== null) {
   *   const { applied, skipped, previous } = hot.getPlugin('viewState')
   *     .setViewState(JSON.parse(stored), { undo: 'record' });
   * }
   * ```
   *
   * @since 19.0.0
   * @param {object} state The view state to restore.
   * @param {object} [options] The restore options.
   * @param {'record' | 'skip'} [options.undo='skip'] Whether the restore is one undo step (`'record'`) or none.
   * @param {boolean} [options.atomic=false] When `true`, nothing is applied if any part is rejected.
   * @returns {object} An object with an `applied` array of the parts that were restored, a `skipped` array of
   * `{ part, reason, path, message }` for the parts that were not, the `previous` view of the restored parts,
   * and an `error` when the whole state was rejected.
   */
  setViewState(state: GridViewStateInput, options?: GridViewStateSetOptions): GridViewStateRestoreResult {
    return setGridViewState(this.hot as HotInstance, state, options);
  }

  /**
   * Checks a view state against the grid, without applying anything. The answer is the one
   * {@link ViewState#setViewState} acts on: which parts it would apply, and for each part it would skip,
   * the `{ part, reason, path, message }` entry that says why. Use it to give a stored or generated
   * state a second chance before it reaches the grid. It takes the same input, column properties
   * included, and resolves them the same way.
   *
   * ```js
   * const { valid, skipped } = hot.getPlugin('viewState').validateViewState(generatedState);
   *
   * if (!valid) {
   *   // send `skipped` back to the author of the state, and ask for a corrected one
   * }
   * ```
   *
   * @since 19.0.0
   * @param {object} state The view state to check.
   * @returns {object} An object with `valid` (whether the whole state can be applied), `applicable` (the parts
   * `setViewState()` would apply), `skipped` (the parts it would not, as `{ part, reason, path, message }`), and an
   * `error` when the whole state would be rejected.
   */
  validateViewState(state: GridViewStateInput): GridViewStateValidationResult {
    return validateGridViewState(this.hot as HotInstance, state);
  }
}
