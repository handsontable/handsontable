function WalkontableBorder(instance, settings) {
  var style;

  if(!settings){
    return;
  }

  //reference to instance
  this.instance = instance;
  this.settings = settings;

  this.main = document.createElement("div");
  style = this.main.style;
  style.position = 'absolute';
  style.top = 0;
  style.left = 0;

  var borderDivs = ['top','left','bottom','right','corner'];

  for (var i = 0; i < 5; i++) {
    var position = borderDivs[i];

    var DIV = document.createElement('DIV');
    DIV.className = 'wtBorder ' + (this.settings.className || ''); // + borderDivs[i];
    if(this.settings[position] && this.settings[position].hide){
      DIV.className += " hidden";
    }

    style = DIV.style;
    style.backgroundColor = (this.settings[position] && this.settings[position].color) ? this.settings[position].color : settings.border.color;
    style.height = (this.settings[position] && this.settings[position].width) ? this.settings[position].width + 'px' : settings.border.width + 'px';
    style.width = (this.settings[position] && this.settings[position].width) ? this.settings[position].width + 'px' : settings.border.width + 'px';

    this.main.appendChild(DIV);
  }

  this.top = this.main.childNodes[0];
  this.left = this.main.childNodes[1];
  this.bottom = this.main.childNodes[2];
  this.right = this.main.childNodes[3];

  this.topStyle = this.top.style;
  this.leftStyle = this.left.style;
  this.bottomStyle = this.bottom.style;
  this.rightStyle = this.right.style;

  this.corner = this.main.childNodes[4];
  this.corner.className += ' corner';
  this.cornerStyle = this.corner.style;
  this.cornerStyle.width = '5px';
  this.cornerStyle.height = '5px';
  this.cornerStyle.border = '2px solid #FFF';

  this.disappear();
  if (!instance.wtTable.bordersHolder) {
    instance.wtTable.bordersHolder = document.createElement('div');
    instance.wtTable.bordersHolder.className = 'htBorders';
    instance.wtTable.hider.appendChild(instance.wtTable.bordersHolder);

  }
  instance.wtTable.bordersHolder.insertBefore(this.main, instance.wtTable.bordersHolder.firstChild);

  var down = false;
  var $body = $(document.body);

  $body.on('mousedown.walkontable.' + instance.guid, function () {
    down = true;
  });

  $body.on('mouseup.walkontable.' + instance.guid, function () {
    down = false
  });

  $(this.main.childNodes).on('mouseenter', function (event) {
    if (!down || !instance.getSetting('hideBorderOnMouseDownOver')) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();

    var bounds = this.getBoundingClientRect();

    var $this = $(this);
    $this.hide();

    var isOutside = function (event) {
      if (event.clientY < Math.floor(bounds.top)) {
        return true;
      }
      if (event.clientY > Math.ceil(bounds.top + bounds.height)) {
        return true;
      }
      if (event.clientX < Math.floor(bounds.left)) {
        return true;
      }
      if (event.clientX > Math.ceil(bounds.left + bounds.width)) {
        return true;
      }
    };

    $body.on('mousemove.border.' + instance.guid, function (event) {
      if (isOutside(event)) {
        $body.off('mousemove.border.' + instance.guid);
        $this.show();
      }
    });
  });
}

/**
 * Show border around one or many cells
 * @param {Array} corners
 */
