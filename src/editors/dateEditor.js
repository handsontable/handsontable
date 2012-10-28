/**
 * Date editor (uses jQuery UI Datepicker)
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param {Object} keyboardProxy jQuery element of keyboard proxy that contains current editing value
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.DateEditor = function (instance, td, row, col, prop, keyboardProxy, cellProperties) {

  //1. Editor preparation. Called when cell is selected.
  var $td = $(td);

  var textDestroyer = Handsontable.TextEditor(instance, td, row, col, prop, keyboardProxy, cellProperties);

  var datePickerdiv = $("<div>");
  datePickerdiv[0].style.position = 'absolute';
  datePickerdiv[0].style.top = 0;
  datePickerdiv[0].style.left = 0;
  datePickerdiv[0].style.zIndex = 99;
  instance.container[0].appendChild(datePickerdiv[0]);


  //2. Event bindings. Listens when user uses key or mouse on cell.
  function showDatepicker() {
    var position = $td.position();
    datePickerdiv[0].style.top = (position.top + $td.height()) + 'px';
    datePickerdiv[0].style.left = position.left + 'px';

    if (!datePickerdiv.data('datepicker')) {
      var dateoptions = {
        dateFormat: "yy-mm-dd",
        defaultDate: instance.getDataAtCell(row, col),
        dshowButtonPanel: true,
        changeMonth: true,
        changeYear: true,
        altField: keyboardProxy,
        onSelect: function () {
          instance.selectCell(row, col);
        }
      };
      datePickerdiv.datepicker(dateoptions);
    }
    else {
      datePickerdiv.show();
    }
  }

  keyboardProxy.on("keydown.editor", function (event) {
    switch (event.keyCode) {
      case 27: /* ESC */
        hideCalendar();
        break;

      case 9: /* tab */
      case 13: /* return/enter */
        showDatepicker();
        event.stopPropagation();
        event.preventDefault();
    }
  });

  function onDblClick() {
    setTimeout(function () { //otherwise is misaligned in IE9
      showDatepicker();
    }, 1);
  }

  $td.on('dblclick.editor', onDblClick);
  instance.container.find('.htBorder.current').on('dblclick.editor', onDblClick);


  //3. Return destroyer function. Will be executed when cell is deselected.
  function hideCalendar() {
    datePickerdiv.hide();
  }

  return function () {
    textDestroyer();
    datePickerdiv.remove();
    $td.off(".editor");
    instance.container.find('.htBorder.current').off(".editor");
  };
};