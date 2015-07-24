
var _isIE8 = !(document.createTextNode('test').textContent);

export function isIE8() {
  return _isIE8;
}

var _isIE9 = !!(document.documentMode);

export function isIE9() {
  return _isIE9;
}

var _isSafari = (/Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor));

export function isSafari() {
  return _isSafari;
}

var _isChrome = (/Chrome/.test(navigator.userAgent) && /Google/.test(navigator.vendor));

export function isChrome() {
  return _isChrome;
}

export function isMobileBrowser(userAgent) {
  if (!userAgent) {
    userAgent = navigator.userAgent;
  }

  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
}

export function isTouchSupported() {
  return ('ontouchstart' in window);
}

/**
 * Checks if browser is support web components natively
 *
 * @returns {Boolean}
 */
export function isWebComponentSupportedNatively() {
  var test = document.createElement('div');

  return test.createShadowRoot && test.createShadowRoot.toString().match(/\[native code\]/) ? true : false;
}

var _hasCaptionProblem;

function detectCaptionProblem() {
  var TABLE = document.createElement('TABLE');
  TABLE.style.borderSpacing = 0;
  TABLE.style.borderWidth = 0;
  TABLE.style.padding = 0;
  var TBODY = document.createElement('TBODY');
  TABLE.appendChild(TBODY);
  TBODY.appendChild(document.createElement('TR'));
  TBODY.firstChild.appendChild(document.createElement('TD'));
  TBODY.firstChild.firstChild.innerHTML = '<tr><td>t<br>t</td></tr>';

  var CAPTION = document.createElement('CAPTION');
  CAPTION.innerHTML = 'c<br>c<br>c<br>c';
  CAPTION.style.padding = 0;
  CAPTION.style.margin = 0;
  TABLE.insertBefore(CAPTION, TBODY);

  document.body.appendChild(TABLE);
  _hasCaptionProblem = (TABLE.offsetHeight < 2 * TABLE.lastChild.offsetHeight); //boolean
  document.body.removeChild(TABLE);
}

export function hasCaptionProblem() {
  if (_hasCaptionProblem === void 0) {
    detectCaptionProblem();
  }

  return _hasCaptionProblem;
}
