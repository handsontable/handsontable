import React, {useEffect, useRef, version} from 'react';
import {useHandsontable} from "../utils/useHandsontable";
import ExecutionEnvironment from "@docusaurus/core/lib/client/exports/ExecutionEnvironment";
import {useActiveVersion} from '@theme/hooks/useDocs';

const decode = (base64data) => {  // todo extract
    const buffer = ExecutionEnvironment.canUseDOM ? Buffer : require('buffer').Buffer;
    return buffer.from(base64data, 'base64').toString();
}

/**
 * @param code {string}
 * @returns {[function(string): void, function(): void]}
 */
const useCodePreview = (code) => {
    const scriptElement = document.createElement('script');
    scriptElement.type = 'text/javascript';
    scriptElement.innerHTML = code;

    return [
            (container) => { container.append(scriptElement); },
            () => { scriptElement.remove(); }
        ]
}

export const CodePreview = (props) => {
    const {hotId = "example", code = "", instanceVariableName=undefined} = props;
    const instance = useRef(null);
    const version = useActiveVersion().name;

    useEffect(() => {
        const {current} = instance;
        if(!current) return;

        const [runPreview, clearPreview] = useCodePreview(decode(code));

        useHandsontable(version, () => runPreview(current.parentNode));

        return ()=>{
            clearPreview();
            if(instanceVariableName && window[instanceVariableName]?.destroy) {
                window[instanceVariableName].destroy();
            }
        };
    }, [])

    return <div id={hotId} ref={instance}/>;
}
