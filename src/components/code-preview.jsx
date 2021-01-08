import React, {useEffect, useRef} from 'react';

const decode = (base64data) => Buffer.from(base64data, 'base64').toString();

export const CodePreview = (props) => {
    const {hotId = "example", code = "", instanceVariableName=undefined} = props;
    const instance = useRef(null);
    useEffect(() => {
        if(!instance.current) return;
        const scriptElement = document.createElement('script');
        scriptElement.type = 'text/javascript';
        scriptElement.innerHTML = decode(code);
        instance.current.parentNode.append(scriptElement);

        return ()=>{
            scriptElement.remove();
            if(instanceVariableName && window[instanceVariableName].destroy) {
                window[instanceVariableName].destroy();
                console.log("Example hot instance has been destroyed:", instanceVariableName);
            }
        };
    }, [])

    return <div id={hotId} ref={instance}></div>;
}
