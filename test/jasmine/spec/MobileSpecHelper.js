var triggerTouchEvent = function (type, target, pageX, pageY) {
  var e = document.createEvent('TouchEvent');
  var targetCoords = target.getBoundingClientRect();
  var touches
    , targetTouches
    , changedTouches;

  if(!pageX && !pageY) {
    pageX = parseInt(targetCoords.left + 3,10);
    pageY = parseInt(targetCoords.top + 3,10);
  }

  var touch = document.createTouch(window, target, 0, pageX, pageY, pageX, pageY);

  if (type == 'touchend') {
    touches = document.createTouchList();
    targetTouches = document.createTouchList();
    changedTouches = document.createTouchList(touch);
  } else {
    touches = document.createTouchList(touch);
    targetTouches = document.createTouchList(touch);
    changedTouches = document.createTouchList(touch);
  }

  e.initTouchEvent(type, true, true, window, null, 0, 0, 0, 0, false, false, false, false, touches, targetTouches, changedTouches, 1, 0);
  target.dispatchEvent(e);
};
