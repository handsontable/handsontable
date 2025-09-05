describe('Test deprecatedWarn in core.js classic theme', () => {
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

  it('should warn user by log at console when classic theme is enabled', async() => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    if (spec().loadedTheme === 'classic') {
      // eslint-disable-next-line max-len
      expect(warnSpy).toHaveBeenCalledWith('Deprecated: Handsontable classic theme is a legacy theme and will be removed in version 17.0. Please update your theme settings to ensure compatibility with future versions.');
    } else {
      expect(warnSpy).not.toHaveBeenCalled();
    }
  });

  it('should not warn user by log at console when classic theme is enabled and not root instance', async() => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      type: 'dropdown',
      source: ['Misubishi', 'Chevrolet', 'Lamborgini'],
    });

    await selectCell(0, 0);

    await keyDownUp('enter');

    if (spec().loadedTheme === 'classic') {
      expect(warnSpy).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line max-len
      expect(warnSpy).toHaveBeenCalledWith('Deprecated: Handsontable classic theme is a legacy theme and will be removed in version 17.0. Please update your theme settings to ensure compatibility with future versions.');
    } else {
      expect(warnSpy).not.toHaveBeenCalled();
    }
  });

  it('should call warn only once by log at console when classic (legacy) theme is enabled and updateSettings is called', async() => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await updateSettings({
      data: createSpreadsheetData(2, 2),
    });
    
    await updateSettings({
      data: createSpreadsheetData(3, 3),
    });

    if (spec().loadedTheme === 'classic') {
      expect(warnSpy).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line max-len
      expect(warnSpy).toHaveBeenCalledWith('Deprecated: Handsontable classic theme is a legacy theme and will be removed in version 17.0. Please update your theme settings to ensure compatibility with future versions.');
    } else {
      expect(warnSpy).not.toHaveBeenCalled();
    }
  });

  it('should recall warn by log at console when classic (legacy) theme is enabled via updateSettings', async() => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await updateSettings({
      themeName: 'ht-theme-test',
    });

    await updateSettings({
      themeName: undefined,
    });

    if (spec().loadedTheme === 'classic') {
      expect(warnSpy).toHaveBeenCalledTimes(3);
      // eslint-disable-next-line max-len
      expect(warnSpy).toHaveBeenCalledWith('Deprecated: Handsontable classic theme is a legacy theme and will be removed in version 17.0. Please update your theme settings to ensure compatibility with future versions.');
    } else {
      expect(warnSpy).toHaveBeenCalledTimes(2);

      // eslint-disable-next-line max-len
      expect(warnSpy).toHaveBeenCalledWith('Deprecated: Handsontable classic theme is a legacy theme and will be removed in version 17.0. Please update your theme settings to ensure compatibility with future versions.');
    }
  });
});
