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
    runs(function () {
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
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDownUp('enter');
      expect(this.$container.find('.handsontableEditor:visible').length).toEqual(1);
    });
  });

  it('should destroy the editor when Esc is pressed', function () {
    runs(function () {
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
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDownUp('enter');
      keyDownUp('esc');
      expect(this.$container.find('.handsontableEditor:visible').length).toEqual(0);
    });
  });

  it('Enter pressed in nested HT should set the value and hide the editor', function () {
    runs(function () {
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
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDownUp('enter');
      keyDownUp('enter');
      expect(this.$container.find('.handsontableEditor:visible').length).toEqual(0);
      expect(getDataAtCell(2, 0)).toEqual('BMW');
    });
  });

  it('after HT editor is closed, focus should be set back to the cell', function () {
    runs(function () {
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
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDownUp('enter');
      keyDownUp('esc');
      expect(document.activeElement).toEqual(getCell(2, 0));
    });
  });
});