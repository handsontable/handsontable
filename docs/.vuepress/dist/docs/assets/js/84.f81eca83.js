(window.webpackJsonp=window.webpackJsonp||[]).push([[84],{463:function(t,e,a){"use strict";a.r(e);var s=a(24),i=Object(s.a)({},(function(){var t=this,e=t._self._c;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h1",{attrs:{id:"manualrowresize"}},[e("a",{staticClass:"header-link",attrs:{href:"#manualrowresize"}},[e("span",{staticClass:"header-framework"},[t._v("JavaScript Data Grid")]),t._v("ManualRowResize")])]),t._v(" "),e("p"),e("div",{staticClass:"table-of-contents"},[e("div",{staticClass:"toc-container-header"},[e("i",{staticClass:"ico i-toc"}),t._v("On this page")]),e("ul",[e("li",[e("a",{attrs:{href:"#description"}},[t._v("Description")])]),e("li",[e("a",{attrs:{href:"#options"}},[t._v("Options")]),e("ul",[e("li",[e("a",{attrs:{href:"#manualrowresize-2"}},[t._v("manualRowResize")])])])]),e("li",[e("a",{attrs:{href:"#methods"}},[t._v("Methods")]),e("ul",[e("li",[e("a",{attrs:{href:"#destroy"}},[t._v("destroy")])]),e("li",[e("a",{attrs:{href:"#disableplugin"}},[t._v("disablePlugin")])]),e("li",[e("a",{attrs:{href:"#enableplugin"}},[t._v("enablePlugin")])]),e("li",[e("a",{attrs:{href:"#getlastdesiredrowheight"}},[t._v("getLastDesiredRowHeight")])]),e("li",[e("a",{attrs:{href:"#isenabled"}},[t._v("isEnabled")])]),e("li",[e("a",{attrs:{href:"#loadmanualrowheights"}},[t._v("loadManualRowHeights")])]),e("li",[e("a",{attrs:{href:"#savemanualrowheights"}},[t._v("saveManualRowHeights")])]),e("li",[e("a",{attrs:{href:"#setmanualsize"}},[t._v("setManualSize")])]),e("li",[e("a",{attrs:{href:"#updateplugin"}},[t._v("updatePlugin")])])])])])]),e("p"),t._v(" "),e("h2",{attrs:{id:"description"}},[e("a",{staticClass:"header-link",attrs:{href:"#description"}},[t._v("Description")])]),t._v(" "),e("p",[t._v("This plugin allows to change rows height. To make rows height persistent the "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/options/#persistentstate"}},[t._v("Options#persistentState")]),t._v("\nplugin should be enabled.")],1),t._v(" "),e("p",[t._v("The plugin creates additional components to make resizing possibly using user interface:")]),t._v(" "),e("ul",[e("li",[t._v("handle - the draggable element that sets the desired height of the row.")]),t._v(" "),e("li",[t._v("guide - the helper guide that shows the desired height as a horizontal guide.")])]),t._v(" "),e("h2",{attrs:{id:"options"}},[e("a",{staticClass:"header-link",attrs:{href:"#options"}},[t._v("Options")])]),t._v(" "),e("h3",{attrs:{id:"manualrowresize-2"}},[e("a",{staticClass:"header-link",attrs:{href:"#manualrowresize-2"}},[t._v("manualRowResize")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\dataMap\\metaManager/metaSchema.js#L3028",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.manualRowResize : boolean | Array<number>")])]),t._v(" "),e("p",[t._v("The "),e("code",[t._v("manualRowResize")]),t._v(" option configures the "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/manual-row-resize/"}},[e("code",[t._v("ManualRowResize")])]),t._v(" plugin.")],1),t._v(" "),e("p",[t._v("You can set the "),e("code",[t._v("manualRowResize")]),t._v(" option to one of the following:")]),t._v(" "),e("table",[e("thead",[e("tr",[e("th",[t._v("Setting")]),t._v(" "),e("th",[t._v("Description")])])]),t._v(" "),e("tbody",[e("tr",[e("td",[e("code",[t._v("true")])]),t._v(" "),e("td",[t._v("Enable the "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/manual-row-resize/"}},[e("code",[t._v("ManualRowResize")])]),t._v(" plugin")],1)]),t._v(" "),e("tr",[e("td",[e("code",[t._v("false")])]),t._v(" "),e("td",[t._v("Disable the "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/manual-row-resize/"}},[e("code",[t._v("ManualRowResize")])]),t._v(" plugin")],1)]),t._v(" "),e("tr",[e("td",[t._v("An array")]),t._v(" "),e("td",[t._v("- Enable the "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/manual-row-resize/"}},[e("code",[t._v("ManualRowResize")])]),t._v(" plugin"),e("br"),t._v("- Set initial heights of individual rows")],1)])])]),t._v(" "),e("p",[t._v("Read more:")]),t._v(" "),e("ul",[e("li",[e("RouterLink",{attrs:{to:"/javascript-data-grid/row-height/#adjust-the-row-height-manually"}},[t._v("Row height: Adjust the row height manually")])],1)]),t._v(" "),e("p",[e("strong",[t._v("Default")]),t._v(": "),e("code",[t._v("undefined")]),e("br"),t._v(" "),e("strong",[t._v("Example")])]),t._v(" "),e("div",{staticClass:"language-js extra-class"},[e("pre",{pre:!0,attrs:{class:"language-js"}},[e("code",[e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// enable the `ManualRowResize` plugin")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("manualRowResize")]),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// enable the `ManualRowResize` plugin")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// set the initial height of row 0 to 40 pixels")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// set the initial height of row 1 to 50 pixels")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// set the initial height of row 2 to 60 pixels")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token literal-property property"}},[t._v("manualRowResize")]),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("40")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("50")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("60")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"codeControls"},[e("div",{staticClass:"select-type"},[e("button",{staticClass:"select-type-button",attrs:{type:"button",value:"js"},on:{click:function(e){return t.$parent.$parent.toggleDropdown(e)}}},[t._v("\n                "+t._s(t.$parent.$parent.selectedLang)+"\n              ")]),t._v(" "),e("ul",[e("li",[e("button",{class:{"select-type-js":!0,active:!0},attrs:{type:"button"},on:{click:function(e){return t.$parent.$parent.setLanguage("JavaScript")}}},[t._v("\n                    JavaScript\n                  ")])]),t._v(" "),e("li",[e("button",{class:{"select-type-ts":!0,active:!1},attrs:{type:"button"},on:{click:function(e){return t.$parent.$parent.setLanguage("TypeScript")}}},[t._v("\n                    TypeScript\n                  ")])])])]),t._v(" "),e("button",{staticClass:"copycode",attrs:{"aria-label":"Copy to clipboard"},on:{click:function(e){return t.$parent.$parent.copyCode(e)}}},[e("i",{staticClass:"ico i-copy no-pointer"}),e("i",{staticClass:"ico i-checks no-pointer"})])])]),e("h2",{attrs:{id:"methods"}},[e("a",{staticClass:"header-link",attrs:{href:"#methods"}},[t._v("Methods")])]),t._v(" "),e("h3",{attrs:{id:"destroy"}},[e("a",{staticClass:"header-link",attrs:{href:"#destroy"}},[t._v("destroy")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualRowResize/manualRowResize.js#L665",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.destroy()")])]),t._v(" "),e("p",[t._v("Destroys the plugin instance.")]),t._v(" "),e("h3",{attrs:{id:"disableplugin"}},[e("a",{staticClass:"header-link",attrs:{href:"#disableplugin"}},[t._v("disablePlugin")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualRowResize/manualRowResize.js#L166",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.disablePlugin()")])]),t._v(" "),e("p",[t._v("Disables the plugin functionality for this Handsontable instance.")]),t._v(" "),e("h3",{attrs:{id:"enableplugin"}},[e("a",{staticClass:"header-link",attrs:{href:"#enableplugin"}},[t._v("enablePlugin")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualRowResize/manualRowResize.js#L134",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.enablePlugin()")])]),t._v(" "),e("p",[t._v("Enables the plugin functionality for this Handsontable instance.")]),t._v(" "),e("h3",{attrs:{id:"getlastdesiredrowheight"}},[e("a",{staticClass:"header-link",attrs:{href:"#getlastdesiredrowheight"}},[t._v("getLastDesiredRowHeight")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualRowResize/manualRowResize.js#L219",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.getLastDesiredRowHeight() ⇒ number")])]),t._v(" "),e("p",[t._v("Returns the last desired row height set manually with the resize handle.")]),t._v(" "),e("p",[e("strong",[t._v("Returns")]),t._v(": "),e("code",[t._v("number")]),t._v(" - The last desired row height.")]),t._v(" "),e("h3",{attrs:{id:"isenabled"}},[e("a",{staticClass:"header-link",attrs:{href:"#isenabled"}},[t._v("isEnabled")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualRowResize/manualRowResize.js#L127",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.isEnabled() ⇒ boolean")])]),t._v(" "),e("p",[t._v("Checks if the plugin is enabled in the handsontable settings. This method is executed in "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/hooks/#beforeinit"}},[t._v("Hooks#beforeInit")]),t._v("\nhook and if it returns "),e("code",[t._v("true")]),t._v(" then the "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/manual-row-resize/#enableplugin"}},[t._v("ManualRowResize#enablePlugin")]),t._v(" method is called.")],1),t._v(" "),e("h3",{attrs:{id:"loadmanualrowheights"}},[e("a",{staticClass:"header-link",attrs:{href:"#loadmanualrowheights"}},[t._v("loadManualRowHeights")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualRowResize/manualRowResize.js#L190",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.loadManualRowHeights() ⇒ Array")])]),t._v(" "),e("p",[t._v("Loads the previously saved sizes using the persistentState plugin (the "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/options/#persistentstate"}},[t._v("Options#persistentState")]),t._v(" option\nhas be enabled).")],1),t._v(" "),e("p",[e("strong",[t._v("Emits")]),t._v(": "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/hooks/#persistentstateload"}},[e("code",[t._v("Hooks#event:persistentStateLoad")])])],1),t._v(" "),e("h3",{attrs:{id:"savemanualrowheights"}},[e("a",{staticClass:"header-link",attrs:{href:"#savemanualrowheights"}},[t._v("saveManualRowHeights")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualRowResize/manualRowResize.js#L179",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.saveManualRowHeights()")])]),t._v(" "),e("p",[t._v("Saves the current sizes using the persistentState plugin (the "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/options/#persistentstate"}},[t._v("Options#persistentState")]),t._v(" option has to be\nenabled).")],1),t._v(" "),e("p",[e("strong",[t._v("Emits")]),t._v(": "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/hooks/#persistentstatesave"}},[e("code",[t._v("Hooks#event:persistentStateSave")])])],1),t._v(" "),e("h3",{attrs:{id:"setmanualsize"}},[e("a",{staticClass:"header-link",attrs:{href:"#setmanualsize"}},[t._v("setManualSize")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualRowResize/manualRowResize.js#L205",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.setManualSize(row, height) ⇒ number")])]),t._v(" "),e("p",[t._v("Sets the new height for specified row index.")]),t._v(" "),e("table",[e("thead",[e("tr",[e("th",[t._v("Param")]),t._v(" "),e("th",[t._v("Type")]),t._v(" "),e("th",[t._v("Description")])])]),t._v(" "),e("tbody",[e("tr",[e("td",[t._v("row")]),t._v(" "),e("td",[e("code",[t._v("number")])]),t._v(" "),e("td",[t._v("Visual row index.")])]),t._v(" "),e("tr",[e("td",[t._v("height")]),t._v(" "),e("td",[e("code",[t._v("number")])]),t._v(" "),e("td",[t._v("Row height.")])])])]),t._v(" "),e("p",[e("strong",[t._v("Returns")]),t._v(": "),e("code",[t._v("number")]),t._v(" - Returns new height.")]),t._v(" "),e("h3",{attrs:{id:"updateplugin"}},[e("a",{staticClass:"header-link",attrs:{href:"#updateplugin"}},[t._v("updatePlugin")])]),t._v(" "),e("a",{staticClass:"source-code-link",attrs:{href:"https://github.com/handsontable/handsontable/blob/3d620674b8d47d39f08596d8bc413ee314849214/handsontable\\src\\plugins\\manualRowResize/manualRowResize.js#L156",target:"_blank"}},[t._v(" Source code "),e("i",{staticClass:"ico i-external"})]),e("p",[e("em",[t._v("manualRowResize.updatePlugin()")])]),t._v(" "),e("p",[t._v("Updates the plugin's state.")]),t._v(" "),e("p",[t._v("This method is executed when "),e("RouterLink",{attrs:{to:"/javascript-data-grid/api/core/#updatesettings"}},[e("code",[t._v("updateSettings()")])]),t._v(" is invoked with any of the following configuration options:")],1),t._v(" "),e("ul",[e("li",[e("RouterLink",{attrs:{to:"/javascript-data-grid/api/options/#manualrowresize"}},[e("code",[t._v("manualRowResize")])])],1)])])}),[],!1,null,null,null);e.default=i.exports}}]);