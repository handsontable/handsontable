(function (Handsontable) {

  'use strict';

  var FormatterEditor = Handsontable.editors.TextEditor.prototype.extend();

  FormatterEditor.prototype.init = function () {
    if (typeof Formatter === 'undefined') {
      throw new Error('You need to include formatter.js (lib/formatter.min.js) to your project in order to use the formatterEditor.');
    }
    Handsontable.editors.TextEditor.prototype.init.apply(this, arguments);
  };
  
  FormatterEditor.prototype.beginEditing = function (initialValue) {

    var BaseEditor = Handsontable.editors.TextEditor.prototype;
    var value;

    if (this.patternApplied === undefined) {
      if (  this.cellProperties.pattern !== undefined || 
            this.cellProperties.toJstype !== undefined || 
            this.cellProperties.fromJstype !== undefined) {
              this.patternApplied = new Formatter(this.TEXTAREA, {
              'pattern': this.cellProperties.pattern, 
              'persistent': true
            });
      } 
    }

    if (typeof (initialValue) === 'undefined' && this.originalValue) {

      value = this.originalValue;

      if (this.patternApplied) {
        value = this.cellProperties.fromJstype(value);
      }

      BaseEditor.beginEditing.apply(this, [value]);
    } else {
      BaseEditor.beginEditing.apply(this, arguments);
    }

    BaseEditor.beginEditing.apply(this, [value]);
  };

  FormatterEditor.prototype.finishEditing = function (restoreOriginalValue, ctrlDown, callback) {
    var val;
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
      var that = this;
      this.instance._registerTimeout(setTimeout(function () {
        that._fireCallbacks(true);
      }, 0));
      return;
    }

    if (this.state == Handsontable.EditorState.EDITING) {

      if (restoreOriginalValue) {

        this.cancelChanges();
        this.instance.view.render();
        return;

      }

      if (this.patternApplied) {
        val = String.prototype.trim.call(this.getValue());
        val = [
          [this.cellProperties.toJstype(val)]
        ];
      } else {
        val = [
          [String.prototype.trim.call(this.getValue())] // String.prototype.trim is defined in Walkontable polyfill.js
        ];
      }

      this.state = Handsontable.EditorState.WAITING;

      this.saveValue(val, ctrlDown);

      if(this.instance.getCellValidator(this.cellProperties)){
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

  Handsontable.editors.FormatterEditor = FormatterEditor;
  Handsontable.editors.registerEditor('formatter', FormatterEditor);

})(Handsontable);