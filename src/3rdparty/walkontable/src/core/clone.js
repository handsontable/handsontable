import Core from './_base';
import Event from '../event';
import Scroll from '../scroll';

/**
 * @class Clone
 */
class Clone extends Core {
  /**
   * @param {object} settings The Walkontable settings.
   */
  constructor(settings) {
    super(settings);

    this.overlay = settings.overlay;
    this.overlayName = settings.overlay.type;
    this.wtSettings = this.overlay.master.wtSettings;
    this.wtTable = settings.createTableFn(this, settings.table);
    this.wtScroll = new Scroll(this);
    this.wtViewport = this.overlay.master.wtViewport;
    this.wtEvent = new Event(this);
    this.selections = this.overlay.master.selections;
  }

  /**
   * Force rerender of Walkontable sub-instance ("clone") used for a single overlay. This method should only be called
   * privately by Walkontable, not externally from Handsontable or any of the plugins.
   *
   * @param {boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   * @returns {Walkontable}
   */
  drawClone(fastDraw = false) {
    this.wtTable.draw(fastDraw);

    return this;
  }

  /**
   * Get overlay name.
   *
   * @returns {string}
   */
  getOverlayName() {
    return this.overlayName;
  }
}

export default Clone;
