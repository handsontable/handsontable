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
    this._closeCallback = function () {
    };

    this.init();
  }

  BaseEditor.prototype._fireCallbacks = function(result) {
    this._closeCallback(result);
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
    }

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

    this.instance.view.scrollViewport({row: this.row, col: this.col});
    this.instance.view.render();

    this.state = Handsontable.EditorState.EDITING;

    initialValue = typeof initialValue == 'string' ? initialValue : this.originalValue;

    this.val(Handsontable.helper.stringify(initialValue));

    this.open();
    this._opened = true;

    this.instance.view.render(); //only rerender the selections (FillHandle should disappear when beginediting is triggered)
  };

  BaseEditor.prototype.finishEditing = function (restoreOriginalValue, ctrlDown, callback) {

    if (callback) {
      var old = this._closeCallback;
      this._closeCallback = function (result) {
        old(result);
        callback(result);
      };
    }

    if (this.isWaiting()) {
      return;
    }

    this._closeCallback = function () {
    };

    if (this.state == Handsontable.EditorState.VIRGIN) {
      var that = this;
      setTimeout(function () {
        that._fireCallbacks(true);
      });
      return;
    }

    if (this.state == Handsontable.EditorState.EDITING) {
      var val;

      if (restoreOriginalValue) {
        val = [
          [this.originalValue]
        ];
      } else {
        val = [
          [this.val().trim()] //String.prototype.trim is defined in Walkontable polyfill.js
        ];
      }

      this.state = Handsontable.EditorState.WAITING;

      this.saveValue(val, ctrlDown);

      if(this.instance.getCellValidator(this.row, this.col)){
        var that = this;
        this.instance.addHookOnce('afterValidate', function (result) {
          that.state = Handsontable.EditorState.FINISHED;
          that.discardEditor(result);
        });
      } else {
        this.state = Handsontable.EditorState.FINISHED;
        this.discardEditor(true);
      }

    }
  };

  BaseEditor.prototype.discardEditor = function (result) {
    if (this.state !== Handsontable.EditorState.FINISHED) {
      return;
    }

    if (result === false && this.cellProperties.allowInvalid !== true) { //validator was defined and failed

      this.instance.selectCell(this.row, this.col);
      this.focus();

      this.state = Handsontable.EditorState.EDITING;

      this._fireCallbacks(false);
    }
    else {
      this.close();
      this._opened = false;

      this.state = Handsontable.EditorState.VIRGIN;

      this._fireCallbacks(true);
    }

  };

  BaseEditor.prototype.isOpened = function(){
    return this._opened;
  };

  BaseEditor.prototype.isWaiting = function () {
    return this.state === Handsontable.EditorState.WAITING;
  };

  Handsontable.editors.BaseEditor = BaseEditor;

})(Handsontable);
