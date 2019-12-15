import Core from './_base';
import Event from '../event';
import Scroll from '../scroll';

/**
 * @class Clone
 */
class Clone extends Core {
  /**
   * @param {Object} settings
   */
  constructor(settings) {
    super(settings);

    this.cloneSource = settings.masterInstance;
    this.overlayName = settings.type;
    this.wtSettings = this.cloneSource.wtSettings;
    this.wtTable = settings.createTableFn(this, settings.table);
    this.wtScroll = new Scroll(this);
    this.wtViewport = this.cloneSource.wtViewport;
    this.wtEvent = new Event(this);
    this.selections = this.cloneSource.selections;
  }

  /**
   * Force rerender of Walkontable sub-instance ("clone") used for a single overlay. This method should only be called
   * privately by Walkontable, not externally from Handsontable or any of the plugins.
   *
   * @param {Boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway
   * @returns {Walkontable}
   */
  drawClone(fastDraw = false) {
    this.wtTable.draw(fastDraw);

    return this;
  }

  /**
   * Get overlay name
   *
   * @returns {String}
   */
  getOverlayName() {
    return this.overlayName;
  }
}

export default Clone;
