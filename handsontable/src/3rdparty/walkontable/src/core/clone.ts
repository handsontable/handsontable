import Event from '../event';
import CoreAbstract from './_base';
import type Settings from '../settings';
import type Viewport from '../viewport';
import type { SelectionManager } from '../selection/manager';
import type { Overlay } from '../overlay/_base';
import type { WalkontableInstance } from '../types';

/**
 * @class Walkontable
 */
export default class Clone extends CoreAbstract {
  /**
   * @type {Walkontable}
   */
  cloneSource;
  /**
   * @type {Overlay}
   */
  cloneOverlay;

  /**
   * @param {HTMLTableElement} table Main table.
   * @param {SettingsPure|Settings} settings The Walkontable settings.
   * @param {WalkontableCloneOptions} clone Clone data.
   */
  constructor(table: HTMLTableElement, settings: Settings, clone: {
    source: WalkontableInstance;
    overlay: Overlay;
    viewport: Viewport;
    event: Event | Record<string, unknown> | null;
    selectionManager: SelectionManager;
  }) {
    super(table, settings);

    const facadeGetter = this.wtSettings.getSetting<Function>('facade', this);

    this.cloneSource = clone.source as unknown as CoreAbstract;
    this.cloneOverlay = clone.overlay;
    this.wtTable = this.cloneOverlay.createTable(this.getTableDao(), facadeGetter, this.domBindings, this.wtSettings) as typeof this.wtTable;
    this.wtViewport = clone.viewport;
    this.selectionManager = clone.selectionManager;
    this.wtEvent = new Event(
      facadeGetter, this.domBindings, this.wtSettings, this.eventManager, this.wtTable,
      this.selectionManager, clone.event as Event | null
    );

    this.findOriginalHeaders();
  }
}
