import {
  addClass,
  fastInnerText,
  removeClass,
} from './../../../helpers/dom/element';
import { objectEach } from './../../../helpers/object';
import { toUpperCaseFirst, randomString } from './../../../helpers/string';
import Event from './event';
import Overlays from './overlays';
import Scroll from './scroll';
import Settings from './settings';
import MasterTable from './table/master';
import Viewport from './viewport';

/**
 * @class Walkontable
 */
class Walkontable {
  /**
   * @param {Object} settings
   */
  constructor(settings) {
    const originalHeaders = [];

    // this is the namespace for global events
    this.guid = `wt_${randomString()}`;
    this.rootDocument = settings.table.ownerDocument;
    this.rootWindow = this.rootDocument.defaultView;

    // bootstrap from settings
    if (settings.cloneSource) {
      this.cloneSource = settings.cloneSource;
      this.cloneOverlay = settings.cloneOverlay;
      this.wtSettings = settings.cloneSource.wtSettings;
      this.wtTable = this.cloneOverlay.createTable(this, settings.table);
      this.wtScroll = new Scroll(this);
      this.wtViewport = settings.cloneSource.wtViewport;
      this.wtEvent = new Event(this);
      this.selections = this.cloneSource.selections;
    } else {
      this.wtSettings = new Settings(this, settings);
      this.wtTable = new MasterTable(this, settings.table);
      this.wtScroll = new Scroll(this);
      this.wtViewport = new Viewport(this);
      this.wtEvent = new Event(this);
      this.selections = this.getSetting('selections');
      this.wtOverlays = new Overlays(this);
      this.exportSettingsAsClassNames();
    }

    // find original headers
    if (this.wtTable.THEAD.childNodes.length && this.wtTable.THEAD.childNodes[0].childNodes.length) {
      for (let c = 0, clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
        originalHeaders.push(this.wtTable.THEAD.childNodes[0].childNodes[c].innerHTML);
      }
      if (!this.getSetting('columnHeaders').length) {
        this.update('columnHeaders', [
          function(column, TH) {
            fastInnerText(TH, originalHeaders[column]);
          }
        ]);
      }
    }
    this.drawn = false;
    this.drawInterrupted = false;
  }

  /**
   * Force rerender of Walkontable
   *
   * @param {Boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway
   * @returns {Walkontable}
   */
  draw(fastDraw = false) {
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
   * Returns the TD at coords. If topmost is set to true, returns TD from the topmost overlay layer,
   * if not set or set to false, returns TD from the master table.
   *
   * @param {CellCoords} coords
   * @param {Boolean} [topmost=false]
   * @returns {Object}
   */
  getCell(coords, topmost = false) {
    if (!topmost) {
      return this.wtTable.getCell(coords);
    }

    const totalRows = this.wtSettings.getSetting('totalRows');
    const fixedRowsTop = this.wtSettings.getSetting('fixedRowsTop');
    const fixedRowsBottom = this.wtSettings.getSetting('fixedRowsBottom');
    const fixedColumns = this.wtSettings.getSetting('fixedColumnsLeft');

    if (coords.row < fixedRowsTop && coords.col < fixedColumns) {
      return this.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell(coords);

    } else if (coords.row < fixedRowsTop) {
      return this.wtOverlays.topOverlay.clone.wtTable.getCell(coords);

    } else if (coords.col < fixedColumns && coords.row >= totalRows - fixedRowsBottom) {
      if (this.wtOverlays.bottomLeftCornerOverlay && this.wtOverlays.bottomLeftCornerOverlay.clone) {
        return this.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.getCell(coords);
      }

    } else if (coords.col < fixedColumns) {
      return this.wtOverlays.leftOverlay.clone.wtTable.getCell(coords);

    } else if (coords.row < totalRows && coords.row >= totalRows - fixedRowsBottom) {
      if (this.wtOverlays.bottomOverlay && this.wtOverlays.bottomOverlay.clone) {
        return this.wtOverlays.bottomOverlay.clone.wtTable.getCell(coords);
      }

    }

    return this.wtTable.getCell(coords);
  }

  /**
   * @param {Object} settings
   * @param {*} value
   * @returns {Walkontable}
   */
  update(settings, value) {
    return this.wtSettings.update(settings, value);
  }

  /**
   * Scrolls the viewport to a cell (rerenders if needed).
   *
   * @param {CellCoords} coords
   * @param {Boolean} [snapToTop]
   * @param {Boolean} [snapToRight]
   * @param {Boolean} [snapToBottom]
   * @param {Boolean} [snapToLeft]
   * @returns {Boolean}
   */
  scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft) {
    if (coords.col < 0 || coords.row < 0) {
      return false;
    }
    return this.wtScroll.scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft);
  }

  /**
   * Scrolls the viewport to a column (rerenders if needed).
   *
   * @param {Number} column Visual column index.
   * @param {Boolean} [snapToRight]
   * @param {Boolean} [snapToLeft]
   * @returns {Boolean}
   */
  scrollViewportHorizontally(column, snapToRight, snapToLeft) {
    if (column < 0) {
      return false;
    }
    return this.wtScroll.scrollViewportHorizontally(column, snapToRight, snapToLeft);
  }

  /**
   * Scrolls the viewport to a row (rerenders if needed).
   *
   * @param {Number} row Visual row index.
   * @param {Boolean} [snapToTop]
   * @param {Boolean} [snapToBottom]
   * @returns {Boolean}
   */
  scrollViewportVertically(row, snapToTop, snapToBottom) {
    if (row < 0) {
      return false;
    }
    return this.wtScroll.scrollViewportVertically(row, snapToTop, snapToBottom);
  }

  /**
   * @returns {Array}
   */
  getViewport() {
    return [
      this.wtTable.getFirstVisibleRow(),
      this.wtTable.getFirstVisibleColumn(),
      this.wtTable.getLastVisibleRow(),
      this.wtTable.getLastVisibleColumn()
    ];
  }

  /**
   * Get overlay name
   *
   * @returns {String}
   */
  getOverlayName() {
    return this.cloneOverlay ? this.cloneOverlay.type : 'master';
  }

  /**
   * Export settings as class names added to the parent element of the table.
   */
  exportSettingsAsClassNames() {
    const toExport = {
      rowHeaders: ['array'],
      columnHeaders: ['array']
    };
    const allClassNames = [];
    const newClassNames = [];

    objectEach(toExport, (optionType, key) => {
      if (optionType.indexOf('array') > -1 && this.getSetting(key).length) {
        newClassNames.push(`ht${toUpperCaseFirst(key)}`);
      }
      allClassNames.push(`ht${toUpperCaseFirst(key)}`);
    });
    removeClass(this.wtTable.wtRootElement.parentNode, allClassNames);
    addClass(this.wtTable.wtRootElement.parentNode, newClassNames);
  }

  /**
   * Get/Set Walkontable instance setting
   *
   * @param {String} key
   * @param {*} [param1]
   * @param {*} [param2]
   * @param {*} [param3]
   * @param {*} [param4]
   * @returns {*}
   */
  getSetting(key, param1, param2, param3, param4) {
    // this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
    return this.wtSettings.getSetting(key, param1, param2, param3, param4);
  }

  /**
   * Checks if setting exists
   *
   * @param {String} key
   * @returns {Boolean}
   */
  hasSetting(key) {
    return this.wtSettings.has(key);
  }

  /**
   * Destroy instance
   */
  destroy() {
    this.wtOverlays.destroy();
    this.wtEvent.destroy();
  }
}

export default Walkontable;
