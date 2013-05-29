function init() {
  var displayRows = 10;

  function createButton(label, fn, newLine) {
    var TABLE = document.getElementsByTagName('TABLE')[0];

    if (newLine) {
      var BR = document.createElement('BR');
      TABLE.parentNode.insertBefore(BR, TABLE);
    }

    var BUTTON = document.createElement('BUTTON');
    BUTTON.innerHTML = label;
    $(BUTTON).on('mousedown', fn);
    TABLE.parentNode.insertBefore(BUTTON, TABLE);
  }

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

  createButton('100k rows', function () {
    arr = createData(100000);
    wt.draw();
  });

  createButton('1k rows', function () {
    arr = createData(1000);
    wt.draw();
  });

  /**
   * Page up/down
   */

  createButton('Page down', function () {
    wt.scrollVertical(displayRows).draw();
  }, true);

  createButton('Page up', function () {
    wt.scrollVertical(-displayRows).draw();
  });


  /**
   * Scroll left/right
   */

  createButton('Scroll left', function () {
    wt.scrollHorizontal(-100).draw();
  });

  createButton('Scroll right', function () {
    wt.scrollHorizontal(100).draw();
  });

  /**
   * Init Walkontable
   */
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
    offsetRow: 0,
    offsetColumn: 0,
    height: 200,
    width: 200,
    rowHeaders: [function (row, TH) {
      TH.innerHTML = row + 1;
    }],
    selections: {
      area: {
        className: 'area',
        border: {
          width: 1,
          color: '#5292F7',
          style: 'solid'
        }
      },
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
  wt.draw();
}

window.onload = init;