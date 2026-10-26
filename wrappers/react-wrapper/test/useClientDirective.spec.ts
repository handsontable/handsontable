import fs from 'fs';
import path from 'path';

const packageRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

// `exports['.']` is what a bundler loads for `import` and `require` of the package.
// The `dist/` files are script-tag builds and are not part of that module graph.
const clientModuleEntries = [
  packageJson.exports['.'].import,
  packageJson.exports['.'].require,
];

const clientDirective = '\'use client\';';

describe('Published module entries', () => {
  clientModuleEntries.forEach((entry) => {
    it(`should start ${entry} with the use client directive so a Server Component can import HotTable`, () => {
      const source = fs.readFileSync(path.join(packageRoot, entry), 'utf8');
      const body = source.charCodeAt(0) === 0xFEFF ? source.slice(1) : source;

      expect(body.slice(0, clientDirective.length)).toBe(clientDirective);
    });
  });
});
