(function (Handsontable) {
    var ChosenSelectEditor = Handsontable.editors.SelectEditor.prototype.extend();

    ChosenSelectEditor.prototype.init = function () {
        this.select = document.createElement('SELECT');
        Handsontable.Dom.addClass(this.select, 'htChosenSelectEditor');
        Handsontable.Dom.addClass(this.select, 'chosen-select');
        this.select.setAttribute('multiple', 'true');
        this.select.style.display = 'none';
        this.instance.rootElement.appendChild(this.select);
    };

    ChosenSelectEditor.prototype.open = function () {
        var width = Handsontable.Dom.outerWidth(this.TD); //important - group layout reads together for better performance
        var height = Handsontable.Dom.outerHeight(this.TD);
        var rootOffset = Handsontable.Dom.offset(this.instance.rootElement);
        var tdOffset = Handsontable.Dom.offset(this.TD);

        this.select.style.height = height + 'px';
        this.select.style.minWidth = width + 40 + 'px'; //40 px for remove button
        this.select.style.top = tdOffset.top - rootOffset.top + 'px';
        this.select.style.left = tdOffset.left - rootOffset.left + 'px';
        this.select.style.margin = '0px';
        this.select.style.display = '';
        $(this.select).chosen();
        this.chosenContainer = $('.handsontable .chosen-container').get(0);
        this.chosenContainer.style.top = tdOffset.top - rootOffset.top + 'px';
        this.chosenContainer.style.left = tdOffset.left - rootOffset.left + 'px';
        this.chosenContainer.style.position = 'absolute';
        this.instance.addHook('beforeKeyDown', this.onBeforeKeyDown);
    };

    ChosenSelectEditor.prototype.setZIndex = function (index) {
        this.chosenContainer.style.zIndex = index;
        //this.select.style.
    };

    ChosenSelectEditor.prototype.getValue = function () {
        var result = [];
        var options = this.select && this.select.options;
        var opt;

        for (var i = 0, iLen = options.length; i < iLen; i++) {
            opt = options[i];

            if (opt.selected) {
                result.push(opt.value || opt.text);
            }
        }
        return result.join(" / ");
    };

    ChosenSelectEditor.prototype.setValue = function (value) {
        if (value) {
            var values = value.split(" / ");
            var options = this.select && this.select.options;
            var opt;

            for (var i = 0, iLen = options.length; i < iLen; i++) {
                opt = options[i];
                if (values.indexOf(opt.value) !== -1 || values.indexOf(opt.text) !== -1)
                    opt.selected = true;
            }
        }

    };


    ChosenSelectEditor.prototype.close = function () {
        $(this.select).chosen('destroy');
        this.select.style.display = 'none';
        this.instance.removeHook('beforeKeyDown', this.onBeforeKeyDown);
    };

    ChosenSelectEditor.prototype.focus = function () {
        $(this.select).data("chosen").activate_field();
    };


    ChosenSelectEditor.prototype.onBeforeKeyDown = function (event) {
        var editor = this.getActiveEditor();
        switch (event.keyCode){
            case Handsontable.helper.keyCode.ENTER:
            {
                if ( $( editor.chosenContainer ).hasClass( "chosen-with-drop" ))
                {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                }
                break;
            }
            case Handsontable.helper.keyCode.ARROW_UP:
            case Handsontable.helper.keyCode.ARROW_DOWN:
                event.stopImmediatePropagation();
                event.preventDefault();
                break;
        }
    };

    Handsontable.editors.ChosenSelectEditor = ChosenSelectEditor;
    Handsontable.editors.registerEditor('chosenselect', ChosenSelectEditor);
})(Handsontable);
