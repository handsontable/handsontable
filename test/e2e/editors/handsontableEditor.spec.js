describe('HandsontableEditor', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function getManufacturerData() {
    return [
      { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
      { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
      { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
      { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
      { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
      { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' }
    ];
  }

  it('should create an editor that is a Handsontable instance', () => {
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
    expect(spec().$container.find('.handsontableEditor:visible').length).toEqual(1);
  });

  it('should create an editor directly below the textarea element', () => {
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
    expect(spec().$container.find('.handsontableEditor')[0].offsetTop).toEqual(spec().$container.find('.handsontableInput')[0].offsetHeight);
  });

  it('should prepare the editor only once per instance', () => {
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

    selectCell(0, 0);

    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    expect(spec().$container.find('.handsontableEditor').length).toEqual(1);
  });

  it('should reuse the container and display them after select the same or different cell', () => {
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

    selectCell(0, 0);
    keyDownUp('enter');

    let container = spec().$container.find('.handsontableEditor')[0];

    expect(container.clientHeight).toBeGreaterThan(2);

    selectCell(0, 0);
    keyDownUp('enter');

    container = spec().$container.find('.handsontableEditor')[0];

    expect(container.clientHeight).toBeGreaterThan(2);

    selectCell(1, 0);
    keyDownUp('enter');

    container = spec().$container.find('.handsontableEditor')[0];

    expect(container.clientHeight).toBeGreaterThan(2);

    selectCell(1, 0);
    keyDownUp('enter');

    container = spec().$container.find('.handsontableEditor')[0];

    expect(container.clientHeight).toBeGreaterThan(2);
  });

  it('should destroy the editor when Esc is pressed', () => {
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
    expect(spec().$container.find('.handsontableEditor:visible').length).toEqual(0);
  });

  // see https://github.com/handsontable/handsontable/issues/3380
  it('should not throw error while selecting the next cell by hitting enter key', () => {
    const spy = jasmine.createSpyObj('error', ['test']);
    const prevError = window.onerror;

    window.onerror = function() {
      spy.test();
    };
    handsontable({
      columns: [{
        type: 'handsontable',
        handsontable: {
          data: [['Marque'], ['Country'], ['Parent company']]
        }
      }]
    });

    selectCell(0, 0);
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');

    expect(spy.test.calls.count()).toBe(0);

    window.onerror = prevError;
  });

  it('Enter pressed in nested HT should set the value and hide the editor', () => {
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
    expect(spec().$container.find('.handsontableEditor:visible').length).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual('BMW');
  });

  it('should keep focus on textarea after arrow is pressed', () => {
    const hot = handsontable({
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

  it('should focus the TD after HT editor is prepared and destroyed', () => {
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

    expect(getSelected()).toEqual([[4, 0, 4, 0]]);
  });

  it('should focus the TD after HT editor is prepared, finished (by keyboard) and destroyed', () => {
    const selections = [];

    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData(),
            afterSelection(row) {
              selections.push(['inner', row]);
            }
          }
        }
      ],
      afterSelection(row) {
        selections.push(['outer', row]);
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

  describe('strict mode', () => {
    it('should open editor and select cell (0, 0) in inner HOT', () => {
      const hot = handsontable({
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

      const ht = hot.getActiveEditor();
      const innerHot = ht.htEditor;

      expect(innerHot.getSelected()).toEqual([[0, 0, 0, 0]]);
    });
  });

  describe('non strict mode', () => {

    it('should open editor and DO NOT select any cell in inner HOT', () => {
      const hot = handsontable({
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

      const ht = hot.getActiveEditor();
      const innerHot = ht.htEditor;

      expect(innerHot.getSelected()).toBeUndefined();
    });

    it('should show textarea', () => {
      const hot = handsontable({
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

      expect(hot.getActiveEditor().TEXTAREA.parentElement.style.zIndex).toEqual('');
      expect(hot.getActiveEditor().TEXTAREA.style.visibility).toEqual('');
    });
  });

  describe('IME support', () => {
    it('should focus editable element after selecting the cell', async() => {
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
      selectCell(0, 0, 0, 0, true, false);

      await sleep(10);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
