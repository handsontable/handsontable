import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react-wrapper';

const container = document.querySelector<HTMLElement>('#grid')!;

new Handsontable(container, {
  data: [['a']],
});

const settings = { data: [['b']] };

new Handsontable(container, settings);

new Handsontable(container, {
  data: [['c']],
  licenseKey: 'your-license-key',
});

export const NoKey = () => <HotTable data={[['d']]} />;

export const SettingsNoKey = () => <HotTable settings={{ data: [['e']] }} />;

export const WithKey = () => <HotTable licenseKey="your-license-key" data={[['f']]} />;

export const KeyInSettings = () => <HotTable settings={{ licenseKey: 'your-license-key' }} />;
