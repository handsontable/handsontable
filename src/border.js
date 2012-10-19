/**
 * Create DOM elements for selection border lines (top, right, bottom, left) and optionally background
 * @constructor
 * @param {Object} instance Handsontable instance
 * @param {Object} options Configurable options
 * @param {Boolean} [options.bg] Should include a background
 * @param {String} [options.className] CSS class for border elements
 */
Handsontable.Border = function (instance, options) {
  this.instance = instance;
  this.$container = instance.container;
  var container = this.$container[0];

  if (options.bg) {
    this.bg = document.createElement("div");
    this.bg.className = 'htBorderBg ' + options.className;
    container.insertBefore(this.bg, container.firstChild);
  }

  this.main = document.createElement("div");
  this.main.style.position = 'absolute';
  this.main.style.top = 0;
  this.main.style.left = 0;
  this.main.innerHTML = (new Array(5)).join('<div class="htBorder ' + options.className + '"></div>');
  this.disappear();
  container.appendChild(this.main);

  var nodes = this.main.childNodes;
  this.top = nodes[0];
  this.left = nodes[1];
  this.bottom = nodes[2];
  this.right = nodes[3];

  this.borderWidth = $(this.left).width();
};

Handsontable.Border.prototype = {
  /**
   * Show border around one or many cells
   * @param {Object[]} coordsArr
   */
  appear: function (coordsArr) {
    var $from, $to, fromOffset, toOffset, containerOffset, top, minTop, left, minLeft, height, width;
    if (this.disabled) {
      return;
    }

    this.corners = this.instance.grid.getCornerCoords(coordsArr);

    $from = $(this.instance.getCell(this.corners.TL.row, this.corners.TL.col));
    $to = (coordsArr.length > 1) ? $(this.instance.getCell(this.corners.BR.row, this.corners.BR.col)) : $from;
    fromOffset = $from.offset();
    toOffset = (coordsArr.length > 1) ? $to.offset() : fromOffset;
    containerOffset = this.$container.offset();

    minTop = fromOffset.top;
    height = toOffset.top + $to.outerHeight() - minTop;
    minLeft = fromOffset.left;
    width = toOffset.left + $to.outerWidth() - minLeft;

    top = minTop - containerOffset.top + this.$container.scrollTop() - 1;
    left = minLeft - containerOffset.left + this.$container.scrollLeft() - 1;

    if (parseInt($from.css('border-top-width')) > 0) {
      top += 1;
      height -= 1;
    }
    if (parseInt($from.css('border-left-width')) > 0) {
      left += 1;
      width -= 1;
    }

    if (this.bg) {
      this.bg.style.top = top + 'px';
      this.bg.style.left = left + 'px';
      this.bg.style.width = width + 'px';
      this.bg.style.height = height + 'px';
      this.bg.style.display = 'block';
    }

    this.top.style.top = top + 'px';
    this.top.style.left = left + 'px';
    this.top.style.width = width + 'px';

    this.left.style.top = top + 'px';
    this.left.style.left = left + 'px';
    this.left.style.height = height + 'px';

    var delta = Math.floor(this.borderWidth / 2);

    this.bottom.style.top = top + height - delta + 'px';
    this.bottom.style.left = left + 'px';
    this.bottom.style.width = width + 'px';

    this.right.style.top = top + 'px';
    this.right.style.left = left + width - delta + 'px';
    this.right.style.height = height + 1 + 'px';

    this.main.style.display = 'block';
  },

  /**
   * Hide border
   */
  disappear: function () {
    this.main.style.display = 'none';
    if (this.bg) {
      this.bg.style.display = 'none';
    }
    this.corners = null;
  }
};