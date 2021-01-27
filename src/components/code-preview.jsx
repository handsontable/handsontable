import React, { useEffect, useRef } from 'react';
import ExecutionEnvironment from '@docusaurus/core/lib/client/exports/ExecutionEnvironment';
import { useActiveVersion } from '@theme/hooks/useDocs';
import PropTypes from 'prop-types';
import { useHandsontable } from '../utils/useHandsontable';

const decode = (base64data) => { // todo extract
  // eslint-disable-next-line global-require
  const buffer = ExecutionEnvironment.canUseDOM ? Buffer : require('buffer').Buffer;
  return buffer.from(base64data, 'base64').toString();
};

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
    () => { scriptElement.remove(); },
  ];
};

export const CodePreview = (props) => {
  const { hotId = 'example', code = '', instanceVariableName = undefined } = props;
  const instance = useRef(null);
  const version = useActiveVersion().name;

  useEffect(() => {
    const { current } = instance;
    if (!current) return () => {};

    const [runPreview, clearPreview] = useCodePreview(decode(code));

    useHandsontable(version, () => { runPreview(current.parentNode); });

    return () => {
      clearPreview();
      if (instanceVariableName && window[instanceVariableName]?.destroy) {
        window[instanceVariableName].destroy();
      }
    };
  }, []);

  return <div className="hot"><div id={hotId} ref={instance}/></div>;
};

CodePreview.propTypes = {
  hotId: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  instanceVariableName: PropTypes.string,
};

CodePreview.defaultProps = {
  instanceVariableName: undefined,
};
