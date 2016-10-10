var spec = function () {
  return currentSpec;
};

function createDataArray(rows, cols) {
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

function getData(row, col) {
  return spec().data[row][col];
};

function getTotalRows() {
  return spec().data.length;
};

function getTotalColumns() {
  return spec().data[0] ? spec().data[0].length : 0;
};

var currentSpec;

beforeEach(function () {
  currentSpec = this;

  var matchers = {
    toBeInArray: function () {
      return {
        compare: function (actual, expected) {
          return {
            pass: Array.isArray(expected) && expected.indexOf(actual) > -1
          };
        }
      };
    },
    toBeFunction: function () {
      return {
        compare: function (actual, expected) {
          return {
            pass: typeof actual === 'function'
          };
        }
      };
    },
    toBeAroundValue: function () {
      return {
        compare: function (actual, expected, diff) {
          diff = diff || 1;

          var pass = actual >= expected - diff && actual <= expected + diff;
          var message = 'Expected ' + actual + ' to be around ' + expected + ' (between ' + (expected - diff) + ' and ' + (expected + diff) + ')';

          if (!pass) {
            message = 'Expected ' + actual + ' NOT to be around ' + expected + ' (between ' + (expected - diff) + ' and ' + (expected + diff) + ')';
          }

          return {
            pass: pass,
            message: message
          };
        }
      };
    }
  };

  jasmine.addMatchers(matchers);
});

afterEach(function () {
  window.scrollTo(0, 0)
});

function getTableWidth(elem) {
  return $(elem).outerWidth() || $(elem).find('tbody').outerWidth() || $(elem).find('thead').outerWidth(); //IE8 reports 0 as <table> offsetWidth
};

function range(from, to) {
  if (!arguments.length){
    return [];
  }

  if (arguments.length == 1){
    to = from;
    from = 0;
  }

  if (to > from){
    from = [to, to = from][0]; //one-liner for swapping two values
  }

  var result = [];

  while (to++ < from) result.push(to);

  return result;
};

/**
 * Rewrite all existing selections from selections[0] etc. to selections.current etc
 * @param instance
 * @returns {object} modified instance
 */
function shimSelectionProperties(instance) {
  if(instance.selections[0]) instance.selections.current = instance.selections[0];
  if(instance.selections[1]) instance.selections.area = instance.selections[1];
  if(instance.selections[2]) instance.selections.highlight = instance.selections[2];
  if(instance.selections[3]) instance.selections.fill = instance.selections[3];

  return instance;
}

function getTableTopClone() {
  return $('.ht_clone_top');
}

function getTableLeftClone() {
  return $('.ht_clone_left');
}

function getTableCornerClone() {
  return $('.ht_clone_top_left_corner');
}
