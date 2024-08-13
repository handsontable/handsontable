import Navigo from 'navigo';
import { initializeDataGrid } from './datagrid';
import { initializeScenarioGrid } from './scenarioGrid';
import { initializeCellTypeDemo } from './demos/cellTypes/cellTypesDemo';

const router = new Navigo('/');

router
  .on({
    '/': function () {
      initializeDataGrid();
    },
    '/scenario-grid': function () {
      initializeScenarioGrid();
    },
    '/cell-types-demo': function () {
      initializeCellTypeDemo();
    },
  })
  .resolve();