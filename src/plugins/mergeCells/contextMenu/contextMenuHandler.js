import * as C from '../../../i18n/constants';

/**
 * The `ContextMenuHandler` class handles adding the context menu entries for the merged cells plugin.
 *
 * @class ContextMenu
 * @plugin MergeCells
 * @private
 */
class ContextMenuHandler {
  /**
   * `afterContextMenuDefaultOptions` hook callback.
   *
   * @private
   * @param {MergeCells} plugin The plugin instance.
   * @param {Object} defaultOptions The default context menu options.
   */
  addEntries(plugin, defaultOptions) {
    defaultOptions.items.push({name: '---------'});
    defaultOptions.items.push({
      key: 'mergeCells',
      name() {
        const sel = this.getSelected();
        const info = plugin.collectionContainer.get(sel[0], sel[1]);

        if (info.row === sel[0] && info.col === sel[1] && info.row + info.rowspan - 1 === sel[2] && info.col + info.colspan - 1 === sel[3]) {
          return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNMERGE_CELLS);
        }
        return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_MERGE_CELLS);

      },
      callback() {
        plugin.toggleMerge(this.getSelectedRange());
        this.render();
      },
      disabled() {
        return this.selection.selectedHeader.corner;
      },
    });
  }
}

export default ContextMenuHandler;
