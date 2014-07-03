var autoResize = function (el, config) {
  var defaults = {
      minHeight: 200,
      maxHeight: 300,
      minWidth: 100,
      maxWidth: 300,
      fontSize: 11
    },
    body = document.getElementsByTagName("body")[0],
    observe = function (element, event, handler) {
      if (window.attachEvent) {
        element.attachEvent('on' + event, handler);
      } else {
        element.addEventListener(event, handler, false);
      }
    },
    resize = function () {
      var value = el.value,
        span = document.createElement('SPAN'),
        text = document.createTextNode(value);
      span.style.display = 'inline-block';
      span.style.fontSize = defaults.fontSize + 'px';

//      console.log(defaults.fontSize  + 2);

      span.appendChild(text);
      body.appendChild(span);

      var width = span.clientWidth;
      body.removeChild(span);

      el.style.height = 'auto';
      el.style.height = defaults.minHeight + 'px';

      if (defaults.minWidth > width) {
        el.style.width = defaults.minWidth + 'px';
      }
      else if(width > defaults.maxWidth) {
        var scrollHeight = el.scrollHeight;

        el.style.width = defaults.maxWidth + 'px';

        if (defaults.minHeight > scrollHeight) {
          el.style.height = defaults.minHeight + 'px';
        } else if(defaults.maxHeight < scrollHeight) {
          el.style.height = defaults.maxHeight + 'px';
          el.style.overflowY = 'visible';
        } else {
          el.style.height = scrollHeight + 'px';
        }
      } else {
        el.style.width = width + 'px';
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

      if (config && config.fontSize) {
        if (config.fontSize == 'inherit') {
          defaults.fontSize = el.fontSize;
        } else {
          var fontSize = parseInt(config.fontSize);
          if (!isNaN(fontSize)) {
            defaults.fontSize = fontSize
          }
        }
      }

    },
    init = function (el, config) {
      extendDefaults(config);

      if (el.nodeName == 'TEXTAREA') {

        el.style.resize = 'none';
        el.style.overflowY = 'none';
        el.style.height = defaults.minHeight + 'px';
        el.style.minWidth = defaults.minWidth + 'px';
        el.style.maxWidth = defaults.maxWidth + 'px';
        el.style.fontSize = defaults.fontSize + 'px';
        el.style.overflowY = 'hidden';
      }


      observe(el, 'change', resize);
      observe(el, 'cut', delayedResize);
      observe(el, 'paste', delayedResize);
      observe(el, 'drop', delayedResize);
      observe(el, 'keydown', delayedResize);

      resize();
    };

  init(el, config);

};