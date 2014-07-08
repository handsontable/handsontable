(function (Handsontable) {
  function HandsontableManualRowResize () {

    var pressed
      , currentTH
      , currentRow
      , currentHeight
      , instance
      , newSize
      , startY
      , startHeight
      , startOffset
      , scrollTop = 0
      , scrollLeft = 0
      , resizer = document.createElement('DIV')
      , handle = document.createElement('DIV')
      , line = document.createElement('DIV')
      , lineStyle = line.style;


    resizer.className = 'manualRowResizer';
    handle.className = 'manualRowResizerHandle';

    resizer.appendChild(handle);

    line.className = 'manualRowResizerLine';
    resizer.appendChild(line);

    var $document = $(document);
    $document.mousemove(function (e) {
      if (pressed) {
        currentHeight = startHeight + (e.pageY - startY);
        newSize = setManualSize(currentRow, currentHeight);
        resizer.style.top = startOffset + currentHeight + 'px';
      }
    });

    $document.mouseup(function () {
      if (pressed) {
        Handsontable.Dom.removeClass(resizer, 'active');
        pressed = false;

        if (newSize != startHeight) {
          instance.forceFullRender = true;
          instance.view.render();

          saveManualRowHeights.call(instance);

          Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
        }

        refreshResizerPosition.call(instance, currentTH);
      }
    });

    var saveManualRowHeights = function () {
      var instance = this;
      Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowHeights', instance.manualRowHeights);
    };

    var loadManualRowHeights = function () {
      var instance = this
        , storedState = {};

      Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowHeights', storedState);

      return storedState.value;
    };

    var refreshResizerPosition = function(TH) {
      instance = this;
      currentTH = TH;

      var row = this.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords

      if (row >= 0) { //if not row header
        currentRow = row;
        var rootOffset = Handsontable.Dom.offset(this.rootElement[0]).top;
        var thOffset = Handsontable.Dom.offset(TH).top;
        startOffset = (thOffset - rootOffset) + scrollTop;
        resizer.style.top = startOffset + parseInt(Handsontable.Dom.outerHeight(TH), 10) + 'px';
        resizer.style.left = scrollLeft + 'px';
        this.rootElement[0].appendChild(resizer);
      }
    }

    var refreshLinePosition = function() {
      var instance = this;
      startHeight = parseInt(Handsontable.Dom.outerHeight(currentTH), 10);
      Handsontable.Dom.addClass(resizer, 'active');
      lineStyle.width = Handsontable.Dom.outerWidth(instance.$table[0]) + 'px';
      pressed = instance;
    }

    var bindManualRowHeightEvents = function () {
      var instance = this,
        autoresizeTimeout = null,
        dblclick = 0;


      instance.rootElement.on('mouseenter.handsontable', 'table tbody tr > th', function (e) {
        if (!pressed) {
          refreshResizerPosition.call(instance, e.currentTarget);
        }
      });


      instance.rootElement.on('mousedown.handsontable', '.manualRowResizer', function () {
        if (autoresizeTimeout == null) {
          autoresizeTimeout = setTimeout(function () {

            if (dblclick >= 2) {
              setManualSize(currentRow, null); //double click sets auto row size
              instance.forceFullRender = true;
              instance.view.render();
              Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
            }

            dblclick = 0;
            autoresizeTimeout = null;
          }, 200);
        }
        dblclick++;
      });

      instance.rootElement.on('mousedown.handsontable', '.manualRowResizer', function (e) {
        startY = e.pageY;
        refreshLinePosition.call(instance);
        newSize = startHeight;
      });
    };

    this.beforeInit = function () {
      this.manualRowHeights = [];
    };

    this.init = function (source) {

      var instance = this;
      var manualColumnHeightEnabled = !!(this.getSettings().manualRowResize);

      if (manualColumnHeightEnabled) {

        var initialRowHeights = this.getSettings().manualRowResize;

        var loadedManualRowHeights = loadManualRowHeights.call(instance);

        if (typeof loadedManualRowHeights != 'undefined') {
          this.manualRowHeights = loadedManualRowHeights;
        } else if (initialRowHeights instanceof Array) {
          this.manualRowHeights = initialRowHeights;
        } else {
          this.manualRowHeights = [];
        }

        if (source === 'afterInit') {
          bindManualRowHeightEvents.call(this);
          instance.forceFullRender = true;
          instance.render();
          Handsontable.hooks.add('afterRender', afterRender);
        }
      }
    };

    var setManualSize = function (row, height) {
      row = Handsontable.hooks.execute(instance, 'modifyRow', row);

      instance.manualRowHeights[row] = height;
      return height;
    };

    this.modifyRowHeight = function (height, row) {
      if (this.getSettings().manualRowResize) {
        row = this.runHooksAndReturn('modifyRow', row);
        if (this.manualRowHeights[row] !== void 0) {
          return this.manualRowHeights[row];
        }
      }
      return height;
    };

    var afterRender = function () {
      var instance = this;
      scrollTop = instance.rootElement.scrollTop();
      scrollLeft = instance.rootElement.scrollLeft();
    }
  }

  var htManualRowResize = new HandsontableManualRowResize();

  Handsontable.hooks.add('beforeInit', htManualRowResize.beforeInit);
  Handsontable.hooks.add('afterInit', function () {
    htManualRowResize.init.call(this, 'afterInit');
  });

  Handsontable.hooks.add('afterUpdateSettings', function () {
    htManualRowResize.init.call(this, 'afterUpdateSettings')
  });

  Handsontable.hooks.add('modifyRowHeight', htManualRowResize.modifyRowHeight);

  Handsontable.hooks.register('afterRowResize');

})(Handsontable);
