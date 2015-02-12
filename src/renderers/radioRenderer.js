/**
 * Radio renderer
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

  var clonableInputLABEL = document.createElement('LABEL'),
      clonableINPUT = document.createElement('INPUT');

  clonableINPUT.className = 'htRadioRendererInput';
  clonableINPUT.type = 'radio';
  clonableINPUT.setAttribute('autocomplete', 'off');

  var RadioRenderer = function (instance, TD, row, col, prop, value, cellProperties) {

    var eventManager = Handsontable.eventManager(instance);

    Handsontable.Dom.empty(TD); //TODO identify under what circumstances this line can be removed

    cellProperties.radioValues.forEach(function(val, idx) {
      var INPUT = clonableINPUT.cloneNode(false), //this is faster than createElement
          LABEL = clonableInputLABEL.cloneNode(false),
          id = [value, row, col].join('');

      LABEL.for = [id, '##', idx].join('');
      LABEL.innerHTML = val;
      INPUT.id = [id, '##', idx].join('');
      INPUT.value = val;
      INPUT.name = id;

      TD.appendChild(LABEL);

      if (~cellProperties.radioValues.indexOf(value) && value === val) { //cell values exists in possible values
        INPUT.checked = true;
      } else {
        INPUT.checked = false;
      }

      TD.appendChild(INPUT);

      if (cellProperties.readOnly) {
        eventManager.addEventListener(INPUT,'click',function (event) {
          event.preventDefault();
        });
      }
      else {

        //delegate the event
        eventManager.addEventListener(INPUT,'mousedown',function (event) {
          Handsontable.helper.stopPropagation(event);
          //event.stopPropagation(); //otherwise can confuse cell mousedown handler
        });

        //delegate the event
        eventManager.addEventListener(INPUT,'mouseup',function (event) {
          Handsontable.helper.stopPropagation(event);
          //event.stopPropagation(); //otherwise can confuse cell dblclick handler
        });

        //delegate the event
        eventManager.addEventListener(INPUT,'click',function (e) {

          if (e.target && e.target.nodeName == 'INPUT' && e.target.type == 'radio') {
            instance.setDataAtRowProp(row, prop, e.target.value);
          }
        });
      }
    });

    if(!instance.RadioRenderer || !instance.RadioRenderer.beforeKeyDownHookBound){
      instance.RadioRenderer = {
        beforeKeyDownHookBound : true
      };

      instance.addHook('beforeKeyDown', function(event){

        Handsontable.Dom.enableImmediatePropagation(event);

        if(event.keyCode == Handsontable.helper.keyCode.SPACE || event.keyCode == Handsontable.helper.keyCode.ENTER){

          var cell, radio, cellProperties;

          var selRange = instance.getSelectedRange();
          var topLeft = selRange.getTopLeftCorner();
          var bottomRight = selRange.getBottomRightCorner();

          for(var row = topLeft.row; row <= bottomRight.row; row++ ){
            for(var col = topLeft.col; col <= bottomRight.col; col++){
              cell = instance.getCell(row, col);
              cellProperties = instance.getCellMeta(row, col);

              radio = cell.querySelectorAll('input[type=radio]');

              if(radio.length > 0 && !cellProperties.readOnly){

                if(!event.isImmediatePropagationStopped()){
                  event.stopImmediatePropagation();
                  event.preventDefault();
                }

                for(var i = 0, len = radio.length; i < len; i++){
                  // jshint maxdepth:8
                  if (radio[i].checked) {
                    radio[i].checked = false;
                    if (i == len - 1) { //at the last radio in the list, kick to front
                        radio[0].checked = true;
                        eventManager.fireEvent(radio[0], 'click');
                        break;
                    } else {
                        radio[i+1].checked = true;
                        eventManager.fireEvent(radio[i+1], 'click');
                        break;
                    }
                  }
                }
              }
            }
          }
        }
      });
    }
  };

  Handsontable.RadioRenderer = RadioRenderer;
  Handsontable.renderers.RadioRenderer = RadioRenderer;
  Handsontable.renderers.registerRenderer('radio', RadioRenderer);

})(Handsontable);
