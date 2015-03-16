function WalkontableBorder(instance, settings) {
  var style;
  var createMultipleSelectorHandles = function () {
    this.selectionHandles = {
      topLeft: document.createElement('DIV'),
      topLeftHitArea: document.createElement('DIV'),
      bottomRight: document.createElement('DIV'),
      bottomRightHitArea: document.createElement('DIV')
    };
    var width = 10
      , hitAreaWidth = 40;

    this.selectionHandles.topLeft.className = 'topLeftSelectionHandle';
    this.selectionHandles.topLeftHitArea.className = 'topLeftSelectionHandle-HitArea';
    this.selectionHandles.bottomRight.className = 'bottomRightSelectionHandle';
    this.selectionHandles.bottomRightHitArea.className = 'bottomRightSelectionHandle-HitArea';

    this.selectionHandles.styles = {
      topLeft: this.selectionHandles.topLeft.style,
      topLeftHitArea: this.selectionHandles.topLeftHitArea.style,
      bottomRight: this.selectionHandles.bottomRight.style,
      bottomRightHitArea: this.selectionHandles.bottomRightHitArea.style
    };

    var hitAreaStyle = {
      'position': 'absolute',
      'height': hitAreaWidth + 'px',
      'width': hitAreaWidth + 'px',
      'border-radius': parseInt(hitAreaWidth/1.5,10) + 'px'
    };

    for (var prop in hitAreaStyle) {
      if (hitAreaStyle.hasOwnProperty(prop)) {
        this.selectionHandles.styles.bottomRightHitArea[prop] = hitAreaStyle[prop];
        this.selectionHandles.styles.topLeftHitArea[prop] = hitAreaStyle[prop];
      }
    }

    var handleStyle = {
      'position': 'absolute',
      'height': width + 'px',
      'width': width + 'px',
      'border-radius': parseInt(width/1.5,10) + 'px',
      'background': '#F5F5FF',
      'border': '1px solid #4285c8'
    };

    for (var prop in handleStyle) {
      if (handleStyle.hasOwnProperty(prop)) {
        this.selectionHandles.styles.bottomRight[prop] = handleStyle[prop];
        this.selectionHandles.styles.topLeft[prop] = handleStyle[prop];
      }
    }

    this.main.appendChild(this.selectionHandles.topLeft);
    this.main.appendChild(this.selectionHandles.bottomRight);
    this.main.appendChild(this.selectionHandles.topLeftHitArea);
    this.main.appendChild(this.selectionHandles.bottomRightHitArea);
  };

  if(!settings){
    return;
  }

  var eventManager = Handsontable.eventManager(instance);

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

  this.cornerDefaultStyle = {
    width: '5px',
    height: '5px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#FFF'
  };

  this.corner = this.main.childNodes[4];
  this.corner.className += ' corner';
  this.cornerStyle = this.corner.style;
  this.cornerStyle.width = this.cornerDefaultStyle.width;
  this.cornerStyle.height = this.cornerDefaultStyle.height;
  this.cornerStyle.border = [
    this.cornerDefaultStyle.borderWidth,
    this.cornerDefaultStyle.borderStyle,
    this.cornerDefaultStyle.borderColor
  ].join(' ');

  if(Handsontable.mobileBrowser) {
    createMultipleSelectorHandles.call(this);
  }

  this.disappear();
  if (!instance.wtTable.bordersHolder) {
    instance.wtTable.bordersHolder = document.createElement('div');
    instance.wtTable.bordersHolder.className = 'htBorders';

    instance.wtTable.spreader.appendChild(instance.wtTable.bordersHolder);

  }
  instance.wtTable.bordersHolder.insertBefore(this.main, instance.wtTable.bordersHolder.firstChild);

  var down = false;



  eventManager.addEventListener(document.body, 'mousedown', function () {
    down = true;
  });


  eventManager.addEventListener(document.body, 'mouseup', function () {
    down = false;
  });

  /* jshint ignore:start */
  for (var c = 0, len = this.main.childNodes.length; c < len; c++) {

    eventManager.addEventListener(this.main.childNodes[c], 'mouseenter', function (event) {
      if (!down || !instance.getSetting('hideBorderOnMouseDownOver')) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();

      var bounds = this.getBoundingClientRect();

      this.style.display = 'none';

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

      var handler = function (event) {
        if (isOutside(event)) {
          eventManager.removeEventListener(document.body, 'mousemove', handler);
          this.style.display = 'block';
        }
      };
      eventManager.addEventListener(document.body, 'mousemove', handler);
    });
  }
  /* jshint ignore:end */
}

/**
 * Show border around one or many cells
 * @param {Array} corners
 */
