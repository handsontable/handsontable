const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const PROJECT_ROOT = __dirname.split('examples')[0];
const CODE_SNIPPET_ROOT = __dirname.split('scripts')[0]; // code snippet root is outside the `scripts` directory
const packageJsonPath = path.join(CODE_SNIPPET_ROOT, 'package.json');
const packageJsonFile = require(packageJsonPath);

delete packageJsonFile.devDependencies['jasmine']
delete packageJsonFile.devDependencies['jasmine-console-reporter']
delete packageJsonFile.devDependencies['puppeteer']

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonFile, null, 2));

// Install `jasmine`, `jasmine-terminal-reporter`, `puppeteer` and `http-server` from local root `node_modules`
execSync(`npm install --save-dev ${path.join(PROJECT_ROOT, 'node_modules', 'jasmine')}`, {
  stdio: 'inherit',
  shell: true
});
execSync(`npm install --save-dev ${path.join(PROJECT_ROOT, 'node_modules', 'jasmine-console-reporter')}`, {
  stdio: 'inherit',
  shell: true
});
execSync(`npm install --save-dev ${path.join(PROJECT_ROOT, 'node_modules', 'puppeteer')}`, {
  stdio: 'inherit',
  shell: true
});
