import Event, { createEventDeps } from '../event';
import { createTableDeps } from '../table';
import CoreAbstract from './_base';
import type Settings from '../settings';
import type { CloneDeps } from '../overlay/_base';

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
  constructor(table: HTMLTableElement, settings: Settings, clone: CloneDeps) {
    super(table, settings);

    this.cloneSource = clone.source;
    this.cloneOverlay = clone.overlay;
    this.wtTable = this.cloneOverlay
      .createTable(createTableDeps(this.engineContext)) as typeof this.wtTable;
    this.wtViewport = clone.viewport;
    this.selectionManager = clone.selectionManager;
    // Event deps resolve `getWtTable()`/`getSelectionManager()` off this clone's context, so they
    // read the clone's own table and selection manager (set just above). The parent Event is the
    // per-instance link back to the master, kept as a separate argument.
    this.wtEvent = new Event(createEventDeps(this.engineContext), clone.event as Event | null);

    this.findOriginalHeaders();
  }
}
