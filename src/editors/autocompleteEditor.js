(function (Handsontable, HandsontableEditorClass) {

  function HandsontableAutocompleteEditorClass (instance){
    HandsontableEditorClass.call(this, instance);
  }

  Handsontable.helper.inherit(HandsontableAutocompleteEditorClass, HandsontableEditorClass);

  HandsontableAutocompleteEditorClass.prototype.createElements = function(){
    HandsontableEditorClass.prototype.createElements.apply(this, arguments);

    this.$htContainer.addClass('autocompleteEditor');

  };

  HandsontableAutocompleteEditorClass.prototype.bindEvents = function(){

    var that = this;
    this.$textarea.on('keydown.autocompleteEditor', function(event){
      if(!Handsontable.helper.isMetaKey(event.keyCode) || [Handsontable.helper.keyCode.BACKSPACE, Handsontable.helper.keyCode.DELETE].indexOf(event.keyCode) != -1){
        setTimeout(function () {
          that.queryChoices(that.$textarea.val());
        });
      }

    });

    HandsontableEditorClass.prototype.bindEvents.apply(this, arguments);

  };

  HandsontableAutocompleteEditorClass.prototype.bindTemporaryEvents = function (td, row, col, prop, value, cellProperties) {

    HandsontableEditorClass.prototype.bindTemporaryEvents.apply(this, arguments);

    this.cellProperties = cellProperties;
    this.td = td;

  };

  HandsontableAutocompleteEditorClass.prototype.beginEditing = function () {
    HandsontableEditorClass.prototype.beginEditing.apply(this, arguments);

    var that = this;
    setTimeout(function () {
      that.queryChoices(that.TEXTAREA.value);
    });

    this.$htContainer.handsontable('updateSettings', {
      'colWidths': [this.wtDom.outerWidth(this.TEXTAREA) - 2]
    });
  };

  HandsontableAutocompleteEditorClass.prototype.queryChoices = function(query){
    if (typeof this.cellProperties.source == 'function'){
      var that = this;

      this.cellProperties.source(query, function(choices){
        that.updateChoicesList(choices)
      });

    } else if (Handsontable.helper.isArray(this.cellProperties.source)) {

      var choices;

      if(!query){
        choices = this.cellProperties.source;
      } else {
        choices = this.cellProperties.source.filter(function(choice){
          return choice.indexOf(query) != -1
        });
      }

      this.updateChoicesList(choices)

    } else {
      this.updateChoicesList([]);
    }

  };

  HandsontableAutocompleteEditorClass.prototype.updateChoicesList = function (choices) {
    this.$htContainer.handsontable('loadData', Handsontable.helper.pivot([choices]));

    var value = this.TEXTAREA.value;
    var row;
    for( var i = 0, len = choices.length; i < len; i++){
     if(choices[i] == value){
       row = i;
       break;
     }
    }

    if(typeof row == 'undefined'){
      this.$htContainer.handsontable('deselectCell');
    } else {
      this.$htContainer.handsontable('selectCell', row, 0);
    }

    this.TEXTAREA.focus();
  };

  Handsontable.AutocompleteEditor = function (instance, td, row, col, prop, value, cellProperties) {
    if (!instance.autocompleteEditor) {
      instance.autocompleteEditor = new HandsontableAutocompleteEditorClass(instance);
    }
    instance.autocompleteEditor.bindTemporaryEvents(td, row, col, prop, value, cellProperties);
    return function (isCancelled) {
      instance.autocompleteEditor.finishEditing(isCancelled);
    }
  };



})(Handsontable, HandsontableHandsontableEditorClass);
