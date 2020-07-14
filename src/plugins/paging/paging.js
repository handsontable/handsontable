import BasePlugin from '../_base';
import { registerPlugin } from '../../plugins';
import { HidingMap } from '../../translations';

const PLUGIN_NAME = 'Paging';

/**
 * @plugin Paging
 */
class Paging extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    this.pagingMap = null;
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

    this.pagingMap = new HidingMap();
    this.hot.rowIndexMapper.registerMap(PLUGIN_NAME, this.pagingMap);

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
    this.hot.pagingMap.unregisterMap(PLUGIN_NAME);

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
    this.pagingMap.clear();

    // when we have clear state, we can refresh buttons
    this.drawButtons();

    // start with all rows that should be rendered (after hidden, trim, and sorting)
    const renderableIndexes = this.hot.rowIndexMapper.getRenderableIndexes();

    // skip te range we want to show and trim the rest
    renderableIndexes.splice(this.skip, this.pageSize);
    this.hot.rowIndexMapper.executeBatchOperations(() => {
      renderableIndexes.forEach(idx => this.pagingMap.setValueAtIndex(idx, true));
    });

    this._ownChange = false;
    this.hot.render();
  }

  drawButtons() {
    const container = this.createButtonContainer();
    const totalRows = this.hot.rowIndexMapper.getRenderableIndexesLength();
    const pageCount = Math.ceil(totalRows / this.pageSize);

    container.append(this.drawPrevButton());

    if (pageCount > 9) {
      for (let i = 0; i < 3; i++) {
        container.append(this.drawSingleButton(i));
      }

      if (this.currentPage > 4) {
        container.append(this.drawButtonSeparator());
      }

      if (this.currentPage > 3 && this.currentPage < pageCount - 2) {
        container.append(this.drawSingleButton(this.currentPage - 1));
      }

      if (this.currentPage > 2 && this.currentPage < pageCount - 3) {
        container.append(this.drawSingleButton(this.currentPage));
      }

      if (this.currentPage > 1 && this.currentPage < pageCount - 4) {
        container.append(this.drawSingleButton(this.currentPage + 1));
      }

      if (this.currentPage < pageCount - 5) {
        container.append(this.drawButtonSeparator());
      }

      for (let i = pageCount - 3; i < pageCount; i++) {
        container.append(this.drawSingleButton(i));
      }
    } else {
      for (let i = 0; i < pageCount; i++) {
        container.append(this.drawSingleButton(i));
      }
    }

    container.append(this.drawNextButton(pageCount));
    this.hot.rootElement.append(container);
  }

  drawSingleButton(i) {
    const button = this.hot.rootDocument.createElement('button');
    button.innerText = `${i + 1}`;
    button.onclick = () => this.goToPage(i);
    button.disabled = this.currentPage === i;

    return button;
  }

  drawButtonSeparator() {
    const span = this.hot.rootDocument.createElement('button');

    span.innerText = '...';

    return span;
  }

  drawPrevButton() {
    const prevButton = this.hot.rootDocument.createElement('button');

    prevButton.innerText = 'prev';
    prevButton.onclick = () => this.prevPage();
    prevButton.disabled = this.currentPage < 1;

    return prevButton;
  }

  drawNextButton(pageCount) {
    const nextButton = this.hot.rootDocument.createElement('button');

    nextButton.innerText = 'next';
    nextButton.onclick = () => this.nextPage();
    nextButton.disabled = this.currentPage > pageCount - 2;

    return nextButton;
  }

  createButtonContainer() {
    const containerId = 'hot-paging-container';
    const oldContainer = this.hot.rootDocument.getElementById(containerId);

    if (oldContainer) {
      oldContainer.remove();
    }

    const container = this.hot.rootDocument.createElement('div');

    container.id = containerId;

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
