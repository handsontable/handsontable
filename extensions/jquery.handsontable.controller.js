(function ($) {

  /**
   *
   * @return {Boolean} true if it seems like browser is opened on tablet device
   */
  function isTablet() {
    return (screen.width < 1000 && typeof(window.ontouchstart) != 'undefined');
  }


  function flags(arrayOrStr) {
    var f = {};
    if (typeof arrayOrStr == 'string') {
      arrayOrStr = arrayOrStr.split(' ');
    }
    if ($.isArray(arrayOrStr)) {
      $.each(arrayOrStr, function() {
        f[$.trim(this)] = true;
      });
    }
    return f;
  }
  /**
   * Controller object provides method for manipulating Handsontable grid and by default
   * provides the floating panel with buttons for that purpose.
   * You may initialize it without UI and call its methods manually, or provide your own markup.
   *
   * Do not call this constructor manually - provide the options in the .handsontable function, that way:
   * <code>
   *   $("#table").handsontable({
   *      ...
   *      Controller: {... options... }
   *   });
   * </code>
   *
   * @param instance handsontable instance
   * @param (Object) options which may contain the following properties
   *  - (Boolean|jQuery|String) ui
   *    - if false then no UI will be created
   *    - if 'top' then standard UI fixed on top right corner will be created
   *    - if true or 'float' then standard UI which floats near table's right edge will be created
   *    - if jQuery object then it will be linked with controller.
   *  - (Array) buttons - set of buttons for standard UI. May include the following:
   *    - 'add' - shows the 'Add row/column' buttons
   *    - 'delete' - shows the 'Delete row/column' buttons
   *    - 'undo' - shows the Undo/Redo buttons
   *    - 'move' - shows the navigation buttons
   *    - 'edit' - shows the Edit button
   *    - 'drag' - shows the 'move' handler, allows to drag controller UI. Requires 'jquery.draggable' plugin
   *    - 'expand' - shows the 'expand/collapse' button, allows to expand the table on the whole screen. Requires 'jquery.expage' plugin
   *    By default includes all of them, but 'drag' and 'expand' - only if corresponding plugins are installed
   *  - (String) showFor - specifies when the UI shall be shown
   *    "tablet" - for tablets only. Will be hidden for desktop
   *    "expage" - when expanded. Will be usually hidden
   *    "tablet expage" - for tablets when expanded
   *    By default UI is shown when at least one cell of table is selected
   *  - (Boolean) autoAdd - if true then moving to the right/bottom will create new rows/columns when selection is out of table.
   *    Default is false
   * @constructor
   */
  Handsontable.extension.Controller = function(instance, options) {
    var showFor = {};
    if (options === true) {
      options = {ui: true}
    }
    if (options.showFor) {
      showFor = flags(options.showFor);
    }
    if (!isTablet() && showFor.tablet) return;
    this.instance = instance;
    instance.controller = this;
    if (options.ui) {
      options.controlled = instance.container;
      this.ui = new Handsontable.extension.Controller.UI(this, options);
    }
    instance.container.on("datachange.handsontable undoclear.handsontable changeselection.handsontable ", $.proxy(this.ui.update, this.ui));
    this.autoAdd = options.autoAdd;
    instance.container.on("changeselection.handsontable edit.handsontable", $.proxy(this.ui.show, this.ui));
    instance.container.on("deselect.handsontable", $.proxy(this.ui.hide, this.ui));
    instance.container.on("expage.expand expage.collapse", function() {
      instance.blockedCols.refresh();
      instance.blockedRows.refresh();
    });
  }

  var Controller = {
    shown: undefined
  };
  Handsontable.extension.Controller.prototype = {

    /**
     * Hides the associated UI
     */
    hide: function() {
      if (this.ui) {
        this.ui.hide();
        Controller.shown = undefined;
      }
    },
    /**
     * Shows the associated UI
     */
    show: function() {
      if (this.ui) {
        if (Controller.shown) {
          Controller.shown.hide();
        }
        this.ui.show();
        Controller.shown = this;
      }
    },
    /**
     * Moves selection to the left
     */
    moveLeft: function() {
      this._beforeMove();
      var s = this.getPosition();
      if (s.col > 0)
        this.instance.selectCell(s.row, s.col-1);
      this._afterMove();
    },
    /**
     *
     * @return {Boolean} if selection may be moved left
     */
    canMoveLeft: function() {
      return this.getPosition().col > 0;
    },

    /**
     * Moves selection to the right.
     * Creates new column if 'autoAdd' option is true and current column is the latest one
     */
    moveRight: function() {
      this._beforeMove();
      var s = this.getPosition();
      var lastCol = s.col >= this.instance.colCount-1;
      if (lastCol && this.autoAdd)
        this.instance.alter("insert_col", s.col+1);
      if (!lastCol || this.autoAdd)
        this.instance.selectCell(s.row, s.col+1);
      this._afterMove();
    },

    /**
     *
     * @return {Boolean} if selection may be moved right
     */
    canMoveRight: function() {
      return this.autoAdd || this.getPosition().col < this.instance.colCount;
    },

    /**
     * Moves selection up
     */
    moveUp: function() {
      this._beforeMove();
      var s = this.getPosition();
      if (s.row > 0)
        this.instance.selectCell(s.row-1, s.col);
      this._afterMove();
    },

    /**
     *
     * @return {Boolean} if selection can be moved up
     */
    canMoveUp: function() {
      return this.getPosition().row > 0;
    },

    /**
     * Moves selection down.
     * Creates new row if 'autoAdd' option is true and current row is the latest one
     */
    moveDown: function() {
      this._beforeMove();
      var s = this.getPosition();
      var lastRow = s.row >= this.instance.rowCount-1;
      if (lastRow && this.autoAdd)
        this.instance.alter("insert_row", s.row+1);
      if (!lastRow || this.autoAdd)
        this.instance.selectCell(s.row+1, s.col);
      this._afterMove();
    },

    /**
     *
     * @return {Boolean} if selection may be moved down
     */
    canMoveDown: function() {
      return this.autoAdd || this.getPosition().row < this.instance.rowCount;
    },

    //private
    _beforeMove: function() {
      this.edited = this.instance.isCellEdited();
      this.instance.deselectCell();
    },

    //private
    _afterMove: function() {
      var that = this;
      if (this.edited)
        that.edit();
    },

    /**
     * Shows editor for the current cell
     */
    edit: function() {
      this.instance.editCell();
    },

    /**
     * Performs undo
     */
    undo: function() {
      this.instance.undo();
    },

    /**
     *
     * @return {Boolean} if undo may be performed
     */
    canUndo: function() {
      return this.instance.isUndoRedoAvailable().undo;
    },

    /**
     * Performs redo
     */
    redo: function() {
      this.instance.redo();
    },

    /**
     *
     * @return {Boolean} if redo may be performed
     */
    canRedo: function() {
      return this.instance.isUndoRedoAvailable().redo;
    },

    /**
     *
     * @return {Object} current position {row, col}
     */
    getPosition: function() {
      var pos = this.instance.getSelected();
      if (!pos) pos = [0,0];
      return {row: pos[0], col: pos[1]}
    },

    /**
     * Deletes row of the currently selected cell.
     */
    deleteRow: function() {
      var pos = this.getPosition();
      this.instance.alter("remove_row", pos.row);
    },

    /**
     * Deletes column of the currently selected cell.
     */
    deleteCol: function() {
      var pos = this.getPosition();
      this.instance.alter("remove_col", pos.col);
    },

    /**
     * Adds new row after the row of currently selected cell
     */
    addRowAfter: function() {
      var pos = this.getPosition();
      this.instance.alter("insert_row", pos.row+1);

    },

    /**
     * Adds new column after the column of currently selected cell
     */
    addColAfter: function() {
      var pos = this.getPosition();
      this.instance.alter("insert_col", pos.col+1);

    },

    /**
     * Adds new row before the row of currently selected cell
     */
    prependRow: function() {
      this.instance.deselectCell();
      var pos = this.getPosition();
      this.instance.alter("insert_row", pos.row);

    },

    /**
     * Adds new column before the column of currently selected cell
     */
    prependCol: function() {
      this.instance.deselectCell();
      var pos = this.getPosition();
      this.instance.alter("insert_col", pos.col);

    }

  };

  /**
   * UI holder.
   * Holds existent UI or creates standard one
   * @param controller
   * @param options
   * @constructor
   */
  Handsontable.extension.Controller.UI = function(controller, options) {
    this.controller = controller;
    this.controlled = options.controlled;
    if (options.ui === true) options.ui = "float";
    if (typeof options.ui == 'string') {
      var buttons = options.buttons;
      if (!buttons) {
        buttons = ["move", "edit", "undo", "add", "delete"];
        if ($.fn.draggable || isTablet()) buttons.push("drag");
        if ($.fn.expage) buttons.push("expand")
      }
      this.ui = this.createUI(options.ui, flags(buttons), options.controlled);
    }
    else {
      this.ui = $(options.ui);
    }
    //dataTableRelated - to hold selection if clicked (because controller is added outside table's container)
    //expageVisible - to be not hidden when table is expanded
    this.ui.addClass("dataTableRelated expageVisible");
    var eventName = typeof window.ontouchstart === 'undefined' ? 'click' : 'touchstart';
    //Bind ui elements to controller methods
    for (var prop in controller) {
      if (typeof controller[prop] == 'function') {
        (function(ui, prop) {
          $("." + prop, ui.ui).on(eventName, function(e) {
            if ($(this).is(".disabled")) return;
            controller[prop]();
            e.stopPropagation();
            e.preventDefault();
            return false;
          }).on("touchend", function(e) {
              e.stopPropagation();
              e.preventDefault();
              return false;
            })
        })(this, prop);
      }
    }
    if (this.shallShow) {
      //allow table to load/display data before showing controller
      setTimeout($.proxy(this.show, this), 50);
    }
    else {
      this.update();
    }
  };
  Handsontable.extension.Controller.UI.buttons = {
    move: {
      moveLeft: {title: "Left", position: "atLeft atVCenter"},
      moveRight: {title: "Right", position: "atRight atVCenter"},
      moveUp: {title: "Up", position: "atCenter atTop"},
      moveDown: {title: "Down", position: "atCenter atBottom"}
    },
    edit: {
      edit: {title: "Edit", position: "atCenter atVCenter"}
    },
    undo: {
      undo: {title: "Undo", position: "atLeft atTop"},
      redo: {title: "Redo", position: "atRight atTop"}
    },
    add: {
      addRowAfter: "Add row after",
      addColAfter: "Add col after",
      prependRow: "Add row before",
      prependCol: "Add col before"
    },
    "delete": {
      deleteRow: "Delete row",
      deleteCol: "Delete col"
    }
  };
  Handsontable.extension.Controller.UI.prototype = {
    //Create standard UI
    createUI: function(type, buttons, controlled) {
      var main = $("<div></div>");
      main.addClass("handsontable-controller " + type);
      var arrowPad = $("<div></div>").addClass("arrow-pad").appendTo(main);
      var buttonsCollection = Handsontable.extension.Controller.UI.buttons;
      if (buttons.move) {
        this.addButtons(arrowPad, buttonsCollection.move);
      }
      if (buttons.edit) {
        this.addButtons(arrowPad, buttonsCollection.edit)
      }
      if (buttons.undo) {
        this.addButtons(main, buttonsCollection.undo);
      }
      function toggleList() {
        var visible = $(this).is(":visible");
        $(".list:visible", main).hide();
        $(".toggle-btn.pressed", main).removeClass("pressed");
        if (!visible && $(this).is(".list")) {
          $(this).show();
          $(this).prev(".toggle-btn").addClass("pressed");
        }
      }
      if (buttons.add) {
        var addBtn = $("<div></div>")
          .addClass("action add-btn toggle-btn atLeft atBottom")
          .append("<i>Add</i>")
          .attr("title", "Add row/column")
          .appendTo(main);
        var addList = $("<div></div>").addClass("list add-list").hide().appendTo(main);
        addBtn.click($.proxy(toggleList, addList));
        this.addButtons(addList, buttonsCollection.add);
      }
      if (buttons['delete']) {
        var deleteBtn = $("<div></div>")
          .addClass("action delete-btn toggle-btn atRight atBottom")
          .append("<i>Delete</i>")
          .attr("title", "Delete row/column")
          .appendTo(main);
        var deleteList = $("<div></div>").addClass("list delete-list").hide().appendTo(main);
        deleteBtn.click($.proxy(toggleList, deleteList));
        this.addButtons(deleteList, buttonsCollection['delete']);
      }
      main.appendTo($("body"));
      main.css({right: "0"});
      if (buttons.drag) {
        if (!isTablet() && typeof $.fn.draggable == 'undefined') throw "jQuery draggable module is required for 'drag' button in controller";
        var method = isTablet() ? "tabletDraggable" : "draggable";
        var handler = $("<div></div>").addClass("float-handler move").appendTo(main);
        main[method]({handler: handler}).css({"right": "auto", left: main.offset().left})
      }
      main.hide();
      if (buttons.expand) {
        if (typeof $.fn.expage == 'undefined') throw "jQuery.expage plugin is required for 'expand' button in controller";
        var expandCollapse = $("<div></div>").addClass("expandCollapse").appendTo(main);
        controlled.expage({
          expanded: false,
          expandButton: expandCollapse,
          collapseButton: expandCollapse
        }).on("expage.expand expage.collapse", $.proxy(function() {
          this.ui.hide();
          this.show();
        }, this));

        if (controlled.expage('isExpanded')) {
          this.shallShow = true;
        }
      }

      return main;
    },

    /**
     * Adds buttons to the specified element
     * @param {jQuery} where target element
     * @param {Array} buttons buttons descriptors
     */
    addButtons: function(where, buttons) {
      for (var action in buttons) {
        if (buttons.hasOwnProperty(action)) {
          var position = "";
          var title = buttons[action];
          if (typeof title === 'object') {
            position = title.position;
            title = title.title;
          }
          var actionName = action.substring(0, 1).toUpperCase() + action.substring(1);
          var button = $("<div></div>")
            .append($("<i></i>").html(title))
            .attr("title", title)
            .addClass(action).addClass("action")
            .addClass(position)
            .data("action", actionName)
            .appendTo(where);
          if (typeof this.controller["can" + actionName] == 'function') {
            button.data("checker", "can" + actionName).addClass("updateable");
          }
        }
      }

    },

    /**
     * Shows the controller UI if hidden.
     * For 'float' UI recalculates position to show it near top-right table's corner
     */
    show: function() {
      clearTimeout(this.doHide);
      if (!this.ui.is(":visible")) {
        if (this.ui.is(".float")) {
          this.ui.css({top: this.controlled.offset().top});
          if (typeof this.offset == 'undefined') {
            this.offset = Math.max(this.ui.find(".move").width(), this.ui.find(".expandCollapse").width()) + 10;
          }
          var rightEdge = this.controlled.offset().left + this.controlled.find("table").width() + this.offset;
          if (rightEdge < parseFloat(this.ui.css("left"))) {
            this.ui.css({left: rightEdge});
          }
        }
        this.ui.show();
      }
      this.update();
    },

    /**
     * Hides the UI
     */
    hide: function() {
      clearTimeout(this.doHide);
      this.doHide = setTimeout($.proxy(this.ui.hide, this.ui), 100);
    },

    /**
     * Updates buttons' state
     */
    update: function() {
      var that = this;
      $(".action.updateable", this.ui).each(function() {
        var checker = $(this).data("checker");
        if (that.controller[checker]()) {
          $(this).removeClass("disabled");
        }
        else {
          $(this).addClass("disabled");
        }
      });
    }
  };

  if (isTablet()) {
    /**
     * Simple moveable element solution for touchscreen devices
     * @param options
     * @return {*}
     */
    $.fn.tabletDraggable = function(options) {
      $(this).each(function() {
        if ($(this).css("position") != 'fixed') {
          $(this).css({position: "absolute"});
        }
        var handler = options.handler ? $(this).find(options.handler) : $(this);
        var that = $(this);
        var offset = {
          top: handler.offset().top - that.offset().top + handler.height()/2,
          left: handler.offset().left - that.offset().left + handler.width()/2
        };
        handler.on("touchmove touchstart", function(e) {
          e.preventDefault();
          var orig = e.originalEvent;
          var x = orig.changedTouches[0].pageX - offset.left;
          var y = orig.changedTouches[0].pageY - offset.top;
          that.css({top: y, left: x});
        })
      });
      return this;
    }
  }
})(jQuery);