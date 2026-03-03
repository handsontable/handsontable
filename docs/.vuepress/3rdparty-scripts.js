module.exports = {
  productionOnly: [
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
    ]
  ],
  allEnvironments: [

    // Sentry monitoring

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
        id: 'vwoCode'
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

  ],
};
