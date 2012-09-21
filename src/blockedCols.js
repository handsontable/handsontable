(function ($) {
  "use strict";
  /**
   * Handsontable BlockedCols class
   * @param {Object} instance
   */
  Handsontable.BlockedCols = function (instance) {
    var that = this;
    this.heightMethod = ($.browser.mozilla || $.browser.opera) ? "outerHeight" : "height";
    this.instance = instance;
    this.headers = [];
    var position = instance.table.position();
    instance.positionFix(position);
    this.main = $('<div style="position: absolute; top: ' + position.top + 'px; left: ' + position.left + 'px"><table cellspacing="0" cellpadding="0"><thead><tr></tr></thead><tbody></tbody></table></div>');
    this.instance.container.append(this.main);
    this.instance.rootElement.on('cellrender.handsontable', function (event, changes, source) {
      setTimeout(function () {
        that.dimensions(changes, source);
      }, 10);
    });
  };

  /**
   * Returns number of blocked cols
   */
  Handsontable.BlockedCols.prototype.count = function () {
    return this.headers.length;
  };

  /**
   * Create row header in the grid table
   */
  Handsontable.BlockedCols.prototype.createRow = function (tr) {
    var th;
    var mainTr = document.createElement('tr');

    for (var h = 0, hlen = this.count(); h < hlen; h++) {
      th = document.createElement('th');
      th.className = this.headers[h].className;
      this.instance.minWidthFix(th);
      tr.insertBefore(th, tr.firstChild);

      th = document.createElement('th');
      th.className = this.headers[h].className;
      mainTr.insertBefore(th, mainTr.firstChild);
    }

    this.main.find('tbody')[0].appendChild(mainTr);
  };

  /**
   * Create row header in the grid table
   */
  Handsontable.BlockedCols.prototype.create = function () {
    var hlen = this.count(), h, th;
    this.main.find('tbody').empty();
    this.instance.table.find('tbody th').remove();
    var $theadTr = this.main.find('thead tr');
    $theadTr.empty();

    if (hlen > 0) {
      var offset = this.instance.blockedRows.count();
      if (offset) {
        for (h = 0; h < hlen; h++) {
          th = $theadTr[0].getElementsByClassName ? $theadTr[0].getElementsByClassName(this.headers[h].className)[0] : $theadTr.find('.' + this.headers[h].className.replace(/\s/i, '.'))[0];
          if (!th) {
            th = document.createElement('th');
            th.className = this.headers[h].className;
            th.innerHTML = this.headerText('&nbsp;');
            this.instance.minWidthFix(th);
            $theadTr[0].insertBefore(th, $theadTr[0].firstChild);
          }
        }
      }

      var trs = this.instance.table.find('tbody')[0].childNodes;
      for (var r = 0; r < this.instance.rowCount; r++) {
        this.createRow(trs[r]);
      }
    }
  };

  /**
   * Copy table row header onto the floating layer above the grid
   */
  Handsontable.BlockedCols.prototype.refresh = function () {
    var hlen = this.count(), h, th, realTh, i, label;
    if (hlen > 0) {
      var $tbody = this.main.find('tbody');
      var tbody = $tbody[0];
      var trs = tbody.childNodes;
      var trsLen = trs.length;
      while (trsLen > this.instance.rowCount) {
        //remove excessive rows
        trsLen--;
        $(tbody.childNodes[trsLen]).remove();
      }

      var realTrs = this.instance.table.find('tbody tr');
      for (i = 0; i < trsLen; i++) {
        for (h = 0; h < hlen; h++) {
          label = this.headers[h].columnLabel(i);
          realTh = realTrs[i].getElementsByClassName ? realTrs[i].getElementsByClassName(this.headers[h].className)[0] : $(realTrs[i]).find('.' + this.headers[h].className.replace(/\s/i, '.'))[0];
          th = trs[i].getElementsByClassName ? trs[i].getElementsByClassName(this.headers[h].className)[0] : $(trs[i]).find('.' + this.headers[h].className.replace(/\s/i, '.'))[0];
          if (this.headers[h].format && this.headers[h].format === 'small') {
            realTh.innerHTML = this.headerText(label);
            th.innerHTML = this.headerText(label);
          }
          else {
            realTh.innerHTML = label;
            th.innerHTML = label;
          }
          this.instance.minWidthFix(th);
          th.style.height = $(realTh)[this.heightMethod]() + 'px';
        }
      }

      this.ths = this.main.find('th:last-child');
      this.refreshBorders();
    }
  };

  /**
   * Refresh border width
   */
  Handsontable.BlockedCols.prototype.refreshBorders = function () {
    if (this.count() > 0) {
      if (this.instance.curScrollLeft === 0) {
        this.ths.css('borderRightWidth', 0);
      }
      else if (this.instance.lastScrollLeft === 0) {
        this.ths.css('borderRightWidth', '1px');
      }
    }
  };

  /**
   * Recalculate row heights on the floating layer above the grid
   * @param {Object} changes
   */
  Handsontable.BlockedCols.prototype.dimensions = function (changes) {
    if (this.count() > 0) {
      var trs = this.main[0].firstChild.getElementsByTagName('tbody')[0].childNodes;
      for (var i = 0, ilen = changes.length; i < ilen; i++) {
        var col = this.instance.propToCol(changes[i][1]);
        var $th = $(this.instance.getCell(changes[i][0], col));
        if ($th.length) {
          trs[changes[i][0]].firstChild.style.height = $th[this.heightMethod]() + 'px';
        }
      }
    }
  };

  /**
   * Update settings of the row header
   */
  Handsontable.BlockedCols.prototype.update = Handsontable.BlockedRows.prototype.update;

  /**
   * Add row header to DOM
   */
  Handsontable.BlockedCols.prototype.addHeader = function (header) {
    for (var h = this.count() - 1; h >= 0; h--) {
      if (this.headers[h].className === header.className) {
        this.headers.splice(h, 1); //if exists, remove then add to recreate
      }
    }
    this.headers.push(header);
    this.headers.sort(function (a, b) {
      return a.priority || 0 - b.priority || 0
    });
  };

  /**
   * Remove row header from DOM
   */
  Handsontable.BlockedCols.prototype.destroyHeader = function (className) {
    for (var h = this.count() - 1; h >= 0; h--) {
      if (this.headers[h].className === className) {
        this.headers.splice(h, 1);
      }
    }
  };

  /**
   * Puts string to small text template
   */
  Handsontable.BlockedCols.prototype.headerText = Handsontable.BlockedRows.prototype.headerText;
})(jQuery);