import React, {useEffect, useRef} from 'react';
import './jsfiddle.css';

const JSFIDDLE_ENDPOINT = 'https://jsfiddle.net/api/post/library/pure/';

const decode = (base64data) => Buffer.from(base64data, 'base64').toString();

const getHtml = (id) => `<div id="${id}" ></div>`;
const getCss = (version) => `</style><!-- Ugly Hack due to jsFiddle issue -->
<script src="https://cdn.jsdelivr.net/npm/handsontable@${version}/dist/handsontable.full.min.js"></script>
<link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable@${version}/dist/handsontable.full.min.css" />
`;

/**
 * @param formNode HTMLFormElement
 * @return [ChildNode, (function(): void))]
 */
const createButton = (formNode) => {
    const workingDiv = document.createElement("div");
    workingDiv.innerHTML = '<button type="button" aria-label="Edit code in JsFiddle" \
            class="copyButton_node_modules-@docusaurus-theme-classic-lib-theme-CodeBlock-" \
            style="right: calc(var(--ifm-pre-padding)+60px);">Edit</button>';

    const button = workingDiv.firstChild;
    button.addEventListener('click', () => formNode.submit());

    return [button, () => {
        button.remove();
    }];
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
            <textarea name="css" readOnly={true} value={getCss("8.2.0")}/> {/*todo dynamic version*/}
        </form>
    );
}


