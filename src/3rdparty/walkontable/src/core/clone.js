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

    this.cloneSource = settings.cloneSource;
    this.cloneOverlay = settings.cloneOverlay;
    this.wtSettings = settings.cloneSource.wtSettings;
    this.wtTable = this.cloneOverlay.createTable(this, settings.table);
    this.wtScroll = new Scroll(this);
    this.wtViewport = settings.cloneSource.wtViewport;
    this.wtEvent = new Event(this);
    this.selections = this.cloneSource.selections;

    this.drawn = false;
    this.drawInterrupted = false;
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
    this.drawInterrupted = false;

    if (!fastDraw && !this.wtTable.isVisible()) {
      // draw interrupted because TABLE is not visible
      this.drawInterrupted = true;
    } else {
      this.wtTable.draw(fastDraw);
    }

    return this;
  }

  /**
   * Get overlay name
   *
   * @returns {String}
   */
  getOverlayName() {
    return this.cloneOverlay.type;
  }
}

export default Clone;
