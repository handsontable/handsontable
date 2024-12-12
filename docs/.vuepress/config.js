const path = require('path');
const stylusNodes = require('stylus/lib/nodes');
const highlight = require('./highlight');
const examples = require('./containers/examples');
const exampleWithoutTabs = require('./containers/example-without-tabs');
const sourceCodeLink = require('./containers/sourceCodeLink');
const nginxRedirectsPlugin = require('./plugins/generate-nginx-redirects');
const nginxVariablesPlugin = require('./plugins/generate-nginx-variables');
const extendPageDataPlugin = require('./plugins/extend-page-data');
const dumpDocsDataPlugin = require('./plugins/dump-docs-data');
const dumpRedirectPageIdsPlugin = require('./plugins/dump-redirect-page-ids');
const firstHeaderInjection = require('./plugins/markdown-it-header-injection');
const headerAnchor = require('./plugins/markdown-it-header-anchor');
const conditionalContainer = require('./plugins/markdown-it-conditional-container');
const includeCodeSnippet = require('./plugins/markdown-it-include-code-snippet');
const tableWrapper = require('./plugins/markdown-it-table-wrapper');
const {
  createSymlinks,
  getDocsBase,
  getDocsBaseFullUrl,
  getDocsHostname,
  getIgnorePagesPatternList,
  getThisDocsVersion,
  MULTI_FRAMEWORKED_CONTENT_DIR,
} = require('./helpers');

require('dotenv').config();

const buildMode = process.env.BUILD_MODE;
const isProduction = buildMode === 'production';
const environmentHead = isProduction
  ? [
    // Google Tag Manager, an extra element within the `ssr.html` file.
    [
      'script',
      {},
      `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-55L5D3');
    `,
    ],
    // HotJar, an extra element within the `ssr.html` file.
    [
      'script',
      {},
      `
      (function(h,o,t,j,a,r){
        window.addEventListener('DOMContentLoaded', function(){
          if(h.innerWidth > 600){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:329042,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          }
        });
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `,
    ],
  ]
  : [];

// The `vuepress dev` command needs placing directories in proper place. It's done by creating temporary directories
// which are watched by the script. It's done before a compilation is starting.
createSymlinks();

