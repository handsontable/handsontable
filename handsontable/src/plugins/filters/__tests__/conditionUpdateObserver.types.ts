import Handsontable from 'handsontable';

const hot = Handsontable(document.createElement('div'), {
  filters: true,
});

const conditionUpdateObserver = hot.getPlugin('filters').conditionUpdateObserver;

if (conditionUpdateObserver) {
  conditionUpdateObserver.groupChanges();
  conditionUpdateObserver.flush();
  conditionUpdateObserver.updateStatesAtColumn(1);
  // The second argument no longer does anything, but the published typings still have to accept it
  // so an existing TypeScript caller keeps compiling after the upgrade.
  conditionUpdateObserver.updateStatesAtColumn(1, {});
  conditionUpdateObserver.updateStatesAtColumn(1, ['A1', 'A2']);
  conditionUpdateObserver.destroy();
}
