(function (Handsontable) {
  'use strict';

  Handsontable.EditorState = {
    VIRGIN: 'STATE_VIRGIN', //before editing
    EDITING: 'STATE_EDITING',
    WAITING: 'STATE_WAITING', //waiting for async validation
    FINISHED: 'STATE_FINISHED'
  };

  function BaseEditor(instance) {
    this.instance = instance;
    this.state = Handsontable.EditorState.VIRGIN;

    this._opened = false;

    this.init();
  }

  BaseEditor.prototype.init = function(){
    throw Error('Editor init() method unimplemented');
  };

  BaseEditor.prototype.val = function(newValue){
    throw Error('Editor val() method unimplemented');
  };

  BaseEditor.prototype.open = function(){
    throw Error('Editor open() method unimplemented');
  };

  BaseEditor.prototype.close = function(){
    throw Error('Editor close() method unimplemented');
  };

  BaseEditor.prototype.prepare = function(row, col, prop, td, originalValue, cellProperties){
    this.TD = td;
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.originalValue = originalValue;
    this.cellProperties = cellProperties;

    this.state = Handsontable.EditorState.VIRGIN;
  };

  BaseEditor.prototype.extend = function(){
    var baseClass = this.constructor;
    function Editor(){
      baseClass.apply(this, arguments);
    };

    return Handsontable.helper.inherit(Editor, baseClass);
  };

  BaseEditor.prototype.saveValue = function (val, ctrlDown) {
    if (ctrlDown) { //if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
      var sel = this.instance.getSelected();
      this.instance.populateFromArray(sel[0], sel[1], val, sel[2], sel[3], 'edit');
    }
    else {
      this.instance.populateFromArray(this.row, this.col, val, null, null, 'edit');
    }
  };

  BaseEditor.prototype.beginEditing = function(initialValue){
    if (this.state != Handsontable.EditorState.VIRGIN) {
      return;
    }

    if (this.cellProperties.readOnly) {
      return;
    }

    this.state = Handsontable.EditorState.EDITING;

    initialValue = typeof initialValue == 'string' ? initialValue : this.originalValue;

    this.val(Handsontable.helper.stringify(initialValue));

    this.open();
    this._opened = true;

    this.instance.view.scrollViewport({row: this.row, col: this.col});
    this.instance.view.render();
  };

  BaseEditor.prototype.finishEditing = function (restoreOriginalValue, ctrlDown) {

    var deferred = $.Deferred();

    if (this.state == Handsontable.EditorState.WAITING || this.state == Handsontable.EditorState.FINISHED) {
      setTimeout(function(){
        deferred.reject();
      })
      return deferred.promise();
    }

    if (this.state == Handsontable.EditorState.EDITING) {
      var val;

      if (restoreOriginalValue) {
        val = [
          [this.originalValue]
        ];
      } else {
        val = [
          [$.trim(this.val())]
        ];
      }

      var hasValidator = this.instance.getCellMeta(this.row, this.col).validator;

      if (hasValidator) {
        this.state = Handsontable.EditorState.WAITING;
        var that = this;
        this.instance.addHookOnce('afterValidate', function (result) {
          that.state = Handsontable.EditorState.FINISHED;
          that.discardEditor(deferred, result);
        });
      }
      this.saveValue(val, ctrlDown);
    }

    if (!hasValidator) {
      this.state = Handsontable.EditorState.FINISHED;
      this.discardEditor(deferred);
    }

    return deferred.promise();
  };

  BaseEditor.prototype.discardEditor = function (deferred, result) {

    var wtDom = new WalkontableDom();

    if (this.state !== Handsontable.EditorState.FINISHED) {
      return;
    }

    if (result === false && this.cellProperties.allowInvalid !== true) { //validator was defined and failed
      this.state = Handsontable.EditorState.EDITING;
      this.focus();
      deferred.reject();
    }
    else {
      this.close();
      this._opened = false;

      if (this.waitingEvent) { //this is needed so when you finish editing with Enter key, the default Enter behavior (move selection down) will work after async validation
        var ev = $.Event(this.waitingEvent.type);
        ev.keyCode = this.waitingEvent.keyCode;
        this.waitingEvent = null;
        $(document.activeElement).trigger(ev);
      }

      deferred.resolve();
    }

    this.state = Handsontable.EditorState.VIRGIN;
  };

  BaseEditor.prototype.isOpened = function(){
    return this._opened;
  };

  Handsontable.editors.BaseEditor = BaseEditor;

})(Handsontable);
