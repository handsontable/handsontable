describe('Layout slots', () => {
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

  it('renders the ht-before-grid slot as the first wrapper child', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const children = Array.from(hot.rootWrapperElement.children).map(c => c.className);

    expect(hot.rootBeforeGridElement).toBeTruthy();
    expect(hot.rootBeforeGridElement.classList.contains('ht-before-grid')).toBe(true);
    expect(children[0]).toContain('ht-before-grid');
  });

  it('places ht-overlays as the last wrapper child', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const children = Array.from(hot.rootWrapperElement.children).map(c => c.className);

    expect(children.at(-1)).toContain('ht-overlays');
  });

  it('orders the wrapper slots before-grid, grid, after-grid, overlays', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const classes = Array.from(hot.rootWrapperElement.children)
      .map(c => c.className.split(' ').find(n => n.startsWith('ht-')));

    expect(classes).toEqual(['ht-before-grid', 'ht-grid', 'ht-after-grid', 'ht-overlays']);
  });

  const slotItemIds = slot => Array.from(slot.getElement().children).map(c => c.dataset.id);

  it('adds the ht-slot-element class to each edge-slot element', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };
    const a = make('a');
    const b = make('b');

    hot.getLayoutManager().getSlot('beforeGrid').add('a', a);
    hot.getLayoutManager().getSlot('afterGrid').add('b', b);

    expect(a.classList.contains('ht-slot-element')).toBe(true);
    expect(b.classList.contains('ht-slot-element')).toBe(true);
    // The elements are direct children of the slot - they are not wrapped.
    expect(a.parentNode).toBe(hot.rootBeforeGridElement);
    expect(b.parentNode).toBe(hot.rootAfterGridElement);
  });

  it('does not add the ht-slot-element class to overlays-slot elements', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const el = document.createElement('div');

    hot.getLayoutManager().getSlot('overlays').add('custom', el, 100);

    expect(el.parentNode).toBe(hot.rootOverlaysElement);
    expect(el.classList.contains('ht-slot-element')).toBe(false);
  });

  it('exposes getLayoutManager with the three orderable slots', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const manager = hot.getLayoutManager();

    expect(manager.getSlot('beforeGrid').getElement()).toBe(hot.rootBeforeGridElement);
    expect(manager.getSlot('afterGrid').getElement()).toBe(hot.rootAfterGridElement);
    expect(manager.getSlot('overlays').getElement()).toBe(hot.rootOverlaysElement);
  });

  it('adds and orders custom elements within a slot by weight', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const slot = hot.getLayoutManager().getSlot('beforeGrid');
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };

    slot.add('second', make('second'), 200);
    slot.add('first', make('first'), 100);

    expect(slotItemIds(slot)).toEqual(['first', 'second']);
  });

  it('orders slot elements according to the layout setting', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      layout: { beforeGrid: ['b', 'a'] },
    });
    const slot = hot.getLayoutManager().getSlot('beforeGrid');
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };

    slot.add('a', make('a'), 100);
    slot.add('b', make('b'), 200);

    expect(slotItemIds(slot)).toEqual(['b', 'a']);
  });

  it('re-applies order when the layout setting changes via updateSettings', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const slot = hot.getLayoutManager().getSlot('afterGrid');
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };

    slot.add('a', make('a'), 100);
    slot.add('b', make('b'), 200);

    await updateSettings({ layout: { afterGrid: ['b', 'a'] } });

    expect(slotItemIds(slot)).toEqual(['b', 'a']);
  });

  it('keeps ht-before-grid the same width as ht-after-grid', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      width: 300,
      height: 200,
    });

    hot.getLayoutManager().getSlot('beforeGrid')
      .add('probe', document.createElement('div'), 100);

    hot.refreshDimensions();

    await sleep(50);

    expect(hot.rootBeforeGridElement.style.width).toBe(hot.rootAfterGridElement.style.width);
    expect(hot.rootBeforeGridElement.style.width).not.toBe('');
  });

  it('registers the license notification under the afterGrid slot when present', async() => {
    // Pass `true` so the test helper does not inject the default evaluation license key,
    // which leaves the key missing and renders the license notification.
    const hot = handsontable({ data: createSpreadsheetData(3, 3) }, true);

    expect(hot.getLayoutManager().getSlot('afterGrid').has('licenseNotification')).toBe(true);
    expect(hot.rootAfterGridElement.querySelector('.hot-display-license-info')).toBeTruthy();
  });

  it('orders pagination and license per the layout setting', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      pagination: true,
      layout: { afterGrid: ['licenseNotification', 'pagination'] },
    }, true);

    const keys = Array.from(hot.getLayoutManager().getSlot('afterGrid').getElement().children).map((c) => {
      if (c.classList.contains('hot-display-license-info')) {
        return 'licenseNotification';
      }

      if (c.classList.contains('ht-pagination')) {
        return 'pagination';
      }

      return c.className;
    });

    expect(keys).toEqual(['licenseNotification', 'pagination']);
  });

  it('removes pagination from the slot when the plugin is disabled', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      pagination: true,
    });

    expect(hot.getLayoutManager().getSlot('afterGrid').has('pagination')).toBe(true);

    await updateSettings({ pagination: false });

    expect(hot.getLayoutManager().getSlot('afterGrid').has('pagination')).toBe(false);
  });

  it('registers the dialog under the overlays slot', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      dialog: true,
    });

    expect(hot.getLayoutManager().getSlot('overlays').has('dialog')).toBe(true);

    await updateSettings({ dialog: false });

    expect(hot.getLayoutManager().getSlot('overlays').has('dialog')).toBe(false);
  });

  it('does not throw when destroying with layout-registered plugins', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      pagination: true,
      dialog: true,
    });

    expect(() => hot.destroy()).not.toThrow();
  });

  it('keeps tab order before-grid -> grid -> after-grid', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const beforeBtn = document.createElement('button');
    const afterBtn = document.createElement('button');

    beforeBtn.id = 'beforeBtn';
    afterBtn.id = 'afterBtn';

    hot.getLayoutManager().getSlot('beforeGrid').add('b', beforeBtn, 100);
    hot.getLayoutManager().getSlot('afterGrid').add('a', afterBtn, 100);

    const inDocOrder = Array.from(hot.rootWrapperElement.querySelectorAll('#beforeBtn, #afterBtn'))
      .map(el => el.id);

    expect(inDocOrder).toEqual(['beforeBtn', 'afterBtn']);
  });

  it('orders overlays-slot elements according to the layout setting', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      layout: { overlays: ['b', 'a'] },
    });
    const slot = hot.getLayoutManager().getSlot('overlays');
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };

    slot.add('a', make('a'), 100);
    slot.add('b', make('b'), 200);

    expect(slotItemIds(slot)).toEqual(['b', 'a']);
  });

  it('removes the top border of the first after-grid item', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };

    hot.getLayoutManager().getSlot('afterGrid').add('first', make('first'), 100);
    hot.getLayoutManager().getSlot('afterGrid').add('second', make('second'), 200);

    hot.render();

    await waitForNextAnimationFrames(2);

    const [first, second] = Array.from(hot.rootAfterGridElement.children);

    // The first after-grid item never draws a top border; non-first items are not targeted by the rule.
    expect(getComputedStyle(first).borderTopWidth).toBe('0px');
    expect(first.matches('.ht-after-grid > .ht-slot-element:first-child')).toBe(true);
    expect(second.matches('.ht-after-grid > .ht-slot-element:first-child')).toBe(false);
  });

  it('throws when getLayoutManager is called on a non-root instance', async() => {
    handsontable({
      contextMenu: true,
    });

    await contextMenu();

    const hotMenu = getPlugin('contextMenu').menu.hotMenu;

    expect(() => hotMenu.getLayoutManager())
      .toThrowError('The LayoutManager is only available for the main Handsontable instance.');
  });
});
