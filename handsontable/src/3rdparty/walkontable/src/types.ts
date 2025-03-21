/**
 * Object, which stores information about bound dom elements, window and document.
 *
 * @typedef DomBindings
 *
 * @property {HTMLTableElement} rootTable Target table, where the Walkontable binds.
 * @property {WindowProxy} rootWindow The window related to `rootTable`.
 * @property {Document} rootDocument The document of `rootWindow`.
 */
export interface DomBindings {
  rootTable: HTMLTableElement;
  rootWindow: WindowProxy;
  rootDocument: Document;
}

/**
 * Function which return proper facade.
 * It should be uses ONLY for keeping backward compatibility when calling external methods (i.e. Event listeners).
 *
 * @typedef FacadeGetter
 *
 * @function
 * @returns {WalkontableFacade}
 */
export interface FacadeGetter {
  (): WalkontableFacade;
}

/**
 * The information for creating a clone of Walkontable.
 *
 * @typedef WalkontableCloneOptions
 *
 * @property {Selections} selections Info about selections.
 * @property {Overlay} overlay The walkontable overlay.
 * @property {Viewport} viewport The viewport.
 * @property {Walkontable} source The parent walkontable instance.
 * @property {Event} event The event subscriber.
 */
export interface WalkontableCloneOptions {
  selections: Selections;
  overlay: Overlay;
  viewport: Viewport;
  source: Walkontable;
  event: EventManager;
}

/**
 * @typedef {*} Selections
 * @interface
 *
 * @todo Describe and set the type.
 * @todo I have no idea what it is, probably a class that implements an interface nowhere defined here.
 */
export interface Selections {
  // This is a placeholder interface. Will be refined based on actual usage.
  [key: string]: any;
}

/**
 * The Data Access Object for Scroll class.
 *
 * @typedef ScrollDao
 *
 * @property {boolean} drawn Is Walkontable drawn.
 * @property {MasterTable} wtTable WtTable.
 * @property {InlineStartOverlay} inlineStartOverlay InlineStartOverlay.
 * @property {TopOverlay} topOverlay TopOverlay.
 * @property {number} fixedColumnsStart FixedColumnsStart.
 * @property {number} fixedRowsBottom FixedRowsBottom.
 * @property {number} fixedRowsTop FixedRowsTop.
 * @property {number} totalColumns TotalColumns.
 * @property {number} totalRows TotalRows.
 * @property {Window} rootWindow RootWindow.
 * @property {Viewport} wtViewport WtViewport.
 * @property {Settings} wtSettings Walkontable Settings.
 */
export interface ScrollDao {
  drawn: boolean;
  wtTable: MasterTable;
  inlineStartOverlay: InlineStartOverlay;
  topOverlay: TopOverlay;
  fixedColumnsStart: number;
  fixedRowsBottom: number;
  fixedRowsTop: number;
  totalColumns: number;
  totalRows: number;
  rootWindow: Window;
  wtViewport: Viewport;
  wtSettings: Settings;
}

/**
 * The Data Access Object for Table class.
 *
 * @typedef TableDao
 *
 * @property {boolean} drawn Is Walkontable drawn.
 * @property {Table} wtTable WtTable.
 * @property {Viewport} wtViewport WtViewport.
 * @property {Overlays} wtOverlays WtOverlays.
 * @property {Selections} selections Selections.
 * @property {number|string} workspaceWidth WorkspaceWidth.
 * @property {Walkontable} cloneSource CloneSource.
 * @property {Walkontable} wot Wot.
 * @property {number} parentTableOffset ParentTableOffset.
 * @property {StylesHandler} stylesHandler StylesHandler.
 * @property {number|null} startColumnRendered StartColumnRendered.
 * @property {number|null} startColumnVisible StartColumnVisible.
 * @property {number|null} endColumnRendered EndColumnRendered.
 * @property {number|null} endColumnVisible EndColumnVisible.
 * @property {number|null} countColumnsRendered CountColumnsRendered.
 * @property {number|null} countColumnsVisible CountColumnsVisible.
 * @property {number|null} startRowRendered StartRowRendered.
 * @property {number|null} startRowVisible StartRowVisible.
 * @property {number|null} endRowRendered EndRowRendered.
 * @property {number|null} endRowVisible EndRowVisible.
 * @property {number|null} countRowsRendered CountRowsRendered.
 * @property {number|null} countRowsVisible CountRowsVisible.
 */
