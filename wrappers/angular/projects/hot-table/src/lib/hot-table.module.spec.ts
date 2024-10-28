import { HotTableModule } from '@handsontable/angular';
import packageJson from '../../package.json';

describe('HotTableModule', () => {
  it(`should expose information about its version`, () => {
    expect(HotTableModule.version).toBeDefined();
    expect(HotTableModule.version).toBe(packageJson.version);
  });
});
