(window.webpackJsonp=window.webpackJsonp||[]).push([[386],{767:function(e,t,a){"use strict";a.r(t);var s=a(24),r=Object(s.a)({},(function(){var e=this,t=e._self._c;return t("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[t("h1",{attrs:{id:"custom-builds"}},[t("a",{staticClass:"header-link",attrs:{href:"#custom-builds"}},[t("span",{staticClass:"header-framework"},[e._v("React Data Grid")]),e._v("Custom builds")])]),e._v(" "),t("p",[e._v("Handsontable's building process transforms the source files located in the code repository into dedicated packages.")]),e._v(" "),t("p"),t("div",{staticClass:"table-of-contents"},[t("div",{staticClass:"toc-container-header"},[t("i",{staticClass:"ico i-toc"}),e._v("On this page")]),t("ul",[t("li",[t("a",{attrs:{href:"#overview"}},[e._v("Overview")]),t("ul",[t("li",[t("a",{attrs:{href:"#monorepo"}},[e._v("Monorepo")])]),t("li",[t("a",{attrs:{href:"#build-processes"}},[e._v("Build processes")])]),t("li",[t("a",{attrs:{href:"#build-requirements"}},[e._v("Build requirements")])]),t("li",[t("a",{attrs:{href:"#package-json-files"}},[e._v("package.json files")])])])]),t("li",[t("a",{attrs:{href:"#run-your-first-build"}},[e._v("Run your first build")])]),t("li",[t("a",{attrs:{href:"#build-the-packages"}},[e._v("Build the packages")]),t("ul",[t("li",[t("a",{attrs:{href:"#build-all-the-packages"}},[e._v("Build all the packages")])]),t("li",[t("a",{attrs:{href:"#build-the-javascript-package"}},[e._v("Build the JavaScript package")])]),t("li",[t("a",{attrs:{href:"#build-the-react-package"}},[e._v("Build the React package")])])])]),t("li",[t("a",{attrs:{href:"#related-guides"}},[e._v("Related guides")])])])]),t("p"),e._v(" "),t("h2",{attrs:{id:"overview"}},[t("a",{staticClass:"header-link",attrs:{href:"#overview"}},[e._v("Overview")])]),e._v(" "),t("h3",{attrs:{id:"monorepo"}},[t("a",{staticClass:"header-link",attrs:{href:"#monorepo"}},[e._v("Monorepo")])]),e._v(" "),t("p",[e._v("The Handsontable repository is a monorepo that contains the following projects:")]),e._v(" "),t("table",[t("thead",[t("tr",[t("th",[e._v("Project")]),e._v(" "),t("th",[e._v("Location")]),e._v(" "),t("th",[e._v("Description")])])]),e._v(" "),t("tbody",[t("tr",[t("td",[t("code",[e._v("handsontable")])]),e._v(" "),t("td",[t("code",[e._v("/handsontable")])]),e._v(" "),t("td",[e._v("Main Handsontable project")])]),e._v(" "),t("tr",[t("td",[t("code",[e._v("@handsontable/react")])]),e._v(" "),t("td",[t("code",[e._v("/wrappers/react")])]),e._v(" "),t("td",[t("RouterLink",{attrs:{to:"/react-data-grid/"}},[e._v("React wrapper")])],1)]),e._v(" "),t("tr",[t("td",[t("code",[e._v("@handsontable/angular")])]),e._v(" "),t("td",[t("code",[e._v("/wrappers/angular")])]),e._v(" "),t("td",[t("RouterLink",{attrs:{to:"/javascript-data-grid/angular-installation/"}},[e._v("Angular wrapper")])],1)]),e._v(" "),t("tr",[t("td",[t("code",[e._v("@handsontable/vue")])]),e._v(" "),t("td",[t("code",[e._v("/wrappers/vue")])]),e._v(" "),t("td",[t("RouterLink",{attrs:{to:"/javascript-data-grid/vue-installation/"}},[e._v("Vue 2 wrapper")])],1)]),e._v(" "),t("tr",[t("td",[t("code",[e._v("@handsontable/vue3")])]),e._v(" "),t("td",[t("code",[e._v("/wrappers/vue3")])]),e._v(" "),t("td",[t("RouterLink",{attrs:{to:"/javascript-data-grid/vue3-installation/"}},[e._v("Vue 3 wrapper")])],1)])])]),e._v(" "),t("p",[e._v("All the projects are released together, under the same version number.\nBut each project has its own "),t("a",{attrs:{href:"#build-processes"}},[e._v("building")]),e._v(" and "),t("RouterLink",{attrs:{to:"/react-data-grid/testing/"}},[e._v("testing")]),e._v(" processes.")],1),e._v(" "),t("h3",{attrs:{id:"build-processes"}},[t("a",{staticClass:"header-link",attrs:{href:"#build-processes"}},[e._v("Build processes")])]),e._v(" "),t("p",[e._v("The building processes transform the source files located in the "),t("code",[e._v("/handsontable/src/")]),e._v(" directory into the following output files:")]),e._v(" "),t("ul",[t("li",[t("code",[e._v("/handsontable/dist/handsontable.js")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.css")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.full.js")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.full.css")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.full.min.js")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.full.min.css")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/languages/*")])])]),e._v(" "),t("div",{staticClass:"custom-block tip"},[t("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),t("p",[e._v("Don't modify the output files mentioned above. Instead, make changes in the "),t("code",[e._v("/handsontable/src/")]),e._v(" directory and then run a selected "),t("a",{attrs:{href:"#build-the-packages"}},[e._v("build")]),e._v(". This is especially important if you want to contribute your changes back to Handsontable through a pull request.")]),e._v(" "),t("p",[e._v("For more information on the distribution packages, see "),t("a",{attrs:{href:"https://github.com/handsontable/handsontable/blob/master/handsontable/dist/README.md",target:"_blank",rel:"nofollow noopener noreferrer"}},[e._v("this file"),t("OutboundLink")],1),e._v(".")])]),e._v(" "),t("h3",{attrs:{id:"build-requirements"}},[t("a",{staticClass:"header-link",attrs:{href:"#build-requirements"}},[e._v("Build requirements")])]),e._v(" "),t("p",[e._v("Handsontable building processes require:")]),e._v(" "),t("ul",[t("li",[t("a",{attrs:{href:"https://nodejs.org/",target:"_blank",rel:"nofollow noopener noreferrer"}},[e._v("Node.js"),t("OutboundLink")],1),e._v(" (version "),t("strong",[e._v("20.x")]),e._v("+)")]),e._v(" "),t("li",[t("a",{attrs:{href:"https://www.npmjs.com/",target:"_blank",rel:"nofollow noopener noreferrer"}},[e._v("npm"),t("OutboundLink")],1),e._v(" (version "),t("strong",[e._v("9.x")]),e._v("+)")]),e._v(" "),t("li",[e._v("Node modules installed through "),t("code",[e._v("npm install")]),e._v(" (e.g. "),t("a",{attrs:{href:"https://webpack.js.org/",target:"_blank",rel:"nofollow noopener noreferrer"}},[e._v("webpack"),t("OutboundLink")],1),e._v(" and "),t("a",{attrs:{href:"https://babeljs.io/",target:"_blank",rel:"nofollow noopener noreferrer"}},[e._v("Babel"),t("OutboundLink")],1),e._v(")")])]),e._v(" "),t("h3",{attrs:{id:"package-json-files"}},[t("a",{staticClass:"header-link",attrs:{href:"#package-json-files"}},[t("code",[e._v("package.json")]),e._v(" files")])]),e._v(" "),t("p",[e._v("Each Handsontable "),t("a",{attrs:{href:"#monorepo"}},[e._v("project")]),e._v(" has its own building processes defined in its own "),t("code",[e._v("package.json")]),e._v(" file. Apart from that, the root directory has its own "),t("code",[e._v("package.json")]),e._v(" file as well:")]),e._v(" "),t("table",[t("thead",[t("tr",[t("th",[e._v("File")]),e._v(" "),t("th",[e._v("Holds tasks for building:")])])]),e._v(" "),t("tbody",[t("tr",[t("td",[t("code",[e._v("/package.json")])]),e._v(" "),t("td",[e._v("- All the packages at once"),t("br"),e._v("- Individual packages")])]),e._v(" "),t("tr",[t("td",[t("code",[e._v("/handsontable/package.json")])]),e._v(" "),t("td",[e._v("The JavaScript package")])]),e._v(" "),t("tr",[t("td",[t("code",[e._v("/wrappers/react/package.json")])]),e._v(" "),t("td",[e._v("The React package")])]),e._v(" "),t("tr",[t("td",[t("code",[e._v("/wrappers/angular/package.json")])]),e._v(" "),t("td",[e._v("The Angular package")])]),e._v(" "),t("tr",[t("td",[t("code",[e._v("/wrappers/vue/package.json")])]),e._v(" "),t("td",[e._v("The Vue 2 package")])]),e._v(" "),t("tr",[t("td",[t("code",[e._v("/wrappers/vue3/package.json")])]),e._v(" "),t("td",[e._v("The Vue 3 package")])])])]),e._v(" "),t("h2",{attrs:{id:"run-your-first-build"}},[t("a",{staticClass:"header-link",attrs:{href:"#run-your-first-build"}},[e._v("Run your first build")])]),e._v(" "),t("p",[e._v("To run your first build:")]),e._v(" "),t("ol",[t("li",[e._v("Install "),t("a",{attrs:{href:"https://nodejs.org/",target:"_blank",rel:"nofollow noopener noreferrer"}},[e._v("Node.js"),t("OutboundLink")],1),e._v(" (version "),t("strong",[e._v("20.x")]),e._v("+).")]),e._v(" "),t("li",[e._v("Install "),t("a",{attrs:{href:"https://www.npmjs.com/",target:"_blank",rel:"nofollow noopener noreferrer"}},[e._v("npm"),t("OutboundLink")],1),e._v(" (version "),t("strong",[e._v("9.x")]),e._v("+).")]),e._v(" "),t("li",[e._v("Clone the "),t("a",{attrs:{href:"https://github.com/handsontable/handsontable",target:"_blank",rel:"nofollow noopener noreferrer"}},[e._v("Handsontable repository"),t("OutboundLink")],1),e._v(".")]),e._v(" "),t("li",[e._v("From the root directory, run "),t("code",[e._v("npm install")]),e._v("."),t("br"),e._v("All the required dependencies get installed.")]),e._v(" "),t("li",[e._v("From the root directory, run "),t("code",[e._v("npm run build")]),e._v("."),t("br"),e._v("All the Handsontable packages get built.")])]),e._v(" "),t("h2",{attrs:{id:"build-the-packages"}},[t("a",{staticClass:"header-link",attrs:{href:"#build-the-packages"}},[e._v("Build the packages")])]),e._v(" "),t("p",[e._v("You can either build all the packages at once, or build each package individually.")]),e._v(" "),t("h3",{attrs:{id:"build-all-the-packages"}},[t("a",{staticClass:"header-link",attrs:{href:"#build-all-the-packages"}},[e._v("Build all the packages")])]),e._v(" "),t("p",[e._v("To build all the packages at once:")]),e._v(" "),t("ol",[t("li",[e._v("Make sure you meet the "),t("a",{attrs:{href:"#build-requirements"}},[e._v("build requirements")]),e._v(".")]),e._v(" "),t("li",[e._v("Go to the root directory.")]),e._v(" "),t("li",[e._v("Run "),t("code",[e._v("npm run build")]),e._v("."),t("br"),e._v("The script builds the following packages:\n"),t("ul",[t("li",[e._v("The JavaScript package")]),e._v(" "),t("li",[e._v("The React package")]),e._v(" "),t("li",[e._v("The Angular package")]),e._v(" "),t("li",[e._v("The Vue 2 package")]),e._v(" "),t("li",[e._v("The Vue 3 package")]),e._v(" "),t("li",[e._v("A code examples package")])])])]),e._v(" "),t("h3",{attrs:{id:"build-the-javascript-package"}},[t("a",{staticClass:"header-link",attrs:{href:"#build-the-javascript-package"}},[e._v("Build the JavaScript package")])]),e._v(" "),t("p",[e._v("To build the JavaScript package:")]),e._v(" "),t("ol",[t("li",[e._v("Make sure you meet the "),t("a",{attrs:{href:"#build-requirements"}},[e._v("build requirements")]),e._v(".")]),e._v(" "),t("li",[e._v("Go to "),t("code",[e._v("/handsontable")]),e._v(".")]),e._v(" "),t("li",[e._v("Run "),t("code",[e._v("npm run build")]),e._v("."),t("br"),e._v("Only the JavaScript package builds.")])]),e._v(" "),t("p",[e._v("To build the JavaScript package from the root directory:")]),e._v(" "),t("ol",[t("li",[e._v("Make sure you meet the "),t("a",{attrs:{href:"#build-requirements"}},[e._v("build requirements")]),e._v(".")]),e._v(" "),t("li",[e._v("Go to the root directory.")]),e._v(" "),t("li",[e._v("Run "),t("code",[e._v("npm run in handsontable build")]),e._v("."),t("br"),e._v("Only the JavaScript package builds.")])]),e._v(" "),t("h4",{attrs:{id:"javascript-build-tasks"}},[e._v("JavaScript build tasks")]),e._v(" "),t("p",[e._v("From the "),t("code",[e._v("/handsontable")]),e._v(" directory, you can also run individual JavaScript "),t("code",[e._v("build")]),e._v(" tasks:")]),e._v(" "),t("details",{staticClass:"custom-block details"},[t("summary",[e._v("JavaScript build tasks")]),e._v(" "),t("p",[t("code",[e._v("npm run build:commonjs")])]),e._v(" "),t("ul",[t("li",[e._v("Transpiles the files into the CommonJS format.")])]),e._v(" "),t("p",[t("code",[e._v("npm run build:es")])]),e._v(" "),t("ul",[t("li",[e._v("Transpiles the files into the ESM format.")])]),e._v(" "),t("p",[t("code",[e._v("npm run build:umd")])]),e._v(" "),t("ul",[t("li",[e._v("Creates the following bundles compatible with the Universal Module Definition:\n"),t("ul",[t("li",[t("code",[e._v("/handsontable/dist/handsontable.js")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.css")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.full.js")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.full.css")])])])])]),e._v(" "),t("p",[t("code",[e._v("npm run build:umd.min")])]),e._v(" "),t("ul",[t("li",[e._v("Creates the minified bundles compatible with the Universal Module Definition:\n"),t("ul",[t("li",[t("code",[e._v("/handsontable/dist/handsontable.min.js")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.min.css")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.min.full.js")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/handsontable.min.full.css")])])])])]),e._v(" "),t("p",[t("code",[e._v("npm run build:walkontable")])]),e._v(" "),t("ul",[t("li",[e._v("Builds Walkontable, an essential part of Handsontable that's responsible for the rendering process.")])]),e._v(" "),t("p",[t("code",[e._v("npm run build:languages")])]),e._v(" "),t("ul",[t("li",[e._v("Creates the "),t("RouterLink",{attrs:{to:"/react-data-grid/language/"}},[e._v("language")]),e._v(" bundles compatible with the Universal Module Definition, for example:\n"),t("ul",[t("li",[t("code",[e._v("/handsontable/dist/languages/de-DE.js")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/languages/all.js")])])])],1)]),e._v(" "),t("p",[t("code",[e._v("build:languages.es")])]),e._v(" "),t("ul",[t("li",[e._v("Creates the "),t("RouterLink",{attrs:{to:"/react-data-grid/language/"}},[e._v("language")]),e._v(" bundles compatible with the ESM format, for example:\n"),t("ul",[t("li",[t("code",[e._v("languages/en-US.mjs")])])])],1)]),e._v(" "),t("p",[t("code",[e._v("npm run build:languages.min")])]),e._v(" "),t("ul",[t("li",[e._v("Creates the minified "),t("RouterLink",{attrs:{to:"/react-data-grid/language/"}},[e._v("language")]),e._v(" bundles compatible with the Universal Module Definition, for example:\n"),t("ul",[t("li",[t("code",[e._v("/handsontable/dist/languages/de-DE.min.js")])]),e._v(" "),t("li",[t("code",[e._v("/handsontable/dist/languages/all.min.js")])])])],1)])]),e._v(" "),t("h3",{attrs:{id:"build-the-react-package"}},[t("a",{staticClass:"header-link",attrs:{href:"#build-the-react-package"}},[e._v("Build the React package")])]),e._v(" "),t("p",[e._v("To build the React package:")]),e._v(" "),t("ol",[t("li",[e._v("Make sure you meet the "),t("a",{attrs:{href:"#build-requirements"}},[e._v("build requirements")]),e._v(".")]),e._v(" "),t("li",[e._v("Go to "),t("code",[e._v("/wrappers/react")]),e._v(".")]),e._v(" "),t("li",[e._v("Run "),t("code",[e._v("npm run build")]),e._v("."),t("br"),e._v("Only the React package builds.")])]),e._v(" "),t("p",[e._v("To build the React package from the root directory:")]),e._v(" "),t("ol",[t("li",[e._v("Make sure you meet the "),t("a",{attrs:{href:"#build-requirements"}},[e._v("build requirements")]),e._v(".")]),e._v(" "),t("li",[e._v("Go to the root directory.")]),e._v(" "),t("li",[e._v("Run "),t("code",[e._v("npm run in react build")]),e._v("."),t("br"),e._v("Only the React package builds.")])]),e._v(" "),t("h4",{attrs:{id:"react-build-tasks"}},[e._v("React build tasks")]),e._v(" "),t("p",[e._v("From the "),t("code",[e._v("/wrappers/react")]),e._v(" directory, you can also run individual React "),t("code",[e._v("build")]),e._v(" tasks:")]),e._v(" "),t("details",{staticClass:"custom-block details"},[t("summary",[e._v("React build tasks")]),e._v(" "),t("p",[t("code",[e._v("npm run build:commonjs")])]),e._v(" "),t("ul",[t("li",[e._v("Transpiles the files into the CommonJS format.")]),e._v(" "),t("li",[e._v("Places the output in "),t("code",[e._v("/wrappers/react/commonjs/react-handsontable.js")])])]),e._v(" "),t("p",[t("code",[e._v("npm run build:umd")])]),e._v(" "),t("ul",[t("li",[e._v("Creates the following bundles compatible with the Universal Module Definition:\n"),t("ul",[t("li",[t("code",[e._v("/wrappers/react/dist/react-handsontable.js")])]),e._v(" "),t("li",[t("code",[e._v("/wrappers/react/dist/react-handsontable.js.map")])])])])]),e._v(" "),t("p",[t("code",[e._v("npm run build:es")])]),e._v(" "),t("ul",[t("li",[e._v("Transpiles the files into the ESM format.")]),e._v(" "),t("li",[e._v("Places the output in "),t("code",[e._v("/wrappers/react/es/react-handsontable.mjs")])])]),e._v(" "),t("p",[t("code",[e._v("npm run build:min")])]),e._v(" "),t("ul",[t("li",[e._v("Creates the minified bundles:\n"),t("ul",[t("li",[t("code",[e._v("/wrappers/react/dist/react-handsontable.min.js")])]),e._v(" "),t("li",[t("code",[e._v("/wrappers/react/dist/react-handsontable.min.js.map")])])])])])]),e._v(" "),t("p"),e._v(" "),t("p"),e._v(" "),t("p"),e._v(" "),t("h2",{attrs:{id:"related-guides"}},[t("a",{staticClass:"header-link",attrs:{href:"#related-guides"}},[e._v("Related guides")])]),e._v(" "),t("div",{staticClass:"boxes-list gray"},[t("p"),e._v(" "),t("ul",[t("li",[t("RouterLink",{attrs:{to:"/react-data-grid/testing/"}},[e._v("Testing")])],1)])])])}),[],!1,null,null,null);t.default=r.exports}}]);