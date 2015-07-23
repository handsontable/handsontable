
export function enableImmediatePropagation(event) {
  if (event != null && event.isImmediatePropagationEnabled == null) {
    event.stopImmediatePropagation = function () {
      this.isImmediatePropagationEnabled = false;
      this.cancelBubble = true;
    };
    event.isImmediatePropagationEnabled = true;
    event.isImmediatePropagationStopped = function () {
      return !this.isImmediatePropagationEnabled;
    };
  }
}

export function stopPropagation(event) {
  // ie8
  //http://msdn.microsoft.com/en-us/library/ie/ff975462(v=vs.85).aspx
  if (typeof (event.stopPropagation) === 'function') {
    event.stopPropagation();
  }
  else {
    event.cancelBubble = true;
  }
}

export function pageX(event) {
  if (event.pageX) {
    return event.pageX;
  }

  var scrollLeft = getWindowScrollLeft();
  var cursorX = event.clientX + scrollLeft;

  return cursorX;
}

export function pageY(event) {
  if (event.pageY) {
    return event.pageY;
  }

  var scrollTop = getWindowScrollTop();
  var cursorY = event.clientY + scrollTop;

  return cursorY;
}
