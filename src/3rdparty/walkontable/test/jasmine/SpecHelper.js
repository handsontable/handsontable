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

/**
 * Creates 2D array of Excel-like values "A0", "A1", ...
 * @param rowCount
 * @param colCount
 * @returns {Array}
 */
function createSpreadsheetData(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = []
    , i
    , j;

  for (i = 0; i < rowCount; i++) {
    var row = [];
    for (j = 0; j < colCount; j++) {
      row.push(spreadsheetColumnLabel(j) + i);
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc
 * @param index
 * @returns {String}
 */
function spreadsheetColumnLabel(index) {
  var dividend = index + 1;
  var columnLabel = '';
  var modulo;
  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26, 10);
  }
  return columnLabel;
}