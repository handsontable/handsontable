import { installFocusDetector } from '../utils/focusDetector';
import type { HotInstance } from '../../core/types';

/**
 * Builds a scope container that holds the grid's root element, as the grid scope's container does.
 *
 * @param {object} [options] The options.
 * @param {string|null} [options.rootTabIndex=null] The `tabindex` attribute the root starts with.
 * @returns {{ hot: HotInstance, container: HTMLElement, root: HTMLElement }}
 */
function makeGrid({ rootTabIndex = null }: { rootTabIndex?: string | null } = {}) {
  const container = document.createElement('div');
  const root = document.createElement('div');

  root.className = 'ht-wrapper handsontable';
  root.setAttribute('role', 'treegrid');

  if (rootTabIndex !== null) {
    root.setAttribute('tabindex', rootTabIndex);
  }

  container.appendChild(root);
  document.body.appendChild(container);

  const hot = {
    rootDocument: document,
    rootElement: root,
  } as unknown as HotInstance;

  return { hot, container, root };
}

describe('installFocusDetector', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  describe('in front of the grid root', () => {
    it('should keep both catchers in the DOM around the root, with their class and focus source', () => {
      const { hot, container, root } = makeGrid();

      installFocusDetector(hot, container);

      const [top, , bottom] = Array.from(container.children) as HTMLElement[];

      expect(Array.from(container.children)).toEqual([top, root, bottom]);
      expect(top.className).toBe('htFocusCatcher');
      expect(top.dataset.htFocusSource).toBe('tab_from_above');
      expect(bottom.className).toBe('htFocusCatcher');
      expect(bottom.dataset.htFocusSource).toBe('tab_from_below');
    });

    it('should never give the top catcher a tabindex, armed or not', () => {
      const { hot, container } = makeGrid();
      const detector = installFocusDetector(hot, container);
      const top = container.firstElementChild as HTMLElement;

      expect(top.hasAttribute('tabindex')).toBe(false);

      detector.activate();

      expect(top.hasAttribute('tabindex')).toBe(false);

      detector.deactivate();

      expect(top.hasAttribute('tabindex')).toBe(false);
    });

    it('should make the root the Tab entry from above while armed', () => {
      const { hot, container, root } = makeGrid();
      const detector = installFocusDetector(hot, container);

      expect(root.hasAttribute('tabindex')).toBe(false);
      expect(root.hasAttribute('data-ht-focus-source')).toBe(false);

      detector.activate();

      expect(root.getAttribute('tabindex')).toBe('0');
      expect(root.dataset.htFocusSource).toBe('tab_from_above');
    });

    it('should take the root out of the Tab order and drop its focus source when disarmed', () => {
      const { hot, container, root } = makeGrid();
      const detector = installFocusDetector(hot, container);

      detector.activate();
      detector.deactivate();

      expect(root.hasAttribute('tabindex')).toBe(false);
      expect(root.hasAttribute('data-ht-focus-source')).toBe(false);
    });

    it('should keep the root focusable when it is disarmed while it holds the focus', () => {
      const { hot, container, root } = makeGrid();
      const detector = installFocusDetector(hot, container);

      detector.activate();
      root.focus();
      detector.deactivate();

      expect(document.activeElement).toBe(root);
      expect(root.getAttribute('tabindex')).toBe('-1');
      expect(root.hasAttribute('data-ht-focus-source')).toBe(false);
    });

    it('should arm and disarm the bottom catcher as before', () => {
      const { hot, container } = makeGrid();
      const detector = installFocusDetector(hot, container);
      const bottom = container.lastElementChild as HTMLElement;

      detector.activate();

      expect(bottom.tabIndex).toBe(0);

      detector.deactivate();

      expect(bottom.tabIndex).toBe(-1);
    });

    it('should give the root back its own tabindex when disarmed and destroyed', () => {
      const { hot, container, root } = makeGrid({ rootTabIndex: '-1' });
      const detector = installFocusDetector(hot, container);

      detector.activate();

      expect(root.getAttribute('tabindex')).toBe('0');

      detector.deactivate();

      expect(root.getAttribute('tabindex')).toBe('-1');

      detector.activate();
      detector.destroy();

      expect(root.getAttribute('tabindex')).toBe('-1');
      expect(root.hasAttribute('data-ht-focus-source')).toBe(false);
    });

    it('should remove both catchers and leave the root with no tabindex on destroy', () => {
      const { hot, container, root } = makeGrid();
      const detector = installFocusDetector(hot, container);

      detector.activate();
      detector.destroy();

      expect(container.querySelectorAll('.htFocusCatcher')).toHaveLength(0);
      expect(Array.from(container.children)).toEqual([root]);
      expect(root.hasAttribute('tabindex')).toBe(false);
      expect(root.hasAttribute('data-ht-focus-source')).toBe(false);
    });
  });

  describe('around a container that does not start with the grid root', () => {
    it('should arm and disarm the top catcher itself and leave the root alone', () => {
      const { hot, root } = makeGrid();
      const container = document.createElement('div');

      container.appendChild(document.createElement('button'));
      document.body.appendChild(container);

      const detector = installFocusDetector(hot, container);
      const top = container.firstElementChild as HTMLElement;

      detector.activate();

      expect(top.tabIndex).toBe(0);
      expect(root.hasAttribute('tabindex')).toBe(false);

      detector.deactivate();

      expect(top.tabIndex).toBe(-1);
      expect(root.hasAttribute('tabindex')).toBe(false);
    });
  });
});
