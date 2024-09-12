import Navigo from 'navigo';

import { initializeTwoTablesDemo } from './demos/twoTables/twoTablesDemo';
import { initializeCellTypeDemo } from './demos/cellTypes/cellTypesDemo';
import { initializeArabicRtlDemo } from './demos/arabicRtl/arabicRtlDemo';
import { initializeCustomStyleDemo } from './demos/customStyle/customStyleDemo';
import { initializeMergedCellsDemo } from './demos/mergedCells/mergedCellsDemo';
import { initializeNestedHeadersDemo } from './demos/nestedHeaders/nestedHeadersDemo';
import { initializeNestedRowsDemo } from './demos/nestedRows/nestedRowsDemo';
import { initializeDataGrid } from './datagrid';


const router = new Navigo('/');

router
  .on({
    '/': function () {
      initializeDataGrid();
    },
    '/two-tables-demo': function () {
      initializeTwoTablesDemo();
    },
    '/cell-types-demo': function () {
      initializeCellTypeDemo();
    },
    '/arabic-rtl-demo': function () {
      initializeArabicRtlDemo();
    },
    '/custom-style-demo': function () {
      initializeCustomStyleDemo();
    },
    '/merged-cells-demo': function () {
      initializeMergedCellsDemo();
    },
    '/nested-headers-demo': function () {
      initializeNestedHeadersDemo();
    },
    '/nested-rows-demo': function () {
      initializeNestedRowsDemo();
    }
  })
  .resolve();