module.exports = {
  // by default this always returns true, this is a issue as it preloads every documentation pages content
  shouldPrefetch: (_, type) => {
    if (type === 'script') {
      return false;
    }

    return true;
  },
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
    [
      'link',
      {
        rel: 'icon',
        media: '(prefers-color-scheme: light)',
        href: `${getDocsBaseFullUrl()}/img/favicon.png`,
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        media: '(prefers-color-scheme: dark)',
        href: `${getDocsBaseFullUrl()}/img/favicon-dark.png`,
      },
    ],
    [
      'link',
      {
        rel: 'preload',
        href: `${getDocsBaseFullUrl()}/data/common.json`,
        as: 'fetch',
        crossorigin: '',
      },
    ],
    [
      'meta',
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    // Sentry monitoring
    [
      'script',
      {},
      `
      window.sentryOnLoad = function () {
        Sentry.init({
          environment: '${buildMode || 'testing'}',
          tracesSampleRate: 0,
          profilesSampleRate: 0,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0.2,
          integrations: [
            // If you use a bundle with performance monitoring enabled, add the BrowserTracing integration
            new Sentry.BrowserTracing(),
            // If you use a bundle with session replay enabled, add the SessionReplay integration
            new Sentry.Replay({
              maskAllText: false,
              blockAllMedia: false,
            }),   
          ],
        });
      };
    `,
    ],
    [
      'script',
      {
        id: 'Sentry.io',
        src: 'https://js.sentry-cdn.com/611b4dbe630c4a434fe1367b98ba3644.min.js',
        crossorigin: 'anonymous',
        defer: true,
      },
    ],
    // Cookiebot - cookie consent popup
    [
      'script',
      {
        id: 'Cookiebot',
        src: 'https://consent.cookiebot.com/uc.js',
        'data-cbid': 'ef171f1d-a288-433f-b680-3cdbdebd5646',
        defer: true,
      },
    ],
    // Headwayapp
    [
      'script',
      {
        id: 'Headwayapp',
        src: 'https://cdn.headwayapp.co/widget.js',
        defer: true,
      },
    ],
    ['script', {}, `const DOCS_VERSION = '${getThisDocsVersion()}';`],
    [
      'script',
      {},
      `
      (function(w, d) {
        const colorScheme = localStorage.getItem('handsontable/docs::color-scheme');
        const systemPrefersDark = w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches;
        const preferredScheme = colorScheme ? colorScheme : (systemPrefersDark ? 'dark' : 'light');

        if (preferredScheme === 'dark') {
          d.documentElement.classList.add('theme-dark');
          d.documentElement.setAttribute('data-theme', 'dark');
        }

        w.SELECTED_COLOR_SCHEME = preferredScheme;
      }(window, document));
    `,
    ],
    ...environmentHead,
  ],
  markdown: {
    toc: {
      includeLevel: [2, 3],
      containerHeaderHtml:
        '<div class="toc-container-header"><i class="ico i-toc"></i>On this page</div>',
    },
    anchor: {
      permalink: false,
    },
    externalLinks: {
      target: '_blank',
      rel: 'nofollow noopener noreferrer',
    },
    extendMarkdown(md) {
      md.use(includeCodeSnippet)
        .use(conditionalContainer)
        .use(firstHeaderInjection)
        .use(headerAnchor)
        .use(tableWrapper);
    },
  },
  configureWebpack: {
    resolve: {
      symlinks: false,
    },
  },
  stylus: {
    preferPathResolver: 'webpack',
    define: {
      url: (expression) => {
        return new stylusNodes.Literal(
          `url("${expression.string.replace(
            '{{$basePath}}',
            getDocsBaseFullUrl()
          )}")`
        );
      },
    },
  },
  plugins: [
    extendPageDataPlugin,
    'tabs',
    [
      'sitemap',
      {
        hostname: getDocsHostname(),
        exclude: ['/404.html'],
      },
    ],
    ['container', examples(getThisDocsVersion(), getDocsBaseFullUrl())],
    [
      'container',
      exampleWithoutTabs(getThisDocsVersion(), getDocsBaseFullUrl()),
    ],
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
                token.attrs[index][1] = decodeURIComponent(value).replace(
                  '{{$basePath}}',
                  getDocsBaseFullUrl()
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
                token.attrs[index][1] = decodeURIComponent(value).replace(
                  '{{$basePath}}',
                  getDocsBaseFullUrl()
                );
              }
            });
          });

          return linkOrig(tokens, ...rest);
        };

        const render = function(tokens, options, env) {
          let i;
          let type;
          let result = '';
          const rules = this.rules;

          for (i = 0; i < tokens.length; i++) {
            // overwritten here
            type = tokens[i].type;

            if (type === 'inline') {
              result += this.renderInline(tokens[i].children, options, env);
            } else if (typeof rules[type] !== 'undefined') {
              result += rules[tokens[i].type](
                tokens,
                i,
                options,
                env,
                this,
                getThisDocsVersion()
              );
            } else {
              result += this.renderToken(tokens, i, options, env);
            }
          }

          return result;
        };

        // overwrite markdown `render` function to allow extending tokens array (remove caching before loop).
        md.renderer.render = (tokens, options, env) =>
          render.call(md.renderer, tokens, options, env);
      },
      chainMarkdown(config) {
        // inject custom markdown highlight with our snippet runner
        config.options.highlight(highlight).end();
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
    [
      dumpDocsDataPlugin,
      {
        outputDir: path.resolve(__dirname, './public/data/'),
      },
    ],
    [
      dumpRedirectPageIdsPlugin,
      {
        outputFile: path.resolve(__dirname, '../docker/redirect-page-ids.json'),
      },
    ],
    [
      nginxRedirectsPlugin,
      {
        outputFile: path.resolve(
          __dirname,
          '../docker/redirects-autogenerated.conf'
        ),
      },
    ],
    [
      nginxVariablesPlugin,
      {
        outputFile: path.resolve(__dirname, '../docker/variables.conf'),
      },
    ],
  ],
  themeConfig: {
    nextLinks: false,
    prevLinks: false,
    repo: 'handsontable/handsontable',
    docsRepo: 'handsontable/handsontable',
    docsDir: 'docs/content',
    docsBranch: 'develop',
    editLinks: true,
    editLinkText: 'Edit on GitHub',
    lastUpdated: false,
    smoothScroll: false,
    nav: [
      // Guide & API Reference has been defined in theme/components/NavLinks.vue
      // { text: 'GitHub', link: 'https://github.com/handsontable/handsontable' },
      { text: 'Support',
        items: [
          {
            text: 'Developers Forum',
            link: 'https://forum.handsontable.com',
          },
          {
            text: 'GitHub Discussions',
            link: 'https://github.com/handsontable/handsontable/discussions',
          },
          {
            text: 'StackOverflow',
            link: 'https://stackoverflow.com/tags/handsontable',
          },
          {
            text: 'Contact support',
            link: 'https://handsontable.com/contact?category=technical_support',
          },
        ],
      },
    ],
    displayAllHeaders: true, // collapse other pages
    activeHeaderLinks: true,
    sidebarDepth: 0,
    organization: {
      name: 'Handsontable',
      author: 'Handsontable Team',
      url: 'https://handsontable.com',
      socialMedia: [
        'https://twitter.com/handsontable',
        'https://www.linkedin.com/company/handsontable',
      ],
      image: `${getDocsBaseFullUrl()}/img/handsontable-docs-cover.png`
    },
    searchPlaceholder: 'Search...',
    algolia: {
      indexName: 'handsontable',
      apiKey: 'c2430302c91e0162df988d4b383c9d8b',
      appId: 'MMN6OTJMGX'
    }
  },
};
