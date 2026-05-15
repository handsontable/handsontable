import { objectEach } from './object';
import { isCSR } from './feature';

interface TesterResult {
  value: boolean;
  test: (a: string, b?: string) => void;
}

const tester = (testerFunc: (a: string, b?: string) => boolean): TesterResult => {
  const result: TesterResult = {
    value: false,
    test(_ua: string, _vendor?: string) {
      result.value = testerFunc(_ua, _vendor);
    },
  };

  return result;
};

const browsers: Record<string, TesterResult> = {
  chrome: tester((ua, vendor) => /Chrome/.test(ua) && /Google/.test(vendor ?? '')),
  chromeWebKit: tester(ua => /CriOS/.test(ua)),
  edge: tester(ua => /Edge/.test(ua)),
  edgeWebKit: tester(ua => /EdgiOS/.test(ua)),
  firefox: tester(ua => /Firefox/.test(ua)),
  firefoxWebKit: tester(ua => /FxiOS/.test(ua)),
  mobile: tester(ua => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)),
  safari: tester((ua, vendor) => /Safari/.test(ua) && /Apple Computer/.test(vendor ?? '')),
  safariBefore261: tester((ua, vendor) => {
    if (!/Safari/.test(ua) || !/Apple Computer/.test(vendor ?? '')) {
      return false;
    }
    const match = /Version\/(\d+(?:\.\d+)?)/i.exec(ua);
    const version = match ? Number.parseFloat(match[1]) : 0;

    return version < 26.1;
  }),
};

const platforms: Record<string, TesterResult> = {
  mac: tester(platform => /^Mac/.test(platform)),
  win: tester(platform => /^Win/.test(platform)),
  linux: tester(platform => /^Linux/.test(platform)),
  ios: tester(platform => /iPhone|iPad|iPod/i.test(platform)),
};

/**
 *
 */
export function setBrowserMeta({ userAgent = navigator.userAgent, vendor = navigator.vendor }: {
  userAgent?: string; vendor?: string;
} = {}): void {
  objectEach(browsers, ({ test }) => void test(userAgent, vendor));
}

/**
 *
 */
export function setPlatformMeta({ platform = navigator.platform }: { platform?: string } = {}): void {
  objectEach(platforms, ({ test }) => void test(platform));
}

if (isCSR()) {
  setBrowserMeta();
  setPlatformMeta();
}

/**
 *
 */
export function isChrome(): boolean {
  return browsers.chrome.value;
}

/**
 *
 */
export function isChromeWebKit(): boolean {
  return browsers.chromeWebKit.value;
}

/**
 *
 */
export function isFirefox(): boolean {
  return browsers.firefox.value;
}

/**
 *
 */
export function isFirefoxWebKit(): boolean {
  return browsers.firefoxWebKit.value;
}

/**
 *
 */
export function isSafari(): boolean {
  return browsers.safari.value;
}

/**
 *
 */
export function isSafariBefore261(): boolean {
  return browsers.safariBefore261.value;
}

/**
 *
 */
export function isEdge(): boolean {
  return browsers.edge.value;
}

/**
 *
 */
export function isEdgeWebKit(): boolean {
  return browsers.edgeWebKit.value;
}

/**
 *
 */
export function isMobileBrowser(): boolean {
  return browsers.mobile.value;
}

/**
 *
 */
export function isIOS(): boolean {
  return platforms.ios.value;
}

/**
 *
 */
export function isIpadOS({ maxTouchPoints }: { maxTouchPoints?: number } = navigator): boolean {
  return (maxTouchPoints ?? 0) > 2 && platforms.mac.value;
}

/**
 *
 */
export function isWindowsOS(): boolean {
  return platforms.win.value;
}

/**
 *
 */
export function isMacOS(): boolean {
  return platforms.mac.value;
}

/**
 *
 */
export function isLinuxOS(): boolean {
  return platforms.linux.value;
}
