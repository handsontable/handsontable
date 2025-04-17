describe('Handsontable editor theme handling', () => {
  const id = 'testContainer';

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

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
    }
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a config option)', async() => {
    const hot = handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ],
      themeName: 'ht-theme-sth',
    });

    selectCell(0, 0);
    keyDown('enter');

    await sleep(50);

    expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(true);
    expect(getActiveEditor().htEditor.getCurrentThemeName()).toBe('ht-theme-sth');
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', async() => {
    spec().$container.addClass('ht-theme-sth-else');

    const hot = handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ],
    }, true);

    selectCell(0, 0);
    keyDown('enter');

    await sleep(50);

    expect($(hot.rootWrapperElement).hasClass('ht-theme-sth-else')).toBe(true);
    expect(getActiveEditor().htEditor.getCurrentThemeName()).toBe('ht-theme-sth-else');
  });

  it('should not throw an exception after changing a theme for non-fully-initialized editor (#dev-2157)', () => {

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

    expect(() => {
      updateSettings({ themeName: 'ht-theme-sth-else' });
    }).not.toThrow();
  });
});
