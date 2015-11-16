/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

import {isMobileBrowser} from './helpers/browser';
import {getEditorConstructor} from './editors';
import {getRenderer} from './renderers';

import {TextEditor} from './editors/textEditor';

import {TextRenderer} from './renderers/textRenderer';

Handsontable.mobileBrowser = isMobileBrowser();

Handsontable.TextCell = {
  editor: Handsontable.mobileBrowser ? getEditorConstructor('mobile') : getEditorConstructor('text'),
  renderer: getRenderer('text'),
};

//here setup the friendly aliases that are used by cellProperties.type
Handsontable.cellTypes = {
  text: Handsontable.TextCell
};

//here setup the friendly aliases that are used by cellProperties.renderer and cellProperties.editor
Handsontable.cellLookup = {
  validator: {
  }
};
