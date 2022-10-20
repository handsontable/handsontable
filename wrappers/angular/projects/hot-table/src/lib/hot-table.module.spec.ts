import { HotTableModule } from '@tmp-hot/angular';
import { version } from '../../package.json';


describe('HotTableModule', () => {
  it(`should expose information about its version`, () => {
    expect(HotTableModule.version).toBeDefined();
    expect(HotTableModule.version).toBe(version);
  });
});
