/**
 * walkontable 0.1
 * 
 * Date: Wed Dec 05 2012 23:05:41 GMT+0100 (Central European Standard Time)
*/

function WalkontableBorder(instance, settings) {
  //reference to instance
  this.instance = instance;
  this.settings = settings;

  this.main = document.createElement("div");
  this.main.style.position = 'absolute';
  this.main.style.top = 0;
  this.main.style.left = 0;

  for (var i = 0; i < 4; i++) {
    var DIV = document.createElement('DIV');
    DIV.className = 'wtBorder ' + settings.className;
    DIV.style.backgroundColor = settings.border.color;
    DIV.style.height = settings.border.width + 'px';
    DIV.style.width = settings.border.width + 'px';
    this.main.appendChild(DIV);
  }

  this.top = this.main.childNodes[0];
  this.left = this.main.childNodes[1];
  this.bottom = this.main.childNodes[2];
  this.right = this.main.childNodes[3];

  this.disappear();
  instance.wtTable.TABLE.parentNode.appendChild(this.main);
}

/**
 * Show border around one or many cells
 * @param {Array} corners
 */
WalkontableBorder.prototype.appear = function (corners) {
  var $from, $to, fromOffset, toOffset, containerOffset, top, minTop, left, minLeft, height, width;
  if (this.disabled) {
    return;
  }

  var offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , displayRows = this.instance.getSetting('displayRows')
    , displayColumns = this.instance.getSetting('displayColumns');

  var hideTop, hideLeft, hideBottom, hideRight;

  if (displayRows !== null) {
    if (corners[0] > offsetRow + displayRows - 1 || corners[2] < offsetRow) {
      hideTop = hideLeft = hideBottom = hideRight = true;
    }
    else {
      if (corners[0] < offsetRow) {
        corners[0] = offsetRow;
        hideTop = true;
      }
      if (corners[2] > offsetRow + displayRows - 1) {
        corners[2] = offsetRow + displayRows - 1;
        hideBottom = true;
      }
    }
  }

  if (displayColumns !== null) {
    if (corners[1] > offsetColumn + displayColumns - 1 || corners[3] < offsetColumn) {
      hideTop = hideLeft = hideBottom = hideRight = true;
    }
    else {
      if (corners[1] < offsetColumn) {
        corners[1] = offsetColumn;
        hideLeft = true;
      }
      if (corners[3] > offsetColumn + displayColumns - 1) {
        corners[3] = offsetColumn + displayColumns - 1;
        hideRight = true;
      }
    }
  }

  if (!(hideTop == hideLeft == hideBottom == hideRight == true)) {
    $from = $(this.instance.wtTable.getCell([corners[0], corners[1]]));
    $to = (corners.length > 2) ? $(this.instance.wtTable.getCell([corners[2], corners[3]])) : $from;
    fromOffset = $from.offset();
    toOffset = (corners.length > 2) ? $to.offset() : fromOffset;
    containerOffset = $(this.instance.wtTable.TABLE).offset();

    minTop = fromOffset.top;
    height = toOffset.top + $to.outerHeight() - minTop;
    minLeft = fromOffset.left;
    width = toOffset.left + $to.outerWidth() - minLeft;

    top = minTop - containerOffset.top - 1;
    left = minLeft - containerOffset.left - 1;

    if (parseInt($from.css('border-top-width')) > 0) {
      top += 1;
      //height -= 1;
    }
    if (parseInt($from.css('border-left-width')) > 0) {
      left += 1;
      //width -= 1;
    }
  }

  if (hideTop) {
    this.top.style.display = 'none';
  }
  else {
    this.top.style.top = top + 'px';
    this.top.style.left = left + 'px';
    this.top.style.width = width + 'px';
    this.top.style.display = 'block';
  }

  if (hideLeft) {
    this.left.style.display = 'none';
  }
  else {
    this.left.style.top = top + 'px';
    this.left.style.left = left + 'px';
    this.left.style.height = height + 'px';
    this.left.style.display = 'block';
  }

  var delta = Math.floor(this.settings.border.width / 2);

  if (hideBottom) {
    this.bottom.style.display = 'none';
  }
  else {
    this.bottom.style.top = top + height - delta + 'px';
    this.bottom.style.left = left + 'px';
    this.bottom.style.width = width + 'px';
    this.bottom.style.display = 'block';
  }

  if (hideRight) {
    this.right.style.display = 'none';
  }
  else {
    this.right.style.top = top + 'px';
    this.right.style.left = left + width - delta + 'px';
    this.right.style.height = height + 1 + 'px';
    this.right.style.display = 'block';
  }
};

/**
 * Hide border
 */
WalkontableBorder.prototype.disappear = function () {
  this.top.style.display = 'none';
  this.left.style.display = 'none';
  this.bottom.style.display = 'none';
  this.right.style.display = 'none';
};
function Walkontable(settings) {
  var that = this;
  var originalHeaders = [];

  //default settings. void 0 means it is required, null means it can be empty
  var defaults = {
    table: void 0,
    data: void 0,
    offsetRow: 0,
    offsetColumn: 0,
    rowHeaders: false,
    columnHeaders: false,
    totalRows: void 0,
    totalColumns: void 0,
    width: null,
    height: null,
    displayRows: null,
    displayColumns: null,
    cellRenderer: function (row, column, TD) {
      var cellData = that.getSetting('data', row, column);
      if (cellData !== void 0) {
        TD.innerHTML = cellData;
      }
      else {
        TD.innerHTML = '';
      }
    },
    columnWidth: null,
    selections: null,
    onCellMouseDown: null,
    onCellMouseOver: null
  };

  //reference to settings
  this.settings = {};
  for (var i in defaults) {
    if (defaults.hasOwnProperty(i)) {
      if (settings[i] !== void 0) {
        this.settings[i] = settings[i];
      }
      else if (defaults[i] === void 0) {
        throw new Error('A required setting "' + i + '" was not provided');
      }
      else {
        this.settings[i] = defaults[i];
      }
    }
  }

  //bootstrap from settings
  this.wtTable = new WalkontableTable(this);
  this.wtScroll = new WalkontableScroll(this);
  this.wtWheel = new WalkontableWheel(this);
  this.wtEvent = new WalkontableEvent(this);
  this.wtDom = new WalkontableDom();

  //find original headers
  if (this.wtTable.THEAD.childNodes.length && this.wtTable.THEAD.childNodes[0].childNodes.length) {
    for (var c = 0, clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
      originalHeaders.push(this.wtTable.THEAD.childNodes[0].childNodes[c].innerHTML);
    }
    if (!this.hasSetting('columnHeaders')) {
      this.settings.columnHeaders = function (column) {
        return originalHeaders[column];
      }
    }
  }

  //initialize selections
  this.selections = {};
  if (this.settings.selections) {
    for (i in this.settings.selections) {
      if (this.settings.selections.hasOwnProperty(i)) {
        this.selections[i] = new WalkontableSelection(this, this.settings.selections[i]);
      }
    }
  }

  this.drawn = false;
}

