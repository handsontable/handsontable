import {
  isChrome,
  isEdge,
  isFirefox,
  isIE,
  isMobileBrowser,
  isMSBrowser,
  isSafari,
  isWindowsOS,
  isMacOS,
  isLinuxOS,
  setBrowserMeta,
  setPlatformMeta,
} from 'handsontable/helpers/browser';

describe('Browser helper', () => {
  describe('isMobileBrowser', () => {
    it('should recognize mobile device properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B411 Safari/600.1.4'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_1_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B435 Safari/600.1.4'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K) AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Linux; U; Android 4.0.3; de-ch; HTC Sensation Build/IML74K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Linux; U; Android 2.3.5; en-us; HTC Vision Build/GRI40) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
      });

      expect(isMobileBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Linux; U; Android 2.3.3; zh-tw; HTC_Pyramid Build/GRI40) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari'
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
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isMobileBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isMobileBrowser()).toBeFalsy();
    });
  });

  describe('isIE', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isIE()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isIE()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10'
      });

      expect(isIE()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
      });

      expect(isIE()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
      });

      expect(isIE()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)'
      });

      expect(isIE()).toBeTruthy();
    });
  });

  describe('isEdge', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isEdge()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isEdge()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10'
      });

      expect(isEdge()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
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
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393'
      });

      expect(isEdge()).toBeTruthy();
    });
  });

  describe('isMSBrowser', () => {
    it('should recognize browser properly', () => {
      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
      });

      expect(isMSBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0'
      });

      expect(isMSBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10'
      });

      expect(isMSBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4'
      });

      expect(isMSBrowser()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
      });

      expect(isMSBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)'
      });

      expect(isMSBrowser()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393'
      });

      expect(isMSBrowser()).toBeTruthy();
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
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
        vendor: 'Microsoft Computer',
      });

      expect(isSafari()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36',
        vendor: 'Apple Computer',
      });

      expect(isSafari()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10',
        vendor: 'Apple Computer',
      });

      expect(isSafari()).toBeTruthy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4',
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
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36',
        vendor: 'Apple Computer',
      });

      expect(isChrome()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10',
        vendor: 'Apple Computer',
      });

      expect(isChrome()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4',
        vendor: 'Apple Computer',
      });

      expect(isChrome()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
        vendor: 'Google Inc.',
      });

      expect(isChrome()).toBeTruthy();
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
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36',
        vendor: 'Apple Computer',
      });

      expect(isFirefox()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10',
        vendor: 'Apple Computer',
      });

      expect(isFirefox()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4',
        vendor: 'Apple Computer',
      });

      expect(isFirefox()).toBeFalsy();

      setBrowserMeta({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
        vendor: 'Google Inc.',
      });

      expect(isFirefox()).toBeFalsy();
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
});
