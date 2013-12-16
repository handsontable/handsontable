(function (Handsontable) {
  var AutocompleteEditor = Handsontable.editors.HandsontableEditor.prototype.extend();

  AutocompleteEditor.prototype.init = function () {
    Handsontable.editors.HandsontableEditor.prototype.init.apply(this, arguments);

    this.query = null;
  };

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
      } else if (event.keyCode == Handsontable.helper.keyCode.ENTER && that.cellProperties.strict !== true){
        that.$htContainer.handsontable('deselectCell');
      }

    });

    this.$htContainer.on('mouseenter', function () {
      that.$htContainer.handsontable('deselectCell');
    });

    this.$htContainer.on('mouseleave', function () {
      that.queryChoices(that.query);
    });

    Handsontable.editors.HandsontableEditor.prototype.bindEvents.apply(this, arguments);

  };

  AutocompleteEditor.prototype.beginEditing = function () {
    Handsontable.editors.HandsontableEditor.prototype.beginEditing.apply(this, arguments);

    var that = this;
    setTimeout(function () {
      that.queryChoices(that.TEXTAREA.value);
    });

    var hot =  this.$htContainer.handsontable('getInstance');

    hot.updateSettings({
      'colWidths': [this.wtDom.outerWidth(this.TEXTAREA) - 2],
      afterRenderer: function (TD, row, col, prop, value, cellProperties) {
        var match = TD.innerHTML.match(new RegExp(that.query, 'i'));
        if(match){
          TD.innerHTML = value.replace(match[0], '<strong>' + match[0] + '</strong>');
        }
      }
    });


  };

  var onBeforeKeyDownInner;

  AutocompleteEditor.prototype.open = function () {

    var parent = this;

    onBeforeKeyDownInner = function (event) {
      var instance = this;

      if (event.keyCode == Handsontable.helper.keyCode.ARROW_UP){
        if (instance.getSelected() && instance.getSelected()[0] == 0){

          if(!parent.cellProperties.strict){
            instance.deselectCell();
          }

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

    this.query = query;

    if (typeof this.cellProperties.source == 'function'){
      var that = this;

      this.cellProperties.source(query, function(choices){
        that.updateChoicesList(choices)
      });

    } else if (Handsontable.helper.isArray(this.cellProperties.source)) {

      var choices;

      if(!query || this.cellProperties.filter === false){
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

  function findItemIndexToHighlight(items, value){
    var bestMatch = {};
    var valueLength = value.length;
    var currentItem;
    var indexOfValue;
    var charsLeft;


    for(var i = 0, len = items.length; i < len; i++){
      currentItem = items[i];

      if(valueLength > 0){
        indexOfValue = currentItem.indexOf(value)
      } else {
        indexOfValue = currentItem === value ? 0 : -1;
      }

      if(indexOfValue == -1) continue;

      charsLeft =  currentItem.length - indexOfValue - valueLength;

      if( typeof bestMatch.indexOfValue == 'undefined'
        || bestMatch.indexOfValue > indexOfValue
        || ( bestMatch.indexOfValue == indexOfValue && bestMatch.charsLeft > charsLeft ) ){

        bestMatch.indexOfValue = indexOfValue;
        bestMatch.charsLeft = charsLeft;
        bestMatch.index = i;

      }

    }


    return bestMatch.index;
  }

  AutocompleteEditor.prototype.updateChoicesList = function (choices) {
    this.$htContainer.handsontable('loadData', Handsontable.helper.pivot([choices]));

    var value = this.getValue();
    var rowToHighlight;

    if(this.cellProperties.strict === true){

      rowToHighlight = findItemIndexToHighlight(choices, value);

      if ( typeof rowToHighlight == 'undefined'){
        rowToHighlight = 0;
      }

    }

    if(typeof rowToHighlight == 'undefined'){
      this.$htContainer.handsontable('deselectCell');
    } else {
      this.$htContainer.handsontable('selectCell', rowToHighlight, 0);
    }

    this.focus();
  };

  Handsontable.editors.AutocompleteEditor = AutocompleteEditor;
  Handsontable.editors.registerEditor('autocomplete', AutocompleteEditor);

})(Handsontable);
