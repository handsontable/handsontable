const fs = require('fs');
const path = require('path');
const semver = require('semver');
const fsExtra = require('fs-extra');

const unsortedVersions = fs.readdirSync(path.join(__dirname, '..'))
  .filter(f => semver.valid(semver.coerce(f)));

const availableVersions = unsortedVersions.sort((a, b) => semver.rcompare(semver.coerce(a), semver.coerce((b))));
const TMP_DIR_FOR_WATCH = '.watch-tmp';
const MIN_FRAMEWORKED_DOCS_VERSION = '12.1.0';
const FRAMEWORK_SUFFIX = '-data-grid';

// Please keep in mind that the first element is default framework.
const frameworkToPrettyName = new Map([
  ['javascript', 'JavaScript'],
  ['react', 'React'],
  ['angular', 'Angular'],
  ['vue2', 'Vue 2'],
  ['vue3', 'Vue 3'],
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
 * Gets version of documentation which should be build for particular framework.
 *
 * @param {string} buildMode The env name.
 * @returns {Array}
 */
function getDocsFrameworkedVersions(buildMode) {
  const versions = getVersions(buildMode);

  return versions.filter(version => version === 'next' ||
    semver.gte(semver.coerce(version), semver.coerce(MIN_FRAMEWORKED_DOCS_VERSION)));
}

/**
 * Gets version of documentation which should be build only in one version (no separate builds for particular framework).
 *
 * @param {string} buildMode The env name.
 * @returns {Array}
 */
function getDocsNonFrameworkedVersions(buildMode) {
  const versions = getVersions(buildMode);

  return versions.filter(version => version !== 'next' &&
    semver.lt(semver.coerce(version), semver.coerce(MIN_FRAMEWORKED_DOCS_VERSION)));
}

/**
 * Gets all available docs versions.
 *
 * @param {string} buildMode The env name.
 * @returns {string[]}
 */
function getVersions(buildMode) {
  const next = buildMode !== 'production' ? ['next'] : [];

  return [...next, ...availableVersions];
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
 * Gets the latest version of docs.
 *
 * @returns {string}
 */
function getLatestVersion() {
  return availableVersions[0];
}

/**
 * Gets the sidebar object for docs.
 *
 * @param {string} buildMode The env name.
 * @returns {object}
 */
function getSidebars(buildMode) {
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

  if (isEnvDev()) {
    getDocsNonFrameworkedVersions(buildMode).forEach((version) => {
      // eslint-disable-next-line
      const sidebarConfig = require(path.join(__dirname, `../${version}/sidebars.js`));

      sidebars[`/${TMP_DIR_FOR_WATCH}/${version}/examples/`] = sidebarConfig.examples;
      sidebars[`/${TMP_DIR_FOR_WATCH}/${version}/api/`] = sidebarConfig.api;
      sidebars[`/${TMP_DIR_FOR_WATCH}/${version}/`] = getTransformedGuides(sidebarConfig.guides);
    });

    getDocsFrameworkedVersions(buildMode).forEach((version) => {
      // eslint-disable-next-line
      const sidebarConfig = require(path.join(__dirname, `../${version}/sidebars.js`));

      frameworks.forEach((framework) => {
        const apiTransformed = JSON.parse(JSON.stringify(sidebarConfig.api)); // Copy sidebar definition
        const plugins = apiTransformed.find(arrayElement => typeof arrayElement === 'object');
        const pathPartsWithoutVersion = plugins.path.split(`/${version}`);

        // We store path in sidebars.js files in form <VERSION>/api/plugins.
        plugins.path = [`/${TMP_DIR_FOR_WATCH}/${framework}${FRAMEWORK_SUFFIX}/`,
          version, ...pathPartsWithoutVersion].join('');

        sidebars[`/${TMP_DIR_FOR_WATCH}/${version}/${framework}${FRAMEWORK_SUFFIX}/examples/`] = sidebarConfig.examples;
        sidebars[`/${TMP_DIR_FOR_WATCH}/${version}/${framework}${FRAMEWORK_SUFFIX}/api/`] = apiTransformed;
        sidebars[`/${TMP_DIR_FOR_WATCH}/${version}/${framework}${FRAMEWORK_SUFFIX}/`] =
          getTransformedGuides(sidebarConfig.guides, framework);
      });
    });

  } else {
    getVersions(buildMode).forEach((version) => {
      // eslint-disable-next-line
      const sidebarConfig = require(path.join(__dirname, `../${version}/sidebars.js`));

      sidebars[`/${version}/examples/`] = sidebarConfig.examples;
      sidebars[`/${version}/api/`] = sidebarConfig.api;
      sidebars[`/${version}/`] = getTransformedGuides(sidebarConfig.guides, getEnvDocsFramework());
    });
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

  return normalizedPath;
}

/**
 * Get object containing list of not searchable links from the guides section for specific version of documentation.
 *
 * @param {string} buildMode The env name.
 * @returns {object}
 */
function getNotSearchableLinks(buildMode) {
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

  if (isEnvDev()) {
    getDocsNonFrameworkedVersions(buildMode).forEach((version) => {
      // eslint-disable-next-line
      const sidebarConfig = require(path.join(__dirname, `../${version}/sidebars.js`));

      notSearchableLinks[version] = filterLinks(sidebarConfig.guides);
    });

    getDocsFrameworkedVersions(buildMode).forEach((version) => {
      frameworks.forEach((framework) => {
        if (typeof notSearchableLinks[framework] !== 'object') {
          notSearchableLinks[framework] = {};
        }

        // eslint-disable-next-line
        const sidebarConfig = require(path.join(__dirname, `../${version}/sidebars.js`));

        notSearchableLinks[framework][version] = filterLinks(sidebarConfig.guides, framework);
      });
    });

  } else {
    const version = getEnvDocsVersion();
    const framework = getEnvDocsFramework();
    // eslint-disable-next-line
    const sidebarConfig = require(path.join(__dirname, `../${version}/sidebars.js`));

    if (framework !== void 0) {
      notSearchableLinks[framework] = {
        [version]: filterLinks(sidebarConfig.guides, framework),
      };

    } else {
      notSearchableLinks[version] = filterLinks(sidebarConfig.guides);
    }
  }

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
    const version = getEnvDocsVersion();
    const framework = getEnvDocsFramework();
    let ignoredFiles;

    if (framework !== void 0) {
      ignoredFiles = notSearchableLinks[framework][version];

    } else {
      ignoredFiles = notSearchableLinks[version];
    }

    return ignoredFiles.map(excludedPath => `!${version}/${excludedPath}.md`);
  }

  return [];
}

/**
 * Parses the docs version from the URL.
 *
 * @param {string} url The URL to parse.
 * @returns {string}
 */
function parseVersion(url) {
  return getNormalizedPath(url).split('/')[1] || getLatestVersion();
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
 *
 * @param {string} buildMode The env name.
 */
function createSymlinks(buildMode) {
  if (isEnvDev()) {
    fsExtra.removeSync(TMP_DIR_FOR_WATCH);

    getDocsNonFrameworkedVersions(buildMode).forEach((version) => {
      fsExtra.ensureSymlinkSync(version, `./${TMP_DIR_FOR_WATCH}/${version}`);
    });

    getDocsFrameworkedVersions(buildMode).forEach((version) => {
      getFrameworks().forEach((framework) => {
        fsExtra.ensureSymlinkSync(version, `./${TMP_DIR_FOR_WATCH}/${version}/${framework}${FRAMEWORK_SUFFIX}`);
      });
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
  getVersions,
  getFrameworks,
  getPrettyFrameworkName,
  getDocsFrameworkedVersions,
  getDocsNonFrameworkedVersions,
  getLatestVersion,
  getSidebars,
  getNotSearchableLinks,
  parseVersion,
  parseFramework,
  getEnvDocsFramework,
  getEnvDocsVersion,
  getDefaultFramework,
  isEnvDev,
  createSymlinks,
  getDocsBaseUrl,
  getIgnoredFilesPatterns,
};
