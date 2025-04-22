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

  it('should assign the `role=menu` attribute to the root element of the context menu', async() => {
    handsontable({
      contextMenu: true
    });

    contextMenu();

    await sleep(50);

    expect(getPlugin('contextMenu').menu.container.getAttribute('role')).toEqual('menu');
  });

  it('should assign the `role=menuitem` attribute to all the options of the context menu except of the `Read only` option', () => {
    handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = getPlugin('contextMenu').menu;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'role',
      'menuitem'
    ).length).toEqual(cMenu.hotMenu.countRows() - 1);
  });

  it('should assign the `role=menuitem` attribute to all the options of the Alignment submenu', async() => {
    handsontable({
      contextMenu: ['alignment']
    });

    openContextSubmenuOption('Alignment');

    await sleep(300);

    const cMenu = getPlugin('contextMenu').menu.hotSubMenus.alignment;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'role',
      'menuitem'
    ).length).toBe(8);
  });

  it('should assign the `role=menucheckboxitem` to the `Read only` option of the context menu', () => {
    handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = getPlugin('contextMenu').menu;

    const menuItemCheckboxes = filterElementsByAttribute(
      cMenu.container,
      'td',
      'role',
      'menuitemcheckbox'
    );

    expect(menuItemCheckboxes.length).toEqual(1);
    expect(menuItemCheckboxes[0].ariaLabel).toBe('Read only');
  });

  it('selected and deselected `menuitemcheckboxes` change aria-label and aria-checked values accordingly', async() => {
    handsontable({
      contextMenu: true
    });

    contextMenu();
    selectContextMenuOption('Read only');
    await sleep(50);
    contextMenu();

    {
      const readOnlyElement = $(getPlugin('contextMenu').menu.container).find('td:contains(Read only)');

      expect(readOnlyElement.attr('aria-checked')).toEqual('true');
      expect(readOnlyElement.attr('aria-label')).toEqual('Read only');
    }

    contextMenu();
    selectContextMenuOption('Read only');
    await sleep(50);
    contextMenu();

    {
      const readOnlyElement = $(getPlugin('contextMenu').menu.container).find('td:contains(Read only)');

      expect(readOnlyElement.attr('aria-checked')).toEqual('false');
      expect(readOnlyElement.attr('aria-label')).toEqual('Read only');
    }
  });

  it('should assign the `aria-label` attribute to all the options of the context menu', async() => {
    handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = getPlugin('contextMenu').menu;

    await sleep(300);

    const ariaLabelledCells = [...cMenu.container.querySelectorAll('td')]
      .filter(el => el.ariaLabel !== undefined);

    expect(ariaLabelledCells.length).toBe(cMenu.hotMenu.countRows());

    expect(cMenu.hotMenu.getCell(0, 0).getAttribute('aria-label')).toBe('Insert row above');
  });

  it('should assign the `tabindex` attribute to all the options of the context menu', () => {
    handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = getPlugin('contextMenu').menu;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'tabindex',
      '-1',
    ).length).toBe(10);
  });

  it('should assign the `aria-disabled` attribute to all the disabled options of the context menu', () => {
    handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = getPlugin('contextMenu').menu;

    // Undo and Redo options
    expect(cMenu.hotMenu.getCell(9, 0).getAttribute('aria-disabled')).toEqual('true');
    expect(cMenu.hotMenu.getCell(10, 0).getAttribute('aria-disabled')).toEqual('true');
  });

  it('should assign the `aria-expanded` attribute to all the expandable options of the context menu and set it to' +
    ' either `true` of `false`, depending on their state (via mouse movement)', async() => {
    handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = getPlugin('contextMenu').menu;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'aria-expanded',
      'false'
    ).length).toEqual(1);

    const $expandableItem = $(cMenu.hotMenu.getCell(14, 0));
    const $unExpandableItem = $(cMenu.hotMenu.getCell(16, 0));

    expect($expandableItem.get(0).getAttribute('aria-expanded')).toEqual('false');

    $expandableItem.simulate('mouseover');

    await sleep(300);

    expect($expandableItem.get(0).getAttribute('aria-expanded')).toEqual('true');

    $unExpandableItem.simulate('mouseover');

    await sleep(50);

    expect($expandableItem.get(0).getAttribute('aria-expanded')).toEqual('false');
  });

  it('should assign the `aria-expanded` attribute to all the expandable options of the context menu and set it to' +
    ' either `true` of `false`, depending on their state (via keyboard navigation)', async() => {
    handsontable({
      contextMenu: ['remove_row', 'alignment']
    });

    contextMenu();

    const cMenu = getPlugin('contextMenu').menu;

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
