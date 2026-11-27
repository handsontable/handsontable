import Handsontable from 'handsontable';

const dataProvider = { fetchRows: fetchFromServer };

const hot = new Handsontable(document.querySelector('#grid'), { dataProvider });

hot.updateSettings({ data: [] });
hot.updateSettings({ dataProvider });
