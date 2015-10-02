
import {addClass, hasClass, empty} from './../helpers/dom/element';
import {eventManager as eventManagerObject} from './../eventManager';
import {getRenderer, registerRenderer} from './../renderers';
import {WalkontableCellCoords} from './../3rdparty/walkontable/src/cell/coords';

var clonableWRAPPER = document.createElement('DIV');
clonableWRAPPER.className = 'htAutocompleteWrapper';

var clonableARROW = document.createElement('DIV');
clonableARROW.className = 'htAutocompleteArrow';
// workaround for https://github.com/handsontable/handsontable/issues/1946
// this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
clonableARROW.appendChild(document.createTextNode(String.fromCharCode(9660)));

var wrapTdContentWithWrapper = function(TD, WRAPPER) {
  WRAPPER.innerHTML = TD.innerHTML;
  empty(TD);
  TD.appendChild(WRAPPER);
};

/**
 * Autocomplete renderer
 *
 * @private
 * @renderer AutocompleteRenderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
function autocompleteRenderer(instance, TD, row, col, prop, value, cellProperties) {
  var WRAPPER = clonableWRAPPER.cloneNode(true); //this is faster than createElement
  var ARROW = clonableARROW.cloneNode(true); //this is faster than createElement

  getRenderer('text')(instance, TD, row, col, prop, value, cellProperties);

  TD.appendChild(ARROW);
  addClass(TD, 'htAutocomplete');

  if (!TD.firstChild) { //http://jsperf.com/empty-node-if-needed
    //otherwise empty fields appear borderless in demo/renderers.html (IE)
    TD.appendChild(document.createTextNode(String.fromCharCode(160))); // workaround for https://github.com/handsontable/handsontable/issues/1946
    //this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  }

  if (!instance.acArrowListener) {
    var eventManager = eventManagerObject(instance);

    //not very elegant but easy and fast
    instance.acArrowListener = function(event) {
      if (hasClass(event.target, 'htAutocompleteArrow')) {
        instance.view.wt.getSetting('onCellDblClick', null, new WalkontableCellCoords(row, col), TD);
      }
    };

    eventManager.addEventListener(instance.rootElement, 'mousedown', instance.acArrowListener);

    //We need to unbind the listener after the table has been destroyed
    instance.addHookOnce('afterDestroy', function() {
      eventManager.destroy();
    });
  }
}

export {autocompleteRenderer};

registerRenderer('autocomplete', autocompleteRenderer);
