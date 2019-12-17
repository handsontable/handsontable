document.addEventListener('DOMContentLoaded', function (){
  var example = document.getElementById('example1'),
  hot;

  var hue = 0;
  var customBorders = [];
  var rows = 600;
  var cols= 50;
  var data = Handsontable.helper.createSpreadsheetData(rows, cols);
  data[5][5] = 'XXXXXXXX\nXXXXXXXXX';
  for (var j = 0; j < cols; j++) {
      for (var i = 0; i< rows; i++) {
        data[i][j] += "\nlin";
          customBorders.push({
              row: i,
              col: j,
              top: {
                  width: 3,
                  color: 'blue',
              },
              left: {
                  width: 3,
                  color: 'magneta',
                },
                bottom: {
                  width: 1,
                  color: 'green',
                },
                right: {
                  width: 3,
                  color: 'pink',
                }
          })
      }
  }

  hot = Handsontable(example, {
      data: data,
      colWidths: [50, 50, 50, 50, 150, 250],
      // rowHeaders: true,
      manualColumnFreeze: true,
      contextMenu: true,
      fixedRowsTop: 2,
      fixedRowsBottom: 5,
      fixedColumnsLeft: 2,
      // colHeaders: true,
      manualColumnMove: true,
      // customBorders: customBorders,
      autoColumnSize: false, // AutoColumnSize is asynchronous so it has to be disabled to not inferred stat results
  })

  console.log('current', hot.selection.highlight.cell.settings.border.color);
  hot.selection.highlight.cell.settings.border.color = 'pink'
console.log('hey');
  window.hot = hot;

  }
  )

  console.log(Handsontable.buildDate, Handsontable.version)