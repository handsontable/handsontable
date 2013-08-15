var clonableINPUT = document.createElement('INPUT');
clonableINPUT.className = 'htCheckboxRendererInput';
clonableINPUT.type = 'checkbox';
clonableINPUT.setAttribute('autocomplete', 'off');

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
Handsontable.CheckboxRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
  if (typeof cellProperties.checkedTemplate === "undefined") {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === "undefined") {
    cellProperties.uncheckedTemplate = false;
  }

  instance.view.wt.wtDom.empty(TD); //TODO identify under what circumstances this line can be removed

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
    instance.view.wt.wtDom.fastInnerText(TD, '#bad value#'); //this is faster than innerHTML. See: https://github.com/warpech/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
  }

  var $input = $(INPUT);

  if (cellProperties.readOnly) {
    $input.on('click', function (event) {
      event.preventDefault();
    });
  }
  else {
    $input.on('mousedown', function (event) {
      event.stopPropagation(); //otherwise can confuse cell mousedown handler
    });

    $input.on('mouseup', function (event) {
      event.stopPropagation(); //otherwise can confuse cell dblclick handler
    });

    $input.on('change', function(){
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
       if(event.keyCode == 32){
         event.stopImmediatePropagation();
         event.preventDefault();

         var selection = instance.getSelected();
         var cell, checkbox, cellProperties;
         var selStart = {
           row: Math.min(selection[0], selection[2]),
           col: Math.min(selection[1], selection[3])
         };

         var selEnd = {
           row: Math.max(selection[0], selection[2]),
           col: Math.max(selection[1], selection[3])
         };

         for(var row = selStart.row; row <= selEnd.row; row++ ){
           for(var col = selEnd.col; col <= selEnd.col; col++){
             cell = instance.getCell(row, col);
             cellProperties = instance.getCellMeta(row, col);
             checkbox = cell.querySelectorAll('input[type=checkbox]');

             if(checkbox.length > 0 && !cellProperties.readOnly){
               for(var i = 0, len = checkbox.length; i < len; i++){
                 checkbox[i].checked = !checkbox[i].checked;
                 $(checkbox[i]).trigger('change');
               }
             }

           }
         }
       }
    });
  }

  return TD;
};