WalkontableBorder.prototype.appear = function (corners) {
  if (this.disabled) {
    return;
  }

  var instance = this.instance;

  var isMultiple,
    fromTD,
    toTD,
    fromOffset,
    toOffset,
    containerOffset,
    top,
    minTop,
    left,
    minLeft,
    height,
    width,
    fromRow,
    fromColumn,
    toRow,
    toColumn,
    i,
    ilen,
    s;

  var isPartRange = function () {
    if(this.instance.selections.area.cellRange) {

      if (toRow != this.instance.selections.area.cellRange.to.row ||
          toColumn != this.instance.selections.area.cellRange.to.col) {
        return true;
      }
    }

    return false;
  };

  var updateMultipleSelectionHandlesPosition = function (top, left, width, height) {
    var handleWidth = parseInt(this.selectionHandles.styles.topLeft.width, 10)
      , hitAreaWidth = parseInt(this.selectionHandles.styles.topLeftHitArea.width, 10);

    this.selectionHandles.styles.topLeft.top = parseInt(top - handleWidth,10) + "px";
    this.selectionHandles.styles.topLeft.left = parseInt(left - handleWidth,10) + "px";

    this.selectionHandles.styles.topLeftHitArea.top = parseInt(top - (hitAreaWidth/4)*3,10) + "px";
    this.selectionHandles.styles.topLeftHitArea.left = parseInt(left - (hitAreaWidth/4)*3,10) + "px";

    this.selectionHandles.styles.bottomRight.top = parseInt(top + height,10) + "px";
    this.selectionHandles.styles.bottomRight.left = parseInt(left + width,10) + "px";

    this.selectionHandles.styles.bottomRightHitArea.top = parseInt(top + height - hitAreaWidth/4,10) + "px";
    this.selectionHandles.styles.bottomRightHitArea.left = parseInt(left + width - hitAreaWidth/4,10) + "px";

    if(this.settings.border.multipleSelectionHandlesVisible && this.settings.border.multipleSelectionHandlesVisible()) {
      this.selectionHandles.styles.topLeft.display = "block";
      this.selectionHandles.styles.topLeftHitArea.display = "block";
      if(!isPartRange.call(this)) {
        this.selectionHandles.styles.bottomRight.display = "block";
        this.selectionHandles.styles.bottomRightHitArea.display = "block";
      } else {
        this.selectionHandles.styles.bottomRight.display = "none";
        this.selectionHandles.styles.bottomRightHitArea.display = "none";
      }
    } else {
      this.selectionHandles.styles.topLeft.display = "none";
      this.selectionHandles.styles.bottomRight.display = "none";
      this.selectionHandles.styles.topLeftHitArea.display = "none";
      this.selectionHandles.styles.bottomRightHitArea.display = "none";
    }

    if(fromRow == this.instance.wtSettings.getSetting('fixedRowsTop') || fromColumn == this.instance.wtSettings.getSetting('fixedColumnsLeft')) {
      this.selectionHandles.styles.topLeft.zIndex = "9999";
      this.selectionHandles.styles.topLeftHitArea.zIndex = "9999";
    } else {
      this.selectionHandles.styles.topLeft.zIndex = "";
      this.selectionHandles.styles.topLeftHitArea.zIndex = "";
    }

  };

  if (instance.cloneOverlay instanceof WalkontableTopOverlay || instance.cloneOverlay instanceof WalkontableCornerOverlay) {
    ilen = instance.getSetting('fixedRowsTop');
  }
  else {
    ilen = instance.wtTable.getRenderedRowsCount();
  }

  for (i = 0; i < ilen; i++) {
    s = instance.wtTable.rowFilter.renderedToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      fromRow = s;
      break;
    }
  }

  for (i = ilen - 1; i >= 0; i--) {
    s = instance.wtTable.rowFilter.renderedToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      toRow = s;
      break;
    }
  }

  ilen = instance.wtTable.getRenderedColumnsCount();

  for (i = 0; i < ilen; i++) {
    s = instance.wtTable.columnFilter.renderedToSource(i);
    if (s >= corners[1] && s <= corners[3]) {
      fromColumn = s;
      break;
    }
  }

  for (i = ilen - 1; i >= 0; i--) {
    s = instance.wtTable.columnFilter.renderedToSource(i);
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

  if (Handsontable.mobileBrowser || (!this.hasSetting(this.settings.border.cornerVisible) || isPartRange.call(this))) {
    this.cornerStyle.display = 'none';
  }
  else {
    this.cornerStyle.top = top + height - 4 + 'px';
    this.cornerStyle.left = left + width - 4 + 'px';
    this.cornerStyle.borderRightWidth = this.cornerDefaultStyle.borderWidth;
    this.cornerStyle.width = this.cornerDefaultStyle.width;
    this.cornerStyle.display = 'block';

    if (toColumn === this.instance.getSetting('totalColumns') - 1) {
      var trimmingContainer = Handsontable.Dom.getTrimmingContainer(instance.wtTable.TABLE),
        cornerOverlappingContainer = toTD.offsetLeft + Handsontable.Dom.outerWidth(toTD) >= Handsontable.Dom.innerWidth(trimmingContainer);

      if (cornerOverlappingContainer) {
        this.cornerStyle.left = Math.floor(left + width - 3 - parseInt(this.cornerDefaultStyle.width) / 2) + "px";
        this.cornerStyle.borderRightWidth = 0;
      }
    }
  }

  if (Handsontable.mobileBrowser) {
    updateMultipleSelectionHandlesPosition.call(this, top, left, width, height);
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

  if(Handsontable.mobileBrowser) {
    this.selectionHandles.styles.topLeft.display = 'none';
    this.selectionHandles.styles.bottomRight.display = 'none';
  }


};

WalkontableBorder.prototype.hasSetting = function (setting) {
  if (typeof setting === 'function') {
    return setting();
  }
  return !!setting;
};
