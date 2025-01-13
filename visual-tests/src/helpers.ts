import path from 'path';
import os from 'os';
import { URLSearchParams } from 'url';
import { EXAMPLES_SERVER_PORT } from './config.mjs';

export const helpers = {
  defaultHOTFramework: 'js',

  screenshotsDirectory: './screenshots',
  screenshotsExtension: 'png',

  selectors: {
    anyTable: '#root .handsontable',
    mainTable: '#root > .handsontable',
    themesMainTable: '#root',
    mainTableBody: '> .ht_master.handsontable table tbody',
    cloneTopTable: '> .ht_clone_top.handsontable table thead',
    cloneInlineStartTable: '> .ht_clone_inline_start.handsontable table tbody',
    cloneInlineStartCornerTable:
      '> .ht_clone_top_inline_start_corner.handsontable table thead',
    dropdownMenu: '.htMenu.htDropdownMenu.handsontable',
    contextMenu: '.htMenu.htContextMenu.handsontable',
  },

  cssFiles: {
    cookieInfo: 'remove-cookie-info.css',
    changeCellsBackground: 'change-cells-background.css',
    changeCellTextColor: 'change-cell-text-color.css',
    dynamicDataFreeze: 'dynamic-data-freeze.css',
  },

  expectedPageTitle: /Handsontable for .* example/,

  pageParams: {},
  baseUrl: '/',
  hotWrapper: '',
  hotTheme: '',
  testURL: `http://localhost:${EXAMPLES_SERVER_PORT}/`,
  isMac: true,
  modifier: 'Meta' as 'Meta' | 'Control',
  screenshotsCount: 0,
  browser: '',
  testFilePath: '',
  testedPageUrl: '',

  cssPath(file: string) {
    return `./tests-css/${file}`;
  },

  init() {
    this.hotWrapper = process.env.HOT_FRAMEWORK ?? this.defaultHOTFramework;
    this.hotTheme = process.env.HOT_THEME ?? '';
    this.isMac = os.platform() === 'darwin';
    this.modifier = this.isMac ? 'Meta' : 'Control';
  },

  setTestDetails(details) {
    this.testFilePath = details.testFilePath;
    this.screenshotDirName = path.relative(details.rootDir, details.testFilePath).replace(/\.spec\.ts$/, '');
    this.browser = details.browser;
    this.testedPageUrl = details.testedPageUrl;
  },

  getSearchUrlParams() {
    // eslint-disable-next-line prefer-template
    return '?' + new URLSearchParams({
      ...(process.env.HOT_THEME ? { theme: process.env.HOT_THEME } : undefined),
      ...this.pageParams,
    }).toString();
  },

  setBaseUrl(url: string) {
    this.baseUrl = url;

    return this;
  },

  setPageParams(params: Record<string, string>) {
    this.pageParams = params;

    return this;
  },

  getFullUrl() {
    return this.baseUrl + this.getSearchUrlParams();
  },

  findCell({ row = 0, column = 0, cellType = 'td' }) {
    return `> tr:nth-of-type(${row + 1}) > ${cellType}:nth-of-type(${
      column + 1
    })`;
  },

  findDropdownMenuExpander({ col = 1 }) {
    return `${this.selectors.cloneTopTable} > tr > th:nth-of-type(${
      col + 1
    }) button.changeType`;
  },

  findCellEditor() {
    return 'textarea.handsontableInput';
  },

  testTitle(filename: string) {
    const title = filename.split('.spec.ts')[0].split('-').join(' ');

    return `${title.substring(0, 1).toUpperCase()}${title.substring(1)}`;
  },

  screenshotPath() {
    this.screenshotsCount += 1;

    if (this.testFilePath.includes('/cross-browser/')) {
      let safeUrl = new URL(this.testedPageUrl).pathname.replace(/[^\w]/g, '-');

      safeUrl = safeUrl === '-' ? '' : safeUrl;

      return path.join(
        this.screenshotsDirectory,
        'cross-browser',
        this.browser,
        `${this.screenshotDirName}${safeUrl}-${this.screenshotsCount}.${this.screenshotsExtension}`,
      );
    }

    return path.join(
      this.screenshotsDirectory,
      this.hotWrapper,
      `${this.browser}${this.hotTheme ? '-theme-' + this.hotTheme : ''}`, // eslint-disable-line prefer-template
      `${this.screenshotDirName}-${this.screenshotsCount}.${this.screenshotsExtension}`,
    );
  },
};
