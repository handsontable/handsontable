const path = require('path');
const fsExtra = require('fs-extra');
const execa = require('execa');

const TMP_DIR_FOR_WATCH = '.watch-tmp';
const FRAMEWORK_SUFFIX = '-data-grid';
const versionFromBranchRegExp = /^prod-docs\/(\d+\.\d+)$/;
let docsVersion = null;

// Please keep in mind that the first element is default framework.
const frameworkToPrettyName = new Map([
  ['javascript', 'JavaScript'],
  ['react', 'React'],
]);

/**
 * Get whether we work in dev mode (watch script).
 *
 * @returns {boolean}
 */
function isEnvDev() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Gets all available frameworks.
 *
 * @returns {string[]}
 */
function getFrameworks() {
  return Array.from(frameworkToPrettyName.keys());
}

/**
 * Gets default framework.
 *
 * @returns {string}
 */
function getDefaultFramework() {
  return getFrameworks()[0];
}

/**
 * Get pretty framework name.
 *
 * @param {string} framework Framework ID.
 * @returns {string}
 */
function getPrettyFrameworkName(framework) {
  return frameworkToPrettyName.get(framework);
}

/**
 * Gets the current (this) version of docs.
 *
 * @returns {string}
 */
function getThisDocsVersion() {
  if (docsVersion === null) {
    const branchName = execa.sync('git rev-parse --abbrev-ref HEAD', { shell: true }).stdout;

    if (versionFromBranchRegExp.test(branchName)) {
      docsVersion = branchName.match(versionFromBranchRegExp)[1];
    } else {
      docsVersion = 'next';
    }
  }

  return docsVersion;
}

/**
 * Gets the sidebar object for docs.
 *
 * @returns {object}
 */
function getSidebars() {
  const sidebars = { };
  const frameworks = getFrameworks();
  const getTransformedGuides = (guides, currentFramework) => {
    const filterElementsForFramework = element =>
      (Array.isArray(element.onlyFor) && element.onlyFor.includes(currentFramework)) ||
      (typeof element.onlyFor === 'string' && element.onlyFor === currentFramework) ||
      typeof element.onlyFor === 'undefined';
    const guidesSections = JSON.parse(JSON.stringify(guides)); // Copy sidebar definition
    const filteredGuidesSections = guidesSections.filter(filterElementsForFramework);

    filteredGuidesSections.forEach((filteredGuidesSection) => {
      filteredGuidesSection.children = filteredGuidesSection.children.reduce((newGuides, guide) => {
        if (filterElementsForFramework(guide)) {
          newGuides.push(guide.path);
        }

        return newGuides;
      }, []);
    });

    return filteredGuidesSections;
  };

  // eslint-disable-next-line
  const sidebarConfig = require(path.join(__dirname, '../content/sidebars.js'));

  if (isEnvDev()) {
    frameworks.forEach((framework) => {
      const apiTransformed = JSON.parse(JSON.stringify(sidebarConfig.api)); // Copy sidebar definition
      const plugins = apiTransformed.find(arrayElement => typeof arrayElement === 'object');

      // We store path in sidebars.js files in form <VERSION>/api/plugins.
      plugins.path = `/${TMP_DIR_FOR_WATCH}/${framework}${FRAMEWORK_SUFFIX}/api/plugins`;

      sidebars[`/${TMP_DIR_FOR_WATCH}/${framework}${FRAMEWORK_SUFFIX}/examples/`] = sidebarConfig.examples;
      sidebars[`/${TMP_DIR_FOR_WATCH}/${framework}${FRAMEWORK_SUFFIX}/api/`] = apiTransformed;
      sidebars[`/${TMP_DIR_FOR_WATCH}/${framework}${FRAMEWORK_SUFFIX}/`] =
        getTransformedGuides(sidebarConfig.guides, framework);
    });

  } else {
    const framework = getEnvDocsFramework();

    sidebars[`/${framework}/examples/`] = sidebarConfig.examples;
    sidebars[`/${framework}/api/`] = sidebarConfig.api;
    sidebars[`/${framework}/`] = getTransformedGuides(sidebarConfig.guides, framework);
  }

  return sidebars;
}

