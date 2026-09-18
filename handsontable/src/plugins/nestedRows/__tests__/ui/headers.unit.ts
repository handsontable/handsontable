import Handsontable from 'handsontable/base';
import { registerPlugin, NestedRows } from 'handsontable/plugins';

registerPlugin(NestedRows);

/**
 * Builds a row header the way Walkontable renders one, with the decoration the plugin appends to
 * it: indent spacers before the label and the collapse button after it.
 *
 * @returns {object} The header and the label it wraps.
 */
function buildDecoratedRowHeader() {
  const TH = document.createElement('th');
  const innerDiv = document.createElement('div');
  const label = document.createElement('span');
  const spacer = document.createElement('span');
  const button = document.createElement('div');

  label.className = 'rowHeader';
  label.textContent = '2';
  spacer.className = 'ht_nestingLevel_empty';
  button.className = 'ht_nestingButton ht_nestingCollapse';

  innerDiv.append(spacer, label, button);
  TH.appendChild(innerDiv);

  return { TH, label };
}

describe('HeadersUI#removeLevelIndicators', () => {
  let hot: Handsontable;

  beforeEach(() => {
    hot = new Handsontable(document.createElement('div'), {
      data: [{ name: 'parent', __children: [{ name: 'child' }] }],
      rowHeaders: true,
      nestedRows: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot.destroy();
  });

  it('should remove the spacers and the button and keep the label', () => {
    const { TH, label } = buildDecoratedRowHeader();

    hot.getPlugin('nestedRows').headersUI!.removeLevelIndicators(TH);

    expect(TH.querySelectorAll('[class^="ht_nesting"]').length).toBe(0);
    expect(Array.from(TH.firstElementChild!.children)).toEqual([label]);
  });

  it('should leave a header without an inner container alone', () => {
    const TH = document.createElement('th');

    TH.textContent = '2';

    expect(() => hot.getPlugin('nestedRows').headersUI!.removeLevelIndicators(TH)).not.toThrow();
    expect(TH.textContent).toBe('2');
  });
});
