import handsontableStyles from '../../src/styles/handsontableStyles';
import coreStylesStub from '../__mocks__/coreStylesMock';
import { injectRealCoreStyles, removeRealCoreStyles } from '../helpers/realCoreStyles';
import Handsontable from '../../src/base';

/**
 * Pins the Jest-only stub for the generated core stylesheet. Without it every grid built in a
 * unit test resolves its styles against 700+ rules in jsdom, and the suite runs about 10 times
 * slower (see `test/__mocks__/coreStylesMock.js`).
 */
describe('Jest core styles stub', () => {
  afterEach(() => {
    removeRealCoreStyles();
  });

  it('should map the generated core stylesheet module to the stub', () => {
    expect(handsontableStyles).toBe(coreStylesStub);
    expect(handsontableStyles.length).toBeLessThan(1000);
  });

  it('should inject the stub, not the real stylesheet, when a grid is built', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, { licenseKey: 'non-commercial-and-evaluation' });

    expect(document.getElementById('handsontable-core-styles').textContent).toBe(coreStylesStub);

    hot.destroy();
    container.remove();
  });

  it('should let a spec opt into the real stylesheet, and keep it when a grid is built', () => {
    injectRealCoreStyles();

    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, { licenseKey: 'non-commercial-and-evaluation' });
    const styles = document.querySelectorAll('#handsontable-core-styles');

    expect(styles.length).toBe(1);
    expect(styles[0].textContent.length).toBeGreaterThan(10000);
    expect(styles[0].sheet.cssRules.length).toBeGreaterThan(100);

    hot.destroy();
    container.remove();
  });
});
