/**
 * autoResize - resizes a DOM element to the width and height of another DOM element
 *
 * Copyright 2014, Marcin Warpechowski
 * Licensed under the MIT license
 */
var autoResize = function () {
  var defaults = {
      minHeight: 200,
      maxHeight: 300,
      minWidth: 100,
      maxWidth: 300
    },
    el,
    body = document.body,
    text = document.createTextNode(''),
    span = document.createElement('SPAN'),
    observe = function (element, event, handler) {
      if (window.attachEvent) {
        element.attachEvent('on' + event, handler);
      } else {
        element.addEventListener(event, handler, false);
      }
    },
    unObserve = function (element, event, handler) {
      if (window.detachEvent) {
        element.detachEvent('on' + event, handler);
      } else {
        element.removeEventListener(event, handler, false);
      }
    },
    resize = function () {
      if (text.textContent !== void 0) {
        text.textContent = el.value;
      }
      else {
        text.data = el.value; //IE8
      }
      span.style.fontSize = Handsontable.Dom.getComputedStyle(el).fontSize;
      span.style.fontFamily = Handsontable.Dom.getComputedStyle(el).fontFamily;

      body.appendChild(span);
      var width = span.clientWidth;
      body.removeChild(span);

      el.style.height = defaults.minHeight + 'px';

      if (defaults.minWidth > width) {
        el.style.width = defaults.minWidth + 'px';
      } else if (width > defaults.maxWidth) {
        el.style.width = defaults.maxWidth + 'px';
      } else {
        el.style.width = width + 'px';
      }

      var scrollHeight = el.scrollHeight;
      if (defaults.minHeight > scrollHeight) {
        el.style.height = defaults.minHeight + 'px';
      } else if (defaults.maxHeight < scrollHeight) {
        el.style.height = defaults.maxHeight + 'px';
        el.style.overflowY = 'visible';
      } else {
        el.style.height = scrollHeight + 'px';
      }

    },
    delayedResize = function () {
      window.setTimeout(resize, 0);
    },
    extendDefaults = function (config) {

      if (config && config.minHeight) {
        if (config.minHeight == 'inherit') {
          defaults.minHeight = el.clientHeight;
        } else {
          var minHeight = parseInt(config.minHeight);
          if (!isNaN(minHeight)) {
            defaults.minHeight = minHeight
          }
        }
      }

      if (config && config.maxHeight) {
        if (config.maxHeight == 'inherit') {
          defaults.maxHeight = el.clientHeight;
        } else {
          var maxHeight = parseInt(config.maxHeight);
          if (!isNaN(maxHeight)) {
            defaults.maxHeight = maxHeight
          }
        }
      }

      if (config && config.minWidth) {
        if (config.minWidth == 'inherit') {
          defaults.minWidth = el.clientWidth;
        } else {
          var minWidth = parseInt(config.minWidth);
          if (!isNaN(minWidth)) {
            defaults.minWidth = minWidth
          }
        }
      }

      if (config && config.maxWidth) {
        if (config.maxWidth == 'inherit') {
          defaults.maxWidth = el.clientWidth;
        } else {
          var maxWidth = parseInt(config.maxWidth);
          if (!isNaN(maxWidth)) {
            defaults.maxWidth = maxWidth
          }
        }
      }

      if(!span.firstChild) {
        span.className = "autoResize";
        span.style.display = 'inline-block';
        span.appendChild(text);
      }
    },
    init = function (el_, config) {
      el = el_;
      extendDefaults(config);

      if (el.nodeName == 'TEXTAREA') {

        el.style.resize = 'none';
        el.style.overflowY = '';
        el.style.height = defaults.minHeight + 'px';
        el.style.minWidth = defaults.minWidth + 'px';
        el.style.maxWidth = defaults.maxWidth + 'px';
        el.style.overflowY = 'hidden';
      }


      observe(el, 'change', resize);
      observe(el, 'cut', delayedResize);
      observe(el, 'paste', delayedResize);
      observe(el, 'drop', delayedResize);
      observe(el, 'keydown', delayedResize);

      resize();
    };

  return {
    init: function (el_, config) {
      init(el_, config);
    },
    unObserve: function () {
      unObserve(el, 'change', resize);
      unObserve(el, 'cut', delayedResize);
      unObserve(el, 'paste', delayedResize);
      unObserve(el, 'drop', delayedResize);
      unObserve(el, 'keydown', delayedResize);
    }
  }

};
