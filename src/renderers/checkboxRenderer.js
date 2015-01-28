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

import * as dom from './../dom.js';
import * as helper from './../helpers.js';
import {eventManager as eventManagerObject} from './../eventManager.js';
import {getRenderer, registerRenderer} from './../renderers.js';

export {checkboxRenderer};

registerRenderer('checkbox', checkboxRenderer);

var clonableINPUT = document.createElement('INPUT');

clonableINPUT.className = 'htCheckboxRendererInput';
clonableINPUT.type = 'checkbox';
clonableINPUT.setAttribute('autocomplete', 'off');

function checkboxRenderer(instance, TD, row, col, prop, value, cellProperties) {

  var eventManager = eventManagerObject(instance);

  if (typeof cellProperties.checkedTemplate === "undefined") {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === "undefined") {
    cellProperties.uncheckedTemplate = false;
  }

  dom.empty(TD); //TODO identify under what circumstances this line can be removed

  var INPUT = clonableINPUT.cloneNode(false); //this is faster than createElement

  if (value === cellProperties.checkedTemplate || value === helper.stringify(cellProperties.checkedTemplate)) {
    INPUT.checked = true;
    TD.appendChild(INPUT);
  }
  else if (value === cellProperties.uncheckedTemplate || value === helper.stringify(cellProperties.uncheckedTemplate)) {
    TD.appendChild(INPUT);
  }
  else if (value === null) { //default value
    INPUT.className += ' noValue';
    TD.appendChild(INPUT);
  }
  else {
    dom.fastInnerText(TD, '#bad value#'); //this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  }

  if (cellProperties.readOnly) {
    eventManager.addEventListener(INPUT,'click',function (event) {
      event.preventDefault();
    });
  }
  else {
    eventManager.addEventListener(INPUT,'mousedown',function (event) {
      helper.stopPropagation(event);
      //event.stopPropagation(); //otherwise can confuse cell mousedown handler
    });

    eventManager.addEventListener(INPUT,'mouseup',function (event) {
      helper.stopPropagation(event);
      //event.stopPropagation(); //otherwise can confuse cell dblclick handler
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

      dom.enableImmediatePropagation(event);

      if(event.keyCode == helper.keyCode.SPACE || event.keyCode == helper.keyCode.ENTER){

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
}
