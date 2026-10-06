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

  it('should create only one DOM element for multiple `install` function calls', () => {
    const portalElement = document.createElement('div');

    install(portalElement);

    expect(portalElement.childElementCount).toBe(1);
    expect(portalElement.firstChild.getAttribute('role')).toBe('status');

    install(portalElement);

    expect(portalElement.childElementCount).toBe(1);

    install(portalElement);

    expect(portalElement.childElementCount).toBe(1);

    uninstall();

    expect(portalElement.childElementCount).toBe(1);

    uninstall();

    expect(portalElement.childElementCount).toBe(1);

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

  it('should create the polite live region on its first use and remove it on the last uninstall', () => {
    const portalElement = document.createElement('div');

    install(portalElement);

    expect(portalElement.childElementCount).toBe(1);

    announce('Polite announcement', 'polite');

    expect(portalElement.childElementCount).toBe(2);

    const politeRegion = portalElement.querySelector('[aria-live="polite"]');

    expect(politeRegion.getAttribute('role')).toBe('status');
    expect(politeRegion.getAttribute('aria-atomic')).toBe('true');

    jest.runAllTimers();

    expect(politeRegion.textContent).toBe('Polite announcement');
    expect(portalElement.querySelector('[aria-live="assertive"]').textContent).toBe('');

    announce('Second polite announcement', 'polite');
    jest.runAllTimers();

    expect(portalElement.childElementCount).toBe(2);
    expect(politeRegion.textContent).toBe('Second polite announcement');

    uninstall();

    expect(portalElement.childElementCount).toBe(0);

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
