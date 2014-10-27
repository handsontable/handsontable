(function (window, $, Handsontable) {
  $.fn.handsontable = function (action){
    var instance = Handsontable.tmpHandsontable(this[0], action);
    $(this[0]).data('handsontable', instance);
    //return Handsontable.tmpHandsontable(this[0], action);
  }
})(window, $, Handsontable);
