/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

import {isMobileBrowser} from './helpers/browser';

Handsontable.mobileBrowser = isMobileBrowser();

//here setup the friendly aliases that are used by cellProperties.type
Handsontable.cellTypes = {};

//here setup the friendly aliases that are used by cellProperties.renderer and cellProperties.editor
Handsontable.cellLookup = {
  validator: {
  }
};
