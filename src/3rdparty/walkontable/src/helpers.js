function walkontableRangesIntersect() {
  var from = arguments[0];
  var to = arguments[1];
  for (var i = 1, ilen = arguments.length / 2; i < ilen; i++) {
    if (from <= arguments[2 * i + 1] && to >= arguments[2 * i]) {
      return true;
    }
  }
  return false;
}

/**
 * Generates a random hex string. Used as namespace for Walkontable instance events.
 * @return {String} - 16 character random string: "92b1bfc74ec4"
 */
function walkontableRandomString() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + s4() + s4();
}

var cachedScrollbarWidth;
//http://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
function walkontableCalculateScrollbarWidth() {
  var inner = document.createElement('p');
  inner.style.width = "100%";
  inner.style.height = "200px";

  var outer = document.createElement('div');
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.appendChild(inner);

  document.body.appendChild(outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 == w2) w2 = outer.clientWidth;

  document.body.removeChild(outer);

  return (w1 - w2);
}

function walkontableGetScrollbarWidth() {
  if (cachedScrollbarWidth === void 0) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth();
  }
  return cachedScrollbarWidth;
}