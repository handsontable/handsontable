(window.webpackJsonp=window.webpackJsonp||[]).push([[67],{447:function(t,s,a){"use strict";a.r(s);var e=a(24),n=Object(e.a)({},(function(){var t=this,s=t._self._c;return s("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[s("h1",{attrs:{id:"exportfile"}},[s("a",{staticClass:"header-link",attrs:{href:"#exportfile"}},[s("span",{staticClass:"header-framework"},[t._v("JavaScript Data Grid")]),t._v("ExportFile")])]),t._v(" "),s("p"),s("div",{staticClass:"table-of-contents"},[s("div",{staticClass:"toc-container-header"},[s("i",{staticClass:"ico i-toc"}),t._v("On this page")]),s("ul",[s("li",[s("a",{attrs:{href:"#description"}},[t._v("Description")])]),s("li",[s("a",{attrs:{href:"#members"}},[t._v("Members")]),s("ul",[s("li",[s("a",{attrs:{href:"#exportoptions"}},[t._v("ExportOptions")])])])]),s("li",[s("a",{attrs:{href:"#methods"}},[t._v("Methods")]),s("ul",[s("li",[s("a",{attrs:{href:"#downloadfile"}},[t._v("downloadFile")])]),s("li",[s("a",{attrs:{href:"#exportasblob"}},[t._v("exportAsBlob")])]),s("li",[s("a",{attrs:{href:"#exportasstring"}},[t._v("exportAsString")])]),s("li",[s("a",{attrs:{href:"#isenabled"}},[t._v("isEnabled")])])])])])]),s("p"),t._v(" "),s("h2",{attrs:{id:"description"}},[s("a",{staticClass:"header-link",attrs:{href:"#description"}},[t._v("Description")])]),t._v(" "),s("p",[t._v("The "),s("code",[t._v("ExportFile")]),t._v(" plugin lets you export table data as a string, blob, or downloadable CSV file.")]),t._v(" "),s("p",[t._v("See "),s("RouterLink",{attrs:{to:"/javascript-data-grid/export-to-csv/"}},[t._v("the export file demo")]),t._v(" for examples.")],1),t._v(" "),s("p",[s("strong",[t._v("Example")]),s("br")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" container "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" document"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("getElementById")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("'example'")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" hot "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Handsontable")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("container"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("data")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("getData")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// access to exportFile plugin instance")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" exportPlugin "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" hot"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("getPlugin")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("'exportFile'")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// export as a string")]),t._v("\nexportPlugin"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("exportAsString")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("'csv'")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// export as a blob object")]),t._v("\nexportPlugin"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("exportAsBlob")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("'csv'")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// export to downloadable file (named: MyFile.csv)")]),t._v("\nexportPlugin"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("downloadFile")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("'csv'")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("filename")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("'MyFile'")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// export as a string (with specified data range):")]),t._v("\nexportPlugin"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("exportAsString")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("'csv'")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("exportHiddenRows")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("     "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// default false")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("exportHiddenColumns")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// default false")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("columnHeaders")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("        "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// default false")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("rowHeaders")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("           "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// default false")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("columnDelimiter")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("';'")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("       "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// default ','")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("range")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("6")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("6")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),t._v("         "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// [startRow, endRow, startColumn, endColumn]")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),s("div",{staticClass:"codeControls"},[s("div",{staticClass:"select-type"},[s("button",{staticClass:"select-type-button",attrs:{type:"button",value:"js"},on:{click:function(s){return t.$parent.$parent.toggleDropdown(s)}}},[t._v("\n                "+t._s(t.$parent.$parent.selectedLang)+"\n              ")]),t._v(" "),s("ul",[s("li",[s("button",{class:{"select-type-js":!0,active:!0},attrs:{type:"button"},on:{click:function(s){return t.$parent.$parent.setLanguage("JavaScript")}}},[t._v("\n                    JavaScript\n                  ")])]),t._v(" "),s("li",[s("button",{class:{"select-type-ts":!0,active:!1},attrs:{type:"button"},on:{click:function(s){return t.$parent.$parent.setLanguage("TypeScript")}}},[t._v("\n                    TypeScript\n                  ")])])])]),t._v(" "),s("button",{staticClass:"copycode",attrs:{"aria-label":"Copy to clipboard"},on:{click:function(s){return t.$parent.$parent.copyCode(s)}}},[s("i",{staticClass:"ico i-copy no-pointer"}),s("i",{staticClass:"ico i-checks no-pointer"})])])]),s("p"),t._v(" "),s("p"),t._v(" "),s("h2",{attrs:{id:"members"}},[s("a",{staticClass:"header-link",attrs:{href:"#members"}},[t._v("Members")])]),t._v(" "),s("h3",{attrs:{id:"exportoptions"}},[s("a",{staticClass:"header-link",attrs:{href:"#exportoptions"}},[t._v("ExportOptions")])]),t._v(" "),s("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\exportFile/exportFile.js#L104",target:"_blank"}},[t._v(" Source code "),s("i",{staticClass:"ico i-external"})]),s("p",[s("em",[t._v("ExportFile.ExportOptions : object")])]),t._v(" "),s("p",[s("strong",[t._v("Properties")])]),t._v(" "),s("table",[s("thead",[s("tr",[s("th",[t._v("Name")]),t._v(" "),s("th",[t._v("Type")]),t._v(" "),s("th",[t._v("Default")]),t._v(" "),s("th",[t._v("Description")])])]),t._v(" "),s("tbody",[s("tr",[s("td",[t._v("[exportHiddenRows]")]),t._v(" "),s("td",[s("code",[t._v("boolean")])]),t._v(" "),s("td",[s("code",[t._v("false")])]),t._v(" "),s("td",[t._v("Include hidden rows in the exported file.")])]),t._v(" "),s("tr",[s("td",[t._v("[exportHiddenColumns]")]),t._v(" "),s("td",[s("code",[t._v("boolean")])]),t._v(" "),s("td",[s("code",[t._v("false")])]),t._v(" "),s("td",[t._v("Include hidden columns in the exported file.")])]),t._v(" "),s("tr",[s("td",[t._v("[columnHeaders]")]),t._v(" "),s("td",[s("code",[t._v("boolean")])]),t._v(" "),s("td",[s("code",[t._v("false")])]),t._v(" "),s("td",[t._v("Include column headers in the exported file.")])]),t._v(" "),s("tr",[s("td",[t._v("[rowHeaders]")]),t._v(" "),s("td",[s("code",[t._v("boolean")])]),t._v(" "),s("td",[s("code",[t._v("false")])]),t._v(" "),s("td",[t._v("Include row headers in the exported file.")])]),t._v(" "),s("tr",[s("td",[t._v("[columnDelimiter]")]),t._v(" "),s("td",[s("code",[t._v("string")])]),t._v(" "),s("td",[s("code",[t._v('","')])]),t._v(" "),s("td",[t._v("Column delimiter.")])]),t._v(" "),s("tr",[s("td",[t._v("[range]")]),t._v(" "),s("td",[s("code",[t._v("string")])]),t._v(" "),s("td",[s("code",[t._v('"[]"')])]),t._v(" "),s("td",[t._v("Cell range that will be exported to file.")])])])]),t._v(" "),s("h2",{attrs:{id:"methods"}},[s("a",{staticClass:"header-link",attrs:{href:"#methods"}},[t._v("Methods")])]),t._v(" "),s("h3",{attrs:{id:"downloadfile"}},[s("a",{staticClass:"header-link",attrs:{href:"#downloadfile"}},[t._v("downloadFile")])]),t._v(" "),s("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\exportFile/exportFile.js#L144",target:"_blank"}},[t._v(" Source code "),s("i",{staticClass:"ico i-external"})]),s("p",[s("em",[t._v("exportFile.downloadFile(format, options)")])]),t._v(" "),s("p",[t._v("Exports table data as a downloadable file.")]),t._v(" "),s("table",[s("thead",[s("tr",[s("th",[t._v("Param")]),t._v(" "),s("th",[t._v("Type")]),t._v(" "),s("th",[t._v("Description")])])]),t._v(" "),s("tbody",[s("tr",[s("td",[t._v("format")]),t._v(" "),s("td",[s("code",[t._v("string")])]),t._v(" "),s("td",[t._v("Export format type eq. "),s("code",[t._v("'csv'")]),t._v(".")])]),t._v(" "),s("tr",[s("td",[t._v("options")]),t._v(" "),s("td",[s("code",[t._v("ExportOptions")])]),t._v(" "),s("td",[t._v("Export options.")])])])]),t._v(" "),s("h3",{attrs:{id:"exportasblob"}},[s("a",{staticClass:"header-link",attrs:{href:"#exportasblob"}},[t._v("exportAsBlob")])]),t._v(" "),s("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\exportFile/exportFile.js#L134",target:"_blank"}},[t._v(" Source code "),s("i",{staticClass:"ico i-external"})]),s("p",[s("em",[t._v("exportFile.exportAsBlob(format, options) ⇒ Blob")])]),t._v(" "),s("p",[t._v("Exports table data as a blob object.")]),t._v(" "),s("table",[s("thead",[s("tr",[s("th",[t._v("Param")]),t._v(" "),s("th",[t._v("Type")]),t._v(" "),s("th",[t._v("Description")])])]),t._v(" "),s("tbody",[s("tr",[s("td",[t._v("format")]),t._v(" "),s("td",[s("code",[t._v("string")])]),t._v(" "),s("td",[t._v("Export format type eq. "),s("code",[t._v("'csv'")]),t._v(".")])]),t._v(" "),s("tr",[s("td",[t._v("options")]),t._v(" "),s("td",[s("code",[t._v("ExportOptions")])]),t._v(" "),s("td",[t._v("Export options.")])])])]),t._v(" "),s("h3",{attrs:{id:"exportasstring"}},[s("a",{staticClass:"header-link",attrs:{href:"#exportasstring"}},[t._v("exportAsString")])]),t._v(" "),s("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\exportFile/exportFile.js#L123",target:"_blank"}},[t._v(" Source code "),s("i",{staticClass:"ico i-external"})]),s("p",[s("em",[t._v("exportFile.exportAsString(format, options) ⇒ string")])]),t._v(" "),s("p",[t._v("Exports table data as a string.")]),t._v(" "),s("table",[s("thead",[s("tr",[s("th",[t._v("Param")]),t._v(" "),s("th",[t._v("Type")]),t._v(" "),s("th",[t._v("Description")])])]),t._v(" "),s("tbody",[s("tr",[s("td",[t._v("format")]),t._v(" "),s("td",[s("code",[t._v("string")])]),t._v(" "),s("td",[t._v("Export format type eq. "),s("code",[t._v("'csv'")]),t._v(".")])]),t._v(" "),s("tr",[s("td",[t._v("options")]),t._v(" "),s("td",[s("code",[t._v("ExportOptions")])]),t._v(" "),s("td",[t._v("Export options.")])])])]),t._v(" "),s("h3",{attrs:{id:"isenabled"}},[s("a",{staticClass:"header-link",attrs:{href:"#isenabled"}},[t._v("isEnabled")])]),t._v(" "),s("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\exportFile/exportFile.js#L100",target:"_blank"}},[t._v(" Source code "),s("i",{staticClass:"ico i-external"})]),s("p",[s("em",[t._v("exportFile.isEnabled() ⇒ boolean")])]),t._v(" "),s("p",[t._v("Checks if the plugin is enabled in the handsontable settings. This method is executed in "),s("RouterLink",{attrs:{to:"/javascript-data-grid/api/hooks/#beforeinit"}},[t._v("Hooks#beforeInit")]),t._v("\nhook and if it returns "),s("code",[t._v("true")]),t._v(" then the "),s("RouterLink",{attrs:{to:"/javascript-data-grid/api/export-file/#enableplugin"}},[t._v("ExportFile#enablePlugin")]),t._v(" method is called.")],1)])}),[],!1,null,null,null);s.default=n.exports}}]);