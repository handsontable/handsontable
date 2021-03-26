import { execSync } from 'child_process';
import path from 'path';

const gitDiffResult = execSync('git diff --name-only HEAD HEAD~1 | cat', { encoding: 'utf-8' });
const versionRegexp = /[\d].[\d].[\d]/g; // look for 7.2.0, 8.1.0, 8.3.0, etc.
const iterator = gitDiffResult.matchAll(versionRegexp);

const [hotVersion] = process.argv.slice(2);

let changedExamplesFolders = [];
let result = iterator.next();

while (!result.done) {
  if (result.value?.input.includes(path.join('examples', result.value[0]))) { // get folders only within examples/
    changedExamplesFolders.push(result.value[0]); // push example's folder names
  }
  result = iterator.next();
  
  changedExamplesFolders = [...new Set(changedExamplesFolders)]; // remove duplicates
}

function returnValue(value) {
  return value;
}

if (hotVersion) {
  console.log(returnValue(JSON.stringify([hotVersion])));
} else {
  console.log(returnValue(JSON.stringify(changedExamplesFolders)));
}