WalkontableBorder.prototype.appear = function (corners) {
  var isMultiple, fromTD, toTD, fromOffset, toOffset, containerOffset, top, minTop, left, minLeft, height, width;
  if (this.disabled) {
    return;
  }

  var instance = this.instance;

  var fromRow
    , fromColumn
    , toRow
    , toColumn
    , i
    , ilen
    , s;

  if (instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    ilen = instance.getSetting('fixedRowsTop');
  }
  else {
    ilen = instance.wtTable.getRowStrategy().countVisible();
  }

  for (i = 0; i < ilen; i++) {
    s = instance.wtTable.rowFilter.visibleToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      fromRow = s;
      break;
    }
  }

  for (i = ilen - 1; i >= 0; i--) {
    s = instance.wtTable.rowFilter.visibleToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      toRow = s;
      break;
    }
  }

  if (instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    ilen = instance.getSetting('fixedColumnsLeft');
  }
  else {
    ilen = instance.wtTable.getColumnStrategy().cellCount;
  }

  for (i = 0; i < ilen; i++) {
    s = instance.wtTable.columnFilter.visibleToSource(i);
    if (s >= corners[1] && s <= corners[3]) {
      fromColumn = s;
      break;
    }
  }

  for (i = ilen - 1; i >= 0; i--) {
    s = instance.wtTable.columnFilter.visibleToSource(i);
    if (s >= corners[1] && s <= corners[3]) {
      toColumn = s;
      break;
    }
  }

  if (fromRow !== void 0 && fromColumn !== void 0) {
    isMultiple = (fromRow !== toRow || fromColumn !== toColumn);
    fromTD = instance.wtTable.getCell(new WalkontableCellCoords(fromRow, fromColumn));
    toTD = isMultiple ? instance.wtTable.getCell(new WalkontableCellCoords(toRow, toColumn)) : fromTD;
    fromOffset = Handsontable.Dom.offset(fromTD);
    toOffset = isMultiple ? Handsontable.Dom.offset(toTD) : fromOffset;
    containerOffset = Handsontable.Dom.offset(instance.wtTable.TABLE);

    minTop = fromOffset.top;
    height = toOffset.top + Handsontable.Dom.outerHeight(toTD) - minTop;
    minLeft = fromOffset.left;
    width = toOffset.left + Handsontable.Dom.outerWidth(toTD) - minLeft;

    top = minTop - containerOffset.top - 1;
    left = minLeft - containerOffset.left - 1;

    var style = Handsontable.Dom.getComputedStyle(fromTD);
    if (parseInt(style['borderTopWidth'], 10) > 0) {
      top += 1;
      height = height > 0 ? height - 1 : 0;
    }
    if (parseInt(style['borderLeftWidth'], 10) > 0) {
      left += 1;
      width = width > 0 ? width - 1 : 0;
    }
  }
  else {
    this.disappear();
    return;
  }

  this.topStyle.top = top + 'px';
  this.topStyle.left = left + 'px';
  this.topStyle.width = width + 'px';
  this.topStyle.display = 'block';

  this.leftStyle.top = top + 'px';
  this.leftStyle.left = left + 'px';
  this.leftStyle.height = height + 'px';
  this.leftStyle.display = 'block';

  var delta = Math.floor(this.settings.border.width / 2);

  this.bottomStyle.top = top + height - delta + 'px';
  this.bottomStyle.left = left + 'px';
  this.bottomStyle.width = width + 'px';
  this.bottomStyle.display = 'block';

  this.rightStyle.top = top + 'px';
  this.rightStyle.left = left + width - delta + 'px';
  this.rightStyle.height = height + 1 + 'px';
  this.rightStyle.display = 'block';

  if (!this.hasSetting(this.settings.border.cornerVisible)) {
    this.cornerStyle.display = 'none';
  }
  else {
    this.cornerStyle.top = top + height - 4 + 'px';
    this.cornerStyle.left = left + width - 4 + 'px';
    this.cornerStyle.display = 'block';
  }
};

/**
 * Hide border
 */
WalkontableBorder.prototype.disappear = function () {
  this.topStyle.display = 'none';
  this.leftStyle.display = 'none';
  this.bottomStyle.display = 'none';
  this.rightStyle.display = 'none';
  this.cornerStyle.display = 'none';
};

WalkontableBorder.prototype.hasSetting = function (setting) {
  if (typeof setting === 'function') {
    return setting();
  }
  return !!setting;
};