Walkontable.prototype.draw = function () {
  this.wtTable.draw();
  this.wtScroll.refreshScrollbars();
  this.drawn = true;
  return this;
};

Walkontable.prototype.update = function (settings, value) {
  if (value === void 0) { //settings is object
    for (var i in settings) {
      if (settings.hasOwnProperty(i)) {
        this.settings[i] = settings[i];
      }
    }
  }
  else { //if value is defined then settings is the key
    this.settings[settings] = value;
  }
  return this;
};

Walkontable.prototype.scrollVertical = function (delta) {
  return this.wtScroll.scrollVertical(delta);
};

Walkontable.prototype.scrollHorizontal = function (delta) {
  return this.wtScroll.scrollHorizontal(delta);
};

Walkontable.prototype.scrollViewport = function (coords) {
  return this.wtScroll.scrollViewport(coords);
};

Walkontable.prototype.getSetting = function (key, param1, param2, param3) {
  if (key === 'displayRows' && this.settings['height']) {
    return this.settings['height'] / 20; //silly assumption but should be fine for now
  }
  else if (key === 'displayColumns' && this.settings['width']) {
    return this.settings['width'] / 50; //silly assumption but should be fine for now
  }
  else if (key === 'displayRows' && this.settings['displayRows'] === null) {
    return this.getSetting('totalRows');
  }
  else if (key === 'displayColumns' && this.settings['displayColumns'] === null) {
    return this.settings['rowHeaders'] ? this.getSetting('totalColumns') + 1 : this.getSetting('totalColumns');
  }

  if (typeof this.settings[key] === 'function') {
    return this.settings[key](param1, param2, param3);
  }
  else {
    return this.settings[key];
  }
};

Walkontable.prototype.hasSetting = function (key) {
  return !!this.settings[key]
};
function WalkontableDom() {
}

//goes up the DOM tree (including given element) until it finds an element that matches the nodeName
WalkontableDom.prototype.closest = function (elem, nodeNames) {
  while (elem != null) {
    if (elem.nodeType === 1 && nodeNames.indexOf(elem.nodeName) > -1) {
      return elem;
    }
    elem = elem.parentNode;
  }
  return null;
};

WalkontableDom.prototype.prevSiblings = function (elem) {
  var out = [];
  while ((elem = elem.previousSibling) != null) {
    if (elem.nodeType === 1) {
      out.push(elem);
    }
  }
  return out;
};

//http://snipplr.com/view/3561/addclass-removeclass-hasclass/
WalkontableDom.prototype.hasClass = function (ele, cls) {
  return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
};

WalkontableDom.prototype.addClass = function (ele, cls) {
  if (!this.hasClass(ele, cls)) ele.className += " " + cls;
};

WalkontableDom.prototype.removeClass = function (ele, cls) {
  if (this.hasClass(ele, cls)) { //is this really needed?
    var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
    ele.className = ele.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, ''); //last 2 replaces do right trim (see http://blog.stevenlevithan.com/archives/faster-trim-javascript)
  }
};

/*//http://net.tutsplus.com/tutorials/javascript-ajax/javascript-from-null-cross-browser-event-binding/
 WalkontableDom.prototype.addEvent = (function () {
 var that = this;
 if (document.addEventListener) {
 return function (elem, type, cb) {
 if ((elem && !elem.length) || elem === window) {
 elem.addEventListener(type, cb, false);
 }
 else if (elem && elem.length) {
 var len = elem.length;
 for (var i = 0; i < len; i++) {
 that.addEvent(elem[i], type, cb);
 }
 }
 };
 }
 else {
 return function (elem, type, cb) {
 if ((elem && !elem.length) || elem === window) {
 elem.attachEvent('on' + type, function () {

 //normalize
 //http://stackoverflow.com/questions/4643249/cross-browser-event-object-normalization
 var e = window['event'];
 e.target = e.srcElement;
 //e.offsetX = e.layerX;
 //e.offsetY = e.layerY;
 e.relatedTarget = e.relatedTarget || e.type == 'mouseover' ? e.fromElement : e.toElement;
 if (e.target.nodeType === 3) e.target = e.target.parentNode; //Safari bug

 return cb.call(elem, e)
 });
 }
 else if (elem.length) {
 var len = elem.length;
 for (var i = 0; i < len; i++) {
 that.addEvent(elem[i], type, cb);
 }
 }
 };
 }
 })();

 WalkontableDom.prototype.triggerEvent = function (element, eventName, target) {
 var event;
 if (document.createEvent) {
 event = document.createEvent("MouseEvents");
 event.initEvent(eventName, true, true);
 } else {
 event = document.createEventObject();
 event.eventType = eventName;
 }

 event.eventName = eventName;
 event.target = target;

 console.log("próbujem", event, element, target);

 if (document.createEvent) {
 target.dispatchEvent(event);
 } else {
 target.fireEvent("on" + event.eventType, event);
 }
 };*/

