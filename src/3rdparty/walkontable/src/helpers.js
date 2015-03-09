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
 *
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
