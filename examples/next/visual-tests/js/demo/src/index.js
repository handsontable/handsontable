import "./styles/styles.css";

// Import JavaScript modules
import Navigo from 'navigo';
import { initializeDataGrid } from './datagrid';
import { initializeTwoTablesDemo } from './demos/twoTables/twoTablesDemo';
import { initializeCellTypeDemo } from './demos/cellTypes/cellTypesDemo';
import { initializeArabicRtlDemo } from './demos/arabicRtl/arabicRtlDemo';
import { initializeCustomStyleDemo } from './demos/customStyle/customStyleDemo';
import { initializeMergedCellsDemo } from './demos/mergedCells/mergedCellsDemo';
import { initializeNestedHeadersDemo } from './demos/nestedHeaders/nestedHeadersDemo';
import { initializeNestedRowsDemo } from './demos/nestedRows/nestedRowsDemo';
import { initializeComplexDemo } from './demos/complex/complexDemo';

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
        initializeDataGrid();
      });
    },
    '/two-tables-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/two-tables-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initializeTwoTablesDemo();
      });
    },
    '/cell-types-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/cell-types-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initializeCellTypeDemo();
      });
    },
    '/arabic-rtl-demo': function () {
      removeCSS();

      Promise.all([
        loadThemeCSS(),
      ]).then(() => {
        initializeArabicRtlDemo();
      });
    },
    '/custom-style-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/custom-style-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initializeCustomStyleDemo();
      });
    },
    '/merged-cells-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/merged-cells-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initializeMergedCellsDemo();
      });
    },
    '/nested-headers-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/nested-headers-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initializeNestedHeadersDemo();
      });
    },
    '/nested-rows-demo': function () {
      removeCSS();

      Promise.all([
        loadCSS('./assets/nested-rows-demo.css'),
        loadThemeCSS(),
      ]).then(() => {
        initializeNestedRowsDemo();
      });
    },
    '/complex-demo': function () {
      removeCSS();

      Promise.all([
        loadThemeCSS(),
      ]).then(() => {
        initializeComplexDemo();
      });
    },
  })
  .resolve();
