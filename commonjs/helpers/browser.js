'use strict';

exports.__esModule = true;
exports.setBrowserMeta = setBrowserMeta;
exports.isChrome = isChrome;
exports.isEdge = isEdge;
exports.isIE = isIE;
exports.isIE8 = isIE8;
exports.isIE9 = isIE9;
exports.isMSBrowser = isMSBrowser;
exports.isMobileBrowser = isMobileBrowser;
exports.isSafari = isSafari;

var _object = require('./object');

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

function setBrowserMeta() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$userAgent = _ref.userAgent,
      userAgent = _ref$userAgent === undefined ? navigator.userAgent : _ref$userAgent,
      _ref$vendor = _ref.vendor,
      vendor = _ref$vendor === undefined ? navigator.vendor : _ref$vendor;

  (0, _object.objectEach)(browsers, function (_ref2) {
    var test = _ref2.test;
    return void test(userAgent, vendor);
  });
}

setBrowserMeta();

function isChrome() {
  return browsers.chrome.value;
}

function isEdge() {
  return browsers.edge.value;
}

function isIE() {
  return browsers.ie.value;
}

function isIE8() {
  return browsers.ie8.value;
}

function isIE9() {
  return browsers.ie9.value;
}

function isMSBrowser() {
  return browsers.ie.value || browsers.edge.value;
}

function isMobileBrowser() {
  return browsers.mobile.value;
}

function isSafari() {
  return browsers.safari.value;
}