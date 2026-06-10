import { initLicenseNotification } from '../licenseNotification';

jest.mock('../../helpers/mixed', () => ({
  _injectProductInfo: jest.fn(),
}));

const { _injectProductInfo } = require('../../helpers/mixed');

const LICENSE_INFO_CLASS = 'hot-display-license-info';

function createMockHotInstance(overrides = {}) {
  const container = document.createElement('div');
  const registerScopeMock = jest.fn();

  return {
    rootAfterGridElement: container,
    getSettings: jest.fn(() => ({
      licenseKey: overrides.licenseKey,
    })),
    getFocusScopeManager: jest.fn(() => ({
      registerScope: registerScopeMock,
    })),
    getLayoutManager: jest.fn(() => ({
      getSlot: jest.fn(() => ({
        add: jest.fn(),
      })),
    })),
    ...overrides,
  };
}

describe('licenseNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initLicenseNotification', () => {
    it('should do nothing when rootAfterGridElement is null', () => {
      const hotInstance = createMockHotInstance();

      hotInstance.rootAfterGridElement = null;

      initLicenseNotification(hotInstance);

      expect(_injectProductInfo).not.toHaveBeenCalled();
      expect(hotInstance.getFocusScopeManager).not.toHaveBeenCalled();
    });

    it('should do nothing when rootAfterGridElement is undefined', () => {
      const hotInstance = createMockHotInstance();

      hotInstance.rootAfterGridElement = undefined;

      initLicenseNotification(hotInstance);

      expect(_injectProductInfo).not.toHaveBeenCalled();
      expect(hotInstance.getFocusScopeManager).not.toHaveBeenCalled();
    });

    it('should call _injectProductInfo with correct parameters when container exists', () => {
      const hotInstance = createMockHotInstance({ licenseKey: 'test-key' });
      const originalEnv = process.env;

      process.env = { ...originalEnv };

      initLicenseNotification(hotInstance);

      expect(_injectProductInfo).toHaveBeenCalledTimes(1);
      expect(_injectProductInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          className: LICENSE_INFO_CLASS,
          key: 'test-key',
          element: hotInstance.rootAfterGridElement,
          releaseDate: expect.any(String),
        })
      );

      process.env = originalEnv;
    });

    it('should pass releaseDate from process.env.HOT_RELEASE_DATE to _injectProductInfo', () => {
      const hotInstance = createMockHotInstance();

      initLicenseNotification(hotInstance);

      expect(_injectProductInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          releaseDate: expect.any(String),
        })
      );
    });

    it('should not register focus scope when no notification element is present after _injectProductInfo', () => {
      _injectProductInfo.mockImplementation(() => {});
      const hotInstance = createMockHotInstance();

      initLicenseNotification(hotInstance);

      expect(_injectProductInfo).toHaveBeenCalled();
      expect(hotInstance.getFocusScopeManager).not.toHaveBeenCalled();
    });

    it('should register focus scope when notification element is present', () => {
      const hotInstance = createMockHotInstance();
      const notificationEl = document.createElement('div');

      notificationEl.className = `handsontable ${LICENSE_INFO_CLASS}`;
      hotInstance.rootAfterGridElement.appendChild(notificationEl);

      _injectProductInfo.mockImplementation(({ element }) => {
        element.appendChild(notificationEl);
      });

      initLicenseNotification(hotInstance);

      expect(hotInstance.getFocusScopeManager).toHaveBeenCalled();
      const registerScope = hotInstance.getFocusScopeManager().registerScope;

      expect(registerScope).toHaveBeenCalledWith(
        'licenseNotification',
        expect.any(HTMLElement),
        expect.objectContaining({
          shortcutsContextName: 'plugin:licenseNotification',
          runOnlyIf: expect.any(Function),
          onActivate: expect.any(Function),
        })
      );
    });

    it('should register scope with runOnlyIf that returns false when notification element is removed', () => {
      const hotInstance = createMockHotInstance();
      const notificationEl = document.createElement('div');

      notificationEl.className = `handsontable ${LICENSE_INFO_CLASS}`;
      hotInstance.rootAfterGridElement.appendChild(notificationEl);

      _injectProductInfo.mockImplementation(() => {});

      initLicenseNotification(hotInstance);

      const registerScope = hotInstance.getFocusScopeManager().registerScope;
      const runOnlyIf = registerScope.mock.calls[0][2].runOnlyIf;

      expect(runOnlyIf()).toBe(true);

      notificationEl.remove();

      expect(runOnlyIf()).toBe(false);
    });

    it('should focus first focusable link when onActivate is called with tab_from_above', () => {
      const hotInstance = createMockHotInstance();
      const notificationEl = document.createElement('div');
      const link1 = document.createElement('a');
      const link2 = document.createElement('a');

      link1.href = '#1';
      link2.href = '#2';
      notificationEl.className = `handsontable ${LICENSE_INFO_CLASS}`;
      notificationEl.appendChild(link1);
      notificationEl.appendChild(link2);
      hotInstance.rootAfterGridElement.appendChild(notificationEl);

      _injectProductInfo.mockImplementation(() => {});

      const focusSpy1 = jest.spyOn(link1, 'focus').mockImplementation(() => {});
      const focusSpy2 = jest.spyOn(link2, 'focus').mockImplementation(() => {});

      initLicenseNotification(hotInstance);

      const onActivate = hotInstance.getFocusScopeManager().registerScope.mock.calls[0][2].onActivate;

      onActivate('tab_from_above');

      expect(focusSpy1).toHaveBeenCalled();
      expect(focusSpy2).not.toHaveBeenCalled();

      focusSpy1.mockRestore();
      focusSpy2.mockRestore();
    });

    it('should focus last focusable link when onActivate is called with tab_from_below', () => {
      const hotInstance = createMockHotInstance();
      const notificationEl = document.createElement('div');
      const link1 = document.createElement('a');
      const link2 = document.createElement('a');

      link1.href = '#1';
      link2.href = '#2';
      notificationEl.className = `handsontable ${LICENSE_INFO_CLASS}`;
      notificationEl.appendChild(link1);
      notificationEl.appendChild(link2);
      hotInstance.rootAfterGridElement.appendChild(notificationEl);

      _injectProductInfo.mockImplementation(() => {});

      const focusSpy1 = jest.spyOn(link1, 'focus').mockImplementation(() => {});
      const focusSpy2 = jest.spyOn(link2, 'focus').mockImplementation(() => {});

      initLicenseNotification(hotInstance);

      const onActivate = hotInstance.getFocusScopeManager().registerScope.mock.calls[0][2].onActivate;

      onActivate('tab_from_below');

      expect(focusSpy1).not.toHaveBeenCalled();
      expect(focusSpy2).toHaveBeenCalled();

      focusSpy1.mockRestore();
      focusSpy2.mockRestore();
    });

    it('should not throw when onActivate is called and notification has no focusable elements', () => {
      const hotInstance = createMockHotInstance();
      const notificationEl = document.createElement('div');

      notificationEl.className = `handsontable ${LICENSE_INFO_CLASS}`;
      hotInstance.rootAfterGridElement.appendChild(notificationEl);

      _injectProductInfo.mockImplementation(() => {});

      initLicenseNotification(hotInstance);

      const onActivate = hotInstance.getFocusScopeManager().registerScope.mock.calls[0][2].onActivate;

      expect(() => {
        onActivate('tab_from_above');
        onActivate('tab_from_below');
      }).not.toThrow();
    });
  });
});
