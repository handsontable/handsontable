(function (Handsontable) {

  var SelectEditor = Handsontable.editors.BaseEditor.prototype.extend();

  SelectEditor.prototype.init = function(){
    this.select = document.createElement('SELECT');
    Handsontable.Dom.addClass(this.select, 'htSelectEditor');
    this.select.style.display = 'none';
    this.instance.rootElement.appendChild(this.select);
  };

  SelectEditor.prototype.prepare = function(){
    Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);


    var selectOptions = this.cellProperties.selectOptions;
    var options;

    if (typeof selectOptions == 'function'){
      options =  this.prepareOptions(selectOptions(this.row, this.col, this.prop));
    } else {
      options =  this.prepareOptions(selectOptions);
    }

    Handsontable.Dom.empty(this.select);

    for (var option in options){
      if (options.hasOwnProperty(option)){
        var optionElement = document.createElement('OPTION');
        optionElement.value = option;
        Handsontable.Dom.fastInnerHTML(optionElement, options[option]);
        this.select.appendChild(optionElement);
      }
    }
  };

  SelectEditor.prototype.prepareOptions = function(optionsToPrepare){

    var preparedOptions = {};

    if (Array.isArray(optionsToPrepare)){
      for(var i = 0, len = optionsToPrepare.length; i < len; i++){
        preparedOptions[optionsToPrepare[i]] = optionsToPrepare[i];
      }
    }
    else if (typeof optionsToPrepare == 'object') {
      preparedOptions = optionsToPrepare;
    }

    return preparedOptions;

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

    if (event != null && event.isImmediatePropagationEnabled == null) {
      event.stopImmediatePropagation = function () {
        this.isImmediatePropagationEnabled = false;
      };
      event.isImmediatePropagationEnabled = true;
      event.isImmediatePropagationStopped = function () {
        return !this.isImmediatePropagationEnabled;
      };
    }

    switch (event.keyCode){
      case Handsontable.helper.keyCode.ARROW_UP:
        var previousOptionIndex = editor.select.selectedIndex - 1;
        if (previousOptionIndex >= 0 ) {
          editor.select[previousOptionIndex].selected = true;
        }

        event.stopImmediatePropagation();
        event.preventDefault();
        break;

      case Handsontable.helper.keyCode.ARROW_DOWN:
        var nextOptionIndex = editor.select.selectedIndex + 1;
        if (nextOptionIndex <= editor.select.length - 1 ) {
          editor.select[nextOptionIndex].selected = true;
        }

        event.stopImmediatePropagation();
        event.preventDefault();
        break;
    }
  };

  // TODO: Refactor this with the use of new getCell() after 0.12.1
  SelectEditor.prototype.checkEditorSection = function () {
    if(this.row < this.instance.getSettings().fixedRowsTop) {
      if(this.col < this.instance.getSettings().fixedColumnsLeft) {
        return 'corner';
      } else {
        return 'top';
      }
    } else {
      if(this.col < this.instance.getSettings().fixedColumnsLeft) {
        return 'left';
      }
    }
  };

  SelectEditor.prototype.open = function () {
    var width = Handsontable.Dom.outerWidth(this.TD); //important - group layout reads together for better performance
    var height = Handsontable.Dom.outerHeight(this.TD);
    var rootOffset = Handsontable.Dom.offset(this.instance.rootElement);
    var tdOffset = Handsontable.Dom.offset(this.TD);
    var editorSection = this.checkEditorSection();
    var cssTransformOffset;

    switch(editorSection) {
      case 'top':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'left':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'corner':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
        break;
    }

    var selectStyle = this.select.style;

    if(cssTransformOffset && cssTransformOffset != -1) {
      selectStyle[cssTransformOffset[0]] = cssTransformOffset[1];
    } else {
      Handsontable.Dom.resetCssTransform(this.select);
    }

    selectStyle.height = height + 'px';
    selectStyle.minWidth = width + 'px';
    selectStyle.top = tdOffset.top - rootOffset.top + 'px';
    selectStyle.left = tdOffset.left - rootOffset.left + 'px';
    selectStyle.margin = '0px';
    selectStyle.display = '';

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
