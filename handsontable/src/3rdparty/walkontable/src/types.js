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
 * @todo Write descriptions.
 *
 * @typedef ScrollDao
 *
 * @property {boolean} drawn Is Walkontable drawn.
 * @property {MasterTable} wtTable WtTable.
 * @property {LeftOverlay} leftOverlay LeftOverlay.
 * @property {TopOverlay} topOverlay TopOverlay.
 * @property {number} fixedColumnsLeft FixedColumnsLeft.
 * @property {number} fixedRowsBottom FixedRowsBottom.
 * @property {number} fixedRowsTop FixedRowsTop.
 * @property {number} totalColumns TotalColumns.
 * @property {number} totalRows TotalRows.
 * @property {Window} rootWindow RootWindow.
 * @property {Viewport} wtViewport WtViewport.
 */
/**
 * @todo Write descriptions.
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
 * @todo Write descriptions.
 *
 * @typedef ViewportDao
 *
 * @property {HTMLElement} leftOverlayTrimmingContainer LeftOverlayTrimmingContainer.
 * @property {number} leftParentOffset LeftParentOffset.
 * @property {BottomOverlay} bottomOverlay BottomOverlay.
 * @property {number} leftScrollPosition LeftScrollPosition.
 * @property {LeftOverlay} leftOverlay LeftOverlay.
 * @property {TopOverlay} topOverlay TopOverlay.
 * @property {number} topParentOffset TopParentOffset.
 * @property {HTMLElement} topOverlayTrimmingContainer TopOverlayTrimmingContainer.
 * @property {Walkontable} wot Wot.
 * @property {number} topScrollPosition TopScrollPosition.
 */

