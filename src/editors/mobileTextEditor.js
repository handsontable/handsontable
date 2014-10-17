(function (Handsontable) {

  var MobileTextEditor = Handsontable.editors.BaseEditor.prototype.extend();

  MobileTextEditor.prototype.init = function () {
    this.createElements();
    this.bindEvents();
  };

  MobileTextEditor.prototype.getValue = function () {
    return this.TEXTAREA.value
  };

  MobileTextEditor.prototype.setValue = function (newValue) {
    this.TEXTAREA.value = newValue;
  };

  MobileTextEditor.prototype.createElements = function () {
    this.editorContainer = document.createElement('DIV');
    this.editorContainer.id = "mobile-editor-container";

    this.inputPane = document.createElement('DIV');
    this.inputPane.className = "inputs";

    this.TEXTAREA = document.createElement('TEXTAREA');
    this.inputPane.appendChild(this.TEXTAREA);

    this.editorContainer.appendChild(this.inputPane);

    this.instance.rootElement[0].parentNode.appendChild(this.editorContainer);
//    document.body.appendChild(this.editorContainer);
  };

  MobileTextEditor.prototype.onBeforeKeyDown = function (event) {
    var instance = this;
    var that = instance.getActiveEditor();

    if (event.target !== that.TEXTAREA || event.isImmediatePropagationStopped()){
      return;
    }

    var keyCodes = Handsontable.helper.keyCode;

console.log(keyCodes);

    switch(event.keyCode) {
      case keyCodes.ENTER:
        console.log('enter');
        event.preventDefault(); //don't add newline to field
        break;
      case keyCodes.BACKSPACE:

        event.stopImmediatePropagation(); //backspace, delete, home, end should only work locally when cell is edited (not in table context)
        break;
    }

    console.log('before key down', event);
  };

  MobileTextEditor.prototype.open = function () {
    this.instance.addHook('beforeKeyDown', this.onBeforeKeyDown);

    Handsontable.Dom.addClass(this.editorContainer, 'active');
  };

  MobileTextEditor.prototype.focus = function(){
    this.TEXTAREA.focus();
    Handsontable.Dom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  };

  MobileTextEditor.prototype.close = function () {
    this.instance.removeHook('beforeKeyDown', this.onBeforeKeyDown);

    Handsontable.Dom.removeClass(this.editorContainer, 'active');
  };

  MobileTextEditor.prototype.bindEvents = function () {

  };

  Handsontable.editors.MobileTextEditor = MobileTextEditor;
  Handsontable.editors.registerEditor('mobile', Handsontable.editors.MobileTextEditor);


})(Handsontable);
