(window.webpackJsonp=window.webpackJsonp||[]).push([[259],{636:function(t,e,a){"use strict";a.r(e);var s=a(24),n=Object(s.a)({},(function(){var t=this,e=t._self._c;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h1",{attrs:{id:"manualcolumnresize"}},[e("a",{staticClass:"header-link",attrs:{href:"#manualcolumnresize"}},[e("span",{staticClass:"header-framework"},[t._v("React Data Grid")]),t._v("ManualColumnResize")])]),t._v(" "),e("p"),e("div",{staticClass:"table-of-contents"},[e("div",{staticClass:"toc-container-header"},[e("i",{staticClass:"ico i-toc"}),t._v("On this page")]),e("ul",[e("li",[e("a",{attrs:{href:"#description"}},[t._v("Description")])]),e("li",[e("a",{attrs:{href:"#options"}},[t._v("Options")]),e("ul",[e("li",[e("a",{attrs:{href:"#manualcolumnresize-2"}},[t._v("manualColumnResize")])])])]),e("li",[e("a",{attrs:{href:"#methods"}},[t._v("Methods")]),e("ul",[e("li",[e("a",{attrs:{href:"#clearmanualsize"}},[t._v("clearManualSize")])]),e("li",[e("a",{attrs:{href:"#destroy"}},[t._v("destroy")])]),e("li",[e("a",{attrs:{href:"#disableplugin"}},[t._v("disablePlugin")])]),e("li",[e("a",{attrs:{href:"#enableplugin"}},[t._v("enablePlugin")])]),e("li",[e("a",{attrs:{href:"#isenabled"}},[t._v("isEnabled")])]),e("li",[e("a",{attrs:{href:"#loadmanualcolumnwidths"}},[t._v("loadManualColumnWidths")])]),e("li",[e("a",{attrs:{href:"#savemanualcolumnwidths"}},[t._v("saveManualColumnWidths")])]),e("li",[e("a",{attrs:{href:"#setmanualsize"}},[t._v("setManualSize")])]),e("li",[e("a",{attrs:{href:"#updateplugin"}},[t._v("updatePlugin")])])])])])]),e("p"),t._v(" "),e("h2",{attrs:{id:"description"}},[e("a",{staticClass:"header-link",attrs:{href:"#description"}},[t._v("Description")])]),t._v(" "),e("p",[t._v("This plugin allows to change columns width. To make columns width persistent the "),e("RouterLink",{attrs:{to:"/react-data-grid/api/options/#persistentstate"}},[t._v("Options#persistentState")]),t._v("\nplugin should be enabled.")],1),t._v(" "),e("p",[t._v("The plugin creates additional components to make resizing possibly using user interface:")]),t._v(" "),e("ul",[e("li",[t._v("handle - the draggable element that sets the desired width of the column.")]),t._v(" "),e("li",[t._v("guide - the helper guide that shows the desired width as a vertical guide.")])]),t._v(" "),e("h2",{attrs:{id:"options"}},[e("a",{staticClass:"header-link",attrs:{href:"#options"}},[t._v("Options")])]),t._v(" "),e("h3",{attrs:{id:"manualcolumnresize-2"}},[e("a",{staticClass:"header-link",attrs:{href:"#manualcolumnresize-2"}},[t._v("manualColumnResize")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\dataMap\\metaManager/metaSchema.js#L2960",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.manualColumnResize : boolean | Array<number>")])]),t._v(" "),e("p",[t._v("The "),e("code",[t._v("manualColumnResize")]),t._v(" option configures the "),e("RouterLink",{attrs:{to:"/react-data-grid/api/manual-column-resize/"}},[e("code",[t._v("ManualColumnResize")])]),t._v(" plugin.")],1),t._v(" "),e("p",[t._v("You can set the "),e("code",[t._v("manualColumnResize")]),t._v(" option to one of the following:")]),t._v(" "),e("table",[e("thead",[e("tr",[e("th",[t._v("Setting")]),t._v(" "),e("th",[t._v("Description")])])]),t._v(" "),e("tbody",[e("tr",[e("td",[e("code",[t._v("true")])]),t._v(" "),e("td",[t._v("Enable the "),e("RouterLink",{attrs:{to:"/react-data-grid/api/manual-column-resize/"}},[e("code",[t._v("ManualColumnResize")])]),t._v(" plugin")],1)]),t._v(" "),e("tr",[e("td",[e("code",[t._v("false")])]),t._v(" "),e("td",[t._v("Disable the "),e("RouterLink",{attrs:{to:"/react-data-grid/api/manual-column-resize/"}},[e("code",[t._v("ManualColumnResize")])]),t._v(" plugin")],1)]),t._v(" "),e("tr",[e("td",[t._v("An array")]),t._v(" "),e("td",[t._v("- Enable the "),e("RouterLink",{attrs:{to:"/react-data-grid/api/manual-column-resize/"}},[e("code",[t._v("ManualColumnResize")])]),t._v(" plugin"),e("br"),t._v("- Set initial widths of individual columns")],1)])])]),t._v(" "),e("p",[t._v("Read more:")]),t._v(" "),e("ul",[e("li",[e("RouterLink",{attrs:{to:"/react-data-grid/column-width/#column-stretching"}},[t._v("Column width: Column stretching")])],1)]),t._v(" "),e("p",[e("strong",[t._v("Default")]),t._v(": "),e("code",[t._v("undefined")]),e("br"),t._v(" "),e("strong",[t._v("Example")])]),t._v(" "),e("div",{staticClass:"language-js extra-class"},[e("pre",{pre:!0,attrs:{class:"language-js"}},[e("code",[e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// enable the `manualColumnResize` plugin")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("manualColumnResize")]),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// enable the `manualColumnResize` plugin")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// set the initial width of column 0 to 40 pixels")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// set the initial width of column 1 to 50 pixels")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// set the initial width of column 2 to 60 pixels")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("manualColumnResize")]),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("40")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("50")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("60")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"codeControls"},[e("div",{staticClass:"select-type"},[e("button",{staticClass:"select-type-button",attrs:{type:"button",value:"js"},on:{click:function(e){return t.$parent.$parent.toggleDropdown(e)}}},[t._v("\n                "+t._s(t.$parent.$parent.selectedLang)+"\n              ")]),t._v(" "),e("ul",[e("li",[e("button",{class:{"select-type-js":!0,active:!0},attrs:{type:"button"},on:{click:function(e){return t.$parent.$parent.setLanguage("JavaScript")}}},[t._v("\n                    JavaScript\n                  ")])]),t._v(" "),e("li",[e("button",{class:{"select-type-ts":!0,active:!1},attrs:{type:"button"},on:{click:function(e){return t.$parent.$parent.setLanguage("TypeScript")}}},[t._v("\n                    TypeScript\n                  ")])])])]),t._v(" "),e("button",{staticClass:"copycode",attrs:{"aria-label":"Copy to clipboard"},on:{click:function(e){return t.$parent.$parent.copyCode(e)}}},[e("i",{staticClass:"ico i-copy no-pointer"}),e("i",{staticClass:"ico i-checks no-pointer"})])])]),e("h2",{attrs:{id:"methods"}},[e("a",{staticClass:"header-link",attrs:{href:"#methods"}},[t._v("Methods")])]),t._v(" "),e("h3",{attrs:{id:"clearmanualsize"}},[e("a",{staticClass:"header-link",attrs:{href:"#clearmanualsize"}},[t._v("clearManualSize")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualColumnResize/manualColumnResize.js#L219",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.clearManualSize(column)")])]),t._v(" "),e("p",[t._v("Clears the cache for the specified column index.")]),t._v(" "),e("table",[e("thead",[e("tr",[e("th",[t._v("Param")]),t._v(" "),e("th",[t._v("Type")]),t._v(" "),e("th",[t._v("Description")])])]),t._v(" "),e("tbody",[e("tr",[e("td",[t._v("column")]),t._v(" "),e("td",[e("code",[t._v("number")])]),t._v(" "),e("td",[t._v("Visual column index.")])])])]),t._v(" "),e("h3",{attrs:{id:"destroy"}},[e("a",{staticClass:"header-link",attrs:{href:"#destroy"}},[t._v("destroy")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualColumnResize/manualColumnResize.js#L688",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.destroy()")])]),t._v(" "),e("p",[t._v("Destroys the plugin instance.")]),t._v(" "),e("h3",{attrs:{id:"disableplugin"}},[e("a",{staticClass:"header-link",attrs:{href:"#disableplugin"}},[t._v("disablePlugin")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualColumnResize/manualColumnResize.js#L169",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.disablePlugin()")])]),t._v(" "),e("p",[t._v("Disables the plugin functionality for this Handsontable instance.")]),t._v(" "),e("h3",{attrs:{id:"enableplugin"}},[e("a",{staticClass:"header-link",attrs:{href:"#enableplugin"}},[t._v("enablePlugin")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualColumnResize/manualColumnResize.js#L133",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.enablePlugin()")])]),t._v(" "),e("p",[t._v("Enables the plugin functionality for this Handsontable instance.")]),t._v(" "),e("h3",{attrs:{id:"isenabled"}},[e("a",{staticClass:"header-link",attrs:{href:"#isenabled"}},[t._v("isEnabled")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualColumnResize/manualColumnResize.js#L126",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.isEnabled() ⇒ boolean")])]),t._v(" "),e("p",[t._v("Checks if the plugin is enabled in the handsontable settings. This method is executed in "),e("RouterLink",{attrs:{to:"/react-data-grid/api/hooks/#beforeinit"}},[t._v("Hooks#beforeInit")]),t._v("\nhook and if it returns "),e("code",[t._v("true")]),t._v(" then the "),e("RouterLink",{attrs:{to:"/react-data-grid/api/manual-column-resize/#enableplugin"}},[t._v("ManualColumnResize#enablePlugin")]),t._v(" method is called.")],1),t._v(" "),e("h3",{attrs:{id:"loadmanualcolumnwidths"}},[e("a",{staticClass:"header-link",attrs:{href:"#loadmanualcolumnwidths"}},[t._v("loadManualColumnWidths")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualColumnResize/manualColumnResize.js#L190",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.loadManualColumnWidths() ⇒ Array")])]),t._v(" "),e("p",[t._v("Loads the previously saved sizes using the persistentState plugin (the "),e("RouterLink",{attrs:{to:"/react-data-grid/api/options/#persistentstate"}},[t._v("Options#persistentState")]),t._v(" option has to be enabled).")],1),t._v(" "),e("p",[e("strong",[t._v("Emits")]),t._v(": "),e("RouterLink",{attrs:{to:"/react-data-grid/api/hooks/#persistentstateload"}},[e("code",[t._v("Hooks#event:persistentStateLoad")])])],1),t._v(" "),e("h3",{attrs:{id:"savemanualcolumnwidths"}},[e("a",{staticClass:"header-link",attrs:{href:"#savemanualcolumnwidths"}},[t._v("saveManualColumnWidths")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualColumnResize/manualColumnResize.js#L180",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.saveManualColumnWidths()")])]),t._v(" "),e("p",[t._v("Saves the current sizes using the persistentState plugin (the "),e("RouterLink",{attrs:{to:"/react-data-grid/api/options/#persistentstate"}},[t._v("Options#persistentState")]),t._v(" option has to be enabled).")],1),t._v(" "),e("p",[e("strong",[t._v("Emits")]),t._v(": "),e("RouterLink",{attrs:{to:"/react-data-grid/api/hooks/#persistentstatesave"}},[e("code",[t._v("Hooks#event:persistentStateSave")])])],1),t._v(" "),e("h3",{attrs:{id:"setmanualsize"}},[e("a",{staticClass:"header-link",attrs:{href:"#setmanualsize"}},[t._v("setManualSize")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualColumnResize/manualColumnResize.js#L205",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.setManualSize(column, width) ⇒ number")])]),t._v(" "),e("p",[t._v("Sets the new width for specified column index.")]),t._v(" "),e("table",[e("thead",[e("tr",[e("th",[t._v("Param")]),t._v(" "),e("th",[t._v("Type")]),t._v(" "),e("th",[t._v("Description")])])]),t._v(" "),e("tbody",[e("tr",[e("td",[t._v("column")]),t._v(" "),e("td",[e("code",[t._v("number")])]),t._v(" "),e("td",[t._v("Visual column index.")])]),t._v(" "),e("tr",[e("td",[t._v("width")]),t._v(" "),e("td",[e("code",[t._v("number")])]),t._v(" "),e("td",[t._v("Column width (no less than 20px).")])])])]),t._v(" "),e("p",[e("strong",[t._v("Returns")]),t._v(": "),e("code",[t._v("number")]),t._v(" - Returns new width.")]),t._v(" "),e("h3",{attrs:{id:"updateplugin"}},[e("a",{staticClass:"header-link",attrs:{href:"#updateplugin"}},[t._v("updatePlugin")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualColumnResize/manualColumnResize.js#L159",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualColumnResize.updatePlugin()")])]),t._v(" "),e("p",[t._v("Updates the plugin's state.")]),t._v(" "),e("p",[t._v("This method is executed when "),e("RouterLink",{attrs:{to:"/react-data-grid/api/core/#updatesettings"}},[e("code",[t._v("updateSettings()")])]),t._v(" is invoked with any of the following configuration options:")],1),t._v(" "),e("ul",[e("li",[e("RouterLink",{attrs:{to:"/react-data-grid/api/options/#manualcolumnresize"}},[e("code",[t._v("manualColumnResize")])])],1)])])}),[],!1,null,null,null);e.default=n.exports}}]);