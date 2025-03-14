import "./styles/styles.css";

// Import JavaScript modules
import Navigo from 'navigo';
import { init as initDefaultDemo } from './demos/default';
import { init as initTwoTablesDemo } from './demos/twoTables';
import { init as initCellTypeDemo } from './demos/cellTypes';
import { init as initArabicRtlDemo } from './demos/arabicRtl';
import { init as initCustomStyleDemo } from './demos/customStyle';
import { init as initMergedCellsDemo } from './demos/mergedCells';
import { init as initNestedHeadersDemo } from './demos/nestedHeaders';
import { init as initNestedRowsDemo } from './demos/nestedRows';
import { init as initComplexDemo } from './demos/complex';
import { init as initBasicTwoTablesDemo } from "./demos/basicTwoTables";
import { init as initContextMenuDemo } from "./demos/contextMenu";
import { init as initDropdownMenuDemo } from "./demos/dropdownMenu";

// Function to dynamically load CSS
function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.className = 'dynamic-css';

  return new Promise((resolve, reject) => {
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

// Function to remove dynamically loaded CSS
function removeCSS() {
  const links = document.querySelectorAll('link.dynamic-css');
  links.forEach(link => link.remove());
}

function loadThemeCSS() {
  const urlParams = new URLSearchParams(window.location.search);
  const theme = urlParams.get('theme');
  const baseLink = document.createElement('link');
  const themeLink = document.createElement('link');

  baseLink.rel = 'stylesheet';
  baseLink.className = 'dynamic-css';
  themeLink.rel = 'stylesheet';
  themeLink.className = 'dynamic-css';

  if (theme === 'main' || theme === 'main-dark') {
    baseLink.href = `/assets/handsontable/styles/handsontable.css`;
    themeLink.href = `/assets/handsontable/styles/ht-theme-main.css`;

  } else if (theme === 'horizon' || theme === 'horizon-dark') {
    baseLink.href = `/assets/handsontable/styles/handsontable.css`;
    themeLink.href = `/assets/handsontable/styles/ht-theme-horizon.css`;

  } else {
    baseLink.href = `/assets/handsontable/dist/handsontable.full.css`;
  }

  const baseLinkPromise = new Promise((resolve, reject) => {
    baseLink.onload = resolve;
    baseLink.onerror = reject;
  });
  const themeLinkPromise = new Promise((resolve, reject) => {
    themeLink.onload = resolve;
    themeLink.onerror = reject;
  });

  [baseLink, themeLink].forEach((link) => {
    if (link.href) {
      document.head.appendChild(link);
    }
  });

  return Promise.all([baseLinkPromise, themeLink.href ? themeLinkPromise : null]);
}

// Initialize the router
const router = new Navigo('/');

// Define routes
router
  .on({
    '/': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/styles.css'),
        loadThemeCSS(),
      ]).then(() => {
        initDefaultDemo();
      });
    },
    '/two-tables-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/two-tables-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initTwoTablesDemo();
      });
    },
    '/cell-types-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/cell-types-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initCellTypeDemo();
      });
    },
    '/arabic-rtl-demo': function () {
      removeCSS();

      Promise.all([
        loadThemeCSS(),
      ]).then(() => {
        initArabicRtlDemo();
      });
    },
    '/custom-style-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/custom-style-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initCustomStyleDemo();
      });
    },
    '/merged-cells-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/merged-cells-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initMergedCellsDemo();
      });
    },
    '/nested-headers-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/nested-headers-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initNestedHeadersDemo();
      });
    },
    '/nested-rows-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/nested-rows-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initNestedRowsDemo();
      });
    },
    '/complex-demo': function () {
      removeCSS();

      Promise.all([
        loadThemeCSS(),
      ]).then(() => {
        initComplexDemo();
      });
    },
    '/basic-two-tables-demo': function () {
      removeCSS();

      Promise.all([
        loadThemeCSS(),
      ]).then(() => {
        initBasicTwoTablesDemo();
      });
    },
    '/context-menu-demo': function () {
      removeCSS();

      Promise.all([
        loadThemeCSS(),
      ]).then(() => {
        initContextMenuDemo();
      });
    },
    '/dropdown-menu-demo': function () {
      removeCSS();

      Promise.all([
        loadThemeCSS(),
      ]).then(() => {
        initDropdownMenuDemo();
      });
    },
  })
  .resolve();
