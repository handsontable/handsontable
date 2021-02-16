import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  filters: true,
});

const conditionUpdateObserver = hot.getPlugin('filters').conditionUpdateObserver;

if (conditionUpdateObserver) {
  conditionUpdateObserver.groupChanges();
  conditionUpdateObserver.flush();
  conditionUpdateObserver.updateStatesAtColumn(1, {});
  conditionUpdateObserver.destroy();
}
