import Event from '../event';
import Overlays from '../overlays';
import Settings from '../settings';
import MasterTable from '../table/master';
import Viewport from '../viewport';
import ACore from './_base';

/**
 * @class Walkontable
 * @TODO define explicitly fields.
 */
export default class Walkontable extends ACore {
  /**
   * @param {HTMLTableElement} table Main table.
   * @param {SettingsPure} settings The Walkontable settings.
   */
  constructor(table, settings) {
    super(table, new Settings(settings));

    const facadeGetter = this.wtSettings.getSetting('facade', this); // todo rethink. I would like to have no access to facade from the internal scope.

    this.wtTable = new MasterTable(this, facadeGetter, this.domBindings, this.wtSettings); // todo refactoring remove passing `this` into Table - potentially breaks many things.
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

}
