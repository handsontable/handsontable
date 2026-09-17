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

const MOBILE_BROWSER_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/**
 * Navigator-shaped input for the browser/platform helpers.
 *
 * When the whole argument is omitted, `userAgent` and `platform` use the
 * {@link setBrowserMeta} / {@link setPlatformMeta} caches, and `maxTouchPoints`
 * is read from the live `navigator`. When an object is passed, only the fields
 * it provides are used: a missing `userAgent` or `platform` still uses the
 * cache, and a missing `maxTouchPoints` is `0`. A custom navigator is never
 * mixed with the process-wide cache for a field it actually provides.
 */
type NavigatorLike = {
  userAgent?: string;
  maxTouchPoints?: number;
  platform?: string;
};

const browsers: Record<string, TesterResult> = {
  chrome: tester((ua, vendor) => /Chrome/.test(ua) && /Google/.test(vendor ?? '')),
  chromeWebKit: tester(ua => /CriOS/.test(ua)),
  edge: tester(ua => /Edge/.test(ua)),
  edgeWebKit: tester(ua => /EdgiOS/.test(ua)),
  firefox: tester(ua => /Firefox/.test(ua)),
  firefoxWebKit: tester(ua => /FxiOS/.test(ua)),
  mobile: tester(ua => MOBILE_BROWSER_UA.test(ua)),
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
  objectEach(browsers, ({ test }) => test(userAgent, vendor));
}

/**
 *
 */
export function setPlatformMeta({ platform = navigator.platform }: { platform?: string } = {}): void {
  objectEach(platforms, ({ test }) => test(platform));
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
 * Returns `true` when the user-agent matches a mobile device.
 *
 * With no argument, uses the UA cached by {@link setBrowserMeta} at module load (or the last
 * `setBrowserMeta` call). Passing `{ userAgent }` evaluates that string instead, so a custom
 * navigator is not mixed with the process-wide cache.
 *
 * @param {object} [navigatorLike] Navigator-like object. Omit to use the cached UA.
 * @param {string} [navigatorLike.userAgent] User-agent to test.
 * @returns {boolean}
 */
export function isMobileBrowser(navigatorLike?: NavigatorLike): boolean {
  if (typeof navigatorLike?.userAgent === 'string') {
    return MOBILE_BROWSER_UA.test(navigatorLike.userAgent);
  }

  return browsers.mobile.value;
}

/**
 *
 */
export function isIOS(): boolean {
  return platforms.ios.value;
}

/**
 * Returns `true` on iPadOS 13+, which reports a desktop Macintosh UA (`MacIntel` +
 * `maxTouchPoints > 2`).
 *
 * `maxTouchPoints` is read from the argument, or from the live `navigator` when omitted.
 * `platform` is read from the argument when provided; otherwise it uses the value cached by
 * {@link setPlatformMeta}. The no-arg path keeps that cache authoritative.
 *
 * @param {object} [navigatorLike] Navigator-like object. Omit for live `maxTouchPoints` and the
 * cached platform.
 * @param {number} [navigatorLike.maxTouchPoints] Maximum simultaneous touch points.
 * @param {string} [navigatorLike.platform] Navigator platform string.
 * @returns {boolean}
 */
export function isIpadOS(navigatorLike?: NavigatorLike): boolean {
  const maxTouchPoints = (navigatorLike ?? navigator).maxTouchPoints ?? 0;
  const isMac = typeof navigatorLike?.platform === 'string'
    ? /^Mac/.test(navigatorLike.platform)
    : platforms.mac.value;

  return maxTouchPoints > 2 && isMac;
}

/**
 * Returns `true` on a mobile user-agent, or on iPadOS that reports a desktop Macintosh UA
 * (iPadOS 13+). Use this for touch-first UI such as mobile selection handles and the `.mobile`
 * CSS class. Do not use it to skip mouse listeners: Walkontable `event.ts` must keep
 * `isMobileBrowser()` so dual-listener devices still register both sets. Do not use
 * it to hide desktop mouse-driven affordances iPad should keep (`moveCells`).
 *
 * @param {object} [navigatorLike] Navigator-like object. Omit to use the cached UA, the live
 * `maxTouchPoints`, and the cached platform.
 * @param {string} [navigatorLike.userAgent] User-agent forwarded to {@link isMobileBrowser}.
 * @param {number} [navigatorLike.maxTouchPoints] Maximum simultaneous touch points.
 * @param {string} [navigatorLike.platform] Navigator platform string.
 * @returns {boolean}
 */
export function isMobileOrIpadOS(navigatorLike?: NavigatorLike): boolean {
  return isMobileBrowser(navigatorLike) || isIpadOS(navigatorLike);
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
