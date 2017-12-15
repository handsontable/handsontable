
const _isIE8 = !(document.createTextNode('test').textContent);

export function isIE8() {
  return _isIE8;
}

const _isIE9 = !!(document.documentMode);

export function isIE9() {
  return _isIE9;
}

const _isIE = /Trident/.test(navigator.userAgent);

export function isIE() {
  return _isIE;
}

const _isEdge = /Edge/.test(navigator.userAgent);

export function isEdge() {
  return _isEdge;
}

export function isMSBrowser() {
  return _isIE || _isEdge;
}

const _isSafari = (/Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor));

export function isSafari() {
  return _isSafari;
}

const _isChrome = (/Chrome/.test(navigator.userAgent) && /Google/.test(navigator.vendor));

export function isChrome() {
  return _isChrome;
}

export function isMobileBrowser(userAgent) {
  if (!userAgent) {
    userAgent = navigator.userAgent;
  }

  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
}
