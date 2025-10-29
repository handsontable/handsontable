describe('EmptyDataState - message option', () => {
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

  it('should show default message when no custom message is provided', async() => {
    handsontable({
      data: [],
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement()).toBeDefined();
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('No data available');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('There’s nothing to display yet.');
  });

  it('should show default message with reset filters action when data is filtered', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
      filters: true,
    });

    const filtersPlugin = getPlugin('filters');
    const emptyDataStatePlugin = getPlugin('emptyDataState');

    // Apply filter that hides all data
    filtersPlugin.addCondition(0, 'eq', ['nonexistent']);
    filtersPlugin.filter();

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('No results found');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('It looks like your current filters are hiding all results.');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__buttons')).toBeDefined();
    expect(getEmptyDataStateContainerElement().querySelector('.ht-button--secondary').textContent)
      .toBe('Reset filters');
  });

  it('should show custom string message', async() => {
    handsontable({
      data: [],
      emptyDataState: {
        message: 'Custom empty state message',
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('Custom empty state message');
  });

  it('should show custom object message with title and description', async() => {
    handsontable({
      data: [],
      emptyDataState: {
        message: {
          title: 'Custom Title',
          description: 'Custom description text',
        },
      },
      filters: true,
    });

    const filtersPlugin = getPlugin('filters');
    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('Custom Title');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('Custom description text');

    // Add data back and test filtered state
    await updateSettings({
      data: createSpreadsheetData(5, 5),
    });

    // Apply filter that hides all data
    filtersPlugin.addCondition(0, 'eq', ['nonexistent']);
    filtersPlugin.filter();

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('Custom Title');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('Custom description text');
  });

  it('should show custom object message with buttons', async() => {
    const callbackSpy = jasmine.createSpy('callback');

    handsontable({
      data: [],
      emptyDataState: {
        message: {
          title: 'No Data',
          description: 'Please add some data',
          buttons: [{
            text: 'Add Data',
            type: 'primary',
            callback: callbackSpy,
          }],
        },
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('No Data');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('Please add some data');

    const actionButton = getEmptyDataStateContainerElement().querySelector('.ht-button--primary');

    expect(actionButton).toBeDefined();
    expect(actionButton.textContent).toBe('Add Data');
    expect(actionButton).toHaveClass('ht-button', 'ht-button--primary');

    await simulateClick(actionButton);

    expect(callbackSpy).toHaveBeenCalledWith(jasmine.any(Event));
  });

  it('should show custom object message with multiple buttons', async() => {
    const primaryCallback = jasmine.createSpy('primaryCallback');
    const secondaryCallback = jasmine.createSpy('secondaryCallback');

    handsontable({
      data: [],
      emptyDataState: {
        message: {
          title: 'No Data',
          description: 'Choose an action',
          buttons: [
            {
              text: 'Primary Action',
              type: 'primary',
              callback: primaryCallback,
            },
            {
              text: 'Secondary Action',
              type: 'secondary',
              callback: secondaryCallback,
            },
          ],
        },
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    const actionButtons = getEmptyDataStateContainerElement().querySelectorAll('.ht-button');

    expect(actionButtons.length).toBe(2);

    expect(actionButtons[0].textContent).toBe('Primary Action');
    expect(actionButtons[0]).toHaveClass('ht-button', 'ht-button--primary');

    expect(actionButtons[1].textContent).toBe('Secondary Action');
    expect(actionButtons[1]).toHaveClass('ht-button', 'ht-button--secondary');

    // Test button callbacks
    await simulateClick(actionButtons[0]);
    expect(primaryCallback).toHaveBeenCalled();

    await simulateClick(actionButtons[1]);
    expect(secondaryCallback).toHaveBeenCalled();
  });

  it('should show custom function message based on source', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: {
        message: (source) => {
          switch (source) {
            case 'filters':
              return {
                title: 'No filtered data',
                description: 'All data is hidden by filters',
                buttons: [{
                  text: 'Clear Filters',
                  type: 'secondary',
                  callback: () => {},
                }],
              };
            default:
              return {
                title: 'No data available',
                description: 'The table is empty',
              };
          }
        },
      },
      filters: true,
    });

    const filtersPlugin = getPlugin('filters');
    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    await updateSettings({
      data: [],
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('No data available');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('The table is empty');

    // Add data back and test filtered state
    await updateSettings({
      data: createSpreadsheetData(5, 5),
    });

    // Apply filter that hides all data
    filtersPlugin.addCondition(0, 'eq', ['nonexistent']);
    filtersPlugin.filter();

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('No filtered data');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('All data is hidden by filters');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-button--secondary').textContent)
      .toBe('Clear Filters');
  });

  it('should handle function message that returns string', async() => {
    handsontable({
      data: [],
      emptyDataState: {
        message: (source) => {
          return source === 'filters' ? 'No filtered results' : 'No data available';
        },
      },
      filters: true,
    });

    const filtersPlugin = getPlugin('filters');
    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('No data available');

    // Add data back and test filtered state
    await updateSettings({
      data: createSpreadsheetData(5, 5),
    });

    // Apply filter that hides all data
    filtersPlugin.addCondition(0, 'eq', ['nonexistent']);
    filtersPlugin.filter();

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('No filtered results');
  });

  it('should handle function message that returns undefined', async() => {
    handsontable({
      data: [],
      emptyDataState: {
        message: () => undefined,
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    // Should fall back to default message
    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('No data available');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('There’s nothing to display yet.');
  });

  it('should handle partial object message (only title)', async() => {
    handsontable({
      data: [],
      emptyDataState: {
        message: {
          title: 'Only Title',
        },
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('Only Title');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description')).toBe(null);
  });

  it('should handle partial object message (only description)', async() => {
    handsontable({
      data: [],
      emptyDataState: {
        message: {
          description: 'Only Description',
        },
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title')).toBe(null);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('Only Description');
  });

  it('should handle partial object message (only buttons)', async() => {
    const callbackSpy = jasmine.createSpy('callback');

    handsontable({
      data: [],
      emptyDataState: {
        message: {
          buttons: [{
            text: 'Custom Action',
            type: 'primary',
            callback: callbackSpy,
          }],
        },
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title')).toBe(null);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description')).toBe(null);

    const actionButton = getEmptyDataStateContainerElement().querySelector('.ht-button--primary');

    expect(actionButton).toBeDefined();
    expect(actionButton.textContent).toBe('Custom Action');
    expect(actionButton).toHaveClass('ht-button', 'ht-button--primary');

    await simulateClick(actionButton);
    expect(callbackSpy).toHaveBeenCalled();
  });

  it('should handle empty buttons array', async() => {
    handsontable({
      data: [],
      emptyDataState: {
        message: {
          title: 'No Buttons',
          description: 'No action buttons',
          buttons: [],
        },
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('No Buttons');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('No action buttons');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__buttons').innerHTML).toBe('');
  });

  it('should handle message with special characters', async() => {
    handsontable({
      data: [],
      emptyDataState: {
        message: {
          title: 'Title with <strong>HTML</strong> & special chars: &lt;&gt;&amp;',
          description: 'Description with "quotes" and \'apostrophes\'',
        },
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('Title with HTML & special chars: <>&');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('Description with "quotes" and \'apostrophes\'');
  });

  it('should handle very long message content', async() => {
    const longTitle = 'A'.repeat(1000);
    const longDescription = 'B'.repeat(2000);

    handsontable({
      data: [],
      emptyDataState: {
        message: {
          title: longTitle,
          description: longDescription,
        },
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe(longTitle);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe(longDescription);
  });

  it('should update message when plugin is updated', async() => {
    handsontable({
      data: [],
      emptyDataState: {
        message: 'Initial message',
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('Initial message');

    // Update the plugin with new message
    await updateSettings({
      emptyDataState: {
        message: {
          title: 'Updated Title',
          description: 'Updated description',
        },
      },
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__title').textContent)
      .toBe('Updated Title');
    expect(getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__description').textContent)
      .toBe('Updated description');
  });
});
