describe('keyboard navigation', () => {
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

  it('should allow navigating around the handsontable editor after opening it, without closing it', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ],
    });

    selectCell(0, 0);

    keyDownUp('enter');

    await sleep(15);

    keyDownUp('arrowdown');

    expect(getActiveEditor().htEditor.getSelectedLast()).toEqual([0, 0, 0, 0]);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('arrowdown');

    expect(getActiveEditor().htEditor.getSelectedLast()).toEqual([1, 0, 1, 0]);
    expect(getActiveEditor().isOpened()).toBe(true);
  });

  it('should allow committing the value using the ENTER key after choosing it with the arrow keys', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ],
    });

    selectCell(0, 0);

    keyDownUp('enter');

    await sleep(15);

    keyDownUp('arrowdown');

    expect(getActiveEditor().htEditor.getSelectedLast()).toEqual([0, 0, 0, 0]);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    await sleep(15);

    expect(getActiveEditor().isOpened()).toBe(false);

    expect(getDataAtCell(0, 0)).toEqual('BMW');
  });

  it('should allow cancel the editing, keeping the previous value in the cell using the ESCPAE key after' +
    ' choosing a value it with the arrow keys', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ],
    });

    selectCell(0, 0);

    keyDownUp('enter');

    await sleep(15);

    keyDownUp('arrowdown');

    expect(getActiveEditor().htEditor.getSelectedLast()).toEqual([0, 0, 0, 0]);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('escape');

    await sleep(15);

    expect(getActiveEditor().isOpened()).toBe(false);

    expect(getDataAtCell(0, 0)).toEqual(null);
  });
});
