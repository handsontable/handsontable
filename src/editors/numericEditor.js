/**
 * Numeric editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Original value (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.NumericEditor = function (instance, td, row, col, prop, value, cellProperties) {
  if (!instance.numericEditor) {
    instance.numericEditor = new HandsontableTextEditorClass(instance);
    instance.numericEditor.dataType = 'number';
  }

  instance.numericEditor.bindEvents();

  instance.numericEditor.TD = td;
  instance.numericEditor.isCellEdited = false;
  instance.numericEditor.originalValue = value;

  instance.$table.on('keydown.editor', function (event) {
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (!instance.numericEditor.isCellEdited) {
      if (Handsontable.helper.isPrintableChar(event.keyCode)) {
        if (!ctrlDown) { //disregard CTRL-key shortcuts
          instance.numericEditor.beginEditing(row, col, prop);
        }
      }
      else if (event.keyCode === 113) { //f2
        instance.numericEditor.beginEditing(row, col, prop, true); //show edit field
        event.stopPropagation();
        event.preventDefault(); //prevent Opera from opening Go to Page dialog
      }
      else if (event.keyCode === 13 && instance.getSettings().enterBeginsEditing) { //enter
        var selected = instance.getSelected();
        var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
        if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
          instance.numericEditor.beginEditing(row, col, prop, true, '\n'); //show edit field
        }
        else {
          instance.numericEditor.beginEditing(row, col, prop, true); //show edit field
        }
        event.preventDefault(); //prevent new line at the end of textarea
        event.stopPropagation();
      }
    }
  });

  function onDblClick() {
    instance.numericEditor.beginEditing(row, col, prop, true);
  }

  instance.view.wt.update('onCellDblClick', onDblClick);

  return function (isCancelled) {
    instance.numericEditor.finishEditing(isCancelled);
  }
};