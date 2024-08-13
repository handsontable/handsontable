import Navigo from 'navigo';
import { initializeDataGrid } from './datagrid';
import { initializeScenarioGrid } from './scenarioGrid';
import { initializeEditorsGrid } from './editorsGrid';

const router = new Navigo('/');

router
  .on({
    '/': function () {
      initializeDataGrid();
    },
    '/scenario-grid': function () {
      initializeScenarioGrid();
    },
    '/editors-grid': function () {
      initializeEditorsGrid();
    },
  })
  .resolve();
