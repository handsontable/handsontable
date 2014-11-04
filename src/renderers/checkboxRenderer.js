/**
 * Checkbox renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
(function (Handsontable) {

  'use strict';

  var clonableINPUT = document.createElement('INPUT');
  clonableINPUT.className = 'htCheckboxRendererInput';
  clonableINPUT.type = 'checkbox';
  clonableINPUT.setAttribute('autocomplete', 'off');

  var CheckboxRenderer = function (instance, TD, row, col, prop, value, cellProperties) {

    var eventManager = Handsontable.eventManager(instance);

    if (typeof cellProperties.checkedTemplate === "undefined") {
      cellProperties.checkedTemplate = true;
    }
    if (typeof cellProperties.uncheckedTemplate === "undefined") {
      cellProperties.uncheckedTemplate = false;
    }

    Handsontable.Dom.empty(TD); //TODO identify under what circumstances this line can be removed

    var INPUT = clonableINPUT.cloneNode(false); //this is faster than createElement

    if (value === cellProperties.checkedTemplate || value === Handsontable.helper.stringify(cellProperties.checkedTemplate)) {
      INPUT.checked = true;
      TD.appendChild(INPUT);
    }
    else if (value === cellProperties.uncheckedTemplate || value === Handsontable.helper.stringify(cellProperties.uncheckedTemplate)) {
      TD.appendChild(INPUT);
    }
    else if (value === null) { //default value
      INPUT.className += ' noValue';
      TD.appendChild(INPUT);
    }
    else {
      Handsontable.Dom.fastInnerText(TD, '#bad value#'); //this is faster than innerHTML. See: https://github.com/handsontable/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
    }

    if (cellProperties.readOnly) {
      eventManager.addEventListener(INPUT,'click',function (event) {
        event.preventDefault();
      });
    }
    else {
      eventManager.addEventListener(INPUT,'mousedown',function (event) {
        event.stopPropagation(); //otherwise can confuse cell mousedown handler
      });

      eventManager.addEventListener(INPUT,'mouseup',function (event) {
        event.stopPropagation(); //otherwise can confuse cell dblclick handler
      });

      eventManager.addEventListener(INPUT,'change',function () {
        if (this.checked) {
          instance.setDataAtRowProp(row, prop, cellProperties.checkedTemplate);
        }
        else {
          instance.setDataAtRowProp(row, prop, cellProperties.uncheckedTemplate);
        }
      });
    }

    if(!instance.CheckboxRenderer || !instance.CheckboxRenderer.beforeKeyDownHookBound){
      instance.CheckboxRenderer = {
        beforeKeyDownHookBound : true
      };

      instance.addHook('beforeKeyDown', function(event){

        if (event != null && event.isImmediatePropagationEnabled == null) {
          event.stopImmediatePropagation = function () {
            this.isImmediatePropagationEnabled = false;
            this.cancelBubble = true;
          };
          event.isImmediatePropagationEnabled = true;
          event.isImmediatePropagationStopped = function () {
            return !this.isImmediatePropagationEnabled;
          };
        }

        if(event.keyCode == Handsontable.helper.keyCode.SPACE || event.keyCode == Handsontable.helper.keyCode.ENTER){

          var cell, checkbox, cellProperties;

          var selRange = instance.getSelectedRange();
          var topLeft = selRange.getTopLeftCorner();
          var bottomRight = selRange.getBottomRightCorner();

          for(var row = topLeft.row; row <= bottomRight.row; row++ ){
            for(var col = topLeft.col; col <= bottomRight.col; col++){
              cell = instance.getCell(row, col);
              cellProperties = instance.getCellMeta(row, col);

              checkbox = cell.querySelectorAll('input[type=checkbox]');

              if(checkbox.length > 0 && !cellProperties.readOnly){

                if(!event.isImmediatePropagationStopped()){
                  event.stopImmediatePropagation();
                  event.preventDefault();
                }

                for(var i = 0, len = checkbox.length; i < len; i++){
                  checkbox[i].checked = !checkbox[i].checked;
                  eventManager.fireEvent(checkbox[i], 'change');
                }

              }

            }
          }
        }
      });
    }

  };

  Handsontable.CheckboxRenderer = CheckboxRenderer;
  Handsontable.renderers.CheckboxRenderer = CheckboxRenderer;
  Handsontable.renderers.registerRenderer('checkbox', CheckboxRenderer);

})(Handsontable);
