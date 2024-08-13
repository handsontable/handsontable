import Navigo from 'navigo';
import { initializeDataGrid } from './datagrid';
import { initializeScenarioGrid } from './scenarioGrid';

const router = new Navigo('/');

router
  .on({
    '/': function () {
      initializeDataGrid();
    },
    '/scenario-grid': function () {
      initializeScenarioGrid();
    }
  })
  .resolve();
