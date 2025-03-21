import Event from '../event';
import CoreAbstract from './_base';
import { Settings } from '../types';
import { WalkontableCloneOptions } from './interfaces';
import { StylesHandler } from '../utils/stylesHandler';

/**
 * @class Walkontable
 */
export default class Clone extends CoreAbstract {
  /**
   * @type {Walkontable}
   */
  cloneSource: CoreAbstract;
  /**
   * @type {Overlay}
   */
  cloneOverlay: any;

  /**
   * @param {HTMLTableElement} table Main table.
   * @param {SettingsPure|Settings} settings The Walkontable settings.
   * @param {WalkontableCloneOptions} clone Clone data.
   */
  constructor(table: HTMLTableElement, settings: Settings, clone: WalkontableCloneOptions) {
    super(table, settings);

    const facadeGetter = this.wtSettings.getSetting('facade', this);

    this.cloneSource = clone.source;
    this.cloneOverlay = clone.overlay;
    this.stylesHandler = clone.stylesHandler;
    this.wtTable = this.cloneOverlay.createTable(this.getTableDao(), facadeGetter, this.domBindings, this.wtSettings);
    this.wtViewport = clone.viewport;
    this.selectionManager = clone.selectionManager;
    this.selections = clone.selections;
    this.wtEvent = new Event(
      this.wtSettings,
      this.domBindings,
      this.wtTable,
      this.selectionManager,
      this.eventManager,
      null,
      facadeGetter as any
    );

    this.findOriginalHeaders();
  }
}
