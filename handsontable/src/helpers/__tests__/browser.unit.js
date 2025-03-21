import {
  isChrome,
  isChromeWebKit,
  isEdge,
  isEdgeWebKit,
  isFirefox,
  isFirefoxWebKit,
  isMobileBrowser,
  isSafari,
  isWindowsOS,
  isMacOS,
  isLinuxOS,
  isIOS,
  isIpadOS,
  setBrowserMeta,
  setPlatformMeta,
} from 'handsontable/helpers/browser';

describe('Browser helper', () => {
  describe('isMobileBrowser', () => {
    it('should recognize mobile device properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B411 Safari/600.1.4'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) ' +
          'AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_1_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B435 Safari/600.1.4'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K) ' +
          'AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Linux; U; Android 4.0.3; de-ch; HTC Sensation Build/IML74K) ' +
          'AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Linux; U; Android 2.3.5; en-us; HTC Vision Build/GRI40) ' +
          'AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Linux; U; Android 2.3.3; zh-tw; HTC_Pyramid Build/GRI40) ' +
          'AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'HTC_Touch_3G Mozilla/4.0 (compatible; MSIE 6.0; Windows CE; IEMobile 7.11)'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)'
      });

      expect(isMobileBrowser()).toBeTruthy();
    });

    it('should recognize desktop device properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10) ' +
          'AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) ' +
          'AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) ' +
          'AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isMobileBrowser()).toBeFalsy();
    });
  });

  describe('isEdge', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isEdge()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isEdge()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) ' +
          'AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10'
      });

      expect(isEdge()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
      });

      expect(isEdge()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
      });

      expect(isEdge()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)'
      });

      expect(isEdge()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393'
      });

      expect(isEdge()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5_1 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 EdgiOS/46.3.13 Mobile/15E148 Safari/605.1.15'
      });

      expect(isEdge()).toBeFalsy();
    });
  });

  describe('isEdgeWebKit', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isEdgeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isEdgeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) ' +
          'AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10'
      });

      expect(isEdgeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
      });

      expect(isEdgeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
      });

      expect(isEdgeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)'
      });

      expect(isEdgeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393'
      });

      expect(isEdgeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5_1 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 EdgiOS/46.3.13 Mobile/15E148 Safari/605.1.15'
      });

      expect(isEdgeWebKit()).toBeTruthy();
    });
  });

  describe('isSafari', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0',
        vendor: 'Apple Computer',
      });

      expect(isSafari()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
        vendor: 'Apple Computer',
      });

      expect(isSafari()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)',
        vendor: 'Apple Computer',
      });

      expect(isSafari()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
        vendor: 'Microsoft Computer',
      });

      expect(isSafari()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36',
        vendor: 'Apple Computer',
      });

      expect(isSafari()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) ' +
          'AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10',
        vendor: 'Apple Computer',
      });

      expect(isSafari()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4',
        vendor: 'Apple Computer',
      });

      expect(isSafari()).toBeTruthy();
    });
  });

  describe('isChrome', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0',
        vendor: 'Apple Computer',
      });

      expect(isChrome()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
        vendor: 'Apple Computer',
      });

      expect(isChrome()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)',
        vendor: 'Apple Computer',
      });

      expect(isChrome()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36',
        vendor: 'Apple Computer',
      });

      expect(isChrome()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) ' +
          'AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10',
        vendor: 'Apple Computer',
      });

      expect(isChrome()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4',
        vendor: 'Apple Computer',
      });

      expect(isChrome()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
        vendor: 'Google Inc.',
      });

      expect(isChrome()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.163 Mobile/15E148 Safari/604.1',
      });

      expect(isChrome()).toBeFalsy();
    });
  });

  describe('isChromeWebKit', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0',
        vendor: 'Apple Computer',
      });

      expect(isChromeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
        vendor: 'Apple Computer',
      });

      expect(isChromeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)',
        vendor: 'Apple Computer',
      });

      expect(isChromeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36',
        vendor: 'Apple Computer',
      });

      expect(isChromeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) ' +
          'AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10',
        vendor: 'Apple Computer',
      });

      expect(isChromeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4',
        vendor: 'Apple Computer',
      });

      expect(isChromeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
        vendor: 'Google Inc.',
      });

      expect(isChromeWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.163 Mobile/15E148 Safari/604.1',
      });

      expect(isChromeWebKit()).toBeTruthy();
    });
  });

  describe('isFirefox', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0',
        vendor: 'Apple Computer',
      });

      expect(isFirefox()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
        vendor: 'Apple Computer',
      });

      expect(isFirefox()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)',
        vendor: 'Apple Computer',
      });

      expect(isFirefox()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36',
        vendor: 'Apple Computer',
      });

      expect(isFirefox()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) ' +
          'AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10',
        vendor: 'Apple Computer',
      });

      expect(isFirefox()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4',
        vendor: 'Apple Computer',
      });

      expect(isFirefox()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
        vendor: 'Google Inc.',
      });

      expect(isFirefox()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU OS 14_5_1 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/33.1 Mobile/15E148 Safari/605.1.15',
        vendor: 'Google Inc.',
      });

      expect(isFirefox()).toBeFalsy();
    });
  });

  describe('isFirefoxWebKit', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0',
        vendor: 'Apple Computer',
      });

      expect(isFirefoxWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
        vendor: 'Apple Computer',
      });

      expect(isFirefoxWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)',
        vendor: 'Apple Computer',
      });

      expect(isFirefoxWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36',
        vendor: 'Apple Computer',
      });

      expect(isFirefoxWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) ' +
          'AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10',
        vendor: 'Apple Computer',
      });

      expect(isFirefoxWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4',
        vendor: 'Apple Computer',
      });

      expect(isFirefoxWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
        vendor: 'Google Inc.',
      });

      expect(isFirefoxWebKit()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU OS 14_5_1 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/33.1 Mobile/15E148 Safari/605.1.15',
        vendor: 'Google Inc.',
      });

      expect(isFirefoxWebKit()).toBeTruthy();
    });
  });

  describe('isWindowsOS', () => {
    it('should recognize platform correctly', () => {
      setPlatformMeta({
        platform: 'MacIntel'
      });

      expect(isWindowsOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Linux armv7l'
      });

      expect(isWindowsOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Linux i686'
      });

      expect(isWindowsOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Linux x86_64'
      });

      expect(isWindowsOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'HP-UX'
      });

      expect(isWindowsOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Win'
      });

      expect(isWindowsOS()).toBeTruthy();

      setPlatformMeta({
        platform: 'Win32'
      });

      expect(isWindowsOS()).toBeTruthy();
    });
  });

  describe('isMacOS', () => {
    it('should recognize platform correctly', () => {
      setPlatformMeta({
        platform: 'Win'
      });

      expect(isMacOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Win32'
      });

      expect(isMacOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Linux i686'
      });

      expect(isMacOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Linux x86_64'
      });

      expect(isMacOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'HP-UX'
      });

      expect(isMacOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Mac'
      });

      expect(isMacOS()).toBeTruthy();

      setPlatformMeta({
        platform: 'MacIntel'
      });

      expect(isMacOS()).toBeTruthy();
    });
  });

  describe('isLinuxOS', () => {
    it('should recognize platform correctly', () => {
      setPlatformMeta({
        platform: 'Win'
      });

      expect(isLinuxOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Win32'
      });

      expect(isLinuxOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Mac'
      });

      expect(isLinuxOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'MacIntel'
      });

      expect(isLinuxOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'HP-UX'
      });

      expect(isLinuxOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Linux i686'
      });

      expect(isLinuxOS()).toBeTruthy();

      setPlatformMeta({
        platform: 'Linux x86_64'
      });

      expect(isLinuxOS()).toBeTruthy();
    });
  });

  describe('isIOS', () => {
    it('should recognize platform correctly', () => {
      setPlatformMeta({
        platform: 'Win'
      });

      expect(isIOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Win32'
      });

      expect(isIOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Mac'
      });

      expect(isIOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'MacIntel'
      });

      expect(isIOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'HP-UX'
      });

      expect(isIOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Linux i686'
      });

      expect(isIOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'Linux x86_64'
      });

      expect(isIOS()).toBeFalsy();

      setPlatformMeta({
        platform: 'iPhone'
      });

      expect(isIOS()).toBeTruthy();

      setPlatformMeta({
        platform: 'iPad'
      });

      expect(isIOS()).toBeTruthy();

      setPlatformMeta({
        platform: 'iPod'
      });

      expect(isIOS()).toBeTruthy();
    });
  });

  describe('isIpadOS', () => {
    it('should recognize iPadOS correctly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isIpadOS()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isIpadOS()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) ' +
          'AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10'
      });

      expect(isIpadOS()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) ' +
          'AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
      });

      expect(isIpadOS()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
      });

      expect(isIpadOS()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)'
      });

      expect(isIpadOS()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393'
      });

      expect(isIpadOS()).toBeFalsy();

      // mock navigator for iPad Pro (9.7-inch) - iOS 14.3 to overwrite maxTouchPoints read-only property
      const navigator = {
        maxTouchPoints: 5
      };

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) ' +
        'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15' // iPad Pro (9.7-inch) - iOS 14.3
      });

      setPlatformMeta({
        platform: 'MacIntel'
      });

      expect(isIpadOS(navigator)).toBeTruthy();
    });
  });
});
