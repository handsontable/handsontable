(function (window, $, Handsontable) {
  $.fn.handsontable = function (action){
    Handsontable.tmpHandsontable(this[0], action);
  }
})(window, $, Handsontable);
