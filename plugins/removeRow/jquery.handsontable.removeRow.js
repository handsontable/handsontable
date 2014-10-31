(function (Handsontable) {
  "use strict";
  /**
   * Handsontable RemoveRow plugin. See `demo/buttons.html` for example usage
   * This plugin is not a part of the Handsontable build (to use it, you must load it after loading Handsontable)
   * See `test/removeRowSpec.js` for tests
   */
  function removeRow() {

    var eventManager = Handsontable.eventManager(this);

    function bindMouseEvents() {
      var instance = this;

      eventManager.addEventListener(instance.rootElement, 'mouseover', function (e) {
        if(checkRowHeader(e.target)) {
          var element = getElementFromTargetElement(e.target);
          if (element) {
            var btn = getButton(element);
            if (btn) {
              btn.style.display = 'block';
            }
          }
        }
      });

      eventManager.addEventListener(instance.rootElement, 'mouseout', function (e) {
        if(checkRowHeader(e.target)) {
          var element = getElementFromTargetElement(e.target);
          if (element) {
            var btn = getButton(element);
            if (btn) {
              btn.style.display = 'none';
            }
          }
        }
      });

//      instance.rootElement.on('mouseover.removeRow', 'tbody th, tbody td', function () {
//        getButton(this).show();
//      });
//
//      instance.rootElement.on('mouseout.removeRow', 'tbody th, tbody td', function () {
//        getButton(this).hide();
//      });
    }

    var getElementFromTargetElement = function (element) {
      if (element.tagName != 'TABLE') {
        if (element.tagName == 'TH' || element.tagName == 'TD') {
          return element;
        } else {
          return getElementFromTargetElement(element.parentNode);
        }
      }
      return null;
    };

    var checkRowHeader = function (element) {
      if (element.tagName != 'BODY') {
        if (element.parentNode.tagName == 'TBODY') {
          return true;
        } else {
          element = element.parentNode;
          return checkRowHeader(element);
        }
      }
      return false;
    };

    function unbindMouseEvents() {
      eventManager.clear();
    }

    function getButton(td) {
      var btn = td.querySelector('.btn');

      if (!btn) {
        var parent = td.parentNode.querySelector('th.htRemoveRow');

        if (parent) {
          btn = parent.querySelector('.btn');
        }
      }

      return btn;
    }

    this.init = function () {
      var instance = this;
      var pluginEnabled = !!(instance.getSettings().removeRowPlugin);

      if (pluginEnabled) {
        bindMouseEvents.call(this);
        Handsontable.Dom.addClass(instance.rootElement, 'htRemoveRow');
      } else {
        unbindMouseEvents.call(this);
        Handsontable.Dom.removeClass(instance.rootElement, 'htRemoveRow');
      }
    };

    this.beforeInitWalkontable = function (walkontableConfig) {
      var instance = this;

      /**
       * rowHeaders is a function, so to alter the actual value we need to alter the result returned by this function
       */
      var baseRowHeaders = walkontableConfig.rowHeaders;
      walkontableConfig.rowHeaders = function () {

        var pluginEnabled = !!(instance.getSettings().removeRowPlugin);

        var newRowHeader = function (row, elem) {
          var child
            , div;

          while (child = elem.lastChild) {
            elem.removeChild(child);
          }
          elem.className = 'htNoFrame htRemoveRow';
          if (row > -1) {
            div = document.createElement('div');
            div.className = 'btn';
            div.appendChild(document.createTextNode('x'));
            elem.appendChild(div);

            eventManager.addEventListener(div, 'mouseup', function () {
              instance.alter('remove_row', row);
            });
          }
        };

        return pluginEnabled ? Array.prototype.concat.call([], newRowHeader, baseRowHeaders()) : baseRowHeaders();
      };
    }
  }

  var htRemoveRow = new removeRow();

  Handsontable.hooks.add('beforeInitWalkontable', function (walkontableConfig) {
    htRemoveRow.beforeInitWalkontable.call(this, walkontableConfig);
  });

  Handsontable.hooks.add('beforeInit', function () {
    htRemoveRow.init.call(this)
  });

  Handsontable.hooks.add('afterUpdateSettings', function () {
    htRemoveRow.init.call(this)
  });

})(Handsontable);