WalkontableDom.prototype.removeTextNodes = function (elem, parent) {
  if (elem.nodeType === 3) {
    parent.removeChild(elem); //bye text nodes!
  }
  else if (['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'].indexOf(elem.nodeName) > -1) {
    var childs = elem.childNodes;
    for (var i = childs.length - 1; i >= 0; i--) {
      this.removeTextNodes(childs[i], elem);
    }
  }
};
function WalkontableEvent(instance) {
  var that = this;

  //reference to instance
  this.instance = instance;

  this.wtDom = new WalkontableDom();

  $(this.instance.settings.table).on('mousedown', function (event) {
    if (that.instance.settings.onCellMouseDown) {
      var TD = that.wtDom.closest(event.target, ['TD', 'TH']);
      that.instance.getSetting('onCellMouseDown', event, that.instance.wtTable.getCoords(TD), TD);
    }
  });

  $(this.instance.settings.table).on('mouseover', function (event) {
    if (that.instance.settings.onCellMouseOver) {
      var TD = that.wtDom.closest(event.target, ['TD', 'TH']);
      that.instance.getSetting('onCellMouseOver', event, that.instance.wtTable.getCoords(TD), TD);
    }
  });
}
//http://stackoverflow.com/questions/3629183/why-doesnt-indexof-work-on-an-array-ie8
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (elt /*, from*/) {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
      ? Math.ceil(from)
      : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++) {
      if (from in this &&
        this[from] === elt)
        return from;
    }
    return -1;
  };
}
function WalkontableScroll(instance) {
  this.instance = instance;
  this.wtScrollbarV = new WalkontableScrollbar(instance, 'vertical');
  this.wtScrollbarH = new WalkontableScrollbar(instance, 'horizontal');
}

WalkontableScroll.prototype.refreshScrollbars = function () {
  this.wtScrollbarV.refresh();
  this.wtScrollbarH.refresh();
};

WalkontableScroll.prototype.scrollVertical = function (delta) {
  var offsetRow = this.instance.getSetting('offsetRow')
    , max = this.instance.getSetting('totalRows') - this.instance.getSetting('displayRows');
  if (max < 0) {
    max = 0;
  }
  offsetRow = offsetRow + delta;
  if (offsetRow < 0) {
    offsetRow = 0;
  }
  else if (offsetRow >= max) {
    offsetRow = max;
  }
  this.instance.update('offsetRow', offsetRow);
  return this.instance;
};

WalkontableScroll.prototype.scrollHorizontal = function (delta) {
  var displayColumns = this.instance.getSetting('displayColumns');
  if (displayColumns !== null) {
    var offsetColumn = this.instance.getSetting('offsetColumn')
      , max = this.instance.getSetting('totalColumns') - displayColumns;
    if (max < 0) {
      max = 0;
    }
    offsetColumn = offsetColumn + delta;
    if (offsetColumn < 0) {
      offsetColumn = 0;
    }
    else if (offsetColumn >= max) {
      offsetColumn = max;
    }
    this.instance.update('offsetColumn', offsetColumn);
  }
  return this.instance;
};

/**
 * Scrolls viewport to a cell by minimum number of cells
 */
