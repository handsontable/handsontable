/**
 * Clean the node_modules, dist and package-locks for the framework directories (and thus, the examples).
 */
import rimraf from 'rimraf';

const [version] = process.argv.slice(2);

if (version) {
  console.log(`Removing:
  ${version}/**/(js|ts|angular|angular-*|react|vue)/node_modules
  ${version}/**/(js|ts|angular|angular-*|react|vue)/**/node_modules
  ${version}/**/(js|ts|angular|angular-*|react|vue)/**/dist
  ${version}/**/(js|ts|angular|angular-*|react|vue)/**/.cache
  ${version}/**/(js|ts|angular|angular-*|react|vue)/package-lock.json`);

  rimraf.sync(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/node_modules`);
  rimraf.sync(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/@(!(node_modules))/node_modules`);
  rimraf.sync(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/@(!(node_modules))/dist`);
  rimraf.sync(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/@(!(node_modules))/.cache`);
  rimraf.sync(`${version}/@(!(node_modules))/+(js|ts|angular|angular-*|react|vue)/package-lock.json`);

} else {
  console.log(`Removing:
  ./node_modules
  ./package-lock.json`);

  rimraf.sync('./node_modules');
  rimraf.sync('./package-lock.json');
}
