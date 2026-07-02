import Event, { createEventDeps } from '../event';
import Overlays, { createOverlaysDeps } from '../overlays';
import { CLONE_TYPES } from '../overlay';
import Settings from '../settings';
import MasterTable from '../table/master';
import { createTableDeps } from '../table';
import Viewport, { createViewportDeps } from '../viewport';
import CoreAbstract from './_base';
import { SelectionManager } from '../selection/manager';
import type { Overlay } from '../overlay/_base';
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
  constructor(table: HTMLTableElement, settings: Record<string, unknown>) {
    super(table, new Settings(settings));

    this.wtTable = new MasterTable(createTableDeps(this.engineContext));
    // Built after the master table exists (the deps resolve `getWtTable()` concretely); the overlays
    // are still late-bound and come through as thunks in the deps.
    this.wtViewport = new Viewport(createViewportDeps(this.engineContext));
    this.selectionManager = new SelectionManager(this.wtSettings.getSetting('selections'));
    this.wtEvent = new Event(createEventDeps(this.engineContext));
    this.wtOverlays = new Overlays(createOverlaysDeps(this.engineContext));

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
    const allClassNames: string[] = [];
    const newClassNames: string[] = [];

    objectEach(toExport, (className: string, key: string) => {
      if (this.wtSettings.getSetting<unknown[]>(key).length) {
        newClassNames.push(className);
      }
      allClassNames.push(className);
    });
    removeClass(this.wtTable.wtRootElement.parentNode as HTMLElement, allClassNames);
    addClass(this.wtTable.wtRootElement.parentNode as HTMLElement, newClassNames);
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.wtTable.destroy();
    super.destroy();
  }

  /**
   * Gets the overlay instance by its name.
   *
   * @param {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'} overlayName The overlay name.
   * @returns {Overlay | null}
   */
  override getOverlayByName(overlayName: string): Overlay | null {
    if (!CLONE_TYPES.includes(overlayName)) {
      return null;
    }

    const camelCaseOverlay = overlayName.replace(/_([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());

    type OverlayRecord = Pick<Overlays,
      'topOverlay' | 'bottomOverlay' | 'inlineStartOverlay' |
      'topInlineStartCornerOverlay' | 'bottomInlineStartCornerOverlay'
    >;

    return (this.wtOverlays as OverlayRecord as Record<string, Overlay>)[`${camelCaseOverlay}Overlay`] ?? null;
  }

}
