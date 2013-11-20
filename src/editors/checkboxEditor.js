(function(Handsontable){

  //Blank editor, because all the work is done by renderer
  var CheckboxEditor = Handsontable.editors.BaseEditor.prototype.extend();

  CheckboxEditor.prototype.beginEditing = function () {};
  CheckboxEditor.prototype.finishEditing = function () {};

  CheckboxEditor.prototype.init = function () {};
  CheckboxEditor.prototype.open = function () {};
  CheckboxEditor.prototype.close = function () {};
  CheckboxEditor.prototype.val = function () {};
  CheckboxEditor.prototype.focus = function () {};

  Handsontable.editors.CheckboxEditor = CheckboxEditor;
  Handsontable.editors.registerEditor('checkbox', CheckboxEditor);

})(Handsontable);

