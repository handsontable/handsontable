'use strict';

const handsotnableInstancesRegister = (() => {
    const register = new Set();

    register.listen = ()=> {
        try {
            if(typeof Handsontable !== 'undefined' && Handsontable._instanceRegisterInstalled === undefined) {
                Handsontable._instanceRegisterInstalled = true;
                Handsontable.hooks.add('afterInit', function () {
                    register.add(this);
                });
            }
        } catch (e) {
            console.error('handsotnableInstancesRegister initialization failed', e);
        }
    }

    register.destroyAll = () => {
        register.forEach( instance => instance.destroy());
        register.clear();
    }

    return register;
})();

const useHandsontable = ((instanceRegister) => {
    const ATTR_VERSION = 'data-hot-version';

    const getHotUrls = (version) => {
        const mappedVersion = version.match(/^\d+\.\d+\.\d+$/) ? version : 'latest';

        return [
            // todo, localhost url for version `next`
            `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.js`,
            `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.css`,
        ];
    };

    return (version, callback = () => {}, id = 'handsontable-loader') => {
        let hotScript = document.getElementById(id);

        // clear outdated version
        if (hotScript && hotScript.getAttribute(ATTR_VERSION)  !== version) {
            delete window.Handsontable;
            hotScript.remove();
            hotScript = null;
        }

        // clear outdated css
        const cssScript = document.getElementById('css-'+id);

        if (cssScript && cssScript.getAttribute(ATTR_VERSION) !== version) {
            cssScript.remove();
        }

        // import current version
        if (!hotScript) {
            const [scriptUrl, styleUrl] = getHotUrls(version);

            hotScript = document.createElement('script');
            hotScript.src = scriptUrl;
            hotScript.id = id;
            hotScript.setAttribute(ATTR_VERSION,  version);
            hotScript.addEventListener('load', () => { hotScript.loaded = true; });

            document.head.append(hotScript);
            document.head.insertAdjacentHTML(
                'beforeend',
                `<link type="text/css" data-hot-version="${version}" rel="stylesheet" id="css-${id}" href="${styleUrl}"/>`
            );
        }

        // execute callback
        if (hotScript.loaded) {
            setTimeout(() => {
                instanceRegister.listen();
                callback();
            });
        } else {
            hotScript.addEventListener('load', () => {
                instanceRegister.listen();
                callback();
            });
        }
    };

})(handsotnableInstancesRegister);