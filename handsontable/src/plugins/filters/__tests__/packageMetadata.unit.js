import fs from 'fs';
import path from 'path';

describe('package metadata', () => {
  it('should mark filter condition modules as side effects', () => {
    const packageJSONPath = path.resolve(__dirname, '../../../../package.json');
    const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));

    expect(packageJSON.sideEffects).toEqual(expect.arrayContaining([
      './plugins/filters/condition/**'
    ]));
  });
});
