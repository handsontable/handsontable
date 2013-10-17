(function (Handsontable) {
  var AutocompleteEditor = Handsontable.editors.HandsontableEditor.prototype.extend();

  AutocompleteEditor.prototype.createElements = function(){
    Handsontable.editors.HandsontableEditor.prototype.createElements.apply(this, arguments);

    this.$htContainer.addClass('autocompleteEditor');

  };

  AutocompleteEditor.prototype.bindEvents = function(){

    var that = this;
    this.$textarea.on('keydown.autocompleteEditor', function(event){
      if(!Handsontable.helper.isMetaKey(event.keyCode) || [Handsontable.helper.keyCode.BACKSPACE, Handsontable.helper.keyCode.DELETE].indexOf(event.keyCode) != -1){
        setTimeout(function () {
          that.queryChoices(that.$textarea.val());
        });
      }

    });

    Handsontable.editors.HandsontableEditor.prototype.bindEvents.apply(this, arguments);

  };

  AutocompleteEditor.prototype.beginEditing = function () {
    Handsontable.editors.HandsontableEditor.prototype.beginEditing.apply(this, arguments);

    var that = this;
    setTimeout(function () {
      that.queryChoices(that.TEXTAREA.value);
    });

    this.$htContainer.handsontable('updateSettings', {
      'colWidths': [this.wtDom.outerWidth(this.TEXTAREA) - 2]
    });
  };

  var onBeforeKeyDownInner;

  AutocompleteEditor.prototype.open = function () {

    var parent = this;

    onBeforeKeyDownInner = function (event) {
      var instance = this;

      if (event.keyCode == Handsontable.helper.keyCode.ARROW_UP){
        if (instance.getSelected() && instance.getSelected()[0] == 0){
          instance.deselectCell();
          parent.instance.listen();
          parent.focus();
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }

    };

    this.$htContainer.handsontable('getInstance').addHook('beforeKeyDown', onBeforeKeyDownInner);

    Handsontable.editors.HandsontableEditor.prototype.open.apply(this, arguments);

    this.$textarea[0].style.visibility = 'visible';
    parent.focus();
  };

  AutocompleteEditor.prototype.close = function () {

    this.$htContainer.handsontable('getInstance').removeHook('beforeKeyDown', onBeforeKeyDownInner);

    Handsontable.editors.HandsontableEditor.prototype.close.apply(this, arguments);
  };

  AutocompleteEditor.prototype.queryChoices = function(query){
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

  AutocompleteEditor.prototype.updateChoicesList = function (choices) {
    this.$htContainer.handsontable('loadData', Handsontable.helper.pivot([choices]));

    var value = this.val();
    var row;

    if(value.length > 0){
      for( var i = 0, len = choices.length; i < len; i++){
        if(choices[i] == value){
          row = i;
          break;
        }
      }
    }

    if(typeof row == 'undefined'){
      this.$htContainer.handsontable('deselectCell');
    } else {
      this.$htContainer.handsontable('selectCell', row, 0);
    }

    this.focus();
  };

  Handsontable.editors.AutocompleteEditor = AutocompleteEditor;
  Handsontable.editors.registerEditor('autocomplete', AutocompleteEditor);

})(Handsontable);
