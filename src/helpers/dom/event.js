
export function stopImmediatePropagation(event) {
  event.isImmediatePropagationEnabled = false;
  event.cancelBubble = true;
}

export function isImmediatePropagationStopped(event) {
  return event.isImmediatePropagationEnabled === false;
}

export function stopPropagation(event) {
  // ie8
  //http://msdn.microsoft.com/en-us/library/ie/ff975462(v=vs.85).aspx
  if (typeof event.stopPropagation === 'function') {
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
