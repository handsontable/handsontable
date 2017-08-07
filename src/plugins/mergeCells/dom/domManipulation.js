/**
 * Class responsible for the DOM manipualtion concerning the MergeCells plugin.
 *
 * @class DOMManipulation
 * @plugin MergeCells
 */
class DOMManipulation {
  constructor(plugin) {
    /**
     * Reference to the Merge Cells plugin.
     *
     * @type {Handsontable}
     */
    this.plugin = plugin;
  }

  /**
   * Apply the `colspan`/`rowspan` properties.
   *
   * @private
   * @param {HTMLElement} TD The soon-to-be-modified cell.
   * @param {Collection} collectionInfo The collection in question.
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   */
  applySpanProperties(TD, collectionInfo, row, col) {
    if (collectionInfo) {
      if (collectionInfo.row === row && collectionInfo.col === col) {
        TD.setAttribute('rowspan', collectionInfo.rowspan.toString());
        TD.setAttribute('colspan', collectionInfo.colspan.toString());

      } else {
        TD.removeAttribute('rowspan');
        TD.removeAttribute('colspan');

        TD.style.display = 'none';
      }

    } else {
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');
      TD.style.display = '';
    }
  }
}

export default DOMManipulation;
