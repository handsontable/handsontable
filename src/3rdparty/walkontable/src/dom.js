function WalkontableDom(instance) {
  if (instance) {
    this.instance = instance;
  }
  this.tdCache = [];
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

WalkontableDom.prototype.tdHasClass = function (trIndex, tdIndex, cls) {
  return !!(this.tdCache[trIndex] && this.tdCache[trIndex][tdIndex] && this.tdCache[trIndex][tdIndex][cls]);
};

WalkontableDom.prototype.tdAddClass = function (trIndex, tdIndex, cls) {
  if (!this.tdHasClass(trIndex, tdIndex, cls)) {
    if (!this.tdCache[trIndex]) {
      this.tdCache[trIndex] = [];
    }
    if (!this.tdCache[trIndex][tdIndex]) {
      this.tdCache[trIndex][tdIndex] = {};
      this.tdCache[trIndex][tdIndex]._node = this.instance.wtTable.getCell([trIndex + this.instance.getSetting('offsetRow'), tdIndex + this.instance.getSetting('offsetColumn')]);
    }
    this.tdCache[trIndex][tdIndex]._node.className += " " + cls;
    this.tdCache[trIndex][tdIndex][cls] = true;
  }
};

WalkontableDom.prototype.tdRemoveClass = function (trIndex, tdIndex, cls) {
  if (this.tdHasClass(trIndex, tdIndex, cls)) {
    var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
    this.tdCache[trIndex][tdIndex]._node.className = this.tdCache[trIndex][tdIndex]._node.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, ''); //last 2 replaces do right trim (see http://blog.stevenlevithan.com/archives/faster-trim-javascript)
    this.tdCache[trIndex][tdIndex][cls] = false;
  }
};

WalkontableDom.prototype.tdResetCache = function () {
  for (var i in this.tdCache) {
    if (this.tdCache.hasOwnProperty(i)) {
      for (var j in this.tdCache[i]) {
        if (this.tdCache[i].hasOwnProperty(j)) {
          for (var k in this.tdCache[i][j]) {
            if (this.tdCache[i][j].hasOwnProperty(k)) {
              if (k !== '_node') {
                this.tdCache[i][j][k] = false;
              }
            }
          }
        }
      }
    }
  }
};

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
 * seems getBounding is usually faster: http://jsperf.com/offset-vs-getboundingclientrect/4
 * but maybe offset + cache would work?
 * edit: after more tests turns out offsetLeft/Top is faster
 */
/*WalkontableDom.prototype.offset = function (elem) {
 var rect = elem.getBoundingClientRect();
 return {
 top: rect.top + document.documentElement.scrollTop,
 left: rect.left + document.documentElement.scrollLeft
 };
 };*/

/*
 WalkontableDom.prototype.offsetLeft = function (elem) {
 var offset = elem.offsetLeft;
 while (elem = elem.offsetParent) {
 offset += elem.offsetLeft;
 }
 return offset;
 };

 WalkontableDom.prototype.offsetTop = function (elem) {
 var offset = elem.offsetTop;
 while (elem = elem.offsetParent) {
 offset += elem.offsetTop;
 }
 return offset;
 };*/

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