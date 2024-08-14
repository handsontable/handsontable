import Vue from 'vue';
import Router from 'vue-router';
import DataGrid from './components/DataGrid.vue';
import ScenarioGrid from './components/ScenarioGrid.vue';

Vue.use(Router);

const routes = [
  { path: '/scenario-grid', component: ScenarioGrid },
  { path: '/', component: DataGrid },
];

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;

