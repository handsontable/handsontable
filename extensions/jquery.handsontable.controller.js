(function ($) {

  function isTablet() {
    return (screen.width < 1000 && typeof(window.ontouchstart) != 'undefined');
  }
  /**
   *
   * @param instance
   * @param (jQuery) options
   *  - ui
   *  - buttons
   *  - container
   *  - showFor:
   *    "tablet"
   *    "expage"
   *    "tablet expage"
   * @constructor
   */
  Handsontable.extension.Controller = function(instance, options) {
    var showFor = {};
    if (options === true) {
      options = {ui: true}
    }
    if (options.showFor) {
      $.each(options.showFor.split(" "), function() {
        showFor[this] = true;
      });
    }
    if (!isTablet() && showFor.tablet) return;
    this.instance = instance;
    instance.controller = this;
    if (options.ui) {
      if (!options.container) options.container = instance.container;
      this.ui = new Handsontable.extension.Controller.UI(this, options);
    }
    instance.container.on("datachange.handsontable undoclear.handsontable changeselection.handsontable", $.proxy(this.ui.update, this.ui));
    this.autoAdd = options.autoAdd;
    instance.container.on("changeselection.handsontable", $.proxy(this.ui.show, this.ui));
    instance.container.on("deselect.handsontable", $.proxy(this.ui.hide, this.ui));
  }

  Handsontable.extension.Controller.prototype = {
    hide: function() {
      this.ui.hide();
    },
    show: function() {
      this.ui.show();
    },
    moveLeft: function() {
      this._beforeMove();
      var s = this.getPosition();
      if (s.col > 0)
        this.instance.selectCell(s.row, s.col-1);
      this._afterMove();
    },
    canMoveLeft: function() {
      return this.getPosition().col > 0;
    },
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
    canMoveRight: function() {
      return this.autoAdd || this.getPosition().col < this.instance.colCount;
    },
    moveUp: function() {
      this._beforeMove();
      var s = this.getPosition();
      if (s.row > 0)
        this.instance.selectCell(s.row-1, s.col);
      this._afterMove();
    },
    canMoveUp: function() {
      return this.getPosition().row > 0;
    },
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
    canMoveDown: function() {
      return this.autoAdd || this.getPosition().row < this.instance.rowCount;
    },
    _beforeMove: function() {
      this.edited = this.instance.isCellEdited();
      this.instance.deselectCell();
    },
    _afterMove: function() {
      var that = this;
      if (this.edited)
        that.edit();
    },

    edit: function() {
      this.instance.editCell();

    },
    undo: function() {
      this.instance.deselectCell();
      this.instance.undo();
    },
    canUndo: function() {
      return this.instance.isUndoRedoAvailable().undo;
    },
    redo: function() {
      this.instance.deselectCell();
      this.instance.redo();
    },
    canRedo: function() {
      return this.instance.isUndoRedoAvailable().redo;
    },
    getPosition: function() {
      var pos = this.instance.getSelected();
      if (!pos) pos = [0,0];
      return {row: pos[0], col: pos[1]}
    },
    deleteRow: function() {
      var pos = this.getPosition();
      this.instance.alter("remove_row", pos.row);
    },
    deleteCol: function() {
      var pos = this.getPosition();
      this.instance.alter("remove_col", pos.col);
    },
    addRowAfter: function() {
      var pos = this.getPosition();
      this.instance.alter("insert_row", pos.row+1);

    },
    addColAfter: function() {
      var pos = this.getPosition();
      this.instance.alter("insert_col", pos.col+1);

    },
    prependRow: function() {
      this.instance.deselectCell();
      var pos = this.getPosition();
      this.instance.alter("insert_row", pos.row);

    },
    prependCol: function() {
      this.instance.deselectCell();
      var pos = this.getPosition();
      this.instance.alter("insert_col", pos.col);

    }

  }

  Handsontable.extension.Controller.UI = function(controller, options) {
    this.controller = controller;
    if (options.ui === true) options.ui = "top";
    if (typeof options.ui == 'string') {
      var buttons = options.buttons;
      if (!buttons) {
        buttons = ["edit", "undo", "add", "delete"];
        if ($.fn.draggable || isTablet()) buttons.push("drag");
        if ($.fn.expage) buttons.push("expand")
      }
      this.ui = this.createUI(options.ui, buttons, options.container);
    }
    else {
      this.ui = $(options.ui);
    }
    var eventName = typeof window.ontouchstart === 'undefined' ? 'click' : 'touchstart';
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
  }
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
    delete: {
      deleteRow: "Delete row",
      deleteCol: "Delete col"
    }
  }
  Handsontable.extension.Controller.UI.prototype = {
    createUI: function(type, buttons, container) {
      var main = $("<div></div>");
      main.addClass("handsontable-controller " + type);
      var arrowPad = $("<div></div>").addClass("arrow-pad").appendTo(main);
      var buttonsCollection = Handsontable.extension.Controller.UI.buttons;
      this.addButtons(arrowPad, buttonsCollection.move);
      if (buttons.indexOf("edit") > -1) {
        this.addButtons(arrowPad, buttonsCollection.edit)
      }
      if (buttons.indexOf("undo") > -1) {
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
      if (buttons.indexOf("add") > -1) {
        var addBtn = $("<div></div>")
          .addClass("action add-btn toggle-btn atLeft atBottom")
          .append("<i>Add</i>")
          .attr("title", "Add row/column")
          .appendTo(main);
        var addList = $("<div></div>").addClass("list add-list").hide().appendTo(main);
        addBtn.click($.proxy(toggleList, addList));
        this.addButtons(addList, buttonsCollection.add);
      }
      if (buttons.indexOf("delete") > -1) {
        var deleteBtn = $("<div></div>")
          .addClass("action delete-btn toggle-btn atRight atBottom")
          .append("<i>Delete</i>")
          .attr("title", "Delete row/column")
          .appendTo(main);
        var deleteList = $("<div></div>").addClass("list delete-list").hide().appendTo(main);
        deleteBtn.click($.proxy(toggleList, deleteList));
        this.addButtons(deleteList, buttonsCollection.delete);
      }
      main.appendTo(container);
      main.css({right: "0"});
      if (buttons.indexOf("drag") > -1) {
        if (!isTablet() && typeof $.fn.draggable == 'undefined') throw "jQuery draggable module is required for 'drag' button in controller";
        var method = isTablet() ? "tabletDraggable" : "draggable";
        var handler = $("<div></div>").addClass("float-handler move").appendTo(main);
        main[method]({handler: handler}).css({"right": "auto", left: main.offset().left})
      }
      main.hide();
      if (buttons.indexOf("expand") > -1) {
        if (typeof $.fn.expage == 'undefined') throw "jQuery.expage plugin is required for 'expand' button in controller";
        var expandCollapse = $("<div></div>").addClass("expandCollapse").appendTo(main);
        container.expage({
          expanded: false,
          expandButton: expandCollapse,
          collapseButton: expandCollapse
        });
        if (container.expage('isExpanded')) {
          this.shallShow = true;
        }
      }

      return main;
    },

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

    show: function() {
      clearTimeout(this.doHide);
      if (!this.ui.is(":visible")) {
        if (this.ui.is(".float")) {
          this.ui.css({top: this.ui.parent().offset().top});
          if (typeof this.offset == 'undefined') {
            this.offset = Math.max(this.ui.find(".move").width(), this.ui.find(".expandCollapse").width()) + 10;
          }
          var rightEdge = this.ui.parent().offset().left + this.ui.parent().find("table").width() + this.offset;
          if (rightEdge < parseFloat(this.ui.css("left"))) {
            this.ui.css({left: rightEdge});
          }
        }
        this.ui.show();
      }
      this.update();
    },
    hide: function() {
      clearTimeout(this.doHide);
      this.doHide = setTimeout($.proxy(this.ui.hide, this.ui), 100);
    },
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
  }

  if (isTablet()) {
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
        }
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