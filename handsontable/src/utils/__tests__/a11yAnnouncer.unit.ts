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

  it('should move both regions to a remaining instance\'s portal when the instance holding them is gone', () => {
    const firstPortal = document.createElement('div');
    const secondPortal = document.createElement('div');

    document.body.append(firstPortal, secondPortal);
    install(firstPortal);
    install(secondPortal);

    uninstall(firstPortal);
    firstPortal.remove();

    expect(firstPortal.childElementCount).toBe(0);
    expect(secondPortal.childElementCount).toBe(2);

    announce('Collapsed row 1', 'polite');
    jest.runAllTimers();

    const politeRegion = secondPortal.querySelector('[aria-live="polite"]');

    expect(politeRegion.isConnected).toBe(true);
    expect(politeRegion.textContent).toBe('Collapsed row 1');

    uninstall(secondPortal);

    expect(secondPortal.childElementCount).toBe(0);

    secondPortal.remove();
  });

  it('should leave the regions in place when an instance that does not hold them is gone', () => {
    const firstPortal = document.createElement('div');
    const secondPortal = document.createElement('div');

    install(firstPortal);
    install(secondPortal);

    uninstall(secondPortal);

    expect(firstPortal.childElementCount).toBe(2);

    uninstall(firstPortal);

    expect(firstPortal.childElementCount).toBe(0);
  });

  it('should release nothing for a portal that never installed the announcer', () => {
    const installedPortal = document.createElement('div');
    const strayPortal = document.createElement('div');

    install(installedPortal);
    uninstall(strayPortal);

    expect(installedPortal.childElementCount).toBe(2);

    announce('Still announced', 'polite');
    jest.runAllTimers();

    expect(installedPortal.querySelector('[aria-live="polite"]').textContent).toBe('Still announced');

    uninstall(installedPortal);

    expect(installedPortal.childElementCount).toBe(0);
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
