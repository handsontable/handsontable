function WalkontableDom() {
}

//goes up the DOM tree (including given element) until it finds an element that matches the nodeName
WalkontableDom.prototype.closest = function (elem, nodeNames) {
  while (elem != null) {
    if (elem.nodeType === 1 && nodeNames.indexOf(elem.nodeName) > -1) {
      return elem;
    }
    elem = elem.parentNode;
  }
  return null;
};

WalkontableDom.prototype.prevSiblings = function (elem) {
  var out = [];
  while ((elem = elem.previousSibling) != null) {
    if (elem.nodeType === 1) {
      out.push(elem);
    }
  }
  return out;
};

if (document.documentElement.classList) {
  // HTML5 classList API
  WalkontableDom.prototype.hasClass = function (ele, cls) {
    return ele.classList.contains(cls);
  };

  WalkontableDom.prototype.addClass = function (ele, cls) {
    ele.classList.add(cls);
  };

  WalkontableDom.prototype.removeClass = function (ele, cls) {
    ele.classList.remove(cls);
  };
}
else {
  //http://snipplr.com/view/3561/addclass-removeclass-hasclass/
  WalkontableDom.prototype.hasClass = function (ele, cls) {
    return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
  };

  WalkontableDom.prototype.addClass = function (ele, cls) {
    if (!this.hasClass(ele, cls)) ele.className += " " + cls;
  };

  WalkontableDom.prototype.removeClass = function (ele, cls) {
    if (this.hasClass(ele, cls)) { //is this really needed?
      var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
      ele.className = ele.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, ''); //last 2 replaces do right trim (see http://blog.stevenlevithan.com/archives/faster-trim-javascript)
    }
  };
}

/*//http://net.tutsplus.com/tutorials/javascript-ajax/javascript-from-null-cross-browser-event-binding/
 WalkontableDom.prototype.addEvent = (function () {
 var that = this;
 if (document.addEventListener) {
 return function (elem, type, cb) {
 if ((elem && !elem.length) || elem === window) {
 elem.addEventListener(type, cb, false);
 }
 else if (elem && elem.length) {
 var len = elem.length;
 for (var i = 0; i < len; i++) {
 that.addEvent(elem[i], type, cb);
 }
 }
 };
 }
 else {
 return function (elem, type, cb) {
 if ((elem && !elem.length) || elem === window) {
 elem.attachEvent('on' + type, function () {

 //normalize
 //http://stackoverflow.com/questions/4643249/cross-browser-event-object-normalization
 var e = window['event'];
 e.target = e.srcElement;
 //e.offsetX = e.layerX;
 //e.offsetY = e.layerY;
 e.relatedTarget = e.relatedTarget || e.type == 'mouseover' ? e.fromElement : e.toElement;
 if (e.target.nodeType === 3) e.target = e.target.parentNode; //Safari bug

 return cb.call(elem, e)
 });
 }
 else if (elem.length) {
 var len = elem.length;
 for (var i = 0; i < len; i++) {
 that.addEvent(elem[i], type, cb);
 }
 }
 };
 }
 })();

 WalkontableDom.prototype.triggerEvent = function (element, eventName, target) {
 var event;
 if (document.createEvent) {
 event = document.createEvent("MouseEvents");
 event.initEvent(eventName, true, true);
 } else {
 event = document.createEventObject();
 event.eventType = eventName;
 }

 event.eventName = eventName;
 event.target = target;

 if (document.createEvent) {
 target.dispatchEvent(event);
 } else {
 target.fireEvent("on" + event.eventType, event);
 }
 };*/

WalkontableDom.prototype.removeTextNodes = function (elem, parent) {
  if (elem.nodeType === 3) {
    parent.removeChild(elem); //bye text nodes!
  }
  else if (['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'].indexOf(elem.nodeName) > -1) {
    var childs = elem.childNodes;
    for (var i = childs.length - 1; i >= 0; i--) {
      this.removeTextNodes(childs[i], elem);
    }
  }
};

/**
 * Remove childs function
 * WARNING - this doesn't unload events and data attached by jQuery
 * http://jsperf.com/jquery-html-vs-empty-vs-innerhtml/9
 * @param element
 * @returns {void}
 */
//
WalkontableDom.prototype.empty = function (element) {
  var child;
  while (child = element.lastChild) {
    element.removeChild(child);
  }
};

/**
 * Insert content into element trying avoid innerHTML method.
 * @return {void}
 */
WalkontableDom.prototype.avoidInnerHTML = function (element, content) {
  if ((/(<(.*)>|&(.*);)/g).test(content)) {
    element.innerHTML = content;
  } else {
    var child;
    while (child = element.lastChild) {
      element.removeChild(child);
    }

    element.appendChild(document.createTextNode(content));
  }
};

/**
 * Returns true if element is attached to the DOM and visible, false otherwise
 * @param elem
 * @returns {boolean}
 */
WalkontableDom.prototype.isVisible = function (elem) {
  //fast method
  try {//try/catch performance is not a problem here: http://jsperf.com/try-catch-performance-overhead/7
    if (!elem.offsetParent) {
      return false; //fixes problem with UI Bootstrap <tabs> directive
    }
  }
  catch (e) {
    return false; //IE7-8 throws "Unspecified error" when offsetParent is not found - we catch it here
  }

  if (elem.offsetWidth > 0 || (elem.parentNode && elem.parentNode.offsetWidth > 0)) {
    return true;
  }

  //slow method
  var next = elem;
  while (next !== document.documentElement) { //until <html> reached
    if (next === null) { //parent detached from DOM
      return false;
    }
    else if (next.nodeType === 11) { //IE7 reports this after detaching element from DOM
      return false;
    }
    else if (next.style.display === 'none') {
      return false;
    }
    /*else if (next !== elem && next.offsetWidth === 0) {
     //this is the technique used by jQuery is(':visible')
     //but in IE7, clientWidth & offsetWidth sometimes returns 0 when it shouldn't
     return false;

     compare with jQuery :visible selector (search jquery.js for `reliableHiddenOffsets`)
     }*/
    next = next.parentNode;
  }
  return true;
};

/**
 * seems getBounding is usually faster: http://jsperf.com/offset-vs-getboundingclientrect/4
 * but maybe offset + cache would work?
 * edit: after more tests turns out offsetLeft/Top is faster
 */

WalkontableDom.prototype.offset = function (elem) {
  var offsetLeft = elem.offsetLeft
    , offsetTop = elem.offsetTop;
  while (elem = elem.offsetParent) {
    offsetLeft += elem.offsetLeft;
    offsetTop += elem.offsetTop;
  }
  return {
    left: offsetLeft,
    top: offsetTop
  };
};

WalkontableDom.prototype.getComputedStyle = function (elem) {
  return elem.currentStyle || document.defaultView.getComputedStyle(elem);
};

WalkontableDom.prototype.outerWidth = function (elem) {
  return elem.offsetWidth;
};

WalkontableDom.prototype.outerHeight = function (elem) {
  return elem.offsetHeight;
};