export interface TableDao {
  drawn: boolean;
  wtTable: Table;
  wtViewport: Viewport;
  wtOverlays: Overlays;
  selections: Selections;
  workspaceWidth: number | string;
  cloneSource: Walkontable;
  wot: Walkontable;
  parentTableOffset: number;
  stylesHandler: StylesHandler;
  startColumnRendered: number | null;
  startColumnVisible: number | null;
  endColumnRendered: number | null;
  endColumnVisible: number | null;
  countColumnsRendered: number | null;
  countColumnsVisible: number | null;
  startRowRendered: number | null;
  startRowVisible: number | null;
  endRowRendered: number | null;
  endRowVisible: number | null;
  countRowsRendered: number | null;
  countRowsVisible: number | null;
}

/**
 * The Data Access Object for Viewport class.
 *
 * @typedef ViewportDao
 *
 * @property {HTMLElement} inlineStartOverlayTrimmingContainer InlineStartOverlayTrimmingContainer.
 * @property {number} inlineStartParentOffset InlineStartParentOffset.
 * @property {BottomOverlay} bottomOverlay BottomOverlay.
 * @property {number} inlineStartScrollPosition InlineStartScrollPosition.
 * @property {InlineStartOverlay} inlineStartOverlay InlineStartOverlay.
 * @property {TopOverlay} topOverlay TopOverlay.
 * @property {number} topParentOffset TopParentOffset.
 * @property {HTMLElement} topOverlayTrimmingContainer TopOverlayTrimmingContainer.
 * @property {Walkontable} wot Wot.
 * @property {number} topScrollPosition TopScrollPosition.
 */
export interface ViewportDao {
  inlineStartOverlayTrimmingContainer: HTMLElement;
  inlineStartParentOffset: number;
  bottomOverlay: BottomOverlay;
  inlineStartScrollPosition: number;
  inlineStartOverlay: InlineStartOverlay;
  topOverlay: TopOverlay;
  topParentOffset: number;
  topOverlayTrimmingContainer: HTMLElement;
  wot: Walkontable;
  topScrollPosition: number;
}

// Reference the facade interface from the facade/interfaces.ts file
import { IWalkontableFacade } from './facade/interfaces';

// Additional placeholder interfaces for types referenced in the above interfaces
export type WalkontableFacade = IWalkontableFacade;

export interface Walkontable {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface Overlay {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface Viewport {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface EventManager {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface MasterTable {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface Table {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface InlineStartOverlay {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface TopOverlay {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface BottomOverlay {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface Overlays {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface Settings {
  // Will be defined based on actual implementation
  [key: string]: any;
}

export interface StylesHandler {
  // Will be defined based on actual implementation
  [key: string]: any;
}

/**
 * Represents the calculation type for columns.
 */
export interface ColumnsCalculationType {
  startColumn: number | null;
  endColumn: number | null;
  count: number;
  startPosition: number | null;
  isVisibleInTrimmingContainer: boolean;
}

/**
 * Represents the calculation type for rows.
 */
export interface RowsCalculationType {
  startRow: number | null;
  endRow: number | null;
  count: number;
  startPosition: number | null;
  isVisibleInTrimmingContainer: boolean;
}

/**
 * Calculator object factory, holds the calculation context.
 */
export interface CalculatorContext {
  // Will be defined based on actual implementation
  [key: string]: any;
}

/**
 * Calculator instance prototype.
 */
export interface CalculatorInstance {
  initialize: (context: CalculatorContext) => void;
  process: (index: number, context: CalculatorContext) => void;
  finalize: (context: CalculatorContext) => void;
}
