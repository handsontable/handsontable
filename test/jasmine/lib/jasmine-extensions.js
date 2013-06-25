/**
 * Jasmine matchers by Aaron Powell (https://github.com/aaronpowell)
 * Source: http://www.aaron-powell.com/posts/2011-12-23-useful-jasmine-extensions.html
 */

beforeEach(function() {
  this.addMatchers({
    toBeInArray: function() {
      return ~[].slice.call(arguments).indexOf(this.actual);
    },
    toBeInDateRange: function(min, max) {
      var actual = this.actual.getTime();
      return actual <= max.getTime() && actual >= min.getTime();
    },
    toBeInNumericalRange: function (min, max) {
      var actual = this.actual;
      return actual <= max && actual >= min;
    }
  });
});
