/**
 * Object, which stores information about bound dom elements, window and document.
 *
 * @typedef DomBindings
 *
 * @property {HTMLTableElement} rootTable Target table, where the Walkontable binds.
 * @property {WindowProxy} rootWindow The window related to `rootTable`.
 * @property {Document} rootDocument The document of `rootWindow`.
 */
/** .
 * Function which return proper facade.
 * It should be uses ONLY for keeping backward compatibility when calling external methods (i.e. Event listeners).
 *
 * @typedef FacadeGetter
 *
 * @function
 * @returns {WalkontableFacade}
 */
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
/**
 * @typedef {*} Selections
 * @interface
 *
 * @todo Describe and set the type.
 * @todo I have no idea what it is, probably a class that implements an interface nowhere defined here.
 */
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
