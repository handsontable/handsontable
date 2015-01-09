describe('CustomBorders', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    var wrapper = $('<div></div>').css({
      width: 400,
      height: 200,
      overflow: 'scroll'
    });

    this.$wrapper = this.$container.wrap(wrapper).parent();
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    this.$wrapper.remove();
  });

  it('should draw custom borders for single td', function () {

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(7, 7),
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

    var borders = $('.wtBorder.border_row2col2');
    expect(borders.length).toEqual(20); //4 times 5 elements (top,right, bottom, left, corner)
    expect(borders[0].className).toContain('hidden'); // hidden top
    expect(borders[1].style.backgroundColor).toEqual('red'); // left red
    expect(borders[1].style.width).toEqual('2px'); // left 2px width
    expect(borders[2].className).toContain('hidden'); // hidden bottom
    expect(borders[3].style.backgroundColor).toEqual('green'); // green right
    expect(borders[3].style.width).toEqual('1px'); // right 1px width
  });

  it('should draw custom borders for range', function () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(7, 7),
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

    for (var row = 1; row <= 3; row++) {
      for (var column = 1; column <=4; column++){
        if(row == 1) {
          var topRow = $('.wtBorder.border_row' + row + 'col' + column);
          expect(topRow.length).toEqual(20); // borders for all tables (main and hiders)
          expect(topRow[0].style.backgroundColor).toEqual('black');
          expect(topRow[0].style.height).toEqual('2px');
        }
        if(column == 1) {
          var leftColumn = $('.wtBorder.border_row' + row + 'col' + column);
          expect(leftColumn.length).toEqual(20); // borders for all tables (main and hiders)
          expect(leftColumn[1].style.backgroundColor).toEqual('red');
          expect(leftColumn[1].style.width).toEqual('2px');
        }
        if(row == 3) {
          var bottomRow = $('.wtBorder.border_row' + row + 'col' + column);
          expect(bottomRow.length).toEqual(20); // borders for all tables (main and hiders)
          expect(bottomRow[2].style.backgroundColor).toEqual('red');
          expect(bottomRow[2].style.height).toEqual('2px');
        }
        if(column == 4){
          var rightColumn = $('.wtBorder.border_row' + row + 'col' + column);
          expect(rightColumn.length).toEqual(20); // borders for all tables (main and hiders)
          expect(rightColumn[3].style.backgroundColor).toEqual('black');
          expect(rightColumn[3].style.width).toEqual('3px');
        }
      }
    }
  });

  it('should draw top border from context menu options', function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    var defaultBorder = {
        color:'#000',
        width: 1
      },
      empty = {
        hide: true
      };

    contextMenu();

    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(10);
//    item.trigger('mouseover');
    item.simulate('mouseover');

    var contextSubMenu = $('.htContextSubMenu_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);

//    button.trigger('mousedown');
    button.simulate('mousedown');

    //expect(getCellMeta(0,0).borders.hasOwnProperty('top')).toBe(true);
    expect(getCellMeta(0,0).borders.top).toEqual(defaultBorder);
    expect(getCellMeta(0,0).borders.left).toEqual(empty);
    expect(getCellMeta(0,0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0,0).borders.right).toEqual(empty);

  });

  it('should draw left border from context menu options', function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    var defaultBorder = {
        color:'#000',
        width: 1
      },
      empty = {
        hide: true
      };

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(10);
//    item.trigger('mouseover');
    item.simulate('mouseover');

    var contextSubMenu = $('.htContextSubMenu_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(3);

//    button.trigger('mousedown');
    button.simulate('mousedown');

    expect(getCellMeta(0,0).borders.hasOwnProperty('left')).toBe(true);
    expect(getCellMeta(0,0).borders.top).toEqual(empty);
    expect(getCellMeta(0,0).borders.left).toEqual(defaultBorder);
    expect(getCellMeta(0,0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0,0).borders.right).toEqual(empty);
  });

  it('should draw right border from context menu options', function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    var defaultBorder = {
        color:'#000',
        width: 1
      },
      empty = {
        hide: true
      };

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(10);
//    item.trigger('mouseover');
    item.simulate('mouseover');

    var contextSubMenu = $('.htContextSubMenu_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(1);

//    button.trigger('mousedown');
    button.simulate('mousedown');

    expect(getCellMeta(0,0).borders.hasOwnProperty('right')).toBe(true);
    expect(getCellMeta(0,0).borders.top).toEqual(empty);
    expect(getCellMeta(0,0).borders.left).toEqual(empty);
    expect(getCellMeta(0,0).borders.bottom).toEqual(empty);
    expect(getCellMeta(0,0).borders.right).toEqual(defaultBorder);
  });

  it('should draw bottom border from context menu options', function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    var defaultBorder = {
        color:'#000',
        width: 1
      },
      empty = {
        hide: true
      };


    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(10);
//    item.trigger('mouseover');
    item.simulate('mouseover');

    var contextSubMenu = $('.htContextSubMenu_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(2);

//    button.trigger('mousedown');
    button.simulate('mousedown');

    expect(getCellMeta(0,0).borders.hasOwnProperty('right')).toBe(true);
    expect(getCellMeta(0,0).borders.top).toEqual(empty);
    expect(getCellMeta(0,0).borders.left).toEqual(empty);
    expect(getCellMeta(0,0).borders.bottom).toEqual(defaultBorder);
    expect(getCellMeta(0,0).borders.right).toEqual(empty);
  });

  it('should remove all bottoms border from context menu options', function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [
      {
        row: 0,
        col: 0,
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

    contextMenu();
    var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(10);
//    item.trigger('mouseover');
    item.simulate('mouseover');

    var contextSubMenu = $('.htContextSubMenu_' + item.text());
    var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(4);

//    button.trigger('mousedown');
    button.simulate('mousedown');

    expect(getCellMeta(0,0).borders).toBeUndefined();
  });
});
