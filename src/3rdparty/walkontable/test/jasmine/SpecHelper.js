var spec = function () {
  return jasmine.getEnv().currentSpec;
};

var createDataArray = function (rows, cols) {
  spec().data = [];
  rows = rows || 100;
  cols = cols || 4;
  for (var i = 0; i < rows; i++) {
    var row = [i];
    for (var j = 0; j < cols - 1; j++) {
      row.push(String.fromCharCode(65 + j % 20).toLowerCase() + (j / 20 | 0 || ''));  // | 0 is parseInt - see http://jsperf.com/math-floor-vs-math-round-vs-parseint/18
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
  return spec().data[0].length;
};

beforeEach(function () {
  var matchers = {
    toBeInArray: function (arr) {
      return ($.inArray(this.actual, arr) > -1);
    }
  };

  this.addMatchers(matchers);
});