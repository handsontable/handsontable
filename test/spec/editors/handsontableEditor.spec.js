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
    keyDownUp('arrow_down');
    keyDownUp('enter');
    expect(this.$container.find('.handsontableEditor:visible').length).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual('BMW');
  });

  it('should keep focus on textarea after arrow is pressed', function () {
    var hot = handsontable({
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
    keyDownUp('arrow_down');
    expect(document.activeElement).toEqual(hot.getActiveEditor().TEXTAREA);
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

    keyDownUp('arrow_down');
    expect(selections[2]).toEqual(['inner', 0]);

    keyDownUp('esc');
    keyDownUp('arrow_down');
    expect(selections[3]).toEqual(['outer', 3]);

    expect(selections.length).toBe(4);
  });

  describe("strict mode", function () {
    it("should open editor and select cell (0, 0) in inner HOT", function () {
      var hot = handsontable({
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            },
            strict: true
          }
        ]
      });
      selectCell(2, 0);

      keyDownUp('enter');

      var ht = Handsontable.editors.getEditor('handsontable', hot);
      var innerHot = ht.htEditor;

      expect(innerHot.getSelected()).toEqual([0, 0, 0, 0]);
    });

    it("should hide textarea", function () {
      var hot = handsontable({
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            },
            strict: true
          }
        ]
      });
      selectCell(2, 0);

      keyDownUp('enter');

      expect(hot.getActiveEditor().TEXTAREA.style.visibility).toEqual('hidden');

    });
  });

  describe("non strict mode", function () {

    it("should open editor and DO NOT select any cell in inner HOT", function () {
      var hot = handsontable({
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

      var ht = Handsontable.editors.getEditor('handsontable', hot);
      var innerHot = ht.htEditor;

      expect(innerHot.getSelected()).toBeUndefined();
    });

    it("should show textarea", function () {
      var hot = handsontable({
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
      expect(hot.getActiveEditor().TEXTAREA.style.visibility).toEqual('visible');

    });

  });






});
