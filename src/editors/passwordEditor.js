(function(Handsontable){
  function HandsontablePasswordEditorClass(instance){
    HandsontableTextEditorClass.call(this, instance);
  }

  Handsontable.helper.inherit(HandsontablePasswordEditorClass, HandsontableTextEditorClass);

  HandsontablePasswordEditorClass.prototype.createElements = function(){
    this.STATE_VIRGIN = 'STATE_VIRGIN'; //before editing
    this.STATE_EDITING = 'STATE_EDITING';
    this.STATE_WAITING = 'STATE_WAITING'; //waiting for async validation
    this.STATE_FINISHED = 'STATE_FINISHED';

    this.state = this.STATE_VIRGIN;
    this.waitingEvent = null;

    this.wtDom = new WalkontableDom();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.className = 'handsontableInput';
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;
    this.$textarea = $(this.TEXTAREA);

    this.TEXTAREA_PARENT = document.createElement('DIV');
    this.TEXTAREA_PARENT.className = 'handsontableInputHolder';
    this.textareaParentStyle = this.TEXTAREA_PARENT.style;
    this.textareaParentStyle.top = 0;
    this.textareaParentStyle.left = 0;
    this.textareaParentStyle.display = 'none';

    this.$body = $(document.body);

    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
    this.instance.rootElement[0].appendChild(this.TEXTAREA_PARENT);
  };

  Handsontable.PasswordEditor = function (instance, td, row, col, prop, value, cellProperties) {
    if (!instance.passwordEditor) {
      instance.passwordEditor = new HandsontablePasswordEditorClass(instance);
    }
    if (instance.passwordEditor.state === instance.passwordEditor.STATE_VIRGIN || instance.passwordEditor.state === instance.passwordEditor.STATE_FINISHED) {
      instance.passwordEditor.bindTemporaryEvents(td, row, col, prop, value, cellProperties);
    }
    return function (isCancelled) {
      instance.passwordEditor.finishEditing(isCancelled);
    }
  };

})(Handsontable);
