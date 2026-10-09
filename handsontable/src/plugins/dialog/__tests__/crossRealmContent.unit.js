import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Dialog } from '../dialog';
import { DIALOG_CLASS_NAME } from '../constants';
import * as consoleHelpers from '../../../helpers/console';

// A grid inside an iframe builds its DOM from `hot.rootDocument`, the iframe's document, so the nodes
// it hands the dialog belong to the iframe's realm. An `instanceof DocumentFragment` test against the
// top window's constructor answers `false` for them: the dialog rejected the content with
// `"content" option is not valid and it will be ignored`, and the export progress overlay showed
// empty. jsdom gives every iframe its own realm, so these tests reproduce that exactly.
describe('Dialog content from another realm', () => {
  let iframe;
  let frameDocument;
  let container;
  let hot;
  let warnSpy;

  beforeAll(() => {
    registerPlugin(Dialog);
  });

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    frameDocument = iframe.contentDocument;
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [[1, 2], [3, 4]],
      dialog: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
    iframe.remove();
    warnSpy.mockRestore();
  });

  /**
   * Returns the warnings the dialog's settings validation logged.
   *
   * @returns {string[]} The warning messages.
   */
  function contentWarnings() {
    return warnSpy.mock.calls.map(([message]) => String(message)).filter(message => message.includes('content'));
  }

  it('should build the fixture in a separate realm', () => {
    const fragment = frameDocument.createDocumentFragment();

    // Without this, the tests below would pass on an `instanceof` check too.
    expect(fragment instanceof DocumentFragment).toBe(false);
  });

  it('should accept and render a DocumentFragment built from an iframe document', () => {
    const fragment = frameDocument.createDocumentFragment();
    const paragraph = frameDocument.createElement('p');

    paragraph.textContent = 'Exporting...';
    fragment.appendChild(paragraph);

    hot.getPlugin('dialog').show({ content: fragment });

    const content = hot.rootOverlaysElement.querySelector(`.${DIALOG_CLASS_NAME}__content`);

    expect(contentWarnings()).toEqual([]);
    expect(content.textContent).toBe('Exporting...');
  });

  it('should accept and render an HTMLElement built from an iframe document', () => {
    const element = frameDocument.createElement('section');

    element.textContent = 'From the frame';

    hot.getPlugin('dialog').show({ content: element });

    const content = hot.rootOverlaysElement.querySelector(`.${DIALOG_CLASS_NAME}__content`);

    expect(contentWarnings()).toEqual([]);
    expect(content.textContent).toBe('From the frame');
  });

  it('should still accept a string and a same-realm DocumentFragment', () => {
    const dialog = hot.getPlugin('dialog');
    const fragment = document.createDocumentFragment();

    fragment.appendChild(document.createTextNode('Same realm'));
    dialog.show({ content: fragment });

    const content = () => hot.rootOverlaysElement.querySelector(`.${DIALOG_CLASS_NAME}__content`);

    expect(content().textContent).toBe('Same realm');

    dialog.show({ content: 'As a string' });

    expect(content().textContent).toBe('As a string');
    expect(contentWarnings()).toEqual([]);
  });

  it('should still reject an object that only looks like a node', () => {
    hot.getPlugin('dialog').show({ content: { nodeType: 11 } });

    expect(contentWarnings()).toHaveLength(1);
  });
});
