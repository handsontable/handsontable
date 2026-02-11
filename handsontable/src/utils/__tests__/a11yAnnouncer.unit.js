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
});
