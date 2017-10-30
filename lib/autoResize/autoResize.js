/**
 * autoResize - resizes a DOM element to the width and height of another DOM element
 *
 * Copyright 2014, Marcin Warpechowski
 * Licensed under the MIT license
 */


function autoResize() {
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
      if (element.attachEvent) {
        element.attachEvent('on' + event, handler);
      } else {
        element.addEventListener(event, handler, false);
      }
    },
    unObserve = function (element, event, handler) {
      if (element.removeEventListener) {
        element.removeEventListener(event, handler, false);

      } else {
        element.detachEvent('on' + event, handler);
      }
    },
    resize = function (newChar) {
      if (!newChar) {
        newChar = "";

      } else if (!/^[a-zA-Z \.,\\\/\|0-9]$/.test(newChar)) {
        newChar = ".";
      }

      if (text.textContent !== void 0) {
        text.textContent = el.value + newChar;

      } else {
        text.data = el.value + newChar; //IE8
      }

      const styles = getComputedStyle(el);

      span.style.fontSize = styles.fontSize;
      span.style.fontFamily = styles.fontFamily;
      span.style.fontWeight = styles.fontWeight;
      span.style.lineHeight = styles.lineHeight;
      span.style.paddingTop = styles.paddingTop;
      span.style.paddingLeft = styles.paddingLeft;
      span.style.paddingRight = styles.paddingRight;
      span.style.maxHeight = styles.maxHeight;
      span.style.maxWidth = styles.maxWidth;
      span.style.minHeight = styles.minHeight;
      span.style.minWidth = styles.minWidth;
      span.style.whiteSpace = 'pre-wrap';
      span.style.wordBreak = 'break-all';
      span.style.boxSizing = 'border-box';
      span.style.overflowY = 'auto';

      body.appendChild(span);
      const {width: newWidth, height: newHeight} = span.getBoundingClientRect();
      body.removeChild(span);

      el.style.width = `${newWidth}px`;
      el.style.height = `${newHeight}px`;

      el.style.overflowY = newHeight >= defaults.maxHeight ? 'auto' : 'hidden';
    },
    delayedResize = function () {
      //window.setTimeout(resize, 0);
    },
    extendDefaults = function (config) {

      if (config && config.minHeight) {
        if (config.minHeight == 'inherit') {
          defaults.minHeight = el.clientHeight;
        } else {
          var minHeight = parseInt(config.minHeight);
          if (!isNaN(minHeight)) {
            defaults.minHeight = minHeight;
          }
        }
      }

      if (config && config.maxHeight) {
        if (config.maxHeight == 'inherit') {
          defaults.maxHeight = el.clientHeight;
        } else {
          var maxHeight = parseInt(config.maxHeight);
          if (!isNaN(maxHeight)) {
            defaults.maxHeight = maxHeight;
          }
        }
      }

      if (config && config.minWidth) {
        if (config.minWidth == 'inherit') {
          defaults.minWidth = el.clientWidth;
        } else {
          var minWidth = parseInt(config.minWidth);
          if (!isNaN(minWidth)) {
            defaults.minWidth = minWidth;
          }
        }
      }

      if (config && config.maxWidth) {
        if (config.maxWidth == 'inherit') {
          defaults.maxWidth = el.clientWidth;
        } else {
          var maxWidth = parseInt(config.maxWidth);
          if (!isNaN(maxWidth)) {
            defaults.maxWidth = maxWidth;
          }
        }
      }

      if(!span.firstChild) {
        span.className = "autoResize";
        span.style.display = 'inline-block';
        span.appendChild(text);
      }
    },
    init = function (el_, config, doObserve) {
      el = el_;
      extendDefaults(config);

      if (el.nodeName == 'TEXTAREA') {
        el.style.height = defaults.minHeight + 'px';
        el.style.minHeight = defaults.minHeight + 'px';
        el.style.minWidth = defaults.minWidth + 'px';
        el.style.maxWidth = defaults.maxWidth + 'px';
      }

      if(doObserve) {
        observe(el, 'input', resize);
        observe(el, 'focus', resize);
      }

      resize();
    };

  function getComputedStyle(element) {
    return element.currentStyle || document.defaultView.getComputedStyle(element);
  }

  return {
    init: function (el_, config, doObserve) {
      init(el_, config, doObserve);
    },
    unObserve: function () {
      unObserve(el, 'input', resize);
      unObserve(el, 'focus', resize);
    },
    resize: resize
  };
}

if (typeof exports !== 'undefined') {
  module.exports = autoResize;
}
