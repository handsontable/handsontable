describe('CustomBorders', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  var createBigData = function() {
    var rows = []
      , i
      , j;

    for (i = 0; i < 7; i++) {
      var row = [];
      for (j = 0; j < 7; j++) {
        row.push(Handsontable.helper.spreadsheetColumnLabel(j) + i);
      }
      rows.push(row);
    }

    return rows;
  };

  it('should draw custom borders for single td', function () {

    handsontable({
      data: createBigData(),
      customBorders: [
        {
          row: 2,
          col: 2,
          left:{
            width:2,
            color: 'red'
          },
          right:{
            width:1,
            color: 'green'
          }
        }]
    });
    //[top,left, bottom, right]

    var borders = $('.border_row2col2');
    expect(borders.length).toEqual(5); // 5 elements (top,right, bottom, left, corner)
    expect(borders[0].className).toContain('hidden'); // hidden top
    expect(borders[1].style.backgroundColor).toEqual('red'); // left red
    expect(borders[1].style.width).toEqual('2px'); // left 2px width
    expect(borders[2].className).toContain('hidden'); // hidden bottom
    expect(borders[3].style.backgroundColor).toEqual('green'); // green right
    expect(borders[3].style.width).toEqual('1px'); // right 1px width
  });

  it('should draw custom borders for range', function () {
    handsontable({
      data: createBigData(),
      customBorders: [
        {
          range:{
            from:{
              row: 1,
              col: 1
            },
            to:{
              row: 3,
              col: 4
            }
          },
          top:{
            width: 2,
            color: 'black'
          },
          left: {
            width:2,
            color: 'red'
          },
          bottom:{
            width: 2,
            color: 'red'
          },
          right: {
            width:3,
            color:'black'
          }
        }]
    });


//    debugger;
    for (var row = 1; row <= 3; row++) {
      for (var column = 1; column <=4; column++){
        if(row == 1) {
          var topRow = $('.border_row' + row + 'col' + column);
          expect(topRow[0].style.backgroundColor).toEqual('black');
          expect(topRow[0].style.height).toEqual('2px');
        }
        if(column == 1) {
          var leftColumn = $('.border_row' + row + 'col' + column);
          expect(leftColumn[1].style.backgroundColor).toEqual('red');
          expect(leftColumn[1].style.width).toEqual('2px');
        }
        if(row == 3) {
          var bottomRow = $('.border_row' + row + 'col' + column);
          expect(bottomRow[2].style.backgroundColor).toEqual('red');
          expect(bottomRow[2].style.height).toEqual('2px');
        }
        if(column == 4){
          var rightColumn = $('.border_row' + row + 'col' + column);
          expect(rightColumn[3].style.backgroundColor).toEqual('black');
          expect(rightColumn[3].style.width).toEqual('3px');
        }
      }
    }


  });



});