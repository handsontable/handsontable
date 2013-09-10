(function (Handsontable) {

  var SelectEditor = Handsontable.editors.BaseEditor.prototype.extend();

  SelectEditor.prototype.init = function(){
    this.select = $('<select />')
      .addClass('htSelectEditor')
      .hide();
    this.instance.rootElement.append(this.select);


    var editor = this;
    this.onBeforeKeyDown = function (event) {
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
  };

  SelectEditor.prototype.prepare = function(){
    Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);


    var options = this.cellProperties.options || [];
    var optionElements = [];

    options.forEach(function(option){
      var optionElement = $('<option />');
      optionElement.val(option);
      optionElement.html(option);

      optionElements.push(optionElement);
    });

    this.select.empty();
    this.select.append(optionElements);

  };

  SelectEditor.prototype.val = function (value) {
    if ( typeof value == 'undefined' ) {
      return this.select.val();
    } else {
      this.select.val(value);
    }
  };

  SelectEditor.prototype.open = function () {
    this.select.css({
      height: $(this.TD).height(),
      'min-width' : $(this.TD).outerWidth()
    });

    this.select.show();
    this.select.offset($(this.TD).offset());

    this.instance.addHook('beforeKeyDown', this.onBeforeKeyDown);
  };

  SelectEditor.prototype.close = function () {
    this.select.hide();
    this.instance.removeHook('beforeKeyDown', this.onBeforeKeyDown);
  };

  Handsontable.editors.SelectEditor = SelectEditor;
  Handsontable.editors.registerEditor('select', SelectEditor);

})(Handsontable);
