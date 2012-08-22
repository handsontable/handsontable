/**
 * jQuery.expage plugin
 * Allows to expand some page's part to the whole screen and hide back if needed.
 * May be useful for big tables/graphics/charts/etc. on mobile devices
 * https://github.com/AlexeyGrishin/jquery.expage
 * MIT license
 */


(function($) {
  /**
   * Adds expand/collapse functionality to provided element
   * @param element
   * @param options
   * @constructor
   */
  function Expage(element, options) {
    "use strict";

    this.options = {
      expanded: false,
      expandButton: true,
      collapseButton: true,
      changeHash: true  //false, true, or String
    };
    $.extend(this.options, options);

    this.obj = $(element);
    this.objParent = this.obj.parent();

    this.fullScreenContainer = $("<div class='expageCtr'></div>")
      .appendTo($("body"))
      .css({
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      });
    this.fullScreenContainer.hide();

    ($.proxy(function prepareButtons() {
      if (typeof this.options.expandButton === 'string') {
        this.options.expandButton = $(this.options.expandButton);
      }
      else if (this.options.expandButton === true) {
        this.options.expandButton = $("<div class='expageExpand expageHidden'><a class='btn' href='javascript:void(0);'>Expand</a></div>");
        this.objParent.css({position: "relative"});
        if (this.objParent.hasScrollBar()) {
          this.objParent.before(this.options.expandButton);
        }
        else {
          this.obj.before(this.options.expandButton);
        }
      }

      if (typeof this.options.collapseButton === 'string') {
        this.options.collapseButton = $(this.options.collapseButton);
      }
      else if (this.options.collapseButton === true) {
        this.options.collapseButton = $("<div class='expageCollapse'><a class='btn' href='javascript:void(0);'><< Back</a></div>");
        var collapseCtr = $("<div class='navbar navbar-fixed-top expageCollapseCtr'><div class='navbar-inner'></div> </div>")
          .css({
            position: "fixed",
            height: 40,
            top: 0,
            left: 0,
            right: 0
          });
        collapseCtr.find(".navbar-inner").append(this.options.collapseButton);
        this.fullScreenContainer.append(collapseCtr);
        this.fullScreenContainer.css({
          paddingTop: 40
        });
      }
      if (this.options.expandButton && this.options.expandButton.is(this.options.collapseButton)) {
        $(this.options.expandButton).click($.proxy(this.toggle, this));
      }
      else {
        if (this.options.expandButton) {
          $(this.options.expandButton).click($.proxy(this.expand, this));
        }

        if (this.options.collapseButton) {
          $(this.options.collapseButton).click($.proxy(this.collapse, this));
        }
      }
    }, this))();
    this.expanded = false;
    if (this.options.expanded) {
      this.expand();
    }

    if (this.options.changeHash) {
      if (this.options.changeHash === true) {
        this.options.changeHash = this.obj.attr("id");
      }
      if (document.location.hash === "#expand-"+this.options.changeHash) {
        setTimeout($.proxy(this.expand, this), 1);
      }
    }
  }

  Expage.prototype = {
    expand: function() {
      if (this.expanded) return;
      if (Expage.expandedOne) {
        Expage.expandedOne.collapse();
      }
      var prev = this.obj.prev();
      if (prev.length > 0) {
        this.restore = $.proxy(prev.after, prev);
      }
      else {
        this.restore = $.proxy(this.objParent.prepend, this.objParent);
      }
      $("script", $("body")).remove();
      this.hiddenBody = $("<div class='expageVisible'></div>").appendTo($("body")).hide();
      this.hiddenBody.append($("body").children().not(".expageCtr").not(".expageVisible"));
      $(".expageHidden").hide();
      this.fullScreenContainer.prepend(this.obj.show()).slideDown().addClass("expageExpanded");
      if (this.options.changeHash) {
        document.location.hash = "#expand-"+this.options.changeHash;
      }
      Expage.prototype.expandedOne = this;
      this.expanded = true;
      this.obj.trigger("expage.expand");

    },

    collapse: function() {
      if (!this.expanded) {
        return;
      }
      $("body").append(this.hiddenBody.children());
      $(".expageHidden").show();
      this.fullScreenContainer.hide().removeClass("expageExpanded");
      this.restore(this.obj);
      this.hiddenBody.remove();
      if (this.options.changeHash) {
        document.location.hash = "";
      }
      Expage.expandedOne = undefined;
      this.expanded = false;
      this.obj.trigger("expage.collapse");
    },

    toggle: function() {
      if (this.expanded) {
        this.collapse();
      }
      else {
        this.expand();
      }
    },

    isExpanded: function() {
      return this.expanded;
    }
  };

  /**
   * Wraps provided element so it may be expanded on the whole screen.
   * @param (String| Object) commandOrOptions
   *    for new object there could be the options object with the following items:
   *    - (Boolean) expanded - if true then element will be expanded after page's load
   *    - (Boolean | jQuery) expandButton - if true then default expand button is added. If false then there will be no expand button.
   *        You also may specify the jQuery object that will expand the element on click
   *    - (Boolean | jQuery) collapseButton - if true then default collapse button is added. If false then there will be no collapse button.
   *        You also may specify the jQuery object that will collapse the element on click
   *    - (Boolean) changeHash - if true then element's state will be stored in hash, so it will be possible to get URL for expanded element
   *    for existent object you may provide one of the following commands:
   *    - expand
   *    - collapse
   *    - toggle
   *    - isExpanded - returns true if element is expanded
   * @note It generates two events - expage.expand and expage.collapse
   * @note You may use the following classes in your css/html:
   *  - expageCtr - this class is added to the container which contains your element when it is expanded
   *  - expageExpanged - this class is added to the container when element is expanded
   *  - expageVisible - you may add this class to the elements which shall not be hidden during expansion
   *  - expageHidden - you may add this class to the elements that shall be hidden during expansion.
   * @return {*}
   */
  $.fn.expage = function(commandOrOptions) {
    if (typeof commandOrOptions !== 'string') {
      this.each(function() {
        $(this).data("expage", new Expage($(this), commandOrOptions));
      })
    }
    else {
      if (typeof Expage.prototype[commandOrOptions] === 'undefined') {
        throw "Unknown command '" + commandOrOptions + "'";
      }
      var args = Array.prototype.slice.call(arguments),
        res = undefined;
      args.shift();
      this.each(function() {
        var expage = $(this).data("expage");
        res = expage[commandOrOptions].call(expage, args);
      })
      if (typeof res !== 'undefined') {
        return res;
      }
    }
    return this;
  };

  $(function() {
    $(".expage").expage();
    if (screen.width < 1000 && typeof(window.ontouchstart) != 'undefined') {
      $(".expage-tablet").expage();
    }
  });

  $.fn.hasScrollBar = function() {
    return this.get(0).scrollHeight > this.height();
  }
})(jQuery);
