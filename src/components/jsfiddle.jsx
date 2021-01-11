import React, {useEffect, useRef} from 'react';
import './jsfiddle.css';
import {getHotUrls} from "../utils/useHandsontable";
import ExecutionEnvironment from "@docusaurus/core/lib/client/exports/ExecutionEnvironment";
import {useActiveVersion} from '@theme/hooks/useDocs';

const JSFIDDLE_ENDPOINT = 'https://jsfiddle.net/api/post/library/pure/';

const decode = (base64data) => { // todo extract
    const buffer = ExecutionEnvironment.canUseDOM ? Buffer : require('buffer').Buffer;
    return buffer.from(base64data, 'base64').toString();
}
const getHtml = (id) => `<div id="${id}" ></div>`;
const getCss = (version) => {
    const [scriptUrl, styleUrl] = getHotUrls(version);

    return `</style><!-- Ugly Hack due to jsFiddle issue -->
<script src="${scriptUrl}"></script>
<link type="text/css" rel="stylesheet" href="${styleUrl}" />
`};

/**
 * @param formNode HTMLFormElement
 * @return {[ChildNode, (function(): void))]}
 */
const createButton = (formNode) => {
    const workingDiv = document.createElement("div");
    workingDiv.innerHTML = '<button type="button" aria-label="Edit code in JsFiddle" \
            class="copyButton_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-" \
            style="right: calc(var(--ifm-pre-padding)+60px);">Edit</button>';

    const button = workingDiv.firstChild;
    button.addEventListener('click', () => formNode.submit());

    return [
            button,
            () => { button.remove(); }
        ];
}

export const JsFiddleButton = (props) => {
    const {hotId = "example", code = ""} = props;
    const anchorRef = useRef(null);

    useEffect(() => {
        const {current} = anchorRef;
        if (!current) return;

        const [button, clearButton] = createButton(current);

        setTimeout(() => {
            // DOM was used because it doesn't require overwriting @docusaurus/theme-classic/lib/theme/CodeBlock
            current.nextElementSibling
                .querySelector('button[aria-label="Copy code to clipboard"]')
                .parentNode
                .appendChild(button);
        });

        return clearButton;
    }, []);

    return (
        <form className="jsfiddle" ref={anchorRef} action={JSFIDDLE_ENDPOINT} method="post"
              target="_blank">
            <input type="text" name="title" readOnly={true} value="Handsontable example"/>
            <input type="text" name="wrap" readOnly={true} value="d"/>
            <textarea name="js" readOnly={true} value={decode(code)}/>
            <textarea name="html" readOnly={true} value={getHtml(hotId)}/>
            <textarea name="css" readOnly={true} value={getCss(useActiveVersion().name)}/>
        </form>
    );
}


