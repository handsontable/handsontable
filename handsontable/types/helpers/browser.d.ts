export function setBrowserMeta({ userAgent, vendor }?: {
    userAgent?: string;
    vendor?: string;
}): void;
export function setPlatformMeta({ platform }?: {
    platform?: string;
}): void;
export function isChrome(): boolean;
export function isChromeWebKit(): boolean;
export function isFirefox(): boolean;
export function isFirefoxWebKit(): boolean;
export function isSafari(): boolean;
export function isEdge(): boolean;
export function isEdgeWebKit(): boolean;
export function isIE(): boolean;
export function isIE9(): boolean;
export function isMSBrowser(): boolean;
export function isMobileBrowser(): boolean;
export function isIOS(): boolean;
export function isIpadOS({ maxTouchPoints }?: {
    maxTouchPoints?: number;
}): boolean;
export function isWindowsOS(): boolean;
export function isMacOS(): boolean;
export function isLinuxOS(): boolean;
