describe('HandsontableEditor', function () {
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

  function getManufacturerData() {
    return [
      {name: "BMW", country: "Germany", owner: "Bayerische Motoren Werke AG"},
      {name: "Chrysler", country: "USA", owner: "Chrysler Group LLC"},
      {name: "Nissan", country: "Japan", owner: "Nissan Motor Company Ltd"},
      {name: "Suzuki", country: "Japan", owner: "Suzuki Motor Corporation"},
      {name: "Toyota", country: "Japan", owner: "Toyota Motor Corporation"},
      {name: "Volvo", country: "Sweden", owner: "Zhejiang Geely Holding Group"}
    ]
  }

  it('should create an editor that is a Handsontable instance', function () {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');
    expect(this.$container.find('.handsontableEditor:visible').length).toEqual(1);
  });

  it('should destroy the editor when Esc is pressed', function () {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');
    keyDownUp('esc');
    expect(this.$container.find('.handsontableEditor:visible').length).toEqual(0);
  });

  it('Enter pressed in nested HT should set the value and hide the editor', function () {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');
    keyDownUp('enter');
    expect(this.$container.find('.handsontableEditor:visible').length).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual('BMW');
  });

  it('should focus the TD after HT editor is prepared and destroyed', function () {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });

    selectCell(2, 0);
    keyDownUp('arrow_down');
    keyDownUp('arrow_down');

    expect(getSelected()).toEqual([4, 0, 4, 0]);
  });

  it('should focus the TD after HT editor is prepared, finished (by keyboard) and destroyed', function () {
    var selections = [];

    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData(),
            afterSelection: function () {
              selections.push(['inner', arguments[0]]); //arguments[0] is selection start row
            }
          }
        }
      ],
      afterSelection: function () {
        selections.push(['outer', arguments[0]]); //arguments[0] is selection start row
      }
    });
    expect(selections.length).toBe(0);

    selectCell(1, 0);
    expect(selections[0]).toEqual(['outer', 1]);

    keyDownUp('arrow_down');
    expect(selections[1]).toEqual(['outer', 2]);

    keyDownUp('enter');
    expect(selections[2]).toEqual(['inner', 0]);

    keyDownUp('arrow_down');
    expect(selections[3]).toEqual(['inner', 1]);

    keyDownUp('esc');
    keyDownUp('arrow_down');
    expect(selections[4]).toEqual(['outer', 3]);

    expect(selections.length).toBe(5);
  });
});