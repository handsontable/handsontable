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
