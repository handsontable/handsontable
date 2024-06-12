//! moment.js locale configuration
//! locale : Northern Kurdish [ku-kmr]
//! authors : Mazlum Özdogan : https://github.com/mergehez
!function(e,n){"object"==typeof exports&&"undefined"!=typeof module&&"function"==typeof require?n(require("../moment")):"function"==typeof define&&define.amd?define(["../moment"],n):n(e.moment)}(this,(function(e){"use strict";
//! moment.js locale configuration
function n(e,n,a,t){var d={s:["çend sanîye","çend sanîyeyan"],ss:[e+" sanîye",e+" sanîyeyan"],m:["deqîqeyek","deqîqeyekê"],mm:[e+" deqîqe",e+" deqîqeyan"],h:["saetek","saetekê"],hh:[e+" saet",e+" saetan"],d:["rojek","rojekê"],dd:[e+" roj",e+" rojan"],w:["hefteyek","hefteyekê"],ww:[e+" hefte",e+" hefteyan"],M:["mehek","mehekê"],MM:[e+" meh",e+" mehan"],y:["salek","salekê"],yy:[e+" sal",e+" salan"]};return n?d[a][0]:d[a][1]}return e.defineLocale("ku-kmr",{months:"Rêbendan_Sibat_Adar_Nîsan_Gulan_Hezîran_Tîrmeh_Tebax_Îlon_Cotmeh_Mijdar_Berfanbar".split("_"),monthsShort:"Rêb_Sib_Ada_Nîs_Gul_Hez_Tîr_Teb_Îlo_Cot_Mij_Ber".split("_"),monthsParseExact:!0,weekdays:"Yekşem_Duşem_Sêşem_Çarşem_Pêncşem_În_Şemî".split("_"),weekdaysShort:"Yek_Du_Sê_Çar_Pên_În_Şem".split("_"),weekdaysMin:"Ye_Du_Sê_Ça_Pê_În_Şe".split("_"),meridiem:function(e,n,a){return e<12?a?"bn":"BN":a?"pn":"PN"},meridiemParse:/bn|BN|pn|PN/,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"Do MMMM[a] YYYY[an]",LLL:"Do MMMM[a] YYYY[an] HH:mm",LLLL:"dddd, Do MMMM[a] YYYY[an] HH:mm",ll:"Do MMM[.] YYYY[an]",lll:"Do MMM[.] YYYY[an] HH:mm",llll:"ddd[.], Do MMM[.] YYYY[an] HH:mm"},calendar:{sameDay:"[Îro di saet] LT [de]",nextDay:"[Sibê di saet] LT [de]",nextWeek:"dddd [di saet] LT [de]",lastDay:"[Duh di saet] LT [de]",lastWeek:"dddd[a borî di saet] LT [de]",sameElse:"L"},relativeTime:{future:"di %s de",past:"berî %s",s:n,ss:n,m:n,mm:n,h:n,hh:n,d:n,dd:n,w:n,ww:n,M:n,MM:n,y:n,yy:n},dayOfMonthOrdinalParse:/\d{1,2}(?:yê|ê|\.)/,ordinal:function(e,n){var a=n.toLowerCase();return a.includes("w")||a.includes("m")?e+".":e+function(e){var n=(e=""+e).substring(e.length-1),a=e.length>1?e.substring(e.length-2):"";return 12==a||13==a||"2"!=n&&"3"!=n&&"50"!=a&&"70"!=n&&"80"!=n?"ê":"yê"}(e)},week:{dow:1,doy:4}})}));