(window.webpackJsonp=window.webpackJsonp||[]).push([[13,28],{344:function(t,e,r){"use strict";r.d(e,"d",(function(){return n})),r.d(e,"a",(function(){return a})),r.d(e,"i",(function(){return o})),r.d(e,"f",(function(){return u})),r.d(e,"g",(function(){return l})),r.d(e,"h",(function(){return c})),r.d(e,"b",(function(){return p})),r.d(e,"e",(function(){return d})),r.d(e,"k",(function(){return f})),r.d(e,"l",(function(){return h})),r.d(e,"c",(function(){return b})),r.d(e,"j",(function(){return m}));const n=/#.*$/,i=/\.(md|html)$/,a=/\/$/,o=/^[a-z]+:/i;function s(t){return decodeURI(t).replace(n,"").replace(i,"")}function u(t){return o.test(t)}function l(t){return/^mailto:/.test(t)}function c(t){return/^tel:/.test(t)}function p(t){if(u(t))return t;const e=t.match(n),r=e?e[0]:"",i=s(t);return a.test(i)?t:i+".html"+r}function d(t,e){const r=decodeURIComponent(t.hash),i=function(t){const e=t.match(n);if(e)return e[0]}(e);if(i&&r!==i)return!1;return s(t.path)===s(e)}function f(t,e,r){if(u(e))return{type:"external",path:e};r&&(e=function(t,e,r){const n=t.charAt(0);if("/"===n)return t;if("?"===n||"#"===n)return e+t;const i=e.split("/");r&&i[i.length-1]||i.pop();const a=t.replace(/^\//,"").split("/");for(let t=0;t<a.length;t++){const e=a[t];".."===e?i.pop():"."!==e&&i.push(e)}""!==i[0]&&i.unshift("");return i.join("/")}(e,r));const n=s(e);for(let e=0;e<t.length;e++)if(s(t[e].regularPath)===n)return Object.assign({},t[e],{type:"page",path:p(t[e].path)});return console.error(`[vuepress] No matching page found for sidebar item "${e}"`),{}}function h(t,e,r,n){const{pages:i,themeConfig:a}=r,o=n&&a.locales&&a.locales[n]||a;if("auto"===(t.frontmatter.sidebar||o.sidebar||a.sidebar))return g(t);const s=o.sidebar||a.sidebar;if(s){const{base:r,config:n}=function(t,e){if(Array.isArray(e))return{base:"/",config:e};for(const n in e)if(0===(r=t,/(\.html|\/)$/.test(r)?r:r+"/").indexOf(encodeURI(n)))return{base:n,config:e[n]};var r;return{}}(e,s);return"auto"===n?g(t):n?n.map(t=>function t(e,r,n,i=1){if("string"==typeof e)return f(r,e,n);if(Array.isArray(e))return Object.assign(f(r,e[0],n),{title:e[1]});{const a=e.children||[];return 0===a.length&&e.path?Object.assign(f(r,e.path,n),{title:e.title}):{type:"group",path:e.path,title:e.title,sidebarDepth:e.sidebarDepth,initialOpenGroupIndex:e.initialOpenGroupIndex,children:a.map(e=>t(e,r,n,i+1)),collapsable:!1!==e.collapsable}}}(t,i,r)):[]}return[]}function g(t){const e=b(t.headers||[]);return[{type:"group",collapsable:!1,title:t.title,path:null,children:e.map(e=>({type:"auto",title:e.title,basePath:t.path,path:t.path+"#"+e.slug,children:e.children||[]}))}]}function b(t){let e;return(t=t.map(t=>Object.assign({},t))).forEach(t=>{2===t.level?e=t:e&&(e.children||(e.children=[])).push(t)}),t.filter(t=>2===t.level)}function m(t){return Object.assign(t,{type:t.items&&t.items.length?"links":"link"})}},348:function(t,e,r){},351:function(t,e,r){"use strict";r(348)},352:function(t,e,r){"use strict";r.r(e);var n=r(358),i=r(354),a=r(344);function o(t,e){if("group"===e.type){const r=e.path&&Object(a.e)(t,e.path),n=e.children.some(e=>"group"===e.type?o(t,e):"page"===e.type&&Object(a.e)(t,e.path));return r||n}return!1}var s={name:"SidebarLinks",components:{SidebarGroup:n.default,SidebarLink:i.default},props:["items","depth","sidebarDepth","initialOpenGroupIndex"],data(){return{openGroupIndex:this.initialOpenGroupIndex||0}},watch:{$route(){this.refreshIndex()}},created(){this.refreshIndex()},methods:{refreshIndex(){const t=function(t,e){for(let r=0;r<e.length;r++){const n=e[r];if(o(t,n))return r}return-1}(this.$route,this.items);t>-1&&(this.openGroupIndex=t)},toggleGroup(t){this.openGroupIndex=t===this.openGroupIndex?-1:t},isActive(t){return Object(a.e)(this.$route,t.regularPath)}}},u=r(24),l=Object(u.a)(s,(function(){var t=this,e=t._self._c;return t.items.length?e("ul",{staticClass:"sidebar-links"},t._l(t.items,(function(r,n){return e("li",{key:n},["group"===r.type?e("SidebarGroup",{attrs:{item:r,open:n===t.openGroupIndex,collapsable:r.collapsable||r.collapsible,depth:t.depth},on:{toggle:function(e){return t.toggleGroup(n)}}}):e("SidebarLink",{attrs:{"sidebar-depth":t.sidebarDepth,item:r}})],1)})),0):t._e()}),[],!1,null,null,null);e.default=l.exports},354:function(t,e,r){"use strict";r.r(e);var n=r(344);function i(t,e,r,n,i){const a={props:{to:e,activeClass:"",exactActiveClass:""},class:{active:n,"sidebar-link":!0}};return i>2&&(a.style={"padding-left":i+"rem"}),t("RouterLink",a,r)}function a(t,e,r,o,s,u=1){return!e||u>s?null:t("ul",{class:"sidebar-sub-headers"},e.map(e=>{const l=Object(n.e)(o,r+"#"+e.slug);return t("li",{class:"sidebar-sub-header"},[i(t,r+"#"+e.slug,e.title,l,e.level-1),a(t,e.children,r,o,s,u+1)])}))}var o={functional:!0,props:["item","sidebarDepth"],render(t,{parent:{$page:e,$site:r,$route:o,$themeConfig:s,$themeLocaleConfig:u},props:{item:l,sidebarDepth:c}}){const p=Object(n.e)(o,l.path),d="auto"===l.type?p||l.children.some(t=>Object(n.e)(o,l.basePath+"#"+t.slug)):p,f="external"===l.type?function(t,e,r){return t("a",{attrs:{href:e,target:"_blank",rel:"noopener noreferrer"},class:{"sidebar-link":!0}},[r,t("OutboundLink")])}(t,l.path,l.title||l.path):i(t,l.path,l.title||l.path,d),h=[e.frontmatter.sidebarDepth,c,u.sidebarDepth,s.sidebarDepth,1].find(t=>void 0!==t),g=u.displayAllHeaders||s.displayAllHeaders;if("auto"===l.type)return[f,a(t,l.children,l.basePath,o,h)];if((d||g)&&l.headers&&!n.d.test(l.path)){return[f,a(t,Object(n.c)(l.headers),l.path,o,h)]}return f}},s=(r(351),r(24)),u=Object(s.a)(o,void 0,void 0,!1,null,null,null);e.default=u.exports},361:function(t,e,r){"use strict";var n=r(8),i=r(41),a=r(40)("match");t.exports=function(t){var e;return n(t)&&(void 0!==(e=t[a])?!!e:"RegExp"===i(t))}},362:function(t,e,r){"use strict";var n=r(39),i=r(12),a=r(69),o=r(363),s=RegExp.prototype;t.exports=function(t){var e=t.flags;return void 0!==e||"flags"in s||i(t,"flags")||!a(s,t)?e:n(o,t)}},363:function(t,e,r){"use strict";var n=r(72);t.exports=function(){var t=n(this),e="";return t.hasIndices&&(e+="d"),t.global&&(e+="g"),t.ignoreCase&&(e+="i"),t.multiline&&(e+="m"),t.dotAll&&(e+="s"),t.unicode&&(e+="u"),t.unicodeSets&&(e+="v"),t.sticky&&(e+="y"),e}},364:function(t,e,r){"use strict";var n=r(5),i=r(71),a=Math.floor,o=n("".charAt),s=n("".replace),u=n("".slice),l=/\$([$&'`]|\d{1,2}|<[^>]*>)/g,c=/\$([$&'`]|\d{1,2})/g;t.exports=function(t,e,r,n,p,d){var f=r+t.length,h=n.length,g=c;return void 0!==p&&(p=i(p),g=l),s(d,g,(function(i,s){var l;switch(o(s,0)){case"$":return"$";case"&":return t;case"`":return u(e,0,r);case"'":return u(e,f);case"<":l=p[u(s,1,-1)];break;default:var c=+s;if(0===c)return i;if(c>h){var d=a(c/10);return 0===d?i:d<=h?void 0===n[d-1]?o(s,1):n[d-1]+o(s,1):i}l=n[c-1]}return void 0===l?"":l}))}},368:function(t,e,r){"use strict";var n=r(67),i=r(39),a=r(5),o=r(42),s=r(3),u=r(68),l=r(361),c=r(132),p=r(131),d=r(362),f=r(364),h=r(40),g=r(70),b=h("replace"),m=TypeError,v=a("".indexOf),x=a("".replace),y=a("".slice),O=Math.max;n({target:"String",proto:!0},{replaceAll:function(t,e){var r,n,a,h,$,k,j,I,A,G=o(this),w=0,D=0,C="";if(!u(t)){if((r=l(t))&&(n=c(o(d(t))),!~v(n,"g")))throw new m("`.replaceAll` does not allow non-global regexes");if(a=p(t,b))return i(a,t,G,e);if(g&&r)return x(c(G),t,e)}for(h=c(G),$=c(t),(k=s(e))||(e=c(e)),j=$.length,I=O(1,j),w=v(h,$);-1!==w;)A=k?c(e($,w,h)):f($,h,w,[],void 0,e),C+=y(h,D,w)+A,D=w+j,w=w+I>h.length?-1:v(h,$,w+I);return D<h.length&&(C+=y(h,D)),C}})}}]);