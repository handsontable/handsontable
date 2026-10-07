import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Notification } from '../notification';

// A grid inside an iframe builds its DOM from `hot.rootDocument`, so an element message built there
// belongs to the iframe's realm. `instanceof HTMLElement` against the top window's constructor
// answered `false` for it, and `showMessage()` threw "expects an object with a `message` string or
// HTMLElement" for a valid element. jsdom gives every iframe its own realm, so this reproduces it.
describe('Notification message from another realm', () => {
  let iframe;
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Notification);
  });

  beforeEach(() => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [[1, 2], [3, 4]],
      notification: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
    iframe.remove();
  });

  it('should run in a separate realm', () => {
    const element = iframe.contentDocument.createElement('strong');

    expect(element instanceof HTMLElement).toBe(false);
  });

  it('should accept and show an element built from an iframe document', () => {
    const element = iframe.contentDocument.createElement('strong');

    element.textContent = 'Saved in the frame';

    let id;

    expect(() => {
      id = hot.getPlugin('notification').showMessage({ message: element });
    }).not.toThrow();
    expect(typeof id).toBe('string');
    expect(hot.rootElement.ownerDocument.body.textContent).toContain('Saved in the frame');
  });

  it('should still reject an object that only looks like an element', () => {
    expect(() => {
      hot.getPlugin('notification').showMessage({ message: { nodeType: 1, tagName: 'DIV' } });
    }).toThrow(/expects an object with a `message` string or HTMLElement/);
  });
});
