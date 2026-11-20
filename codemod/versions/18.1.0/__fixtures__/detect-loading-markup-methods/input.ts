import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector<HTMLElement>('#grid')!, { licenseKey: 'your-license-key' });
const loading = hot.getPlugin('loading');

loading.show({ title: 'Loading <strong>sales data</strong>' });
hot.getPlugin('loading').update({ description: `Step 1 of 3<br>This can take a minute` });

// Plain text is the supported form.
loading.show({ title: 'Loading sales data', description: 'Step 1 of 3. This can take a minute.' });
