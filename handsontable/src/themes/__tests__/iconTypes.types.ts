import type { ThemeIconsConfig, IconRenderer } from '../types';

const svg: ThemeIconsConfig = { arrowRight: '<svg viewBox="0 0 16 16"></svg>' };
const dataUri: ThemeIconsConfig = { arrowRight: 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E' };
const classes: ThemeIconsConfig = { arrowRight: 'ti ti-chevron-right' };
const renderer: IconRenderer = (element, name) => {
  element.textContent = name;
};
const callback: ThemeIconsConfig = { chipClose: renderer, search: renderer };

// @ts-expect-error – numbers are not icon values
const invalid: ThemeIconsConfig = { arrowRight: 12 };

export { svg, dataUri, classes, callback, invalid };
