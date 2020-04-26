import BasePlugin from '../_base';
import { registerPlugin } from '../../plugins';
import { TrimmingMap } from '../../translations';

const PLUGIN_NAME = 'Paging';

/**
 * @plugin Paging
 */
class Paging extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    this.trimRowsMap = null;
    this.pageSize = 0;
    this.skip = 0;
    this.currentPage = 0;
    this._ownChange = false;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link Paging#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().paging;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.pageSize = this.hot.getSettings().paging.pageSize;

    this.trimRowsMap = new TrimmingMap();
    this.hot.rowIndexMapper.registerMap(PLUGIN_NAME, this.trimRowsMap);

    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', () => {
      // each time the IndexMapper is updated (also on init) we want to refresh the current page
      // unless it was triggered from this plugin
      if (!this._ownChange) {
        this.goToPage(this.currentPage);
      }
    });

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.trimRowsMap.unregisterMap(PLUGIN_NAME);

    super.disablePlugin();
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  goToPage(pageNumber) {
    this._ownChange = true;
    this.currentPage = pageNumber;
    this.skip = this.currentPage * this.pageSize;

    // clear paging map, so we can start the calculations with all rows available
    this.trimRowsMap.clear();

    // when we have clear state, we can refresh buttons
    this.drawButtons();

    // start with all rows that should be rendered (after hidden, trim, and sorting)
    const renderableIndexes = this.hot.rowIndexMapper.getRenderableIndexes();

    // skip te range we want to show and trim the rest
    renderableIndexes.splice(this.skip, this.pageSize);
    this.hot.rowIndexMapper.executeBatchOperations(() => {
      renderableIndexes.forEach(idx => this.trimRowsMap.setValueAtIndex(idx, true));
    });

    this._ownChange = false;
    this.hot.render();
  }

  drawButtons() {
    const container = this.createButtonContainer();

    const prevButton = this.hot.rootDocument.createElement('button');
    prevButton.innerText = 'prev';
    prevButton.onclick = () => this.prevPage();
    prevButton.disabled = this.currentPage < 1;
    container.append(prevButton);

    const totalRows = this.hot.countRows();
    const pageCount = Math.ceil(totalRows / this.pageSize);

    for (let i = 0; i < pageCount; i++) {
      const button = this.hot.rootDocument.createElement('button');
      button.innerText = `${i + 1}`;
      button.onclick = () => this.goToPage(i);
      button.disabled = this.currentPage === i;
      container.append(button);
    }

    const nextButton = this.hot.rootDocument.createElement('button');
    nextButton.innerText = 'next';
    nextButton.onclick = () => this.nextPage();
    nextButton.disabled = this.currentPage > pageCount - 2;
    container.append(nextButton);
  }

  createButtonContainer() {
    const containerId = 'hot-paging-container';
    const oldContainer = this.hot.rootDocument.getElementById(containerId);
    if (oldContainer) {
      oldContainer.remove();
    }

    const container = this.hot.rootDocument.createElement('div');
    container.id = containerId;
    this.hot.rootElement.append(container);

    return container;
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.hot.columnIndexMapper.unregisterMap(PLUGIN_NAME);

    super.destroy();
  }
}

registerPlugin(PLUGIN_NAME, Paging);

export default Paging;
