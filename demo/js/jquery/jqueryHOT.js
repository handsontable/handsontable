(function (window, $, Handsontable) {
  $.fn.handsontable = function (action){
    return Handsontable.tmpHandsontable(this[0], action);
  }
})(window, $, Handsontable);
