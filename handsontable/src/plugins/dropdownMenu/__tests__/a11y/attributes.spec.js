describe('a11y DOM attributes (ARIA tags)', () => {
  const id = 'testContainer';

  const filterElementsByAttribute = (rootElement, elementSelector, attributeName, attributeValue, negation = false) => {
    const valFn = (typeof attributeValue === 'function' ? attributeValue : null);

    return [...rootElement.querySelectorAll(elementSelector || '*')].filter((el) => {
      attributeValue = (valFn ? valFn(el) : attributeValue);

      return [...el.getAttributeNames()].filter(
        (attr) => {
          return negation ?
            (attr !== attributeName || el.getAttribute(attr) !== attributeValue) :
            (attr === attributeName && el.getAttribute(attr) === attributeValue);
        }
      ).length > 0;
    });
  };

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should assign the `role=menu` attribute to the root element of the dropdown menu', async() => {
    const hot = handsontable({
      dropdownMenu: true,
      colHeaders: true,
    });

    dropdownMenu(0);

    await sleep(50);

    expect(hot.getPlugin('dropdownMenu').menu.container.getAttribute('role')).toEqual('menu');
  });

  it('should assign the `role=menuitem` attribute to all the options of the dropdown menu', () => {
    const hot = handsontable({
      dropdownMenu: true,
      colHeaders: true,
    });

    dropdownMenu(0);

    const cMenu = hot.getPlugin('dropdownMenu').menu;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'role',
      'menuitem'
    ).length).toEqual(cMenu.hotMenu.countRows() - 1);

    expect(cMenu.hotMenu.getCell(0, 0).getAttribute('role')).toEqual('menuitem');
  });

  it('should assign the `role=menuitemcheckbox` attribute to the `Read only` item', () => {
    const hot = handsontable({
      dropdownMenu: true,
      colHeaders: true,
    });

    dropdownMenu(0);

    const cMenu = hot.getPlugin('dropdownMenu').menu;

    const menuItemCheckboxes = filterElementsByAttribute(
      cMenu.container,
      'td',
      'role',
      'menuitemcheckbox'
    );

    expect(menuItemCheckboxes.length).toEqual(1);
    expect(menuItemCheckboxes[0].ariaLabel).toBe('Read only');
  });

  it('should assign the `aria-label` attribute to all the options of the dropdown menu', () => {
    handsontable({
      dropdownMenu: true,
      colHeaders: true,
    });

    dropdownMenu(0);

    const cMenu = getPlugin('dropdownMenu').menu;

    const ariaLabelledCells = [...cMenu.container.querySelectorAll('td')]
      .filter(el => el.ariaLabel !== undefined);

    expect(ariaLabelledCells.length).toBe(cMenu.hotMenu.countRows());

    expect(cMenu.hotMenu.getCell(0, 0).getAttribute('aria-label')).toBe('Insert column left');
  });

  it('should assign the `tabindex` attribute to all the options of the dropdown menu', () => {
    handsontable({
      dropdownMenu: true,
      colHeaders: true,
    });

    dropdownMenu(0);

    const cMenu = getPlugin('dropdownMenu').menu;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'tabindex',
      '-1',
    ).length).toBe(6);
  });

  it('should assign the `aria-disabled` attribute to all the disabled options of the dropdown menu', () => {
    const hot = handsontable({
      data: [{ a: 1 }],
      dropdownMenu: true,
      colHeaders: true,
    });

    dropdownMenu(0);

    const cMenu = hot.getPlugin('dropdownMenu').menu;

    // Undo and Redo options
    expect(cMenu.hotMenu.getCell(0, 0).getAttribute('aria-disabled')).toEqual('true');
    expect(cMenu.hotMenu.getCell(1, 0).getAttribute('aria-disabled')).toEqual('true');
  });

  it('should assign the `aria-expanded` attribute to all the expandable options of the dropdown menu and set it to' +
    ' either `true` of `false`, depending on their state (via mouse movement)', async() => {
    const hot = handsontable({
      dropdownMenu: true,
      colHeaders: true,
    });

    dropdownMenu(0);

    const cMenu = hot.getPlugin('dropdownMenu').menu;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'aria-expanded',
      'false'
    ).length).toEqual(1);

    const $expandableItem = $(cMenu.hotMenu.getCell(9, 0));
    const $unExpandableItem = $(cMenu.hotMenu.getCell(7, 0));

    expect($expandableItem.get(0).getAttribute('aria-expanded')).toEqual('false');

    $expandableItem.simulate('mouseover');

    await sleep(300);

    expect($expandableItem.get(0).getAttribute('aria-expanded')).toEqual('true');

    $unExpandableItem.simulate('mouseover');

    await sleep(50);

    expect($expandableItem.get(0).getAttribute('aria-expanded')).toEqual('false');
  });

  it('should assign the `aria-expanded` attribute to all the expandable options of the dropdown menu and set it to' +
    ' either `true` of `false`, depending on their state (via keyboard navigation)', async() => {
    handsontable({
      colHeaders: true,
      dropdownMenu: ['remove_col', 'alignment']
    });

    dropdownMenu();

    const cMenu = getPlugin('dropdownMenu').menu;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'aria-expanded',
      'false'
    ).length).toBe(1);

    const $unExpandableItem = $(cMenu.hotMenu.getCell(0, 0));
    const $expandableItem = $(cMenu.hotMenu.getCell(1, 0));

    keyDownUp('arrowdown');
    keyDownUp('arrowright');

    expect($unExpandableItem.get(0).hasAttribute('aria-expanded')).toBe(false);

    keyDownUp('arrowdown');

    expect($expandableItem.get(0).getAttribute('aria-expanded')).toBe('false');

    keyDownUp('arrowright');

    expect($expandableItem.get(0).getAttribute('aria-expanded')).toBe('true');

    keyDownUp('arrowleft');

    expect($expandableItem.get(0).getAttribute('aria-expanded')).toBe('false');
  });
});
