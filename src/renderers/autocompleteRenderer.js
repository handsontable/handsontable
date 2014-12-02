(function (Handsontable) {

  var clonableWRAPPER = document.createElement('DIV');
  clonableWRAPPER.className = 'htAutocompleteWrapper';

  var clonableARROW = document.createElement('DIV');
  clonableARROW.className = 'htAutocompleteArrow';
  clonableARROW.appendChild(document.createTextNode(String.fromCharCode(9660))); // workaround for https://github.com/handsontable/handsontable/issues/1946
//this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips

  var wrapTdContentWithWrapper = function(TD, WRAPPER){
    WRAPPER.innerHTML = TD.innerHTML;
    Handsontable.Dom.empty(TD);
    TD.appendChild(WRAPPER);
  };

  /**
   * Autocomplete renderer
   * @param {Object} instance Handsontable instance
   * @param {Element} TD Table cell where to render
   * @param {Number} row
   * @param {Number} col
   * @param {String|Number} prop Row object property name
   * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
   * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
   */
  var AutocompleteRenderer = function (instance, TD, row, col, prop, value, cellProperties) {

    var WRAPPER = clonableWRAPPER.cloneNode(true); //this is faster than createElement
    var ARROW = clonableARROW.cloneNode(true); //this is faster than createElement

    Handsontable.renderers.TextRenderer(instance, TD, row, col, prop, value, cellProperties);

    TD.appendChild(ARROW);
    Handsontable.Dom.addClass(TD, 'htAutocomplete');


    if (!TD.firstChild) { //http://jsperf.com/empty-node-if-needed
      //otherwise empty fields appear borderless in demo/renderers.html (IE)
      TD.appendChild(document.createTextNode(String.fromCharCode(160))); // workaround for https://github.com/handsontable/handsontable/issues/1946
      //this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
    }



    if (!instance.acArrowListener) {
      var eventManager = Handsontable.eventManager(instance);

      //not very elegant but easy and fast
      instance.acArrowListener = function (event) {
        if (Handsontable.Dom.hasClass(event.target,'htAutocompleteArrow')) {
          instance.view.wt.getSetting('onCellDblClick', null, new WalkontableCellCoords(row, col), TD);
        }
      };

      eventManager.addEventListener(instance.rootElement,'mousedown',instance.acArrowListener);

      //We need to unbind the listener after the table has been destroyed
      instance.addHookOnce('afterDestroy', function () {
        eventManager.clear();
      });

    }
  };

  Handsontable.AutocompleteRenderer = AutocompleteRenderer;
  Handsontable.renderers.AutocompleteRenderer = AutocompleteRenderer;
  Handsontable.renderers.registerRenderer('autocomplete', AutocompleteRenderer);
})(Handsontable);
