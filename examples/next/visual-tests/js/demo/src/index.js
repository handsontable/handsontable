// Import global CSS files first
import "handsontable/dist/handsontable.full.css";

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

// Function to dynamically load CSS
function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.className = 'dynamic-css';
  document.head.appendChild(link);
}

// Function to remove dynamically loaded CSS
function removeCSS() {
  const links = document.querySelectorAll('link.dynamic-css');
  links.forEach(link => link.remove());
}

// Initialize the router
const router = new Navigo('/');

// Define routes
router
  .on({
    '/': function () {
      removeCSS();
      loadCSS('./assets/styles.css');
      initializeDataGrid();
    },
    '/two-tables-demo': function () {
      removeCSS();
      loadCSS('./assets/two-tables-demo.css');
      initializeTwoTablesDemo();
    },
    '/cell-types-demo': function () {
      removeCSS();
      loadCSS('./assets/cell-types-demo.css');
      initializeCellTypeDemo();
    },
    '/arabic-rtl-demo': function () {
      removeCSS();
      loadCSS('./assets/arabic-rtl-demo.css');
      initializeArabicRtlDemo();
    },
    '/custom-style-demo': function () {
      removeCSS();
      loadCSS('./assets/custom-style-demo.css');
      initializeCustomStyleDemo();
    },
    '/merged-cells-demo': function () {
      removeCSS();
      loadCSS('./assets/merged-cells-demo.css');
      initializeMergedCellsDemo();
    },
    '/nested-headers-demo': function () {
      removeCSS();
      loadCSS('./assets/nested-headers-demo.css');
      initializeNestedHeadersDemo();
    },
    '/nested-rows-demo': function () {
      removeCSS();
      loadCSS('./assets/nested-rows-demo.css');
      initializeNestedRowsDemo();
    },
  })
  .resolve();