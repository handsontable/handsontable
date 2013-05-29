/**
 * I use it to measure how long does it take to paste big chunk of data into the table.
 *
 * rev                                      | date (dd.mm.yy) | performance                           | desc
 * -----------------------------------------|-----------------|---------------------------------------|------------------------------------------------------
 * 7076ebee93ccdf17803410e87f6815aa3eebecef | 11.07.12 00:25  | 4.76 ops/sec ±1.55% (31 runs sampled) | after introducing blockedRows/Cols. offset() core.js is known for slowing up things
 *
 * cheers
 * Marcin
 */

/**
 * Data source
 */

function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars.charAt(Math.round(Math.random() * (chars.length - 1)));
  return result;
}

function createData(rows) {
  var arr = [];
  var arrPart = [];
  var str = 'abcdefghijklmnopqrstuvwxyz';
  var i;

  for (i = 0; i < 100; i++) {
    arrPart.push([
      i,
      randomString(3 * (1 + Math.sin(i)), str),
      randomString(3 * (1 + Math.sin(i + 2)), str),
      randomString(3 * (1 + Math.sin(i + 4)), str),
      randomString(3 * (1 + Math.sin(i + 6)), str),
      randomString(3 * (1 + Math.sin(i + 8)), str),
      randomString(3 * (1 + Math.sin(i + 10)), str)
    ]);
  }

  for (i = 0; i < rows; i++) {
    arr.push(arrPart[i % 100]); //clone 100 row chunks until array has size of 100000
  }

  return arr;
}

$(window).load(function () {
  var suite = new Benchmark.Suite;
  var TABLE = document.createElement('TABLE');
  document.body.appendChild(TABLE);

  var arr = createData(100000);

  var wt = new Walkontable({
    table: document.getElementsByTagName('TABLE')[0],
    data: function (row, col) {
      return arr[row][col];
    },
    totalRows: function () {
      return arr.length;
    },
    totalColumns: function () {
      return arr[0].length;
    },
    height: 600,
    width: 600,
    rowHeaders: [function (row, TH) {
      TH.innerHTML = row + 1;
    }],
    columnHeaders: [function (col, TH) {
      TH.innerHTML = col + 1;
    }],
    selections: {
      current: {
        className: 'current',
        border: {
          width: 2,
          color: '#5292F7',
          style: 'solid'
        }
      }
    },
    onCellMouseDown: function (event, coords, TD) {
      if (wt.selections.area.isSelected(coords, TD) > -1) {
        wt.selections.area.remove(coords, TD);
      }
      else {
        wt.selections.area.add(coords, TD);
      }

      wt.selections.current.clear();
      wt.selections.current.add(coords, TD);
      wt.draw();
    }
  });

  suite.add('Basic test', {
    'defer': false,
    minSamples: 20,
    'fn': function () {
      wt.draw();
    }})
    .on('cycle', function (event) {
      $("body").prepend($('<div>' + String(event.target) + '</div>'));
      if (window.console) {
        console.log("Benchmark finished: " + String(event.target));
      }
    })
    .run();
});