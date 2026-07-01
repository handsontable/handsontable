import { LiveGeometryReader } from '../../../src/geometry/liveGeometryReader';
import * as element from '../../../../../helpers/dom/element';

jest.mock('../../../../../helpers/dom/element', () => ({
  offset: jest.fn(() => ({ left: 11, top: 22 })),
  outerWidth: jest.fn(() => 111),
  outerHeight: jest.fn(() => 222),
  innerHeight: jest.fn(() => 333),
  innerWidth: jest.fn(() => 444),
  getScrollbarWidth: jest.fn(() => 17),
  getStyle: jest.fn(() => 'auto'),
  getScrollLeft: jest.fn(() => 55),
  getScrollTop: jest.fn(() => 66),
  getMaximumScrollTop: jest.fn(() => 77),
  getMaximumScrollLeft: jest.fn(() => 88),
}));

/**
 * Creates a stub element exposing the given geometry properties. Cast is test-only.
 *
 * @param {object} props The geometry properties to expose.
 * @returns {HTMLElement}
 */
function stubElement(props: Record<string, number>): HTMLElement {
  return props as unknown as HTMLElement;
}

describe('LiveGeometryReader', () => {
  let reader: LiveGeometryReader;
  let mockRootWindow: Window;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRootWindow = { getComputedStyle: jest.fn(() => ({ height: '10px' })) } as unknown as Window;
    reader = new LiveGeometryReader(mockRootWindow);
  });

  describe('element-property reads (pass-through)', () => {
    it('should return clientWidth / clientHeight verbatim', () => {
      const el = stubElement({ clientWidth: 100, clientHeight: 200 });

      expect(reader.clientWidth(el)).toBe(100);
      expect(reader.clientHeight(el)).toBe(200);
    });

    it('should return offsetWidth / offsetHeight verbatim', () => {
      const el = stubElement({ offsetWidth: 300, offsetHeight: 400 });

      expect(reader.offsetWidth(el)).toBe(300);
      expect(reader.offsetHeight(el)).toBe(400);
    });

    it('should return scrollWidth / scrollHeight verbatim', () => {
      const el = stubElement({ scrollWidth: 500, scrollHeight: 600 });

      expect(reader.scrollWidth(el)).toBe(500);
      expect(reader.scrollHeight(el)).toBe(600);
    });

    it('should return the element getBoundingClientRect() result verbatim', () => {
      const rect = { height: 42, width: 24 };
      const el = { getBoundingClientRect: () => rect } as unknown as HTMLElement;

      expect(reader.getBoundingClientRect(el)).toBe(rect);
    });

    it('should return scrollTop / scrollLeft verbatim', () => {
      const el = stubElement({ scrollTop: 700, scrollLeft: 800 });

      expect(reader.scrollTop(el)).toBe(700);
      expect(reader.scrollLeft(el)).toBe(800);
    });

    it('should return offsetTop / offsetLeft verbatim', () => {
      const el = stubElement({ offsetTop: 900, offsetLeft: 1000 });

      expect(reader.offsetTop(el)).toBe(900);
      expect(reader.offsetLeft(el)).toBe(1000);
    });
  });

  describe('helper-backed reads (delegation)', () => {
    it('should delegate outerWidth / outerHeight to the DOM helpers with the element', () => {
      const el = stubElement({});

      expect(reader.outerWidth(el)).toBe(111);
      expect(element.outerWidth).toHaveBeenCalledWith(el);
      expect(reader.outerHeight(el)).toBe(222);
      expect(element.outerHeight).toHaveBeenCalledWith(el);
    });

    it('should delegate offset to the DOM helper with the element', () => {
      const el = stubElement({});

      expect(reader.offset(el)).toEqual({ left: 11, top: 22 });
      expect(element.offset).toHaveBeenCalledWith(el);
    });

    it('should delegate innerHeight to the DOM helper with the element', () => {
      const el = stubElement({});

      expect(reader.innerHeight(el)).toBe(333);
      expect(element.innerHeight).toHaveBeenCalledWith(el);
    });

    it('should delegate innerWidth to the DOM helper with the element', () => {
      const el = stubElement({});

      expect(reader.innerWidth(el)).toBe(444);
      expect(element.innerWidth).toHaveBeenCalledWith(el);
    });
  });

  describe('scroll-position reads', () => {
    it('should delegate getScrollLeft to the DOM helper with the element and root window', () => {
      const el = stubElement({});

      expect(reader.getScrollLeft(el)).toBe(55);
      expect(element.getScrollLeft).toHaveBeenCalledWith(el, mockRootWindow);
    });

    it('should delegate getScrollTop to the DOM helper with the element and root window', () => {
      const el = stubElement({});

      expect(reader.getScrollTop(el)).toBe(66);
      expect(element.getScrollTop).toHaveBeenCalledWith(el, mockRootWindow);
    });

    it('should delegate getMaximumScrollTop to the DOM helper with the element', () => {
      const el = stubElement({});

      expect(reader.getMaximumScrollTop(el)).toBe(77);
      expect(element.getMaximumScrollTop).toHaveBeenCalledWith(el);
    });

    it('should delegate getMaximumScrollLeft to the DOM helper with the element', () => {
      const el = stubElement({});

      expect(reader.getMaximumScrollLeft(el)).toBe(88);
      expect(element.getMaximumScrollLeft).toHaveBeenCalledWith(el);
    });
  });

  // The engine calls `getScrollbarWidth` both with no argument (helper default = global `document`)
  // and with the root document. Stage 1 preserves that exactly by forwarding the argument verbatim.
  // These tests lock that behavior; unifying on the root document is a deferred, conscious change.
  describe('getScrollbarWidth document forwarding', () => {
    it('should forward undefined when called with no argument (helper falls back to global document)', () => {
      expect(reader.getScrollbarWidth()).toBe(17);
      expect(element.getScrollbarWidth).toHaveBeenCalledWith(undefined);
    });

    it('should forward the provided document verbatim', () => {
      const doc = {} as unknown as Document;

      reader.getScrollbarWidth(doc);

      expect(element.getScrollbarWidth).toHaveBeenCalledWith(doc);
    });
  });

  describe('computed-style reads', () => {
    it('should return getComputedStyle from the root window', () => {
      const el = stubElement({});

      expect(reader.getComputedStyle(el)).toEqual({ height: '10px' });
      expect(mockRootWindow.getComputedStyle).toHaveBeenCalledWith(el);
    });

    it('should delegate getStyle to the DOM helper with the element, property, and root window', () => {
      const el = stubElement({});

      expect(reader.getStyle(el, 'overflow')).toBe('auto');
      expect(element.getStyle).toHaveBeenCalledWith(el, 'overflow', mockRootWindow);
    });
  });
});
