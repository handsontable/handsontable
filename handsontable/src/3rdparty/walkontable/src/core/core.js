import Event from '../event';
import Overlays from '../overlays';
import Settings from '../settings';
import MasterTable from '../table/master';
import Viewport from '../viewport';
import ACore from './_base';
import { objectEach } from '../../../../helpers/object';
import { addClass, removeClass } from '../../../../helpers/dom/element';

/**
 * @class Walkontable
 */
export default class Walkontable extends ACore {
  /**
   * @param {HTMLTableElement} table Main table.
   * @param {SettingsPure} settings The Walkontable settings.
   */
  constructor(table, settings) {
    super(table, new Settings(settings));

    const facadeGetter = this.wtSettings.getSetting('facade', this); // todo rethink. I would like to have no access to facade from the internal scope.

    this.wtTable = new MasterTable(this.getTableDao(), facadeGetter, this.domBindings, this.wtSettings); // todo refactoring remove passing `this` into Table - potentially breaks many things.
    this.wtViewport = new Viewport(this, this.domBindings, this.wtSettings, this.eventManager, this.wtTable);
    this.selections = this.wtSettings.getSetting('selections');
    this.wtEvent = new Event(
      facadeGetter, this.domBindings, this.wtSettings, this.eventManager, this.wtTable, this.selections
    );
    this.wtOverlays = new Overlays(
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
}