/**
 * Removes temporary directory from the path when needed.
 *
 * @param {string} normalizedPath Path for unification.
 * @returns {string}
 */
function getNormalizedPath(normalizedPath) {
  if (isEnvDev()) {
    return normalizedPath.replace(new RegExp(`^/?${TMP_DIR_FOR_WATCH}`), '');
  }

  if (normalizedPath[0] !== '/') {
    normalizedPath = `/${normalizedPath}`;
  }

  return normalizedPath;
}

/**
 * Get object containing list of not searchable links from the guides section for specific version of documentation.
 *
 * @returns {object}
 */
function getNotSearchableLinks() {
  const frameworks = getFrameworks();
  const notSearchableLinks = {};

  const filterLinks = (guides, framework) => {
    const links = [];
    const isNotSearchable = element =>
      (Array.isArray(element.onlyFor) && element.onlyFor.includes(framework) === false) ||
      (typeof element.onlyFor === 'string' && element.onlyFor !== framework);

    guides.forEach((guideSection) => {
      if (isNotSearchable(guideSection)) {
        links.push(...guideSection.children.map(guide => guide.path));

      } else {
        guideSection.children.forEach((guide) => {
          if (isNotSearchable(guide)) {
            links.push(guide.path);
          }
        });
      }
    });

    return links;
  };

  // eslint-disable-next-line
  const sidebarConfig = require(path.join(__dirname, `../content/sidebars.js`));

  frameworks.forEach((framework) => {
    notSearchableLinks[framework] = filterLinks(sidebarConfig.guides, framework);
  });

  return notSearchableLinks;
}

/**
 * Get ignored files for particular build.
 *
 * Note: Please keep in mind that this method is useful only for full build.
 *
 * @param {string} buildMode The env name.
 * @returns {Array<string>}
 */
function getIgnoredFilesPatterns(buildMode) {
  if (isEnvDev() === false) {
    const notSearchableLinks = getNotSearchableLinks(buildMode);
    const framework = getEnvDocsFramework();

    return notSearchableLinks[framework].map(excludedPath => `!content/${excludedPath}.md`);
  }

  return [];
}

/**
 * Parses the docs framework from the URL.
 *
 * @param {string} url The URL to parse.
 * @returns {string}
 */
function parseFramework(url) {
  const potentialFramework = getNormalizedPath(url).split('/')[2]?.replace(FRAMEWORK_SUFFIX, '');

  if (getFrameworks().includes(potentialFramework)) {
    return potentialFramework;
  }
}

/**
 * Gets docs version that is currently building (based on the environment variable).
 *
 * @returns {string}
 */
function getEnvDocsVersion() {
  return process.env.DOCS_VERSION;
}

/**
 * Gets docs framework that is currently building (based on the environment variable).
 *
 * @returns {string}
 */
function getEnvDocsFramework() {
  return process.env.DOCS_FRAMEWORK;
}

/**
 * Create symlinks needed for vuepress dev script.
 */
function createSymlinks() {
  if (isEnvDev()) {
    fsExtra.removeSync(TMP_DIR_FOR_WATCH);

    getFrameworks().forEach((framework) => {
      fsExtra.ensureSymlinkSync('content', `./${TMP_DIR_FOR_WATCH}/${framework}${FRAMEWORK_SUFFIX}`);
    });
  }
}

/**
 * Gets docs base url (eq: https://handsontable.com).
 *
 * @returns {string}
 */
function getDocsBaseUrl() {
  return `https://${process.env.BUILD_MODE === 'staging' ? 'dev.' : ''}handsontable.com`;
}

module.exports = {
  TMP_DIR_FOR_WATCH,
  FRAMEWORK_SUFFIX,
  getNormalizedPath,
  getFrameworks,
  getPrettyFrameworkName,
  getSidebars,
  getNotSearchableLinks,
  parseFramework,
  getEnvDocsFramework,
  getEnvDocsVersion,
  getDefaultFramework,
  isEnvDev,
  createSymlinks,
  getThisDocsVersion,
  getDocsBaseUrl,
  getIgnoredFilesPatterns,
};
