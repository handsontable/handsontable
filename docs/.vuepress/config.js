const path = require('path');
const stylusNodes = require('stylus/lib/nodes');
const highlight = require('./highlight');
const examples = require('./containers/examples');
const sourceCodeLink = require('./containers/sourceCodeLink');
const nginxRedirectsPlugin = require('./plugins/generate-nginx-redirects');
const nginxVariablesPlugin = require('./plugins/generate-nginx-variables');
const extendPageDataPlugin = require('./plugins/extend-page-data');
const firstHeaderInjection = require('./plugins/markdown-it-header-injection');
const conditionalContainer = require('./plugins/markdown-it-conditional-container');
const {
  createSymlinks,
  getDocsBase,
  getDocsBaseFullUrl,
  getDocsHostname,
  getIgnorePagesPatternList,
  getThisDocsVersion,
  MULTI_FRAMEWORKED_CONTENT_DIR,
} = require('./helpers');
const dumpDocsDataPlugin = require('./plugins/dump-docs-data');

const uniqueSlugs = new Set();
const buildMode = process.env.BUILD_MODE;
const isProduction = buildMode === 'production';
const environmentHead = isProduction ?
  [
    // Google Tag Manager, an extra element within the `ssr.html` file.
    ['script', {}, `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-55L5D3');
    `],
  ]
  : [];

// The `vuepress dev` command needs placing directories in proper place. It's done by creating temporary directories
// which are watched by the script. It's done before a compilation is starting.
createSymlinks();

