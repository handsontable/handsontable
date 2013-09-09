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
  };

  SelectEditor.prototype.close = function () {
    this.select.hide();
  };

  Handsontable.editors.SelectEditor = SelectEditor;
  Handsontable.editors.registerEditor('select', SelectEditor);

})(Handsontable);
