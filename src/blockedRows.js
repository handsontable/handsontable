/**
 * Handsontable BlockedRows class
 * @param {Object} instance
 */
handsontable.BlockedRows = function (instance) {
  var that = this;
  this.instance = instance;
  this.headers = [];
  var position = instance.table.position();
  instance.positionFix(position);
  this.main = $('<div style="position: absolute; top: ' + position.top + 'px; left: ' + position.left + 'px"><table cellspacing="0" cellpadding="0"><thead></thead></table></div>');
  this.instance.container.on('datachange.handsontable', function (event, changes) {
    setTimeout(function () {
      that.dimensions(changes);
    }, 10);
  });
  this.instance.container.append(this.main);
  this.hasCSS3 = !($.browser.msie && (parseInt($.browser.version, 10) <= 8)); //Used to get over IE8- not having :last-child selector
  this.update();
};

/**
 * Returns number of blocked cols
 */
handsontable.BlockedRows.prototype.count = function () {
  return this.headers.length;
};

/**
 * Create column header in the grid table
 */
handsontable.BlockedRows.prototype.createCol = function (className) {
  var $tr, th, h, hlen = this.count();
  for (h = 0; h < hlen; h++) {
    $tr = this.main.find('thead tr.' + this.headers[h].className);
    if (!$tr.length) {
      $tr = $('<tr class="' + this.headers[h].className + '"></tr>');
      this.main.find('thead').append($tr);
    }
    $tr = this.instance.table.find('thead tr.' + this.headers[h].className);
    if (!$tr.length) {
      $tr = $('<tr class="' + this.headers[h].className + '"></tr>');
      this.instance.table.find('thead').append($tr);
    }

    th = document.createElement('th');
    th.className = this.headers[h].className;
    if (className) {
      th.className += ' ' + className;
    }
    th.innerHTML = '&nbsp;<span class="small">&nbsp;</span>&nbsp;';
    this.instance.minWidthFix(th);
    this.instance.table.find('thead tr.' + this.headers[h].className)[0].appendChild(th);

    th = document.createElement('th');
    th.className = this.headers[h].className;
    if (className) {
      th.className += ' ' + className;
    }
    this.instance.minWidthFix(th);
    this.main.find('thead tr.' + this.headers[h].className)[0].appendChild(th);
  }
};

/**
 * Create column header in the grid table
 */
handsontable.BlockedRows.prototype.create = function () {
  if (this.count() > 0) {
    this.instance.table.find('thead').empty();
    this.main.find('thead').empty();
    var offset = this.instance.blockedCols.count();
    for (c = offset - 1; c >= 0; c--) {
      this.createCol(this.instance.blockedCols.headers[c].className);
    }
    for (c = 0; c < this.instance.colCount; c++) {
      this.createCol();
    }
  }
  if (!this.hasCSS3) {
    this.instance.container.find('thead tr.lastChild').not(':last-child').removeClass('lastChild');
    this.instance.container.find('thead tr:last-child').not('.lastChild').addClass('lastChild');
  }
};

/**
 * Copy table column header onto the floating layer above the grid
 */
handsontable.BlockedRows.prototype.refresh = function () {
  if (this.count() > 0) {
    var that = this;
    var hlen = this.count(), h;
    for (h = 0; h < hlen; h++) {
      var $tr = this.main.find('thead tr.' + this.headers[h].className);
      var tr = $tr[0];
      var ths = tr.childNodes;
      var thsLen = ths.length;
      var offset = this.instance.blockedCols.count();

      while (thsLen > this.instance.colCount + offset) {
        //remove excessive cols
        thsLen--;
        $(tr.childNodes[thsLen]).remove();
      }

      for (h = 0; h < hlen; h++) {
        var realThs = this.instance.table.find('thead th.' + this.headers[h].className);
        for (var i = 0; i < thsLen; i++) {
          realThs[i].innerHTML = ths[i].innerHTML = that.headers[h].columnLabel(i - offset);
          this.instance.minWidthFix(realThs[i]);
          this.instance.minWidthFix(ths[i]);
          ths[i].style.minWidth = realThs.eq(i).width() + 'px';
        }
      }
    }

    this.ths = this.main.find('tr:last-child th');
    this.refreshBorders();
  }
};

/**
 * Refresh border width
 */
handsontable.BlockedRows.prototype.refreshBorders = function () {
  if (this.count() > 0) {
    if (this.instance.curScrollTop === 0) {
      this.ths.css('borderBottomWidth', 0);
    }
    else if (this.instance.lastScrollTop === 0) {
      this.ths.css('borderBottomWidth', '1px');
    }
  }
};

/**
 * Recalculate column widths on the floating layer above the grid
 * @param {Object} changes
 */
handsontable.BlockedRows.prototype.dimensions = function (changes) {
  if (this.count() > 0) {
    var offset = this.instance.blockedCols.count();
    for (var i = 0, ilen = changes.length; i < ilen; i++) {
      this.ths[changes[i][1] + offset].style.minWidth = $(this.instance.getCell(changes[i][0], changes[i][1])).width() + 'px';
    }
  }
};


/**
 * Update settings of the column header
 */
handsontable.BlockedRows.prototype.update = function () {
  this.create();
  this.refresh();
};

/**
 * Add column header to DOM
 */
handsontable.BlockedRows.prototype.addHeader = function (header) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === header.className) {
      delete this.headers.splice(h, 1); //if exists, remove then add to recreate
    }
  }
  this.headers.push(header);
  this.headers.sort(function (a, b) {
    return a.priority || 0 - b.priority || 0
  });
  this.update();
};

/**
 * Remove column header from DOM
 */
handsontable.BlockedRows.prototype.destroyHeader = function (className) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === className) {
      this.main.find('thead tr.' + this.headers[h].className).remove();
      this.instance.table.find('thead tr.' + this.headers[h].className).remove();
      this.headers.splice(h, 1);
    }
  }
};