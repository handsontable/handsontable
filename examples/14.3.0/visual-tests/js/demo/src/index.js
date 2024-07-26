import Navigo from 'navigo';
import { initializeDataGrid } from './datagrid';

const root = null;
const useHash = true; // Defaults to: false
const hash = '#!'; // Defaults to: '#'
const router = new Navigo(root, useHash, hash);

router
  .on({
    '/': function () {
      initializeDataGrid();
    },
    '/another': function () {
      // display your another page
    }
  })
  .resolve();