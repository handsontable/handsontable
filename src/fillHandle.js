/**
 * Create DOM element for drag-down handle
 * @constructor
 * @param {Object} instance Handsontable instance
 */
Handsontable.FillHandle = function (instance) {
  return;

  this.instance = instance;
  this.rootElement = instance.rootElement;
  var container = this.rootElement[0];

  this.handle = document.createElement("div");
  this.handle.className = "htFillHandle";
  this.disappear();
  container.appendChild(this.handle);

  var that = this;
  $(this.handle).mousedown(function () {
    that.isDragged = 1;
  });

  this.rootElement.find('table').on('selectstart', function (event) {
    //https://github.com/warpech/jquery-handsontable/issues/160
    //selectstart is IE only event. Prevent text from being selected when performing drag down in IE8
    event.preventDefault();
  });
};

Handsontable.FillHandle.prototype = {
  /**
   * Show handle in cell cornerł
   * @param {Object[]} coordsArr
   */
  appear: function (coordsArr) {
    return;

    if (this.disabled) {
      return;
    }

    var $td, tdOffset, containerOffset, top, left, height, width;

    var corners = this.instance.getCornerCoords(coordsArr);

    $td = $(this.instance.getCell(corners.BR.row, corners.BR.col));
    tdOffset = $td.offset();
    containerOffset = this.$container.offset();

    top = tdOffset.top - containerOffset.top + this.rootElement.scrollTop() - 1;
    left = tdOffset.left - containerOffset.left + this.rootElement.scrollLeft() - 1;
    height = $td.outerHeight();
    width = $td.outerWidth();

    this.handle.style.top = top + height - 3 + 'px';
    this.handle.style.left = left + width - 3 + 'px';
    this.handle.style.display = 'block';
  },

  /**
   * Hide handle
   */
  disappear: function () {
    return;

    this.handle.style.display = 'none';
  }
};