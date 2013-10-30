(function (Handsontable) {

  var SelectEditor = Handsontable.editors.BaseEditor.prototype.extend();

  SelectEditor.prototype.init = function(){
    this.select = $('<select />')
      .addClass('htSelectEditor')
      .hide();
    this.instance.rootElement.append(this.select);
  };

  SelectEditor.prototype.prepare = function(){
    Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);


    var selectOptions = this.cellProperties.selectOptions;
    var options;

    if (typeof selectOptions == 'function'){
      options =  this.prepareOptions(selectOptions(this.row, this.col, this.prop))
    } else {
      options =  this.prepareOptions(selectOptions);
    }

    var optionElements = [];

    for (var option in options){
      if (options.hasOwnProperty(option)){
        var optionElement = $('<option />');
        optionElement.val(option);
        optionElement.html(options[option]);

        optionElements.push(optionElement);
      }
    }

    this.select.empty();
    this.select.append(optionElements);

  };

  SelectEditor.prototype.prepareOptions = function(optionsToPrepare){

    var preparedOptions = {};

    if (Handsontable.helper.isArray(optionsToPrepare)){
      for(var i = 0, len = optionsToPrepare.length; i < len; i++){
        preparedOptions[optionsToPrepare[i]] = optionsToPrepare[i];
      }
    }
    else if (typeof optionsToPrepare == 'object') {
      preparedOptions = optionsToPrepare;
    }

    return preparedOptions;

  };

  SelectEditor.prototype.val = function (value) {
    if ( typeof value == 'undefined' ) {
      return this.select.val();
    } else {
      this.select.val(value);
    }
  };

  var onBeforeKeyDown = function (event) {
    var instance = this;
    var editor = instance.getActiveEditor();

    switch (event.keyCode){
      case Handsontable.helper.keyCode.ARROW_UP:

        var previousOption = editor.select.find('option:selected').prev();

        if (previousOption.length == 1){
          previousOption.prop('selected', true);
        }

        event.stopImmediatePropagation();
        event.preventDefault();
        break;

      case Handsontable.helper.keyCode.ARROW_DOWN:

        var nextOption = editor.select.find('option:selected').next();

        if (nextOption.length == 1){
          nextOption.prop('selected', true);
        }

        event.stopImmediatePropagation();
        event.preventDefault();
        break;
    }
  };

  SelectEditor.prototype.open = function () {
    this.select.css({
      height: $(this.TD).height(),
      'min-width' : $(this.TD).outerWidth()
    });

    this.select.show();
    this.select.offset($(this.TD).offset());

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  };

  SelectEditor.prototype.close = function () {
    this.select.hide();
    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  };

  Handsontable.editors.SelectEditor = SelectEditor;
  Handsontable.editors.registerEditor('select', SelectEditor);

})(Handsontable);
