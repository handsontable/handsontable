/**
 * Clean the node_modules, dist and package-locks for the framework directories (and thus, the examples).
 */
import rimraf from 'rimraf';
import { promisify } from 'util';

const rimrafPromisified = promisify(rimraf);

  console.log(`Removing:
  (docs|visual-tests)/(js|ts|angular|angular-*|react|vue)/node_modules
  (docs|visual-tests)/(js|ts|angular|angular-*|react|vue)/**/node_modules
  (docs|visual-tests)/(js|ts|angular|angular-*|react|vue)/**/dist
  (docs|visual-tests)/(js|ts|angular|angular-*|react|vue)/**/.cache
  (docs|visual-tests)/(js|ts|angular|angular-*|react|vue)/package-lock.json
  (docs|visual-tests)/(angular|angular-*)/**/.angular`);

  const removes = [];

  removes.push(rimrafPromisified(`+(docs|visual-tests)/+(js|ts|angular|angular-*|react|vue)/node_modules`));
  removes.push(rimrafPromisified(`+(docs|visual-tests)/+(js|ts|angular|angular-*|react|vue)/@(!(node_modules))/node_modules`));
  removes.push(rimrafPromisified(`+(docs|visual-tests)/+(js|ts|angular|angular-*|react|vue)/@(!(node_modules))/dist`));
  removes.push(rimrafPromisified(`+(docs|visual-tests)/+(js|ts|angular|angular-*|react|vue)/@(!(node_modules))/.cache`));
  removes.push(rimrafPromisified(`+(docs|visual-tests)/+(js|ts|angular|angular-*|react|vue)/package-lock.json`));
  removes.push(rimrafPromisified(`+(docs|visual-tests)/+(angular|angular-*)/@(!(node_modules))/.angular`));

  await Promise.all(removes);

  console.log(`Removing:
  ./node_modules
  ./package-lock.json`);

