import {
  install,
  uninstall,
  announce,
} from '../a11yAnnouncer';

describe('a11yAnnouncer', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create only one pair of live regions for multiple `install` function calls', () => {
    const portalElement = document.createElement('div');

    install(portalElement);

    expect(portalElement.childElementCount).toBe(2);
    expect(portalElement.firstChild.getAttribute('role')).toBe('status');
    expect(portalElement.firstChild.getAttribute('aria-live')).toBe('assertive');
    expect(portalElement.lastChild.getAttribute('role')).toBe('status');
    expect(portalElement.lastChild.getAttribute('aria-live')).toBe('polite');

    install(portalElement);

    expect(portalElement.childElementCount).toBe(2);

    install(portalElement);

    expect(portalElement.childElementCount).toBe(2);

    uninstall();

    expect(portalElement.childElementCount).toBe(2);

    uninstall();

    expect(portalElement.childElementCount).toBe(2);

    uninstall();

    expect(portalElement.childElementCount).toBe(0);

    portalElement.remove();
  });

  it('should update the text of the internal DOM element with timeout', () => {
    const portalElement = document.createElement('div');

    install(portalElement);

    const internalAnnouncer = portalElement.firstChild;

    announce('Test announcement');

    expect(internalAnnouncer.textContent).toBe('');

    jest.runAllTimers();

    expect(internalAnnouncer.textContent).toBe('Test announcement');

    uninstall();
    portalElement.remove();
  });

  it('should announce politely through the polite live region and leave the assertive one empty', () => {
    const portalElement = document.createElement('div');

    install(portalElement);

    const politeRegion = portalElement.querySelector('[aria-live="polite"]');
    const assertiveRegion = portalElement.querySelector('[aria-live="assertive"]');

    expect(politeRegion.getAttribute('aria-atomic')).toBe('true');

    announce('Polite announcement', 'polite');
    jest.runAllTimers();

    expect(politeRegion.textContent).toBe('Polite announcement');
    expect(assertiveRegion.textContent).toBe('');

    announce('Second polite announcement', 'polite');
    jest.runAllTimers();

    expect(politeRegion.textContent).toBe('Second polite announcement');

    uninstall();

    expect(portalElement.childElementCount).toBe(0);

    portalElement.remove();
  });

  it('should keep announcing politely while another instance that installed the announcer is gone', () => {
    const portalElement = document.createElement('div');

    install(portalElement);
    install(portalElement);
    uninstall();

    announce('Still here', 'polite');
    jest.runAllTimers();

    expect(portalElement.querySelector('[aria-live="polite"]').textContent).toBe('Still here');

    uninstall();
    portalElement.remove();
  });

  it('should not write a pending announcement into a region removed before the timeout', () => {
    const portalElement = document.createElement('div');

    install(portalElement);
    announce('Late announcement', 'polite');

    const politeRegion = portalElement.querySelector('[aria-live="polite"]');

    uninstall();
    jest.runAllTimers();

    expect(politeRegion.textContent).toBe('');

    portalElement.remove();
  });
});
