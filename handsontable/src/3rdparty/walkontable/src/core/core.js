import Event from '../event';
import Overlays from '../overlays';
import Settings from '../settings';
import MasterTable from '../table/master';
import Viewport from '../viewport';
import CoreAbstract from './_base';
import { objectEach } from '../../../../helpers/object';
import { addClass, removeClass } from '../../../../helpers/dom/element';

/**
 * @class Walkontable
 */
export default class Walkontable extends CoreAbstract {
  /**
   * @param {HTMLTableElement} table Main table.
   * @param {SettingsPure} settings The Walkontable settings.
   */
  constructor(table, settings) {
    super(table, new Settings(settings));

    const facadeGetter = this.wtSettings.getSetting('facade', this); // todo rethink. I would like to have no access to facade from the internal scope.

    this.wtTable = new MasterTable(this.getTableDao(), facadeGetter, this.domBindings, this.wtSettings);
    this.wtViewport = new Viewport(
      this.getViewportDao(), this.domBindings, this.wtSettings, this.eventManager, this.wtTable
    );
    this.selections = this.wtSettings.getSetting('selections');
    this.wtEvent = new Event(
      facadeGetter, this.domBindings, this.wtSettings, this.eventManager, this.wtTable, this.selections
    );
    this.wtOverlays = new Overlays(
      // TODO create DAO and remove reference to the Walkontable instance.
      this, facadeGetter, this.domBindings, this.wtSettings, this.eventManager, this.wtTable
    );

    this.exportSettingsAsClassNames();

    this.findOriginalHeaders();
  }

  /**
   * Export settings as class names added to the parent element of the table.
   */
  exportSettingsAsClassNames() {
    const toExport = {
      rowHeaders: 'htRowHeaders',
      columnHeaders: 'htColumnHeaders'
    };
    const allClassNames = [];
    const newClassNames = [];

    objectEach(toExport, (className, key) => {
      if (this.wtSettings.getSetting(key).length) {
        newClassNames.push(className);
      }
      allClassNames.push(className);
    });
    removeClass(this.wtTable.wtRootElement.parentNode, allClassNames);
    addClass(this.wtTable.wtRootElement.parentNode, newClassNames);
  }

  /**
   * @returns {ViewportDao}
   */
  getViewportDao() {
    const wot = this;

    return {
      get wot() {
        return wot;
      },
      get topOverlayTrimmingContainer() {
        return wot.wtOverlays.topOverlay.trimmingContainer;
      },
      get inlineStartOverlayTrimmingContainer() {
        return wot.wtOverlays.inlineStartOverlay.trimmingContainer;
      },
      get topScrollPosition() {
        return wot.wtOverlays.topOverlay.getScrollPosition();
      },
      get topParentOffset() {
        return wot.wtOverlays.topOverlay.getTableParentOffset();
      },
      get inlineStartScrollPosition() {
        return wot.wtOverlays.inlineStartOverlay.getScrollPosition();
      },
      get inlineStartParentOffset() {
        return wot.wtOverlays.inlineStartOverlay.getTableParentOffset();
      },
      get topOverlay() {
        return wot.wtOverlays.topOverlay; // TODO refactoring: move outside dao, use IOC
      },
      get inlineStartOverlay() {
        return wot.wtOverlays.inlineStartOverlay; // TODO refactoring: move outside dao, use IOC
      },
      get bottomOverlay() {
        return wot.wtOverlays.bottomOverlay; // TODO refactoring: move outside dao, use IOC
      }
    };
  }
}
