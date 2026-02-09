import { objectEach } from './object';
import { isCSR } from './feature';

const tester = (testerFunc: (...args: unknown[]) => boolean) => {
  const result: { value: boolean; test: (ua: string, vendor: string) => void } = {
    value: false,
    test: undefined,
  };

  result.test = (ua: string, vendor: string) => {
    result.value = testerFunc(ua, vendor);
  };

  return result;
};

const browsers = {
  chrome: tester((ua: string, vendor: string) => /Chrome/.test(ua) && /Google/.test(vendor)),
  chromeWebKit: tester((ua: string) => /CriOS/.test(ua)),
  edge: tester((ua: string) => /Edge/.test(ua)),
  edgeWebKit: tester((ua: string) => /EdgiOS/.test(ua)),
  firefox: tester((ua: string) => /Firefox/.test(ua)),
  firefoxWebKit: tester((ua: string) => /FxiOS/.test(ua)),
  mobile: tester((ua: string) => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)),
  safari: tester((ua: string, vendor: string) => /Safari/.test(ua) && /Apple Computer/.test(vendor)),
};

const platforms = {
  mac: tester((platform: string) => /^Mac/.test(platform)),
  win: tester((platform: string) => /^Win/.test(platform)),
  linux: tester((platform: string) => /^Linux/.test(platform)),
  ios: tester((platform: string) => /iPhone|iPad|iPod/i.test(platform)),
};

/**
 * @param {object} [metaObject] The browser identity collection.
 * @param {object} [metaObject.userAgent] The user agent reported by browser.
 * @param {object} [metaObject.vendor] The vendor name reported by browser.
 */
export function setBrowserMeta({ userAgent = navigator.userAgent, vendor = navigator.vendor }: { userAgent?: string; vendor?: string } = {}): void {
  objectEach(browsers as unknown as Record<string, unknown>, ({ test }) => void test(userAgent, vendor));
}

/**
 * @param {object} [metaObject] The platform identity collection.
 * @param {object} [metaObject.platform] The platform ID.
 */
export function setPlatformMeta({ platform = navigator.platform }: { platform?: string } = {}): void {
  objectEach(platforms as unknown as Record<string, unknown>, ({ test }) => void test(platform));
}

if (isCSR()) {
  setBrowserMeta();
  setPlatformMeta();
}

/**
 * @returns {boolean}
 */
export function isChrome(): boolean {
  return browsers.chrome.value;
}

/**
 * @returns {boolean}
 */
export function isChromeWebKit(): boolean {
  return browsers.chromeWebKit.value;
}

/**
 * @returns {boolean}
 */
export function isFirefox(): boolean {
  return browsers.firefox.value;
}

/**
 * @returns {boolean}
 */
export function isFirefoxWebKit(): boolean {
  return browsers.firefoxWebKit.value;
}

/**
 * @returns {boolean}
 */
export function isSafari(): boolean {
  return browsers.safari.value;
}

/**
 * @returns {boolean}
 */
export function isEdge(): boolean {
  return browsers.edge.value;
}

/**
 * @returns {boolean}
 */
export function isEdgeWebKit(): boolean {
  return browsers.edgeWebKit.value;
}

/**
 * @returns {boolean}
 */
export function isMobileBrowser(): boolean {
  return browsers.mobile.value;
}

/**
 * @returns {boolean}
 */
export function isIOS(): boolean {
  return platforms.ios.value;
}

/**
 * A hacky way to recognize the iPad. Since iOS 13, the iPad on Safari mimics macOS behavior and user agent.
 *
 * @see {@https://stackoverflow.com/a/57838385}
 * @param {object} [metaObject] The browser identity collection.
 * @param {number} [metaObject.maxTouchPoints] The maximum number of simultanous touch points.
 * @returns {boolean}
 */
export function isIpadOS({ maxTouchPoints }: { maxTouchPoints?: number } = navigator): boolean {
  return maxTouchPoints > 2 && platforms.mac.value;
}

/**
 * @returns {boolean}
 */
export function isWindowsOS(): boolean {
  return platforms.win.value;
}

/**
 * @returns {boolean}
 */
export function isMacOS(): boolean {
  return platforms.mac.value;
}

/**
 * @returns {boolean}
 */
export function isLinuxOS(): boolean {
  return platforms.linux.value;
}