WalkontableScroll.prototype.scrollViewport = function (coords) {
  var offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , displayRows = this.instance.getSetting('displayRows')
    , displayColumns = this.instance.getSetting('displayColumns')
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns');

  if (coords[0] < 0 || coords[0] > totalRows - 1) {
    throw new Error('row ' + coords[0] + ' does not exist');
  }
  else if (coords[1] < 0 || coords[1] > totalColumns - 1) {
    throw new Error('column ' + coords[1] + ' does not exist');
  }

  if (displayRows < totalRows) {
    if (coords[0] > offsetRow + displayRows - 1) {
      this.scrollVertical(coords[0] - (offsetRow + displayRows - 1));
    }
    else if (coords[0] < offsetRow) {
      this.scrollVertical(coords[0] - offsetRow);
    }
  }

  if (displayColumns < totalColumns) {
    if (coords[1] > offsetColumn + displayColumns - 1) {
      this.scrollHorizontal(coords[1] - (offsetColumn + displayColumns - 1));
    }
    else if (coords[1] < offsetColumn) {
      this.scrollHorizontal(coords[1] - offsetColumn);
    }
  }

  return this.instance;
};
function WalkontableScrollbar(instance, type) {
  var that = this;

  //reference to instance
  this.instance = instance;
  this.type = type;
  var TABLE = this.instance.getSetting('table');
  this.$table = $(TABLE);
  var wtDom = new WalkontableDom();

  //create elements
  this.slider = document.createElement('DIV');
  this.slider.style.position = 'absolute';
  this.slider.style.top = '0';
  this.slider.style.left = '0';
  this.slider.className = 'dragdealer ' + type;

  this.handle = document.createElement('DIV');
  this.handle.className = 'handle';

  var parent = TABLE.parentNode;
  if (!parent || parent.nodeType !== 1 || !wtDom.hasClass(parent, 'wtHolder')) {
    var holder = document.createElement('DIV');
    holder.style.position = 'relative';
    holder.className = 'wtHolder';
    if (parent) {
      parent.insertBefore(holder, TABLE); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    holder.appendChild(TABLE);
    parent = holder;
  }

  this.slider.appendChild(this.handle);
  parent.appendChild(this.slider);

  this.dragdealer = new Dragdealer(this.slider, {
    vertical: (type === 'vertical'),
    horizontal: (type === 'horizontal'),
    speed: 100,
    yPrecision: 100,
    animationCallback: function (x, y) {
      that.onScroll(type === 'vertical' ? y : x);
    }
  });
}

WalkontableScrollbar.prototype.onScroll = function (delta) {
  if (this.instance.drawn) {
    var keys = this.type === 'vertical' ? ['offsetRow', 'totalRows', 'displayRows'] : ['offsetColumn', 'totalColumns', 'displayColumns'];
    var total = this.instance.getSetting(keys[1]);
    var display = this.instance.getSetting(keys[2]);
    if (total > display) {
      var newOffset = Math.max(0, Math.round((total - display) * delta));
      if (newOffset !== this.instance.getSetting(keys[0])) { //is new offset different than old offset
        this.instance.update(keys[0], newOffset);
        this.instance.draw();
      }
    }
  }
};

WalkontableScrollbar.prototype.refresh = function () {
  var ratio = 1
    , handleSize
    , handlePosition
    , offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , tableWidth = this.$table.outerWidth()
    , tableHeight = this.$table.outerHeight()
    , displayRows = Math.min(this.instance.getSetting('displayRows'), totalRows)
    , displayColumns = Math.min(this.instance.getSetting('displayColumns'), totalColumns);

  if (!tableWidth) {
    throw new Error("I could not compute table width. Is the <table> element attached to the DOM?");
  }
  if (!tableHeight) {
    throw new Error("I could not compute table height. Is the <table> element attached to the DOM?");
  }

  if (this.type === 'vertical') {
    this.slider.style.top = this.$table.position().top + 'px';
    this.slider.style.left = tableWidth - 1 + 'px'; //1 is sliders border-width
    this.slider.style.height = tableHeight - 2 + 'px'; //2 is sliders border-width

    if (totalRows) {
      ratio = displayRows / totalRows;
    }
    handleSize = Math.round($(this.slider).height() * ratio);
    if (handleSize < 10) {
      handleSize = 30;
    }
    this.handle.style.height = handleSize + 'px';

    handlePosition = tableHeight * (offsetRow / totalRows);
    if (handlePosition > tableHeight - handleSize) {
      handlePosition = tableHeight - handleSize;
    }
    this.handle.style.top = handlePosition + 'px';
  }
  else if (this.type === 'horizontal') {
    this.slider.style.left = this.$table.position().left + 'px';
    this.slider.style.top = tableHeight - 1 + 'px'; //1 is sliders border-width
    this.slider.style.width = tableWidth - 2 + 'px'; //2 is sliders border-width

    if (totalColumns) {
      ratio = displayColumns / totalColumns;
    }
    handleSize = Math.round($(this.slider).width() * ratio);
    if (handleSize < 10) {
      handleSize = 30;
    }
    this.handle.style.width = handleSize + 'px';

    handlePosition = tableWidth * (offsetColumn / totalColumns);
    if (handlePosition > tableWidth - handleSize) {
      handlePosition = tableWidth - handleSize;
    }
    else if (handlePosition < 0) {
      handlePosition = 0;
    }
    this.handle.style.left = handlePosition + 'px';
  }

  this.dragdealer.setWrapperOffset();
  //this.dragdealer.setBoundsPadding();
  this.dragdealer.setBounds();
  //this.dragdealer.setSteps();
};
function WalkontableSelection(instance, settings) {
  this.instance = instance;
  this.selected = [];
  if (settings.border) {
    this.border = new WalkontableBorder(instance, settings);
  }
  this.onAdd = function (coords) {
    var TD = instance.wtTable.getCell(coords);
    if (TD) {
      if (settings.className) {
        instance.wtDom.addClass(TD, settings.className);
      }
    }
  };
  /*this.onRemove = function (coords) {
   var TD = instance.wtTable.getCell(coords);
   if (TD) {
   if (settings.className) {
   instance.wtDom.removeClass(TD, settings.className);
   }
   }
   };*/
}

WalkontableSelection.prototype.add = function (coords) {
  this.selected.push(coords);
};

WalkontableSelection.prototype.remove = function (coords) {
  var index = this.isSelected(coords);
  if (index > -1) {
    this.selected.splice(index, 1);
  }
};

WalkontableSelection.prototype.clear = function () {
  for (var i = this.selected.length - 1; i >= 0; i--) {
    this.remove(this.selected[i]);
  }
};

WalkontableSelection.prototype.isSelected = function (coords) {
  for (var i = 0, ilen = this.selected.length; i < ilen; i++) {
    if (this.selected[i][0] === coords[0] && this.selected[i][1] === coords[1]) {
      return i;
    }
  }
  return -1;
};

WalkontableSelection.prototype.getSelected = function () {
  return this.selected;
};

/**
 * Returns the top left (TL) and bottom right (BR) selection coordinates
 * @returns {Object}
 */
WalkontableSelection.prototype.getCorners = function () {
  var minRow
    , minColumn
    , maxRow
    , maxColumn
    , i
    , ilen = this.selected.length;

  if (ilen > 0) {
    minRow = maxRow = this.selected[0][0];
    minColumn = maxColumn = this.selected[0][1];

    if (ilen > 1) {
      for (i = 1; i < ilen; i++) {
        if (this.selected[i][0] < minRow) {
          minRow = this.selected[i][0];
        }
        else if (this.selected[i][0] > maxRow) {
          maxRow = this.selected[i][0];
        }

        if (this.selected[i][1] < minColumn) {
          minColumn = this.selected[i][1];
        }
        else if (this.selected[i][1] > maxColumn) {
          maxColumn = this.selected[i][1];
        }
      }
    }
  }

  return [minRow, minColumn, maxRow, maxColumn];
};

WalkontableSelection.prototype.draw = function () {
  var TD;
  for (var i = 0, ilen = this.selected.length; i < ilen; i++) {
    TD = this.instance.wtTable.getCell(this.selected[i]);
    if (TD) {
      this.onAdd(this.selected[i], TD);
    }
  }
  if (this.border) {
    if (ilen > 0) {
      this.border.appear(this.getCorners());
    }
    else {
      this.border.disappear(this.getCorners());
    }
  }
};

/*WalkontableSelection.prototype.rectangleSize = function () {
 var that = this
 , rowLengths = {}
 , rowBegins = {}
 , rowEnds = {}
 , row
 , col
 , rowSpan
 , colSpan
 , lastRow
 , i
 , ilen
 , j
 , height = 0
 , tableSection
 , lastTableSection;

 this.selected.sort(function (a, b) {
 return that.wtCell.colIndex(a) - that.wtCell.colIndex(b);
 });

 this.selected.sort(function (a, b) {
 return that.wtCell.rowIndex(a) - that.wtCell.rowIndex(b);
 });

 for (i = 0, ilen = this.selected.length; i < ilen; i++) {
 tableSection = this.wtDom.closestParent(this.selected[i], ['THEAD', 'TBODY', 'TFOOT', 'TABLE']);
 if(lastTableSection && lastTableSection !== tableSection) {
 return null; //can only select cells that are in the same section (thead, tbody, tfoot or table if none of them is defined)
 }
 lastTableSection = tableSection;

 row = this.wtCell.rowIndex(this.selected[i]);
 col = this.wtCell.colIndex(this.selected[i]);
 rowSpan = this.selected[i].rowSpan;
 colSpan = this.selected[i].colSpan;
 for (j = 0; j < rowSpan; j++) {
 if (typeof rowBegins[row + j] === 'undefined' || col < rowBegins[row + j]) {
 rowBegins[row + j] = col;
 }
 if (typeof rowEnds[row + j] === 'undefined' || col + colSpan - 1 > rowEnds[row + j]) {
 rowEnds[row + j] = col + colSpan - 1;
 }
 if (typeof rowLengths[row + j] === 'undefined') {
 rowLengths[row + j] = 0;
 height++;
 }
 rowLengths[row + j] += colSpan;
 }
 }

 if (!ilen) {
 return null; //empty selection
 }

 lastRow = -1;
 for (i in rowBegins) {
 if (rowBegins.hasOwnProperty(i)) {
 if (lastRow !== -1 && rowBegins[i] !== lastRow) {
 return null; //selected rows begin in different column
 }
 lastRow = rowBegins[i];
 }
 }

 lastRow = -1;
 for (i in rowEnds) {
 if (rowEnds.hasOwnProperty(i)) {
 if (lastRow !== -1 && rowEnds[i] !== lastRow) {
 return null; //selected rows end in different column
 }
 if (rowEnds[i] !== rowBegins[i] + rowLengths[i] - 1) {
 return null; //selected rows end does not match begin + length
 }
 lastRow = rowEnds[i];
 }
 }

 lastRow = -1;
 for (i in rowLengths) {
 if (rowLengths.hasOwnProperty(i)) {
 if (lastRow !== -1 && rowLengths[i] !== lastRow) {
 return null; //selected rows have different length
 }
 if (lastRow !== -1 && !rowLengths.hasOwnProperty(i - 1)) {
 return null; //there is a row gap in selection
 }
 lastRow = rowLengths[i];
 }
 }

 return {width: lastRow, height: height};
 };*/
function WalkontableTable(instance) {
  //reference to instance
  this.instance = instance;

  //bootstrap from settings
  this.TABLE = this.instance.getSetting('table');
  this.wtDom = new WalkontableDom();
  this.wtDom.removeTextNodes(this.TABLE);
  this.TBODY = this.TABLE.getElementsByTagName('TBODY')[0];
  if (!this.TBODY) {
    this.TBODY = document.createElement('TBODY');
    this.TABLE.appendChild(this.TBODY);
  }
  this.THEAD = this.TABLE.getElementsByTagName('THEAD')[0];
  if (!this.THEAD) {
    this.THEAD = document.createElement('THEAD');
    this.TABLE.insertBefore(this.THEAD, this.TBODY);
  }
  this.COLGROUP = this.TABLE.getElementsByTagName('COLGROUP')[0];
  if (!this.COLGROUP) {
    this.COLGROUP = document.createElement('COLGROUP');
    this.TABLE.insertBefore(this.COLGROUP, this.THEAD);
  }

  if (this.instance.hasSetting('columnHeaders')) {
    if (!this.THEAD.childNodes.length) {
      var TR = document.createElement('TR');
      this.THEAD.appendChild(TR);
    }
  }

  this.availableTRs = 0;
}

WalkontableTable.prototype.adjustAvailableNodes = function () {
  var totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , displayRows = this.instance.getSetting('displayRows')
    , displayColumns = this.instance.getSetting('displayColumns')
    , displayTds
    , rowHeadersCount = this.instance.hasSetting('rowHeaders') ? 1 : 0
    , TR;

  displayRows = Math.min(displayRows, totalRows);
  displayTds = Math.min(displayColumns, totalColumns);

  //adjust COLGROUP
  while (this.COLGROUP.childNodes.length < displayTds + rowHeadersCount) {
    this.COLGROUP.appendChild(document.createElement('COL'));
  }
  while (this.COLGROUP.length > displayTds + rowHeadersCount) {
    this.COLGROUP.removeChild(this.COLGROUP.lastChild);
  }

  //adjust THEAD
  if (this.instance.hasSetting('columnHeaders')) {
    var availableTHs = this.THEAD.childNodes[0].childNodes.length;
    while (availableTHs < displayTds + rowHeadersCount) {
      this.THEAD.firstChild.appendChild(document.createElement('TH'));
      availableTHs++;
    }
  }

  //adjust TBODY
  while (this.availableTRs < displayRows) {
    TR = document.createElement('TR');
    if (this.instance.hasSetting('rowHeaders')) {
      TR.appendChild(document.createElement('TH'));
    }
    for (var c = 0; c < displayTds; c++) {
      TR.appendChild(document.createElement('TD'));
    }
    this.TBODY.appendChild(TR);
    this.availableTRs++;
  }
  while (this.availableTRs > displayRows) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.availableTRs--;
  }

  var TRs = this.TABLE.getElementsByTagName('TR');

  for (var r = 0, rlen = TRs.length; r < rlen; r++) {
    while (TRs[r].childNodes.length < displayTds + rowHeadersCount) {
      TRs[r].appendChild(document.createElement('TD'));
    }
    while (TRs[r].childNodes.length > displayTds + rowHeadersCount) {
      TRs[r].removeChild(TRs[r].lastChild);
    }
  }
};

