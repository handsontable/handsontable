/*
 * jQuery.fn.autoResize 1.1+
 * --
 * https://github.com/warpech/jQuery.fn.autoResize
 *
 * This fork differs from others in a way that it autoresizes textarea in 2-dimensions (horizontally and vertically).
 * It was originally forked from alexbardas's repo but maybe should be merged with dpashkevich's repo in future.
 *
 * originally forked from:
 * https://github.com/jamespadolsey/jQuery.fn.autoResize
 * which is now located here:
 * https://github.com/alexbardas/jQuery.fn.autoResize
 * though the mostly maintained for is here:
 * https://github.com/dpashkevich/jQuery.fn.autoResize/network
 *
 * --
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details. */

(function($){

  autoResize.defaults = {
    onResize: function(){},
    animate: {
      duration: 200,
      complete: function(){}
    },
    extraSpace: 50,
    minHeight: 'original',
    maxHeight: 500,
    minWidth: 'original',
    maxWidth: 500
  };

  autoResize.cloneCSSProperties = [
    'lineHeight', 'textDecoration', 'letterSpacing',
    'fontSize', 'fontFamily', 'fontStyle', 'fontWeight',
    'textTransform', 'textAlign', 'direction', 'wordSpacing', 'fontSizeAdjust',
    'padding'
  ];

  autoResize.cloneCSSValues = {
    position: 'absolute',
    top: -9999,
    left: -9999,
    opacity: 0,
    overflow: 'hidden',
    overflowX: 'hidden',
    overflowY: 'hidden',
    border: '1px solid black',
    padding: '0.49em' //this must be about the width of caps W character
  };

  autoResize.resizableFilterSelector = 'textarea,input:not(input[type]),input[type=text],input[type=password]';

  autoResize.AutoResizer = AutoResizer;

  $.fn.autoResize = autoResize;

  function autoResize(config) {
    this.filter(autoResize.resizableFilterSelector).each(function(){
      new AutoResizer( $(this), config );
    });
    return this;
  }

  function AutoResizer(el, config) {

    if(this.clones) return;

    this.config = $.extend({}, autoResize.defaults, config);

    this.el = el;

    this.nodeName = el[0].nodeName.toLowerCase();

    this.previousScrollTop = null;

    if (config.maxWidth === 'original') config.maxWidth = el.width();
    if (config.minWidth === 'original') config.minWidth = el.width();
    if (config.maxHeight === 'original') config.maxHeight = el.height();
    if (config.minHeight === 'original') config.minHeight = el.height();

    if (this.nodeName === 'textarea') {
      el.css({
        resize: 'none',
        overflowY: 'none'
      });
    }

    el.data('AutoResizer', this);

    this.createClone();
    this.injectClone();
    this.bind();

  }

  AutoResizer.prototype = {

    bind: function() {

      var check = $.proxy(function(){
        this.check();
        return true;
      }, this);

      this.unbind();

      this.el
        .bind('keyup.autoResize', check)
        //.bind('keydown.autoResize', check)
        .bind('change.autoResize', check);

      this.check(null, true);

    },

    unbind: function() {
      this.el.unbind('.autoResize');
    },

    createClone: function() {

      var el = this.el,
        self = this,
        config = this.config;

      this.clones = $();

      if (config.minHeight !== 'original' || config.maxHeight !== 'original') {
        this.hClone = el.clone().height('auto');
        this.clones = this.clones.add(this.hClone);
      }
      if (config.minWidth !== 'original' || config.maxWidth !== 'original') {
        this.wClone = $('<div/>').width('auto').css({
          whiteSpace: 'nowrap',
          'float': 'left'
        });
        this.clones = this.clones.add(this.wClone);
      }

      $.each(autoResize.cloneCSSProperties, function(i, p){
        self.clones.css(p, el.css(p));
      });

      this.clones
        .removeAttr('name')
        .removeAttr('id')
        .attr('tabIndex', -1)
        .css(autoResize.cloneCSSValues)
        .css('overflowY', 'scroll');

    },

    check: function(e, immediate) {

      var config = this.config,
        wClone = this.wClone,
        hClone = this.hClone,
        el = this.el,
        value = el.val();

      if (wClone) {

        wClone.text(value);

        // Calculate new width + whether to change
        var cloneWidth = wClone.outerWidth(),
          newWidth = (cloneWidth + config.extraSpace) >= config.minWidth ?
            cloneWidth + config.extraSpace : config.minWidth,
          currentWidth = el.width();

        newWidth = Math.min(newWidth, config.maxWidth);

        if (
          (newWidth < currentWidth && newWidth >= config.minWidth) ||
            (newWidth >= config.minWidth && newWidth <= config.maxWidth)
          ) {

          config.onResize.call(el);

          el.scrollLeft(0);

          config.animate && !immediate ?
            el.stop(1,1).animate({
              width: newWidth
            }, config.animate)
            : el.width(newWidth);

        }

      }

      if (hClone) {

        if (newWidth) {
          hClone.width(newWidth);
        }

        hClone.height(0).val(value).scrollTop(10000);

        var scrollTop = hClone[0].scrollTop + config.extraSpace;

        // Don't do anything if scrollTop hasen't changed:
        if (this.previousScrollTop === scrollTop) {
          return;
        }

        this.previousScrollTop = scrollTop;

        if (scrollTop >= config.maxHeight) {
          scrollTop = config.maxHeight;
        }

        if (scrollTop < config.minHeight) {
          scrollTop = config.minHeight;
        }

        if(scrollTop == config.maxHeight && newWidth == config.maxWidth) {
          el.css('overflowY', 'scroll');
        }
        else {
          el.css('overflowY', 'hidden');
        }

        config.onResize.call(el);

        // Either animate or directly apply height:
        config.animate && !immediate ?
          el.stop(1,1).animate({
            height: scrollTop
          }, config.animate)
          : el.height(scrollTop);
      }
    },

    destroy: function() {
      this.unbind();
      this.el.removeData('AutoResizer');
      this.clones.remove();
      delete this.el;
      delete this.hClone;
      delete this.wClone;
      delete this.clones;
    },

    injectClone: function() {
      (
        autoResize.cloneContainer ||
          (autoResize.cloneContainer = $('<arclones/>').appendTo('body'))
        ).empty().append(this.clones); //this should be refactored so that a node is never cloned more than once
    }

  };

})(jQuery);