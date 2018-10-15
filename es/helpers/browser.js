import { objectEach } from './object';

var tester = function tester(testerFunc) {
  var result = {
    value: false
  };
  result.test = function (ua, vendor) {
    result.value = testerFunc(ua, vendor);
  };

  return result;
};

var browsers = {
  chrome: tester(function (ua, vendor) {
    return (/Chrome/.test(ua) && /Google/.test(vendor)
    );
  }),
  edge: tester(function (ua) {
    return (/Edge/.test(ua)
    );
  }),
  ie: tester(function (ua) {
    return (/Trident/.test(ua)
    );
  }),
  ie8: tester(function () {
    return !document.createTextNode('test').textContent;
  }),
  ie9: tester(function () {
    return !!document.documentMode;
  }),
  mobile: tester(function (ua) {
    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    );
  }),
  safari: tester(function (ua, vendor) {
    return (/Safari/.test(ua) && /Apple Computer/.test(vendor)
    );
  })
};

export function setBrowserMeta() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$userAgent = _ref.userAgent,
      userAgent = _ref$userAgent === undefined ? navigator.userAgent : _ref$userAgent,
      _ref$vendor = _ref.vendor,
      vendor = _ref$vendor === undefined ? navigator.vendor : _ref$vendor;

  objectEach(browsers, function (_ref2) {
    var test = _ref2.test;
    return void test(userAgent, vendor);
  });
}

setBrowserMeta();

export function isChrome() {
  return browsers.chrome.value;
}

export function isEdge() {
  return browsers.edge.value;
}

export function isIE() {
  return browsers.ie.value;
}

export function isIE8() {
  return browsers.ie8.value;
}

export function isIE9() {
  return browsers.ie9.value;
}

export function isMSBrowser() {
  return browsers.ie.value || browsers.edge.value;
}

export function isMobileBrowser() {
  return browsers.mobile.value;
}

export function isSafari() {
  return browsers.safari.value;
}