WalkontableTable.prototype.draw = function () {
  var r
    , c
    , offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , displayRows = this.instance.getSetting('displayRows')
    , displayColumns = this.instance.getSetting('displayColumns')
    , displayTds
    , rowHeadersCount = this.instance.hasSetting('rowHeaders') ? 1 : 0
    , TR
    , TH
    , TD
    , cellData;
  this.adjustAvailableNodes();

  displayRows = Math.min(displayRows, totalRows);
  displayTds = Math.min(displayColumns, totalColumns);

  //draw COLGROUP
  if (this.instance.hasSetting('rowHeaders')) {
    this.wtDom.addClass(this.COLGROUP.childNodes[0], 'rowHeader');
  }
  else {
    this.wtDom.removeClass(this.COLGROUP.childNodes[0], 'rowHeader');
  }

  if (this.instance.hasSetting('columnWidth')) {
    for (c = 0; c < displayTds; c++) {
      this.COLGROUP.childNodes[c + rowHeadersCount].style.width = this.instance.getSetting('columnWidth', offsetColumn + c) + 'px';
    }
  }

  //draw THEAD
  if (this.instance.hasSetting('rowHeaders') && this.instance.hasSetting('columnHeaders')) {
    this.THEAD.childNodes[0].childNodes[0].innerHTML = '';
  }

  if (this.instance.hasSetting('columnHeaders')) {
    for (c = 0; c < displayTds; c++) {
      this.THEAD.childNodes[0].childNodes[rowHeadersCount + c].innerHTML = this.instance.getSetting('columnHeaders', offsetColumn + c);
    }
  }

  //draw TBODY
  for (r = 0; r < displayRows; r++) {
    TR = this.TBODY.childNodes[r];
    if (this.instance.hasSetting('rowHeaders')) {
      TH = TR.childNodes[0];
      cellData = this.instance.getSetting('rowHeaders', offsetRow + r);
      if (cellData !== void 0) {
        TH.innerHTML = cellData;
      }
      else {
        TH.innerHTML = '';
      }
    }
    for (c = 0; c < displayTds; c++) {
      TD = TR.childNodes[c + rowHeadersCount];
      TD.className = '';
      this.instance.getSetting('cellRenderer', offsetRow + r, offsetColumn + c, TD);
    }
  }

  //redraw selections
  if (this.instance.selections) {
    for (r in this.instance.selections) {
      if (this.instance.selections.hasOwnProperty(r)) {
        this.instance.selections[r].draw();
      }
    }
  }

  return this;
};

