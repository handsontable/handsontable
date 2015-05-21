/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
 */
if (!String.prototype.trim) {
  var trimRegex = /^\s+|\s+$/g;
  /* jshint -W121 */
  String.prototype.trim = function() {
    return this.replace(trimRegex, '');
  };
}
