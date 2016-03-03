
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
