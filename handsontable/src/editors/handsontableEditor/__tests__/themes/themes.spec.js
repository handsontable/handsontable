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
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a config option)', async() => {
    simulateModernThemeStylesheet(spec().$container);
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
      themeName: 'ht-theme-sth',
    });

    selectCell(0, 0);
    keyDown('enter');

    await sleep(50);

    expect($(getActiveEditor().htEditor.rootElement).hasClass('ht-theme-sth')).toBe(true);
    expect(getActiveEditor().htEditor.getCurrentThemeName()).toBe('ht-theme-sth');
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', async() => {
    simulateModernThemeStylesheet(spec().$container);
    spec().$container.addClass('ht-theme-sth-else');
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
    }, true);

    selectCell(0, 0);
    keyDown('enter');

    await sleep(50);

    expect($(getActiveEditor().htEditor.rootElement).hasClass('ht-theme-sth-else')).toBe(true);
    expect(getActiveEditor().htEditor.getCurrentThemeName()).toBe('ht-theme-sth-else');
  });

  it('should not throw an exception after changing a theme for non-fully-initialized editor (#dev-2157)', () => {
    simulateModernThemeStylesheet(spec().$container);
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