WalkontableTable.prototype.getCell = function (coords) {
  var offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , displayRows = this.instance.getSetting('displayRows')
    , displayColumns = this.instance.getSetting('displayColumns')
    , rowHeadersCount = this.instance.hasSetting('rowHeaders') ? 1 : 0;

  if (coords[0] >= offsetRow && coords[0] <= offsetRow + displayRows - 1) {
    if (coords[1] >= offsetColumn && coords[1] < offsetColumn + displayColumns) {
      return this.TBODY.childNodes[coords[0] - offsetRow].childNodes[coords[1] - offsetColumn + rowHeadersCount];
    }
  }
  return null;
};

WalkontableTable.prototype.getCoords = function (TD) {
  var rowHeadersCount = this.instance.hasSetting('rowHeaders') ? 1 : 0;
  return [
    this.wtDom.prevSiblings(TD.parentNode).length + this.instance.getSetting('offsetRow'),
    TD.cellIndex + this.instance.getSetting('offsetColumn') - rowHeadersCount
  ];
};
function WalkontableWheel(instance) {
  var that = this;

  //reference to instance
  this.instance = instance;
  $(this.instance.settings.table).on('mousewheel', function (event, delta, deltaX, deltaY) {
    if (deltaY) {
      that.instance.scrollVertical(-deltaY).draw();
    }
    else if (deltaX) {
      that.instance.scrollHorizontal(deltaX).draw();
    }
    event.preventDefault();
  });
}
/**
 * Dragdealer JS v0.9.5 - patched by Walkontable at line 66
 * http://code.ovidiu.ch/dragdealer-js
 *
 * Copyright (c) 2010, Ovidiu Chereches
 * MIT License
 * http://legal.ovidiu.ch/licenses/MIT
 */

/* Cursor */

