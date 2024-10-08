const path = require('path');
const fsExtra = require('fs-extra');
const execa = require('execa');

const MULTI_FRAMEWORKED_CONTENT_DIR = '.build-tmp';
const FRAMEWORK_SUFFIX = '-data-grid';
const versionFromBranchRegExp = /^prod-docs\/(\d+\.\d+)$/;
let docsVersion = null;
let docsSHA = null;

// Please keep in mind that the first element is default framework.
const fullyProcessedFrameworks = [
  'javascript',
  'react',
];

const frameworkToPrettyName = new Map([
  ['javascript', 'JavaScript'],
  ['react', 'React'],
  ['angular', 'Angular'],
  ['vue', 'Vue 2'],
  ['vue3', 'Vue 3'],
]);

/**
 * Gets all available frameworks.
 *
 * @returns {string[]}
 */
function getFrameworks() {
  return Array.from(fullyProcessedFrameworks);
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
 * @returns {string|undefined}
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
  const { DOCS_LATEST_VERSION } = process.env;

  if (DOCS_LATEST_VERSION) {
    docsVersion = DOCS_LATEST_VERSION;

    return DOCS_LATEST_VERSION;
  }

  if (docsVersion === null) {

    const branchName = execa.sync('git rev-parse --abbrev-ref HEAD', { shell: true }).stdout;

    if (versionFromBranchRegExp.test(branchName) === true) {
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
  const filterByFramework = (guides, currentFramework) => {
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
  const sidebars = {};

  getFrameworks().forEach((framework) => {
    Object.entries(sidebarConfig).forEach(([parentPath, subjectChildren]) => {
      const childrenClone = JSON.parse(JSON.stringify(subjectChildren));
      const isGuidesPage = parentPath === 'guides';
      const sidebarChildren = isGuidesPage ? filterByFramework(childrenClone, framework) : childrenClone;
      const fullPath = `/${framework}${FRAMEWORK_SUFFIX}/${isGuidesPage ? '' : `${parentPath}/`}`;

      sidebars[`/${MULTI_FRAMEWORKED_CONTENT_DIR}${fullPath}`] = sidebarChildren.map((child) => {
        if (typeof child === 'object' && child.path) {
          child.path = `${fullPath}${child.path}/`;
        }

        return child;
      });
    });
  });

  return sidebars;
}

/**
 * Removes temporary directory from the path when needed.
 *
 * @param {string} normalizedPath Path for unification.
 * @returns {string}
 */
function getNormalizedPath(normalizedPath) {
  return normalizedPath
    .replace(new RegExp(`^/?${MULTI_FRAMEWORKED_CONTENT_DIR}`), '')
    .replace(/\.(html|md)$/, '');
}

/**
 * Get object containing list of not searchable links from the guides section for specific version of documentation.
 *
 * @returns {object}
 */
function getIgnorePagesPatternList() {
  const frameworks = getFrameworks();

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
  const pages = [];

  frameworks.forEach((framework) => {
    const linksWithFramework = filterLinks(sidebarConfig.guides, framework)
      .map(link => `!${MULTI_FRAMEWORKED_CONTENT_DIR}/${framework}${FRAMEWORK_SUFFIX}/${link}.md`);

    pages.push(...linksWithFramework);
  });

  return pages;
}

/**
 * Parses the docs framework from the URL.
 *
 * @param {string} url The URL to parse.
 * @returns {string}
 */
function parseFramework(url) {
  const potentialFramework = getNormalizedPath(url).split('/')[1]?.replace(FRAMEWORK_SUFFIX, '');

  if (getFrameworks().includes(potentialFramework)) {
    return potentialFramework;
  }
}

/**
 * Parses the provided file path to find the "partial" framework name.
 *
 * @param {string} filePath The file path.
 * @returns {string|null}
 */
function parsePartialFramework(filePath) {
  const frameworkMatch = filePath.match(/guides\/integrate-with-(vue3|vue|angular)?/);

  return frameworkMatch ? frameworkMatch[1] : null;
}

/**
 * Create symlinks needed for multi-frameworked content.
 */
function createSymlinks() {
  fsExtra.removeSync(MULTI_FRAMEWORKED_CONTENT_DIR);

  getFrameworks().forEach((framework) => {
    fsExtra.ensureSymlinkSync('content', `./${MULTI_FRAMEWORKED_CONTENT_DIR}/${framework}${FRAMEWORK_SUFFIX}`);
  });
}

/**
 * Returns the repository latest SHA.
 *
 * @returns {string}
 */
function getDocsRepoSHA() {
  if (docsSHA === null) {
    docsSHA = execa.sync('git rev-parse HEAD', { shell: true }).stdout;
  }

  return docsSHA;
}

/**
 * Gets docs base path (eq: /docs/12.1).
 *
 * @returns {string}
 */
function getDocsBase() {
  const buildMode = process.env.BUILD_MODE;
  const docsBase = process.env.DOCS_BASE ?? getThisDocsVersion();
  let base = '/docs/';

  // For staging:
  //   * `docsBase` === 'next' generate docs with Docs base set as `/docs/next`;
  //   * `docsBase` === 'latest' generate docs with Docs base set as `/docs`;
  // For other environments (prod, local build, local watch):
  //   * `docsBase` === 'next' (happens locally) generate docs with Docs base set as `/docs`;
  //   * `docsBase` === 'latest' generate docs with Docs base set as `/docs`;
  //   * `docsBase` === '12.1' (happens while testing production branch) generate docs with Docs base set as `/docs/12.1`;
  if ((buildMode === 'staging' && docsBase !== 'latest') ||
      (buildMode !== 'staging' && docsBase !== 'next' && docsBase !== 'latest')) {
    base += `${docsBase}/`;
  }

  return base.replace(/\/$/, '');
}

/**
 * Gets docs base full url with hostname (eq: https://handsontable.com/docs/12.1).
 *
 * @returns {string}
 */
function getDocsBaseFullUrl() {
  return `${getDocsHostname()}${getDocsBase()}`;
}

/**
 * Gets docs hostname (eq: https://handsontable.com).
 *
 * @param {boolean} [allowLocalhost=true] Returns localhost URL for local testing or official Docs domains as
 *                                        a source of truth for further "fetch" requests.
 * @returns {string}
 */
function getDocsHostname(allowLocalhost = true) {
  const buildMode = process.env.BUILD_MODE;

  if (!buildMode && allowLocalhost) {
    return 'http://localhost:8080';
  }

  return `https://${buildMode === 'staging' ? 'dev.' : ''}handsontable.com`;
}

module.exports = {
  FRAMEWORK_SUFFIX,
  MULTI_FRAMEWORKED_CONTENT_DIR,
  getNormalizedPath,
  getFrameworks,
  getPrettyFrameworkName,
  getSidebars,
  getIgnorePagesPatternList,
  parseFramework,
  parsePartialFramework,
  getDefaultFramework,
  createSymlinks,
  getThisDocsVersion,
  getDocsRepoSHA,
  getDocsBase,
  getDocsBaseFullUrl,
  getDocsHostname,
};
