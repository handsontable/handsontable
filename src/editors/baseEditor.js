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
    this._closeCallback = null;

    this.init();
  }

  BaseEditor.prototype._fireCallbacks = function(result) {
    if(this._closeCallback){
      this._closeCallback(result);
      this._closeCallback = null;
    }
  };

  BaseEditor.prototype.init = function(){};

  BaseEditor.prototype.getValue = function(){
    throw Error('Editor getValue() method unimplemented');
  };

  BaseEditor.prototype.setValue = function(newValue){
    throw Error('Editor setValue() method unimplemented');
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

    function inherit(Child, Parent){
      function Bridge() {
      }

      Bridge.prototype = Parent.prototype;
      Child.prototype = new Bridge();
      Child.prototype.constructor = Child;
      return Child;
    }

    return inherit(Editor, baseClass);
  };

  BaseEditor.prototype.saveValue = function (val, ctrlDown) {
    if (ctrlDown) { //if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
      var sel = this.instance.getSelected()
        , tmp;

      if(sel[0] > sel[2]) {
        tmp = sel[0];
        sel[0] = sel[2];
        sel[2] = tmp;
      }
      if(sel[1] > sel[3]) {
        tmp = sel[1];
        sel[1] = sel[3];
        sel[3] = tmp;
      }

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

    this.instance.view.scrollViewport(new WalkontableCellCoords(this.row, this.col));
    this.instance.view.render();

    this.state = Handsontable.EditorState.EDITING;

    initialValue = typeof initialValue == 'string' ? initialValue : this.originalValue;

    this.setValue(Handsontable.helper.stringify(initialValue));

    this.open();
    this._opened = true;
    this.focus();

    this.instance.view.render(); //only rerender the selections (FillHandle should disappear when beginediting is triggered)
  };

  BaseEditor.prototype.finishEditing = function (restoreOriginalValue, ctrlDown, callback) {
    var _this = this;

    if (callback) {
      var previousCloseCallback = this._closeCallback;

      this._closeCallback = function (result) {
        if(previousCloseCallback){
          previousCloseCallback(result);
        }
        callback(result);
      };
    }

    if (this.isWaiting()) {
      return;
    }

    if (this.state == Handsontable.EditorState.VIRGIN) {
      this.instance._registerTimeout(setTimeout(function () {
        _this._fireCallbacks(true);
      }, 0));

      return;
    }

    if (this.state == Handsontable.EditorState.EDITING) {
      if (restoreOriginalValue) {
        this.cancelChanges();
        this.instance.view.render();

        return;
      }
      var val = [
        [String.prototype.trim.call(this.getValue())] // String.prototype.trim is defined in Walkontable polyfill.js
      ];

      this.state = Handsontable.EditorState.WAITING;
      this.saveValue(val, ctrlDown);

      if (this.instance.getCellValidator(this.cellProperties)) {
        this.instance.addHookOnce('postAfterValidate', function (result) {
          _this.state = Handsontable.EditorState.FINISHED;
          _this.discardEditor(result);
        });
      } else {
        this.state = Handsontable.EditorState.FINISHED;
        this.discardEditor(true);
      }
    }
  };

  BaseEditor.prototype.cancelChanges = function () {
    this.state = Handsontable.EditorState.FINISHED;
    this.discardEditor();
  };

  BaseEditor.prototype.discardEditor = function (result) {
    if (this.state !== Handsontable.EditorState.FINISHED) {
      return;
    }
    // validator was defined and failed
    if (result === false && this.cellProperties.allowInvalid !== true) {
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
