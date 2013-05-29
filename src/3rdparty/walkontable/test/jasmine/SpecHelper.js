var spec = function () {
  return jasmine.getEnv().currentSpec;
};

var createDataArray = function (rows, cols) {
  spec().data = [];
  rows = typeof rows === 'number' ? rows : 100;
  cols = typeof cols === 'number' ? cols : 4;
  for (var i = 0; i < rows; i++) {
    var row = [];
    if (cols > 0) {
      row.push(i);
      for (var j = 0; j < cols - 1; j++) {
        row.push(String.fromCharCode(65 + j % 20).toLowerCase() + (j / 20 | 0 || ''));  // | 0 is parseInt - see http://jsperf.com/math-floor-vs-math-round-vs-parseint/18
      }
    }
    spec().data.push(row);
  }
};

var getData = function (row, col) {
  return spec().data[row][col];
};

var getTotalRows = function () {
  return spec().data.length;
};

var getTotalColumns = function () {
  return spec().data[0] ? spec().data[0].length : 0;
};

beforeEach(function () {
  var matchers = {
    toBeInArray: function (arr) {
      return ($.inArray(this.actual, arr) > -1);
    }
  };

  this.addMatchers(matchers);
});

var getTableWidth = function (elem) {
  return $(elem).outerWidth() || $(elem).find('tbody').outerWidth() || $(elem).find('thead').outerWidth(); //IE8 reports 0 as <table> offsetWidth
};