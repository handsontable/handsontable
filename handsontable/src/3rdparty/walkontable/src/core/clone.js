import Event from '../event';
import CoreAbstract from './_base';

/**
 * @class Walkontable
 */
export default class Clone extends CoreAbstract {
  cloneSource;
  cloneOverlay;

  /**
   * @param {HTMLTableElement} table Main table.
   * @param {SettingsPure|Settings} settings The Walkontable settings.
   * @param {WalkontableCloneOptions} clone Clone data.
   */
  constructor(table, settings, clone) {
    super(table, settings);

    const facadeGetter = this.wtSettings.getSetting('facade', this);

    this.cloneSource = clone.source;
    this.cloneOverlay = clone.overlay;
    this.wtTable = this.cloneOverlay.createTable(this.getTableDao(), facadeGetter, this.domBindings, this.wtSettings);
    this.wtViewport = clone.viewport;
    this.selections = clone.selections;
    this.wtEvent = new Event(
      facadeGetter, this.domBindings, this.wtSettings, this.eventManager, this.wtTable, this.selections, clone.event
    );

    this.findOriginalHeaders();
  }
}
