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
    const hot = handsontable({
      contextMenu: true
    });

    contextMenu();

    await sleep(50);

    expect(hot.getPlugin('contextMenu').menu.container.getAttribute('role')).toEqual('menu');
  });

  it('should assign the `role=menuitem` attribute to all the options of the context menu', () => {
    const hot = handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = hot.getPlugin('contextMenu').menu;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'role',
      'menuitem'
    ).length).toEqual(cMenu.hotMenu.countRows());

    expect(cMenu.hotMenu.getCell(0, 0).getAttribute('role')).toEqual('menuitem');
  });

  it('should assign the `aria-label` attribute to all the options of the context menu', () => {
    const hot = handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = hot.getPlugin('contextMenu').menu;

    expect(filterElementsByAttribute(
      cMenu.container,
      'td',
      'aria-label',
      el => (el.innerText === '' ? '---------' : el.innerText)
    ).length).toEqual(cMenu.hotMenu.countRows());
  });

  it('should assign the `aria-disabled` attribute to all the disabled options of the context menu', () => {
    const hot = handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = hot.getPlugin('contextMenu').menu;

    // Undo and Redo options
    expect(cMenu.hotMenu.getCell(9, 0).getAttribute('aria-disabled')).toEqual('true');
    expect(cMenu.hotMenu.getCell(10, 0).getAttribute('aria-disabled')).toEqual('true');
  });

  it('should assign the `aria-expanded` attribute to all the expandable options of the context menu and set it to' +
    ' either `true` of `false`, depending on their state', async() => {
    const hot = handsontable({
      contextMenu: true
    });

    contextMenu();

    const cMenu = hot.getPlugin('contextMenu').menu;

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
});
