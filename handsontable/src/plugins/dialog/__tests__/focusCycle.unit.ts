import { getTabStops, resolveWrapTarget } from '../focusCycle';

describe('Dialog focusCycle', () => {
  let container: HTMLElement;

  /**
   * Builds a container with the given markup, attached to the document so `isVisible()` passes.
   *
   * @param {string} html Container content.
   * @returns {HTMLElement}
   */
  function build(html: string): HTMLElement {
    container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    return container;
  }

  /**
   * @param {string} id Element id.
   * @returns {HTMLElement}
   */
  function byId(id: string): HTMLElement {
    return container.querySelector(`#${id}`) as HTMLElement;
  }

  afterEach(() => {
    container?.remove();
  });

  describe('getTabStops()', () => {
    it('should return only the elements sequential focus visits, in document order', () => {
      build(`
        <input id="input1">
        <input id="input-hidden" type="hidden">
        <button id="button-disabled" disabled></button>
        <div id="minus" tabindex="-1"></div>
        <div id="catcher" class="htFocusCatcher" tabindex="0"></div>
        <button id="button1"></button>
        <div inert><button id="inert-button"></button></div>
      `);

      expect(getTabStops(container).map(el => el.id)).toEqual(['input1', 'button1']);
    });

    it('should leave out a control inside a disabled fieldset, but not one in its legend', () => {
      build(`
        <fieldset disabled><input id="in-fieldset"><legend><button id="in-legend"></button></legend></fieldset>
        <button id="button1"></button>
      `);

      expect(getTabStops(container).map(el => el.id)).toEqual(['in-legend', 'button1']);
    });

    it('should leave out an element hidden with visibility, also through an ancestor (jsdom fallback)', () => {
      build(`
        <button id="hidden-self" style="visibility: hidden"></button>
        <div style="visibility: hidden"><button id="hidden-parent"></button></div>
        <button id="button1"></button>
      `);

      expect(getTabStops(container).map(el => el.id)).toEqual(['button1']);
    });

    it('should ask checkVisibility() about the visibility property where the browser has it', () => {
      build('<button id="button1"></button><button id="button2"></button>');

      const checkVisibility = jest.fn((options?: { visibilityProperty?: boolean }) => (
        options?.visibilityProperty !== true
      ));

      byId('button1').checkVisibility = checkVisibility;

      expect(getTabStops(container).map(el => el.id)).toEqual(['button2']);
      expect(checkVisibility).toHaveBeenCalledWith({ visibilityProperty: true });
    });
  });

  describe('resolveWrapTarget()', () => {
    beforeEach(() => {
      build(`
        <p id="para">text</p>
        <button id="first"></button>
        <button id="middle"></button>
        <button id="last"></button>
      `);
    });

    it('should wrap from the last stop forwards to the first', () => {
      expect(resolveWrapTarget(container, byId('last'), false)?.id).toBe('first');
    });

    it('should wrap from the first stop backwards to the last', () => {
      expect(resolveWrapTarget(container, byId('first'), true)?.id).toBe('last');
    });

    it('should leave a middle stop to the browser', () => {
      expect(resolveWrapTarget(container, byId('middle'), false)).toBeNull();
      expect(resolveWrapTarget(container, byId('middle'), true)).toBeNull();
    });

    it('should pull focus back from the container itself or a non-stop inside it', () => {
      expect(resolveWrapTarget(container, container, false)?.id).toBe('first');
      expect(resolveWrapTarget(container, byId('para'), true)?.id).toBe('last');
    });

    it('should leave a focused non-stop with a stop ahead of it to the browser', () => {
      const between = document.createElement('h6');

      between.tabIndex = -1;
      byId('first').after(between);

      expect(resolveWrapTarget(container, between, false)).toBeNull();
      expect(resolveWrapTarget(container, between, true)).toBeNull();
    });

    it('should wrap from a focused non-stop with no stop ahead of it', () => {
      const after = document.createElement('div');

      after.tabIndex = -1;
      container.appendChild(after);

      expect(resolveWrapTarget(container, after, false)?.id).toBe('first');
      expect(resolveWrapTarget(container, after, true)).toBeNull();
      // The paragraph sits before every stop, so Tab is the browser's and Shift+Tab wraps.
      expect(resolveWrapTarget(container, byId('para'), false)).toBeNull();
    });

    it('should leave a focused ancestor of the stops to the browser on Tab and wrap it on Shift+Tab', () => {
      const wrapper = document.createElement('div');

      wrapper.tabIndex = -1;
      wrapper.append(...Array.from(container.children));
      container.appendChild(wrapper);

      expect(resolveWrapTarget(container, wrapper, false)).toBeNull();
      expect(resolveWrapTarget(container, wrapper, true)?.id).toBe('last');
    });

    it('should use the stops the caller passes', () => {
      expect(resolveWrapTarget(container, byId('middle'), false, [byId('first'), byId('middle')])?.id)
        .toBe('first');
    });

    it('should leave an element outside the container to the browser', () => {
      const outside = document.createElement('button');

      document.body.appendChild(outside);

      expect(resolveWrapTarget(container, outside, false)).toBeNull();
      outside.remove();
    });
  });

  it('should return the container when there are no tab stops', () => {
    build('<p>nothing</p>');

    expect(resolveWrapTarget(container, container, false)).toBe(container);
    expect(resolveWrapTarget(container, container, true)).toBe(container);
  });

  it('should return the only stop in both directions', () => {
    build('<button id="only"></button>');

    expect(resolveWrapTarget(container, byId('only'), false)?.id).toBe('only');
    expect(resolveWrapTarget(container, byId('only'), true)?.id).toBe('only');
  });
});
