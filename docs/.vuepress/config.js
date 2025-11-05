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
const tableWrapper = require('./plugins/markdown-it-table-wrapper');
const includeCodeSnippetPlugin = require('./plugins/include-code-snippet');

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
          beforeSend(event, hint) {
            const error = hint.originalException;
            if (error) {
              if (error.cause?.handsontable) {
                return null;
              }
              if (error.message.match(/ColumnSummary plugin: cell at/i)) {
                return null;
              }
            }
            return event;
          },
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
    [
      'script',
      {
        id:'vwoCode'
      },
      `window._vwo_code || (function() {
var account_id=1134117,
version=2.1,
settings_tolerance=2000,
hide_element='body',
hide_element_style = 'opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;transition:none !important;',
/* DO NOT EDIT BELOW THIS LINE */
f=false,w=window,d=document,v=d.querySelector('#vwoCode'),cK='_vwo_'+account_id+'_settings',cc={};try{var c=JSON.parse(localStorage.getItem('_vwo_'+account_id+'_config'));cc=c&&typeof c==='object'?c:{}}catch(e){}var stT=cc.stT==='session'?w.sessionStorage:w.localStorage;code={nonce:v&&v.nonce,library_tolerance:function(){return typeof library_tolerance!=='undefined'?library_tolerance:undefined},settings_tolerance:function(){return cc.sT||settings_tolerance},hide_element_style:function(){return'{'+(cc.hES||hide_element_style)+'}'},hide_element:function(){if(performance.getEntriesByName('first-contentful-paint')[0]){return''}return typeof cc.hE==='string'?cc.hE:hide_element},getVersion:function(){return version},finish:function(e){if(!f){f=true;var t=d.getElementById('_vis_opt_path_hides');if(t)t.parentNode.removeChild(t);if(e)(new Image).src='https://dev.visualwebsiteoptimizer.com/ee.gif?a='+account_id+e}},finished:function(){return f},addScript:function(e){var t=d.createElement('script');t.type='text/javascript';if(e.src){t.src=e.src}else{t.text=e.text}v&&t.setAttribute('nonce',v.nonce);d.getElementsByTagName('head')[0].appendChild(t)},load:function(e,t){var n=this.getSettings(),i=d.createElement('script'),r=this;t=t||{};if(n){i.textContent=n;d.getElementsByTagName('head')[0].appendChild(i);if(!w.VWO||VWO.caE){stT.removeItem(cK);r.load(e)}}else{var o=new XMLHttpRequest;o.open('GET',e,true);o.withCredentials=!t.dSC;o.responseType=t.responseType||'text';o.onload=function(){if(t.onloadCb){return t.onloadCb(o,e)}if(o.status===200||o.status===304){_vwo_code.addScript({text:o.responseText})}else{_vwo_code.finish('&e=loading_failure:'+e)}};o.onerror=function(){if(t.onerrorCb){return t.onerrorCb(e)}_vwo_code.finish('&e=loading_failure:'+e)};o.send()}},getSettings:function(){try{var e=stT.getItem(cK);if(!e){return}e=JSON.parse(e);if(Date.now()>e.e){stT.removeItem(cK);return}return e.s}catch(e){return}},init:function(){if(d.URL.indexOf('__vwo_disable__')>-1)return;var e=this.settings_tolerance();w._vwo_settings_timer=setTimeout(function(){_vwo_code.finish();stT.removeItem(cK)},e);var t;if(this.hide_element()!=='body'){t=d.createElement('style');var n=this.hide_element(),i=n?n+this.hide_element_style():'',r=d.getElementsByTagName('head')[0];t.setAttribute('id','_vis_opt_path_hides');v&&t.setAttribute('nonce',v.nonce);t.setAttribute('type','text/css');if(t.styleSheet)t.styleSheet.cssText=i;else t.appendChild(d.createTextNode(i));r.appendChild(t)}else{t=d.getElementsByTagName('head')[0];var i=d.createElement('div');i.style.cssText='z-index: 2147483647 !important;position: fixed !important;left: 0 !important;top: 0 !important;width: 100% !important;height: 100% !important;background: white !important;display: block !important;';i.setAttribute('id','_vis_opt_path_hides');i.classList.add('_vis_hide_layer');t.parentNode.insertBefore(i,t.nextSibling)}var o=window._vis_opt_url||d.URL,s='https://dev.visualwebsiteoptimizer.com/j.php?a='+account_id+'&u='+encodeURIComponent(o)+'&vn='+version;if(w.location.search.indexOf('_vwo_xhr')!==-1){this.addScript({src:s})}else{this.load(s+'&x=true')}}};w._vwo_code=code;code.init();})();`
    ],
    [
      'script',
      {
      },
      `window.VWO = window.VWO || [];
      window.VWO.init = window.VWO.init || function (state) {
        window.VWO.consentState = state;
      };
      var category = 'marketing'; // Define the consent category required to allow VWO tracking.
      function updateConsent() {
        var cb = window.Cookiebot;
        var consents = cb && cb.consent;
        if (!consents || !consents.stamp) {
          return window.VWO.init(2);
        }
        return window.VWO.init(consents[category] ? 1 : 3);
      }
      ['CookiebotOnConsentReady', 'CookiebotOnAccept', 'CookiebotOnDecline']
        .forEach(function (event) {
          window.addEventListener(event, updateConsent);
        });`
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
      md.use(conditionalContainer)
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
    includeCodeSnippetPlugin,
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
                if (decodeURIComponent(value).includes('{{$currentVersion}}')) {
                  const version = getThisDocsVersion();

                  token.attrs[index][1] = decodeURIComponent(value).replace(
                    '{{$currentVersion}}',
                    version === 'next' ? 'latest' : version
                  );
                } else if (decodeURIComponent(value).includes('{{$basePath}}')) {
                  token.attrs[index][1] = decodeURIComponent(value).replace(
                    '{{$basePath}}',
                    getDocsBaseFullUrl()
                  );
                }

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
      indexName: 'handsontable', // or 'handsontable-with-versions'
      apiKey: 'c2430302c91e0162df988d4b383c9d8b',
      appId: 'MMN6OTJMGX'
    }
  },
};
