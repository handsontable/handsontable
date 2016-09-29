/*!
 * numbro.js
 * version : 1.9.3
 * author : Företagsplatsen AB
 * license : MIT
 * http://www.foretagsplatsen.se
 */
(function(){"use strict";/************************************
        Constructors
    ************************************/
// Numbro prototype object
function a(a){this._value=a}function b(a){var b,c="";for(b=0;a>b;b++)c+="0";return c}/**
     * Implementation of toFixed() for numbers with exponents
     * This function may return negative representations for zero values e.g. "-0.0"
     */
function c(a,c){var d,e,f,g,h,i,j,k;
// exponent is positive - add zeros after the numbers
// exponent is negative
// tack on the decimal point if needed
// substring off the end to satisfy the precision
// only add percision 0's if the exponent is positive
return k=a.toString(),d=k.split("e")[0],g=k.split("e")[1],e=d.split(".")[0],f=d.split(".")[1]||"",+g>0?k=e+f+b(g-f.length):(h=0>+e?"-0":"0",c>0&&(h+="."),j=b(-1*g-1),i=(j+Math.abs(e)+f).substr(0,c),k=h+i),+g>0&&c>0&&(k+="."+b(c)),k}/**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     *
     * Also removes negative signs for zero-formatted numbers. e.g. -0.01 w/ precision 1 -> 0.0
     */
function d(a,b,d,e){var f,g,h=Math.pow(10,b);
// toFixed returns scientific notation for numbers above 1e21 and below 1e-7
// remove the leading negative sign if it exists and should not be present (e.g. -0.00)
// Multiply up by precision, round accurately, then divide and use native toFixed():
return a.toString().indexOf("e")>-1?(g=c(a,b),"-"===g.charAt(0)&&+g>=0&&(g=g.substr(1))):g=(d(a+"e+"+b)/h).toFixed(b),e&&(f=new RegExp("0{1,"+e+"}$"),g=g.replace(f,"")),g}/************************************
        Formatting
    ************************************/
// determine what type of formatting we need to do
function e(a,b,c){var d,e=b.replace(/\{[^\{\}]*\}/g,"");
// return string
// figure out what kind of format we are dealing with
// currency!!!!!
return d=e.indexOf("$")>-1?g(a,y[A].currency.symbol,b,c):e.indexOf("%")>-1?i(a,b,c):e.indexOf(":")>-1?j(a,b):m(a._value,b,c)}
// revert to number
function f(a,b){var c,d,e,f,g,h=b,i=!1;if(b.indexOf(":")>-1)a._value=k(b);else if(b===B)a._value=0;else{
// see if bytes are there so that we can multiply to the correct number
for("."!==y[A].delimiters.decimal&&(b=b.replace(/\./g,"").replace(y[A].delimiters.decimal,".")),c=new RegExp("[^a-zA-Z]"+y[A].abbreviations.thousand+"(?:\\)|(\\"+y[A].currency.symbol+")?(?:\\))?)?$"),d=new RegExp("[^a-zA-Z]"+y[A].abbreviations.million+"(?:\\)|(\\"+y[A].currency.symbol+")?(?:\\))?)?$"),e=new RegExp("[^a-zA-Z]"+y[A].abbreviations.billion+"(?:\\)|(\\"+y[A].currency.symbol+")?(?:\\))?)?$"),f=new RegExp("[^a-zA-Z]"+y[A].abbreviations.trillion+"(?:\\)|(\\"+y[A].currency.symbol+")?(?:\\))?)?$"),g=1;g<u.length&&!i;++g)b.indexOf(u[g])>-1?i=Math.pow(1024,g):b.indexOf(v[g])>-1&&(i=Math.pow(1e3,g));var j=b.replace(/[^0-9\.]+/g,"");""===j?
// An empty string is not a number.
a._value=NaN:(
// do some math to create our number
a._value=(i?i:1)*(h.match(c)?Math.pow(10,3):1)*(h.match(d)?Math.pow(10,6):1)*(h.match(e)?Math.pow(10,9):1)*(h.match(f)?Math.pow(10,12):1)*(b.indexOf("%")>-1?.01:1)*((b.split("-").length+Math.min(b.split("(").length-1,b.split(")").length-1))%2?1:-1)*Number(j),
// round if we are talking about bytes
a._value=i?Math.ceil(a._value):a._value)}return a._value}function g(a,b,c,d){var e,f,g=c,h=g.indexOf("$"),i=g.indexOf("("),j=g.indexOf("+"),k=g.indexOf("-"),l="",n="";if(-1===g.indexOf("$")?
// Use defaults instead of the format provided
"infix"===y[A].currency.position?(n=b,y[A].currency.spaceSeparated&&(n=" "+n+" ")):y[A].currency.spaceSeparated&&(l=" "):g.indexOf(" $")>-1?(l=" ",g=g.replace(" $","")):g.indexOf("$ ")>-1?(l=" ",g=g.replace("$ ","")):g=g.replace("$",""),f=m(a._value,g,d,n),-1===c.indexOf("$"))
// Use defaults instead of the format provided
switch(y[A].currency.position){case"postfix":f.indexOf(")")>-1?(f=f.split(""),f.splice(-1,0,l+b),f=f.join("")):f=f+l+b;break;case"infix":break;case"prefix":f.indexOf("(")>-1||f.indexOf("-")>-1?(f=f.split(""),e=Math.max(i,k)+1,f.splice(e,0,b+l),f=f.join("")):f=b+l+f;break;default:throw Error('Currency position should be among ["prefix", "infix", "postfix"]')}else
// position the symbol
1>=h?f.indexOf("(")>-1||f.indexOf("+")>-1||f.indexOf("-")>-1?(f=f.split(""),e=1,(i>h||j>h||k>h)&&(e=0),f.splice(e,0,b+l),f=f.join("")):f=b+l+f:f.indexOf(")")>-1?(f=f.split(""),f.splice(-1,0,l+b),f=f.join("")):f=f+l+b;return f}function h(a,b,c,d){return g(a,b,c,d)}function i(a,b,c){var d,e="",f=100*a._value;
// check for space before %
return b.indexOf(" %")>-1?(e=" ",b=b.replace(" %","")):b=b.replace("%",""),d=m(f,b,c),d.indexOf(")")>-1?(d=d.split(""),d.splice(-1,0,e+"%"),d=d.join("")):d=d+e+"%",d}function j(a){var b=Math.floor(a._value/60/60),c=Math.floor((a._value-60*b*60)/60),d=Math.round(a._value-60*b*60-60*c);return b+":"+(10>c?"0"+c:c)+":"+(10>d?"0"+d:d)}function k(a){var b=a.split(":"),c=0;
// turn hours and minutes into seconds and add them all up
// hours
// minutes
// seconds
// minutes
// seconds
return 3===b.length?(c+=60*Number(b[0])*60,c+=60*Number(b[1]),c+=Number(b[2])):2===b.length&&(c+=60*Number(b[0]),c+=Number(b[1])),Number(c)}function l(a,b,c){var d,e,f,g=b[0],h=Math.abs(a);if(h>=c){for(d=1;d<b.length;++d)if(e=Math.pow(c,d),f=Math.pow(c,d+1),h>=e&&f>h){g=b[d],a/=e;break}
// values greater than or equal to [scale] YB never set the suffix
g===b[0]&&(a/=Math.pow(c,b.length-1),g=b[b.length-1])}return{value:a,suffix:g}}function m(a,c,e,f){var g,h,i,j,k,m,n,o,p,q,r,s,t,u,v,w,z,C=!1,D=!1,E=!1,F="",G=!1,// force abbreviation to thousands
H=!1,// force abbreviation to millions
I=!1,// force abbreviation to billions
J=!1,// force abbreviation to trillions
K=!1,// force abbreviation
L="",M="",N=Math.abs(a),O="",P=!1,Q=!1,R="";
// check if number is zero and a custom zero format has been set
if(0===a&&null!==B)return B;if(!isFinite(a))return""+a;if(0===c.indexOf("{")){var S=c.indexOf("}");if(-1===S)throw Error('Format should also contain a "}"');q=c.slice(1,S),c=c.slice(S+1)}else q="";if(c.indexOf("}")===c.length-1){var T=c.indexOf("{");if(-1===T)throw Error('Format should also contain a "{"');r=c.slice(T+1,-1),c=c.slice(0,T+1)}else r="";
// check for min length
var U;
// see if we are formatting
//   binary-decimal bytes (1024 MB), binary bytes (1024 MiB), or decimal bytes (1000 MB)
for(U=-1===c.indexOf(".")?c.match(/([0-9]+).*/):c.match(/([0-9]+)\..*/),w=null===U?-1:U[1].length,-1!==c.indexOf("-")&&(P=!0),c.indexOf("(")>-1?(C=!0,c=c.slice(1,-1)):c.indexOf("+")>-1&&(D=!0,c=c.replace(/\+/g,"")),c.indexOf("a")>-1&&(o=c.split(".")[0].match(/[0-9]+/g)||["0"],o=parseInt(o[0],10),G=c.indexOf("aK")>=0,H=c.indexOf("aM")>=0,I=c.indexOf("aB")>=0,J=c.indexOf("aT")>=0,K=G||H||I||J,c.indexOf(" a")>-1?(F=" ",c=c.replace(" a","")):c=c.replace("a",""),i=Math.floor(Math.log(N)/Math.LN10)+1,k=i%3,k=0===k?3:k,o&&0!==N&&(j=Math.floor(Math.log(N)/Math.LN10)+1-o,m=3*~~((Math.min(o,i)-k)/3),N/=Math.pow(10,m),-1===c.indexOf(".")&&o>3&&(c+="[.]",u=0===j?0:3*~~(j/3)-j,u=0>u?u+3:u,c+=b(u))),Math.floor(Math.log(Math.abs(a))/Math.LN10)+1!==o&&(N>=Math.pow(10,12)&&!K||J?(F+=y[A].abbreviations.trillion,a/=Math.pow(10,12)):N<Math.pow(10,12)&&N>=Math.pow(10,9)&&!K||I?(F+=y[A].abbreviations.billion,a/=Math.pow(10,9)):N<Math.pow(10,9)&&N>=Math.pow(10,6)&&!K||H?(F+=y[A].abbreviations.million,a/=Math.pow(10,6)):(N<Math.pow(10,6)&&N>=Math.pow(10,3)&&!K||G)&&(F+=y[A].abbreviations.thousand,a/=Math.pow(10,3)))),z=0;z<x.length;++z)if(g=x[z],c.indexOf(g.marker)>-1){
// check for space before
c.indexOf(" "+g.marker)>-1&&(L=" "),
// remove the marker (with the space if it had one)
c=c.replace(L+g.marker,""),h=l(a,g.suffixes,g.scale),a=h.value,L+=h.suffix;break}if(
// see if ordinal is wanted
c.indexOf("o")>-1&&(
// check for space before
c.indexOf(" o")>-1?(M=" ",c=c.replace(" o","")):c=c.replace("o",""),y[A].ordinal&&(M+=y[A].ordinal(a))),c.indexOf("[.]")>-1&&(E=!0,c=c.replace("[.]",".")),n=a.toString().split(".")[0],p=c.split(".")[1],s=c.indexOf(","),p){if(-1!==p.indexOf("*")?O=d(a,a.toString().split(".")[1].length,e):p.indexOf("[")>-1?(p=p.replace("]",""),p=p.split("["),O=d(a,p[0].length+p[1].length,e,p[1].length)):O=d(a,p.length,e),n=O.split(".")[0],O.split(".")[1].length){var V=f?F+f:y[A].delimiters.decimal;O=V+O.split(".")[1]}else O="";E&&0===Number(O.slice(1))&&(O="")}else n=d(a,0,e);
// format number
return n.indexOf("-")>-1&&(n=n.slice(1),Q=!0),n.length<w&&(n=b(w-n.length)+n),s>-1&&(n=n.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g,"$1"+y[A].delimiters.thousands)),0===c.indexOf(".")&&(n=""),t=c.indexOf("("),v=c.indexOf("-"),R=v>t?(C&&Q?"(":"")+(P&&Q||!C&&Q?"-":""):(P&&Q||!C&&Q?"-":"")+(C&&Q?"(":""),q+R+(!Q&&D&&0!==a?"+":"")+n+O+(M?M:"")+(F&&!f?F:"")+(L?L:"")+(C&&Q?")":"")+r}/************************************
        Helpers
    ************************************/
function n(a,b){y[a]=b}function o(a){A=a;var b=y[a].defaults;b&&b.format&&s.defaultFormat(b.format),b&&b.currencyFormat&&s.defaultCurrencyFormat(b.currencyFormat)}function p(){return"undefined"!=typeof process&&void 0===process.browser&&process.title&&(0===process.title.indexOf("node")||process.title.indexOf("meteor-tool")>0||"grunt"===process.title||"gulp"===process.title)&&"undefined"!=typeof require}/**
     * Computes the multiplier necessary to make x >= 1,
     * effectively eliminating miscalculations caused by
     * finite precision.
     */
function q(a){var b=a.toString().split(".");return b.length<2?1:Math.pow(10,b[1].length)}/**
     * Given a variable number of arguments, returns the maximum
     * multiplier that must be used to normalize an operation involving
     * all of them.
     */
function r(){var a=Array.prototype.slice.call(arguments);return a.reduce(function(a,b){var c=q(a),d=q(b);return c>d?c:d},-(1/0))}/************************************
        Constants
    ************************************/
var s,t="1.9.3",u=["B","KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"],v=["B","KB","MB","GB","TB","PB","EB","ZB","YB"],w={general:{scale:1024,suffixes:v,marker:"bd"},binary:{scale:1024,suffixes:u,marker:"b"},decimal:{scale:1e3,suffixes:v,marker:"d"}},
// general must be before the others because it reuses their characters!
x=[w.general,w.binary,w.decimal],
// internal storage for culture config files
y={},
// Todo: Remove in 2.0.0
z=y,A="en-US",B=null,C="0,0",D="0$",
// check for nodeJS
E="undefined"!=typeof module&&module.exports,
// default culture
F={delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"$",position:"prefix"},defaults:{currencyFormat:",0000 a"},formats:{fourDigits:"0000 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00"}};s=function(b){return s.isNumbro(b)?b=b.value():0===b||"undefined"==typeof b?b=0:Number(b)||(b=s.fn.unformat(b)),new a(Number(b))},s.version=t,s.isNumbro=function(b){return b instanceof a},s.setLanguage=function(a,b){console.warn("`setLanguage` is deprecated since version 1.6.0. Use `setCulture` instead");var c=a,d=a.split("-")[0],e=null;z[c]||(Object.keys(z).forEach(function(a){e||a.split("-")[0]!==d||(e=a)}),c=e||b||"en-US"),o(c)},s.setCulture=function(a,b){var c=a,d=a.split("-")[1],e=null;y[c]||(d&&Object.keys(y).forEach(function(a){e||a.split("-")[1]!==d||(e=a)}),c=e||b||"en-US"),o(c)},s.language=function(a,b){if(console.warn("`language` is deprecated since version 1.6.0. Use `culture` instead"),!a)return A;if(a&&!b){if(!z[a])throw new Error("Unknown language : "+a);o(a)}return!b&&z[a]||n(a,b),s},s.culture=function(a,b){if(!a)return A;if(a&&!b){if(!y[a])throw new Error("Unknown culture : "+a);o(a)}return!b&&y[a]||n(a,b),s},s.languageData=function(a){if(console.warn("`languageData` is deprecated since version 1.6.0. Use `cultureData` instead"),!a)return z[A];if(!z[a])throw new Error("Unknown language : "+a);return z[a]},s.cultureData=function(a){if(!a)return y[A];if(!y[a])throw new Error("Unknown culture : "+a);return y[a]},s.culture("en-US",F),s.languages=function(){return console.warn("`languages` is deprecated since version 1.6.0. Use `cultures` instead"),z},s.cultures=function(){return y},s.zeroFormat=function(a){B="string"==typeof a?a:null},s.defaultFormat=function(a){C="string"==typeof a?a:"0.0"},s.defaultCurrencyFormat=function(a){D="string"==typeof a?a:"0$"},s.validate=function(a,b){var c,d,e,f,g,h,i,j;if("string"!=typeof a&&(a+="",console.warn&&console.warn("Numbro.js: Value is not string. It has been co-erced to: ",a)),a=a.trim(),a=a.replace(/^[+-]?/,""),a.match(/^\d+$/))return!0;if(""===a)return!1;try{i=s.cultureData(b)}catch(k){i=s.cultureData(s.culture())}return e=i.currency.symbol,g=i.abbreviations,c=i.delimiters.decimal,d="."===i.delimiters.thousands?"\\.":i.delimiters.thousands,j=a.match(/^[^\d\.\,]+/),null!==j&&(a=a.substr(1),j[0]!==e)?!1:(j=a.match(/[^\d]+$/),null!==j&&(a=a.slice(0,-1),j[0]!==g.thousand&&j[0]!==g.million&&j[0]!==g.billion&&j[0]!==g.trillion)?!1:(h=new RegExp(d+"{2}"),a.match(/[^\d.,]/g)?!1:(f=a.split(c),f.length>2?!1:f.length<2?!!f[0].match(/^\d+.*\d$/)&&!f[0].match(h):""===f[0]?!f[0].match(h)&&!!f[1].match(/^\d+$/):1===f[0].length?!!f[0].match(/^\d+$/)&&!f[0].match(h)&&!!f[1].match(/^\d+$/):!!f[0].match(/^\d+.*\d$/)&&!f[0].match(h)&&!!f[1].match(/^\d+$/))))},s.loadLanguagesInNode=function(){console.warn("`loadLanguagesInNode` is deprecated since version 1.6.0. Use `loadCulturesInNode` instead"),s.loadCulturesInNode()},s.loadCulturesInNode=function(){var a=require("./languages");for(var b in a)b&&s.culture(b,a[b])},"function"!=typeof Array.prototype.reduce&&(Array.prototype.reduce=function(a,b){if(null===this||"undefined"==typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");if("function"!=typeof a)throw new TypeError(a+" is not a function");var c,d,e=this.length>>>0,f=!1;for(1<arguments.length&&(d=b,f=!0),c=0;e>c;++c)this.hasOwnProperty(c)&&(f?d=a(d,this[c],c,this):(d=this[c],f=!0));if(!f)throw new TypeError("Reduce of empty array with no initial value");return d}),s.fn=a.prototype={clone:function(){return s(this)},format:function(a,b){return e(this,a?a:C,void 0!==b?b:Math.round)},formatCurrency:function(a,b){return g(this,y[A].currency.symbol,a?a:D,void 0!==b?b:Math.round)},formatForeignCurrency:function(a,b,c){return h(this,a,b?b:D,void 0!==c?c:Math.round)},unformat:function(a){if("number"==typeof a)return a;if("string"==typeof a){var b=f(this,a);return isNaN(b)?void 0:b}},binaryByteUnits:function(){return l(this._value,w.binary.suffixes,w.binary.scale).suffix},byteUnits:function(){return l(this._value,w.general.suffixes,w.general.scale).suffix},decimalByteUnits:function(){return l(this._value,w.decimal.suffixes,w.decimal.scale).suffix},value:function(){return this._value},valueOf:function(){return this._value},set:function(a){return this._value=Number(a),this},add:function(a){function b(a,b){return a+c*b}var c=r.call(null,this._value,a);return this._value=[this._value,a].reduce(b,0)/c,this},subtract:function(a){function b(a,b){return a-c*b}var c=r.call(null,this._value,a);return this._value=[a].reduce(b,this._value*c)/c,this},multiply:function(a){function b(a,b){var c=r(a,b),d=a*c;return d*=b*c,d/=c*c}return this._value=[this._value,a].reduce(b,1),this},divide:function(a){function b(a,b){var c=r(a,b);return a*c/(b*c)}return this._value=[this._value,a].reduce(b),this},difference:function(a){return Math.abs(s(this._value).subtract(a).value())}},p()&&s.loadCulturesInNode(),E?module.exports=s:("undefined"==typeof ender&&(this.numbro=s),"function"==typeof define&&define.amd&&define([],function(){return s}))}).call("undefined"==typeof window?this:window);