(function(Handsontable){

  //Blank editor, because all the work is done by renderer
  var RadioEditor = Handsontable.editors.BaseEditor.prototype.extend();

  RadioEditor.prototype.beginEditing = function () {
    var radio = this.TD.querySelector('input[type="radio"]');

    if (radio) {
      radio.click();
    }

  };

  RadioEditor.prototype.finishEditing = function () {};

  RadioEditor.prototype.init = function () {};
  RadioEditor.prototype.open = function () {};
  RadioEditor.prototype.close = function () {};
  RadioEditor.prototype.getValue = function () {};
  RadioEditor.prototype.setValue = function () {};
  RadioEditor.prototype.focus = function () {};

  Handsontable.editors.RadioEditor = RadioEditor;
  Handsontable.editors.registerEditor('radio', RadioEditor);

})(Handsontable);

