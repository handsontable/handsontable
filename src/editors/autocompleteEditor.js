(function (Handsontable) {
  var AutocompleteEditor = Handsontable.editors.HandsontableEditor.prototype.extend();

  AutocompleteEditor.prototype.init = function () {
    Handsontable.editors.HandsontableEditor.prototype.init.apply(this, arguments);
    this.$htContainer.handsontable('updateSettings', {height: this.getDropdownHeight()});

    this.query = null;
    this.choices = [];
  };

  AutocompleteEditor.prototype.createElements = function(){
    Handsontable.editors.HandsontableEditor.prototype.createElements.apply(this, arguments);

    this.$htContainer.addClass('autocompleteEditor');

  };

  AutocompleteEditor.prototype.bindEvents = function(){
    var that = this;

    this.$textarea.on('keydown.autocompleteEditor', function(event){

      var value = that.$textarea.val();

      if(!Handsontable.helper.isMetaKey(event.keyCode) || [Handsontable.helper.keyCode.BACKSPACE, Handsontable.helper.keyCode.DELETE].indexOf(event.keyCode) !== -1){
        setTimeout(function () {
          that.queryChoices(value);
        });
      } else if ([Handsontable.helper.keyCode.ENTER, Handsontable.helper.keyCode.TAB].indexOf(event.keyCode) !== -1){

        var choice = that.choices[0];

        if (value.length > 0 && choice) {
          if (choice.length > 0) {
            that.$textarea[0].value = choice;
          }
        }

        if (that.cellProperties.strict !== true) {
          that.$htContainer.handsontable('deselectCell');
        }
      }

    });

    this.$htContainer.on('mouseleave', function () {
      if(that.cellProperties.strict === true){
        that.highlightBestMatchingChoice();
      }
    });

    this.$htContainer.on('mouseenter', function () {
      that.$htContainer.handsontable('deselectCell');
    });

    Handsontable.editors.HandsontableEditor.prototype.bindEvents.apply(this, arguments);

  };

  var onBeforeKeyDownInner;

  AutocompleteEditor.prototype.open = function () {

    Handsontable.editors.HandsontableEditor.prototype.open.apply(this, arguments);

    this.$textarea[0].style.visibility = 'visible';
    this.focus();

    var choicesListHot = this.$htContainer.handsontable('getInstance');
    var that = this;

    choicesListHot.updateSettings({
      'colWidths': [Handsontable.Dom.outerWidth(this.TEXTAREA) - 2],
      afterRenderer: function (TD, row, col, prop, value) {
        var caseSensitive = this.getCellMeta(row, col).filteringCaseSensitive === true;
        var indexOfMatch =  caseSensitive ? value.indexOf(this.query) : value.toLowerCase().indexOf(that.query.toLowerCase());

        if(indexOfMatch != -1){
          var match = value.substr(indexOfMatch, that.query.length);
          TD.innerHTML = value.replace(match, '<strong>' + match + '</strong>');
        }
      }
    });

    onBeforeKeyDownInner = function (event) {
      var instance = this;

      if (event.keyCode == Handsontable.helper.keyCode.ARROW_UP){
        if (instance.getSelected() && instance.getSelected()[0] == 0){

          var cellProperties = parent.cellProperties;

          if (cellProperties && !cellProperties.strict) {
            instance.deselectCell();
          }

          if (parent) {
            parent.focus();

            if (parent.instance) {
              parent.instance.listen();
            } else {
              instance.listen();
            }

          }

          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }

    };

    choicesListHot.addHook('beforeKeyDown', onBeforeKeyDownInner);

    this.queryChoices(this.TEXTAREA.value);

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

        var filteringCaseSensitive = this.cellProperties.filteringCaseSensitive === true;
        var lowerCaseQuery = query.toLowerCase();

        choices = this.cellProperties.source.filter(function(choice){

          if (filteringCaseSensitive) {
            return choice.indexOf(query) != -1;
          } else {
            return choice.toLowerCase().indexOf(lowerCaseQuery) != -1;
          }

        });
      }

      this.updateChoicesList(choices)

    } else {
      this.updateChoicesList([]);
    }

  };

  AutocompleteEditor.prototype.updateChoicesList = function (choices) {

    this.choices = choices;

    this.$htContainer.handsontable('loadData', Handsontable.helper.pivot([choices]));

    //if(this.cellProperties.strict === true) {
    //  this.highlightBestMatchingChoice();
    //}

    //this.focus(); // this override textEditor events ie. ctrl combinations
    // Can't highlight text in the cell with ctrl+a in autocomplete demo #1590
    // Editing autocomplete selection, cursor goes to the end of selected string. #1610
  };

  AutocompleteEditor.prototype.highlightBestMatchingChoice = function () {
    var bestMatchingChoice = this.findBestMatchingChoice();

    if ( typeof bestMatchingChoice == 'undefined' && this.cellProperties.allowInvalid === false){
      bestMatchingChoice = 0;
    }

    if(typeof bestMatchingChoice == 'undefined'){
      this.$htContainer.handsontable('deselectCell');
    } else {
      this.$htContainer.handsontable('selectCell', bestMatchingChoice, 0);
    }

  };

  AutocompleteEditor.prototype.findBestMatchingChoice = function(){
    var bestMatch = {};
    var valueLength = this.getValue().length;
    var currentItem;
    var indexOfValue;
    var charsLeft;


    for(var i = 0, len = this.choices.length; i < len; i++){
      currentItem = this.choices[i];

      if(valueLength > 0){
        indexOfValue = currentItem.indexOf(this.getValue())
      } else {
        indexOfValue = currentItem === this.getValue() ? 0 : -1;
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
  };

  AutocompleteEditor.prototype.getDropdownHeight = function(){
    //return 10 * this.$htContainer.handsontable('getInstance').getRowHeight(0);
    //sorry, we can't measure row height before it was rendered. Let's use fixed height for now
    return 230;
  };


  Handsontable.editors.AutocompleteEditor = AutocompleteEditor;
  Handsontable.editors.registerEditor('autocomplete', AutocompleteEditor);

})(Handsontable);