module.exports = {
  define: {
    GA_ID: 'UA-33932793-7',
  },
  patterns: [
    `${MULTI_FRAMEWORKED_CONTENT_DIR}/**/*.md`,
    ...getIgnorePagesPatternList(),
  ],
  description: 'Handsontable',
  base: `${getDocsBase()}/`,
  head: [
    ['link', {
      rel: 'icon',
      href: 'https://handsontable.com/static/images/template/ModCommon/favicon-32x32.png'
    }],
    ['link', {
      rel: 'preload',
      href: `${getDocsBaseFullUrl()}/data/common.json`,
      as: 'fetch',
      crossorigin: ''
    }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    // Cookiebot - cookie consent popup
    ['script', {
      id: 'Cookiebot',
      src: 'https://consent.cookiebot.com/uc.js',
      'data-cbid': 'ef171f1d-a288-433f-b680-3cdbdebd5646'
    }],
    ['script', {}, `const DOCS_VERSION = '${getThisDocsVersion()}';`],
    ['script', {}, `
      (function(w, d) {
        const osColorScheme = () => w.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const colorScheme = localStorage.getItem('handsontable/docs::color-scheme');
        const preferredScheme = colorScheme ? colorScheme : osColorScheme();

        if (preferredScheme === 'dark') {
          d.documentElement.classList.add('theme-dark');
        }

        w.SELECTED_COLOR_SCHEME = preferredScheme;
      }(window, document));
    `],
    ...environmentHead
  ],
  markdown: {
    toc: {
      includeLevel: [2, 3],
      containerHeaderHtml: '<div class="toc-container-header">In this article</div>'
    },
    anchor: {
      permalinkSymbol: '',
      permalinkHref(slug, state) {
        const slugify = state.md.slugify;
        const openTokenContent = /(?:\n?)::: only-for (((react|javascript) ?)+)\n?/;
        const closeTokenContent = /(?:\n?):::(?:\n?)$/;
        const markupForCustomContainer = ':::';
        const headerOpenType = 'heading_open';
        const headerCloseType = 'heading_close';
        let endIndex;

        if (/(.*)-(\d)+$/.test(slug) === false) {
          return `#${slug}`;
        }

        const handleTokensInsideOnlyForContainer = (action) => {
          for (let index = state.tokens.length - 1; index >= 0; index -= 1) {
            const token = state.tokens[index];
            // We don't create custom container intentionally inside `markdown-it-conditional-container` plugin.
            const isNotNativeContainer = token.markup !== markupForCustomContainer;

            if (isNotNativeContainer) {
              if (closeTokenContent.test(token.content)) {

                endIndex = index;
              } else if (openTokenContent.test(token.content)) {
                action(state.tokens.slice(index, endIndex));
              }
            }
          }
        };

        const getTokensInsideHeaders = (tokens) => {
          return tokens.filter((_, tokenIndex) => {
            if (tokenIndex === 0 || tokenIndex === tokens.length - 1) {
              return false;

            } else if (tokens[tokenIndex - 1]?.type === headerOpenType &&
              tokens[tokenIndex + 1]?.type === headerCloseType) {
              // Tokens being children of some header.
              return true;
            }

            return false;
          });
        };

        const getParsedSlugsFromHeaders = (tokens) => {
          return getTokensInsideHeaders(tokens).map(headerContentTag => slugify(headerContentTag.content));
        };

        const parseAndChangeDuplicatedSlug = (tokensInside) => {
          getParsedSlugsFromHeaders(tokensInside).some((headerSlug) => { // Array.some for purpose of stopping the loop.
            const headerSlugWithNumber = new RegExp(`${headerSlug}-(\\d)+$`);

            if (headerSlugWithNumber.test(slug)) {
              // Remove the `-[number]` suffix from the permalink href attribute.
              const duplicatedSlugsMatch = headerSlugWithNumber.exec(slug);

              if (duplicatedSlugsMatch) {
                // Updating a set of slugs, which will be used by another method.
                uniqueSlugs.add(headerSlug);

                // Removed the `-[number]` suffix.
                slug = `#${headerSlug}`;

                return true; // Breaks the loop.
              }
            }

            return false; // Continue looping.
          });
        };

        handleTokensInsideOnlyForContainer(parseAndChangeDuplicatedSlug);

        return `#${slug}`;
      },
      callback(token, slugInfo) {
        // The map is filled in before by a legacy `permalinkHref` method.
        if (['h1', 'h2', 'h3'].includes(token.tag) && uniqueSlugs.has(slugInfo.slug)) {
          const duplicatedSlugsMatch = /(.*)-(\d)+$/.exec(token.attrGet('id'));

          if (duplicatedSlugsMatch) {
            token.attrSet('id', duplicatedSlugsMatch[1]);
            slugInfo.slug = duplicatedSlugsMatch[1];
          }
        }
      }
    },
    externalLinks: {
      target: '_blank',
      rel: 'nofollow noopener noreferrer'
    },
    extendMarkdown(md) {
      md.use(conditionalContainer).use(firstHeaderInjection);
    }
  },
  configureWebpack: {
    resolve: {
      symlinks: false,
    }
  },
  stylus: {
    preferPathResolver: 'webpack',
    define: {
      url: (expression) => {
        return new stylusNodes
          .Literal(`url("${expression.string.replace('{{$basePath}}', getDocsBaseFullUrl())}")`);
      },
    }
  },
  plugins: [
    extendPageDataPlugin,
    'tabs',
    ['sitemap', {
      hostname: getDocsHostname(),
      exclude: ['/404.html']
    }],
    ['container', examples(getThisDocsVersion(), getDocsBaseFullUrl())],
    ['container', sourceCodeLink],
    {
      extendMarkdown(md) {
        const imageOrig = md.renderer.rules.image;

        // Add support for markdown images and links to have ability to substitute the
        // docs latest version variable to the "src" or "href" attributes.
        md.renderer.rules.image = function(tokens, ...rest) {
          tokens.forEach((token) => {
            token.attrs.forEach(([name, value], index) => {
              if (name === 'src') {
                token.attrs[index][1] = (
                  decodeURIComponent(value).replace('{{$basePath}}', getDocsBaseFullUrl())
                );
              }
            });
          });

          return imageOrig(tokens, ...rest);
        };

        const linkOrig = md.renderer.rules.link_open;

        md.renderer.rules.link_open = function(tokens, ...rest) {
          tokens.forEach((token) => {
            if (token.type !== 'link_open') {
              return;
            }

            token.attrs.forEach(([name, value], index) => {
              if (name === 'href') {
                token.attrs[index][1] = (
                  decodeURIComponent(value).replace('{{$basePath}}', getDocsBaseFullUrl())
                );
              }
            });
          });

          return linkOrig(tokens, ...rest);
        };

        const render = function(tokens, options, env) {
          let i; let type;
          let result = '';
          const rules = this.rules;

          for (i = 0; i < tokens.length; i++) { // overwritten here
            type = tokens[i].type;

            if (type === 'inline') {
              result += this.renderInline(tokens[i].children, options, env);
            } else if (typeof rules[type] !== 'undefined') {
              result += rules[tokens[i].type](tokens, i, options, env, this, getThisDocsVersion());
            } else {
              result += this.renderToken(tokens, i, options, env);
            }
          }

          return result;
        };

        // overwrite markdown `render` function to allow extending tokens array (remove caching before loop).
        md.renderer.render = (tokens, options, env) => render.call(md.renderer, tokens, options, env);
      },
      chainMarkdown(config) {
        // inject custom markdown highlight with our snippet runner
        config
          .options
          .highlight(highlight)
          .end();
      },
      chainWebpack: (config) => {
        config.module
          .rule('md')
          .test(/\.md$/)
          .use(path.resolve(__dirname, 'docs-links'))
          .loader(path.resolve(__dirname, 'docs-links'))
          .end();
      },
    },
    [dumpDocsDataPlugin, {
      outputDir: path.resolve(__dirname, './public/data/')
    }],
    [nginxRedirectsPlugin, {
      outputFile: path.resolve(__dirname, '../docker/redirects-autogenerated.conf')
    }],
    [nginxVariablesPlugin, {
      outputFile: path.resolve(__dirname, '../docker/variables.conf')
    }]
  ],
  themeConfig: {
    nextLinks: true,
    prevLinks: true,
    repo: 'handsontable/handsontable',
    docsRepo: 'handsontable/handsontable',
    docsDir: 'docs/content',
    docsBranch: 'develop',
    editLinks: true,
    editLinkText: 'Suggest edits',
    lastUpdated: true,
    smoothScroll: false,
    nav: [
      // Guide & API Reference has been defined in theme/components/NavLinks.vue
      { text: 'GitHub', link: 'https://github.com/handsontable/handsontable' },
      { text: 'Support',
        items: [
          { text: 'Contact support', link: 'https://handsontable.com/contact?category=technical_support' },
          { text: 'Report an issue', link: 'https://github.com/handsontable/handsontable/issues/new/choose' },
          { text: 'Handsontable forum', link: 'https://forum.handsontable.com' },
          { text: 'Ask on Stack Overflow', link: 'https://stackoverflow.com/questions/tagged/handsontable' },
          { text: 'Blog', link: 'https://handsontable.com/blog' }
        ]
      },
    ],
    displayAllHeaders: true, // collapse other pages
    activeHeaderLinks: true,
    sidebarDepth: 0,
    search: true,
    searchOptions: {
      placeholder: 'Search...',
      categoryPriorityList: [
        {
          name: 'Guides',
          domainPriority: [],
          maxSuggestions: 5,
        },
        {
          name: 'API Reference',
          // The "domainPriority" list modifies the search results position. When the search phrase matches
          // the page titles, the search suggestions are placed before the rest results. The pages declared
          // in the array at the beginning have the highest display priority.
          domainPriority: ['Configuration options', 'Core', 'Hooks'],
          maxSuggestions: 10,
        },
      ],
      fuzzySearchDomains: ['Core', 'Hooks', 'Configuration options'],
    }
  }
};
