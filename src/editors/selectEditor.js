(function (Handsontable) {

  var SelectEditor = Handsontable.editors.BaseEditor.prototype.extend();

  SelectEditor.prototype.init = function(){
    this.select = document.createElement('SELECT');
    Handsontable.Dom.addClass(this.select, 'htSelectEditor');
    this.select.style.display = 'none';
    this.instance.rootElement[0].appendChild(this.select);
  };

  SelectEditor.prototype.prepare = function(){
    Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);


    var selectOptions = this.cellProperties.selectOptions;
    var selectKey = this.cellProperties.selectKey;
    var selectText = this.cellProperties.selectText;
    var options;

    if (typeof selectOptions == 'function') {
        options = selectOptions(this.row, this.col, this.prop);
    } else {
        options = selectOptions;
    }

    Handsontable.Dom.empty(this.select);

    if(options !== undefined && options.length !== undefined){
        for (var i = 0; i < options.length; i++){      
            var optionElement = document.createElement('OPTION');
            optionElement.value = selectKey !== undefined ? options[i][selectKey] : options[i];
            Handsontable.Dom.fastInnerHTML(optionElement, selectText !== undefined ? options[i][selectText] : options[i]);
            this.select.appendChild(optionElement);      
        }
    }
  };

  SelectEditor.prototype.getValue = function () {
    return this.select.value;
  };

  SelectEditor.prototype.setValue = function (value) {
    this.select.value = value;
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
    var width = Handsontable.Dom.outerWidth(this.TD); //important - group layout reads together for better performance
    var height = Handsontable.Dom.outerHeight(this.TD);
    var rootOffset = Handsontable.Dom.offset(this.instance.rootElement[0]);
    var tdOffset = Handsontable.Dom.offset(this.TD);

    this.select.style.height = height + 'px';
    this.select.style.minWidth = width + 'px';
    this.select.style.top = tdOffset.top - rootOffset.top + 'px';
    this.select.style.left = tdOffset.left - rootOffset.left + 'px';
    this.select.style.margin = '0px';
    this.select.style.display = '';

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  };

  SelectEditor.prototype.close = function () {
    this.select.style.display = 'none';
    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  };

  SelectEditor.prototype.focus = function () {
    this.select.focus();
  };

  Handsontable.editors.SelectEditor = SelectEditor;
  Handsontable.editors.registerEditor('select', SelectEditor);

})(Handsontable);
