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

  it('renders the ht-slot-top slot as the first wrapper child', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const children = Array.from(hot.rootWrapperElement.children).map(c => c.className);

    expect(hot.rootSlotTopElement).toBeTruthy();
    expect(hot.rootSlotTopElement.classList.contains('ht-slot-top')).toBe(true);
    expect(children[0]).toContain('ht-slot-top');
  });

  it('places ht-overlay as the last wrapper child', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const children = Array.from(hot.rootWrapperElement.children).map(c => c.className);

    expect(children.at(-1)).toContain('ht-overlay');
  });

  it('orders the wrapper slots top, grid, bottom, overlays', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const classes = Array.from(hot.rootWrapperElement.children)
      .map(c => c.className.split(' ').find(n => n.startsWith('ht-')));

    expect(classes).toEqual(['ht-slot-top', 'ht-grid', 'ht-slot-bottom', 'ht-overlay']);
  });

  const slotItemIds = slot => Array.from(slot.getElement().children).map(c => c.dataset.id);

  it('adds the ht-slot-element class to each slot element', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };
    const a = make('a');
    const b = make('b');

    hot.getLayoutManager().getSlot('top').add('a', a);
    hot.getLayoutManager().getSlot('bottom').add('b', b);

    expect(a.classList.contains('ht-slot-element')).toBe(true);
    expect(b.classList.contains('ht-slot-element')).toBe(true);
    // The elements are direct children of the slot - they are not wrapped.
    expect(a.parentNode).toBe(hot.rootSlotTopElement);
    expect(b.parentNode).toBe(hot.rootSlotBottomElement);
  });

  it('exposes getLayoutManager with the orderable top/bottom slots only', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const manager = hot.getLayoutManager();

    expect(manager.getSlot('top').getElement()).toBe(hot.rootSlotTopElement);
    expect(manager.getSlot('bottom').getElement()).toBe(hot.rootSlotBottomElement);
    // Overlays is a fixed internal element (like the grid), not a slot.
    expect(() => manager.getSlot('overlays')).toThrow();
  });

  it('register places a custom element into the slot named by side', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };
    const top = make('top');
    const bottom = make('bottom');

    hot.getLayoutManager().register('a', top, { side: 'top' });
    hot.getLayoutManager().register('b', bottom, { side: 'bottom', weight: 100 });

    expect(top.parentNode).toBe(hot.rootSlotTopElement);
    expect(bottom.parentNode).toBe(hot.rootSlotBottomElement);
  });

  it('keeps focus on a slot element across updateSettings (no reorder churn)', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const link = document.createElement('button');

    link.textContent = 'Slot action';
    hot.getLayoutManager().register('toolbar', link, { side: 'top', weight: 100 });

    link.focus();

    expect(document.activeElement).toBe(link);

    // `updateSettings` re-applies the layout config (setOrder on every slot). With the order
    // unchanged, the element must not be detached/re-appended, so focus stays put.
    await updateSettings({ rowHeaders: true });

    expect(document.activeElement).toBe(link);
  });

  it('unregister removes a custom element registered through register', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const el = document.createElement('div');

    hot.getLayoutManager().register('custom', el, { side: 'bottom' });

    expect(el.parentNode).toBe(hot.rootSlotBottomElement);

    hot.getLayoutManager().unregister('custom', 'bottom');

    expect(el.parentNode).toBe(null);
  });

  it('adds and orders custom elements within a slot by weight', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const slot = hot.getLayoutManager().getSlot('top');
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
      layout: { top: ['b', 'a'] },
    });
    const slot = hot.getLayoutManager().getSlot('top');
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
    const slot = hot.getLayoutManager().getSlot('bottom');
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };

    slot.add('a', make('a'), 100);
    slot.add('b', make('b'), 200);

    await updateSettings({ layout: { bottom: ['b', 'a'] } });

    expect(slotItemIds(slot)).toEqual(['b', 'a']);
  });

  it('keeps ht-slot-top the same width as ht-slot-bottom', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      width: 300,
      height: 200,
    });

    hot.getLayoutManager().getSlot('top')
      .add('probe', document.createElement('div'), 100);

    hot.refreshDimensions();

    await sleep(50);

    expect(hot.rootSlotTopElement.style.width).toBe(hot.rootSlotBottomElement.style.width);
    expect(hot.rootSlotTopElement.style.width).not.toBe('');
  });

  it('sizes the bottom slot to the table width on init (table narrower than the wrapper)', async() => {
    // No defined size + columns narrower than the container: the bottom slot must shrink to the
    // table width on the first render, not stretch to the full wrapper width.
    const hot = handsontable({
      data: createSpreadsheetData(4, 3),
      colWidths: 80,
      pagination: true,
    });

    await waitForNextAnimationFrames(2);

    const tableWidth = hot.rootWrapperElement.querySelector('.ht_master .htCore').offsetWidth;

    expect(hot.rootSlotBottomElement.style.width).not.toBe('');
    expect(hot.rootSlotBottomElement.offsetWidth).toBe(tableWidth);
    expect(hot.rootSlotBottomElement.offsetWidth).toBeLessThan(hot.rootWrapperElement.offsetWidth);
  });

  it('appends the license notification as the last element of the bottom slot when present', async() => {
    // Pass `true` so the test helper does not inject the default evaluation license key,
    // which leaves the key missing and renders the license notification.
    const hot = handsontable({ data: createSpreadsheetData(3, 3) }, true);

    // The notification is not a layout-slot contributor - it is not in the registry.
    expect(hot.getLayoutManager().getSlot('bottom').has('licenseNotification')).toBe(false);

    const notification = hot.rootSlotBottomElement.querySelector('.hot-display-license-info');

    expect(notification).toBeTruthy();
    expect(notification).toBe(hot.rootSlotBottomElement.lastElementChild);
  });

  it('keeps the license notification last regardless of the layout setting', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      pagination: true,
      // The license notification is intentionally not orderable; a `layout` entry for it must be ignored.
      layout: { bottom: ['licenseNotification', 'pagination'] },
    }, true);

    const keys = Array.from(hot.rootSlotBottomElement.children).map((c) => {
      if (c.classList.contains('hot-display-license-info')) {
        return 'licenseNotification';
      }

      if (c.classList.contains('ht-pagination')) {
        return 'pagination';
      }

      return c.className;
    });

    expect(keys).toEqual(['pagination', 'licenseNotification']);
  });

  it('keeps the license notification last when pagination is enabled after init', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) }, true);

    // Pagination is not set at init, so the license notice is the only bottom-slot element.
    expect(hot.rootSlotBottomElement.querySelector('.hot-display-license-info'))
      .toBe(hot.rootSlotBottomElement.lastElementChild);

    // Enabling pagination after init registers it into the bottom slot - the license stays last.
    await updateSettings({ pagination: true });

    const keys = Array.from(hot.rootSlotBottomElement.children).map((c) => {
      if (c.classList.contains('hot-display-license-info')) {
        return 'licenseNotification';
      }

      if (c.classList.contains('ht-pagination')) {
        return 'pagination';
      }

      return c.className;
    });

    expect(keys).toEqual(['pagination', 'licenseNotification']);
  });

  it('removes pagination from the slot when the plugin is disabled', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      pagination: true,
    });

    expect(hot.getLayoutManager().getSlot('bottom').has('pagination')).toBe(true);

    await updateSettings({ pagination: false });

    expect(hot.getLayoutManager().getSlot('bottom').has('pagination')).toBe(false);
  });

  it('renders the dialog in the overlays layer and removes it when disabled', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      dialog: true,
    });

    // The dialog renders in the overlays layer (not a layout slot) and installs its element there.
    expect(hot.rootOverlaysElement.children.length).toBe(1);

    await updateSettings({ dialog: false });

    expect(hot.rootOverlaysElement.children.length).toBe(0);
  });

  it('does not throw when destroying with layout-registered plugins', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      pagination: true,
      dialog: true,
    });

    expect(() => hot.destroy()).not.toThrow();
  });

  it('keeps tab order top -> grid -> bottom', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const topBtn = document.createElement('button');
    const bottomBtn = document.createElement('button');

    topBtn.id = 'topBtn';
    bottomBtn.id = 'bottomBtn';

    hot.getLayoutManager().getSlot('top').add('t', topBtn, 100);
    hot.getLayoutManager().getSlot('bottom').add('b', bottomBtn, 100);

    const inDocOrder = Array.from(hot.rootWrapperElement.querySelectorAll('#topBtn, #bottomBtn'))
      .map(el => el.id);

    expect(inDocOrder).toEqual(['topBtn', 'bottomBtn']);
  });

  it('ignores an overlays key in the layout setting (overlays is not a slot)', async() => {
    // `overlays` is not a layout slot - it renders like the grid - so passing it must be harmless.
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
      layout: { overlays: ['b', 'a'] },
    });

    expect(() => hot.getLayoutManager().getSlot('overlays')).toThrow();
    expect(hot.rootOverlaysElement.classList.contains('ht-overlay')).toBe(true);
  });

  it('removes the top border of the first bottom-slot item', async() => {
    const hot = handsontable({ data: createSpreadsheetData(3, 3) });
    const make = (elId) => {
      const el = document.createElement('div');

      el.dataset.id = elId;

      return el;
    };

    hot.getLayoutManager().getSlot('bottom').add('first', make('first'), 100);
    hot.getLayoutManager().getSlot('bottom').add('second', make('second'), 200);

    hot.render();

    await waitForNextAnimationFrames(2);

    const [first, second] = Array.from(hot.rootSlotBottomElement.children);

    // The first bottom-slot item never draws a top border; non-first items are not targeted by the rule.
    expect(getComputedStyle(first).borderTopWidth).toBe('0px');
    expect(first.matches('.ht-slot-bottom > .ht-slot-element:first-child')).toBe(true);
    expect(second.matches('.ht-slot-bottom > .ht-slot-element:first-child')).toBe(false);
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
