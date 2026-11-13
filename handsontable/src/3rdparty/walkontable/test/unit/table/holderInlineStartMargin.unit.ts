import { measureHolderInlineStartMargin } from 'walkontable/table/holderInlineStartMargin';

/**
 * Reads the page margin from stubs that answer only for the element each read must measure and return
 * `NaN` for any other, so a swapped element fails every case.
 */
describe('measureHolderInlineStartMargin', () => {
  const documentElement = {} as HTMLElement;
  const holder = {} as HTMLElement;
  const rootDocument = { documentElement } as unknown as Document;

  /**
   * Builds the reader for a page `docWidth` wide and a holder `holderWidth` wide.
   *
   * @param {number} docWidth The document element's client width.
   * @param {number} holderWidth The holder's offset width.
   * @returns {object}
   */
  const createReader = (docWidth: number, holderWidth: number) => ({
    clientWidth: (element: HTMLElement) => (element === documentElement ? docWidth : NaN),
    offsetWidth: (element: HTMLElement) => (element === holder ? holderWidth : NaN),
  });

  it('should be 0 for a grid that fills the page width', () => {
    expect(measureHolderInlineStartMargin(createReader(1280, 1280), rootDocument, holder, 0)).toBe(0);
  });

  it('should be the margin on the right for a grid narrower than the page', () => {
    expect(measureHolderInlineStartMargin(createReader(1280, 680), rootDocument, holder, 0)).toBe(600);
  });

  it('should be 0 for a grid wider than the page that ends at the right edge', () => {
    expect(measureHolderInlineStartMargin(createReader(1280, 5050), rootDocument, holder, -3770)).toBe(0);
  });

  it('should leave out a classic scrollbar, which the client width does not count', () => {
    expect(measureHolderInlineStartMargin(createReader(1265, 5050), rootDocument, holder, -3785)).toBe(0);
  });
});
