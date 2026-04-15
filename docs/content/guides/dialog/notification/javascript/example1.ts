import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = [
  ['Review pricing sheet', 'Draft', 'Apr 12', 'Morgan Lee', 'Medium', 'Finance'],
  ['Ship partner samples', 'In progress', 'Apr 14', 'Jordan Kim', 'High', 'Sales'],
  ['Q2 revenue forecast', 'Done', 'Apr 8', 'Avery Chen', 'Low', 'Finance'],
  ['New client onboarding', 'Blocked', 'Apr 18', 'Riley Patel', 'High', 'Success'],
  ['Update documentation', 'Draft', 'Apr 20', 'Casey Ruiz', 'Low', 'Engineering'],
  ['Audit vendor contracts', 'In progress', 'Apr 22', 'Morgan Lee', 'Medium', 'Legal'],
  ['Refresh brand assets', 'Draft', 'Apr 25', 'Sam Okafor', 'Low', 'Marketing'],
  ['Fix login timeout bug', 'In progress', 'Apr 16', 'Devon Walsh', 'High', 'Engineering'],
  ['Prep board deck', 'Done', 'Apr 10', 'Jordan Kim', 'Medium', 'Exec'],
  ['Migrate legacy CRM rows', 'Blocked', 'Apr 28', 'Alex Rivera', 'High', 'Engineering'],
  ['Schedule user interviews', 'Draft', 'Apr 19', 'Riley Patel', 'Medium', 'Product'],
  ['Approve expense policy', 'In progress', 'Apr 21', 'Morgan Lee', 'Low', 'Finance'],
  ['Localize help center', 'Draft', 'May 2', 'Sam Okafor', 'Medium', 'Marketing'],
  ['Load test checkout API', 'In progress', 'Apr 17', 'Devon Walsh', 'High', 'Engineering'],
  ['Quarterly OKR check-in', 'Done', 'Apr 9', 'Avery Chen', 'Low', 'Exec'],
];

const container = document.getElementById('example1')!;

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Task', 'Status', 'Due', 'Owner', 'Priority', 'Team'],
  columns: [
    { data: 0, type: 'text', width: 200 },
    { data: 1, type: 'text', width: 105 },
    { data: 2, type: 'text', width: 72 },
    { data: 3, type: 'text', width: 120 },
    { data: 4, type: 'text', width: 80 },
    { data: 5, type: 'text', width: 100 },
  ],
  rowHeaders: true,
  width: '100%',
  height: 420,
  notification: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const notification = hot.getPlugin('notification');

notification.showMessage({
  title: 'Top start',
  message: 'Info toast in the top-start corner.',
  variant: 'info',
  position: 'top-start',
  duration: 0,
});
notification.showMessage({
  title: 'Top end',
  message: 'Success toast in the top-end corner.',
  variant: 'success',
  position: 'top-end',
  duration: 0,
});
notification.showMessage({
  title: 'Bottom start',
  message: 'Warning toast in the bottom-start corner.',
  variant: 'warning',
  position: 'bottom-start',
  duration: 0,
});
notification.showMessage({
  title: 'Bottom end',
  message: 'Error toast in the bottom-end corner.',
  variant: 'error',
  position: 'bottom-end',
  duration: 0,
});