var Cursor =
{
	x: 0, y: 0,
	init: function()
	{
		this.setEvent('mouse');
		this.setEvent('touch');
	},
	setEvent: function(type)
	{
		var moveHandler = document['on' + type + 'move'] || function(){};
		document['on' + type + 'move'] = function(e)
		{
			moveHandler(e);
			Cursor.refresh(e);
		}
	},
	refresh: function(e)
	{
		if(!e)
		{
			e = window.event;
		}
		if(e.type == 'mousemove')
		{
			this.set(e);
		}
		else if(e.touches)
		{
			this.set(e.touches[0]);
		}
	},
	set: function(e)
	{
		if(e.pageX || e.pageY)
		{
			this.x = e.pageX;
			this.y = e.pageY;
		}
		else if(e.clientX || e.clientY)
		{
			this.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			this.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
	}
};
Cursor.init();

/* Position */

var Position =
{
	get: function(obj)
	{
		var curtop = 0, curleft = 0; //Walkontable patch. Original (var curleft = curtop = 0;) created curtop in global scope
		if(obj.offsetParent)
		{
			do
			{
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			}
			while((obj = obj.offsetParent));
		}
		return [curleft, curtop];
	}
};

/* Dragdealer */

var Dragdealer = function(wrapper, options)
{
	if(typeof(wrapper) == 'string')
	{
		wrapper = document.getElementById(wrapper);
	}
	if(!wrapper)
	{
		return;
	}
	var handle = wrapper.getElementsByTagName('div')[0];
	if(!handle || handle.className.search(/(^|\s)handle(\s|$)/) == -1)
	{
		return;
	}
	this.init(wrapper, handle, options || {});
	this.setup();
};
Dragdealer.prototype =
{
	init: function(wrapper, handle, options)
	{
		this.wrapper = wrapper;
		this.handle = handle;
		this.options = options;
		
		this.disabled = this.getOption('disabled', false);
		this.horizontal = this.getOption('horizontal', true);
		this.vertical = this.getOption('vertical', false);
		this.slide = this.getOption('slide', true);
		this.steps = this.getOption('steps', 0);
		this.snap = this.getOption('snap', false);
		this.loose = this.getOption('loose', false);
		this.speed = this.getOption('speed', 10) / 100;
		this.xPrecision = this.getOption('xPrecision', 0);
		this.yPrecision = this.getOption('yPrecision', 0);
		
		this.callback = options.callback || null;
		this.animationCallback = options.animationCallback || null;
		
		this.bounds = {
			left: options.left || 0, right: -(options.right || 0),
			top: options.top || 0, bottom: -(options.bottom || 0),
			x0: 0, x1: 0, xRange: 0,
			y0: 0, y1: 0, yRange: 0
		};
		this.value = {
			prev: [-1, -1],
			current: [options.x || 0, options.y || 0],
			target: [options.x || 0, options.y || 0]
		};
		this.offset = {
			wrapper: [0, 0],
			mouse: [0, 0],
			prev: [-999999, -999999],
			current: [0, 0],
			target: [0, 0]
		};
		this.change = [0, 0];
		
		this.activity = false;
		this.dragging = false;
		this.tapping = false;
	},
	getOption: function(name, defaultValue)
	{
		return this.options[name] !== undefined ? this.options[name] : defaultValue;
	},
	setup: function()
	{
		this.setWrapperOffset();
		this.setBoundsPadding();
		this.setBounds();
		this.setSteps();
		
		this.addListeners();
	},
	setWrapperOffset: function()
	{
		this.offset.wrapper = Position.get(this.wrapper);
	},
	setBoundsPadding: function()
	{
		if(!this.bounds.left && !this.bounds.right)
		{
			this.bounds.left = Position.get(this.handle)[0] - this.offset.wrapper[0];
			this.bounds.right = -this.bounds.left;
		}
		if(!this.bounds.top && !this.bounds.bottom)
		{
			this.bounds.top = Position.get(this.handle)[1] - this.offset.wrapper[1];
			this.bounds.bottom = -this.bounds.top;
		}
	},
	setBounds: function()
	{
		this.bounds.x0 = this.bounds.left;
		this.bounds.x1 = this.wrapper.offsetWidth + this.bounds.right;
		this.bounds.xRange = (this.bounds.x1 - this.bounds.x0) - this.handle.offsetWidth;
		
		this.bounds.y0 = this.bounds.top;
		this.bounds.y1 = this.wrapper.offsetHeight + this.bounds.bottom;
		this.bounds.yRange = (this.bounds.y1 - this.bounds.y0) - this.handle.offsetHeight;
		
		this.bounds.xStep = 1 / (this.xPrecision || Math.max(this.wrapper.offsetWidth, this.handle.offsetWidth));
		this.bounds.yStep = 1 / (this.yPrecision || Math.max(this.wrapper.offsetHeight, this.handle.offsetHeight));
	},
	setSteps: function()
	{
		if(this.steps > 1)
		{
			this.stepRatios = [];
			for(var i = 0; i <= this.steps - 1; i++)
			{
				this.stepRatios[i] = i / (this.steps - 1);
			}
		}
	},
	addListeners: function()
	{
		var self = this;
		
		this.wrapper.onselectstart = function()
		{
			return false;
		}
		this.handle.onmousedown = this.handle.ontouchstart = function(e)
		{
			self.handleDownHandler(e);
		};
		this.wrapper.onmousedown = this.wrapper.ontouchstart = function(e)
		{
			self.wrapperDownHandler(e);
		};
		var mouseUpHandler = document.onmouseup || function(){};
		document.onmouseup = function(e)
		{
			mouseUpHandler(e);
			self.documentUpHandler(e);
		};
		var touchEndHandler = document.ontouchend || function(){};
		document.ontouchend = function(e)
		{
			touchEndHandler(e);
			self.documentUpHandler(e);
		};
		var resizeHandler = window.onresize || function(){};
		window.onresize = function(e)
		{
			resizeHandler(e);
			self.documentResizeHandler(e);
		};
		this.wrapper.onmousemove = function(e)
		{
			self.activity = true;
		}
		this.wrapper.onclick = function(e)
		{
			return !self.activity;
		}
		
		this.interval = setInterval(function(){ self.animate() }, 25);
		self.animate(false, true);
	},
	handleDownHandler: function(e)
	{
		this.activity = false;
		Cursor.refresh(e);
		
		this.preventDefaults(e, true);
		this.startDrag();
		this.cancelEvent(e);
	},
	wrapperDownHandler: function(e)
	{
		Cursor.refresh(e);
		
		this.preventDefaults(e, true);
		this.startTap();
	},
	documentUpHandler: function(e)
	{
		this.stopDrag();
		this.stopTap();
		//this.cancelEvent(e);
	},
	documentResizeHandler: function(e)
	{
		this.setWrapperOffset();
		this.setBounds();
		
		this.update();
	},
	enable: function()
	{
		this.disabled = false;
		this.handle.className = this.handle.className.replace(/\s?disabled/g, '');
	},
	disable: function()
	{
		this.disabled = true;
		this.handle.className += ' disabled';
	},
	setStep: function(x, y, snap)
	{
		this.setValue(
			this.steps && x > 1 ? (x - 1) / (this.steps - 1) : 0,
			this.steps && y > 1 ? (y - 1) / (this.steps - 1) : 0,
			snap
		);
	},
	setValue: function(x, y, snap)
	{
		this.setTargetValue([x, y || 0]);
		if(snap)
		{
			this.groupCopy(this.value.current, this.value.target);
		}
	},
	startTap: function(target)
	{
		if(this.disabled)
		{
			return;
		}
		this.tapping = true;
		
		if(target === undefined)
		{
			target = [
				Cursor.x - this.offset.wrapper[0] - (this.handle.offsetWidth / 2),
				Cursor.y - this.offset.wrapper[1] - (this.handle.offsetHeight / 2)
			];
		}
		this.setTargetOffset(target);
	},
	stopTap: function()
	{
		if(this.disabled || !this.tapping)
		{
			return;
		}
		this.tapping = false;
		
		this.setTargetValue(this.value.current);
		this.result();
	},
	startDrag: function()
	{
		if(this.disabled)
		{
			return;
		}
		this.offset.mouse = [
			Cursor.x - Position.get(this.handle)[0],
			Cursor.y - Position.get(this.handle)[1]
		];
		
		this.dragging = true;
	},
	stopDrag: function()
	{
		if(this.disabled || !this.dragging)
		{
			return;
		}
		this.dragging = false;
		
		var target = this.groupClone(this.value.current);
		if(this.slide)
		{
			var ratioChange = this.change;
			target[0] += ratioChange[0] * 4;
			target[1] += ratioChange[1] * 4;
		}
		this.setTargetValue(target);
		this.result();
	},
	feedback: function()
	{
		var value = this.value.current;
		if(this.snap && this.steps > 1)
		{
			value = this.getClosestSteps(value);
		}
		if(!this.groupCompare(value, this.value.prev))
		{
			if(typeof(this.animationCallback) == 'function')
			{
				this.animationCallback(value[0], value[1]);
			}
			this.groupCopy(this.value.prev, value);
		}
	},
	result: function()
	{
		if(typeof(this.callback) == 'function')
		{
			this.callback(this.value.target[0], this.value.target[1]);
		}
	},
	animate: function(direct, first)
	{
		if(direct && !this.dragging)
		{
			return;
		}
		if(this.dragging)
		{
			var prevTarget = this.groupClone(this.value.target);
			
			var offset = [
				Cursor.x - this.offset.wrapper[0] - this.offset.mouse[0],
				Cursor.y - this.offset.wrapper[1] - this.offset.mouse[1]
			];
			this.setTargetOffset(offset, this.loose);
			
			this.change = [
				this.value.target[0] - prevTarget[0],
				this.value.target[1] - prevTarget[1]
			];
		}
		if(this.dragging || first)
		{
			this.groupCopy(this.value.current, this.value.target);
		}
		if(this.dragging || this.glide() || first)
		{
			this.update();
			this.feedback();
		}
	},
	glide: function()
	{
		var diff = [
			this.value.target[0] - this.value.current[0],
			this.value.target[1] - this.value.current[1]
		];
		if(!diff[0] && !diff[1])
		{
			return false;
		}
		if(Math.abs(diff[0]) > this.bounds.xStep || Math.abs(diff[1]) > this.bounds.yStep)
		{
			this.value.current[0] += diff[0] * this.speed;
			this.value.current[1] += diff[1] * this.speed;
		}
		else
		{
			this.groupCopy(this.value.current, this.value.target);
		}
		return true;
	},
	update: function()
	{
		if(!this.snap)
		{
			this.offset.current = this.getOffsetsByRatios(this.value.current);
		}
		else
		{
			this.offset.current = this.getOffsetsByRatios(
				this.getClosestSteps(this.value.current)
			);
		}
		this.show();
	},
	show: function()
	{
		if(!this.groupCompare(this.offset.current, this.offset.prev))
		{
			if(this.horizontal)
			{
				this.handle.style.left = String(this.offset.current[0]) + 'px';
			}
			if(this.vertical)
			{
				this.handle.style.top = String(this.offset.current[1]) + 'px';
			}
			this.groupCopy(this.offset.prev, this.offset.current);
		}
	},
	setTargetValue: function(value, loose)
	{
		var target = loose ? this.getLooseValue(value) : this.getProperValue(value);
		
		this.groupCopy(this.value.target, target);
		this.offset.target = this.getOffsetsByRatios(target);
	},
	setTargetOffset: function(offset, loose)
	{
		var value = this.getRatiosByOffsets(offset);
		var target = loose ? this.getLooseValue(value) : this.getProperValue(value);
		
		this.groupCopy(this.value.target, target);
		this.offset.target = this.getOffsetsByRatios(target);
	},
	getLooseValue: function(value)
	{
		var proper = this.getProperValue(value);
		return [
			proper[0] + ((value[0] - proper[0]) / 4),
			proper[1] + ((value[1] - proper[1]) / 4)
		];
	},
	getProperValue: function(value)
	{
		var proper = this.groupClone(value);

		proper[0] = Math.max(proper[0], 0);
		proper[1] = Math.max(proper[1], 0);
		proper[0] = Math.min(proper[0], 1);
		proper[1] = Math.min(proper[1], 1);
		
		if((!this.dragging && !this.tapping) || this.snap)
		{
			if(this.steps > 1)
			{
				proper = this.getClosestSteps(proper);
			}
		}
		return proper;
	},
	getRatiosByOffsets: function(group)
	{
		return [
			this.getRatioByOffset(group[0], this.bounds.xRange, this.bounds.x0),
			this.getRatioByOffset(group[1], this.bounds.yRange, this.bounds.y0)
		];
	},
	getRatioByOffset: function(offset, range, padding)
	{
		return range ? (offset - padding) / range : 0;
	},
	getOffsetsByRatios: function(group)
	{
		return [
			this.getOffsetByRatio(group[0], this.bounds.xRange, this.bounds.x0),
			this.getOffsetByRatio(group[1], this.bounds.yRange, this.bounds.y0)
		];
	},
	getOffsetByRatio: function(ratio, range, padding)
	{
		return Math.round(ratio * range) + padding;
	},
	getClosestSteps: function(group)
	{
		return [
			this.getClosestStep(group[0]),
			this.getClosestStep(group[1])
		];
	},
	getClosestStep: function(value)
	{
		var k = 0;
		var min = 1;
		for(var i = 0; i <= this.steps - 1; i++)
		{
			if(Math.abs(this.stepRatios[i] - value) < min)
			{
				min = Math.abs(this.stepRatios[i] - value);
				k = i;
			}
		}
		return this.stepRatios[k];
	},
	groupCompare: function(a, b)
	{
		return a[0] == b[0] && a[1] == b[1];
	},
	groupCopy: function(a, b)
	{
		a[0] = b[0];
		a[1] = b[1];
	},
	groupClone: function(a)
	{
		return [a[0], a[1]];
	},
	preventDefaults: function(e, selection)
	{
		if(!e)
		{
			e = window.event;
		}
		if(e.preventDefault)
		{
			e.preventDefault();
		}
		e.returnValue = false;
		
		if(selection && document.selection)
		{
			document.selection.empty();
		}
	},
	cancelEvent: function(e)
	{
		if(!e)
		{
			e = window.event;
		}
		if(e.stopPropagation)
		{
			e.stopPropagation();
		}
		e.cancelBubble = true;
	}
};

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);
