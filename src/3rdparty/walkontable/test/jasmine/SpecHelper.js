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
    },
    toBeAroundValue: function (val) {
      this.message = function (val) {
        return [
          "Expected " + this.actual + " to be around " + val + " (between " + (val - 1) + " and " + (val + 1) + ")",
          "Expected " + this.actual + " NOT to be around " + val + " (between " + (val - 1) + " and " + (val + 1) + ")"
        ];
      };
      return (this.actual >= val - 1 && this.actual <= val + 1);
    }
  };

  this.addMatchers(matchers);
});

var getTableWidth = function (elem) {
  return $(elem).outerWidth() || $(elem).find('tbody').outerWidth() || $(elem).find('thead').outerWidth(); //IE8 reports 0 as <table> offsetWidth
};

var range = function (from, to) {
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
  return $('.ht_clone_corner');
}
