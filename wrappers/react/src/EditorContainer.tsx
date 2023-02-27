import React from 'react';
import {
  HotEditorElement
} from './types';
import {
  DEFAULT_CLASSNAME,
  getContainerAttributesProps
} from './helpers';

/**
 * Component provides an editor container for custom editors.
 */
export function EditorContainer({ editorElement }: { editorElement: HotEditorElement }) {
  if (editorElement === null) {
    return null;
  }

  console.log('EditorContainer', editorElement);

  const containerProps = getContainerAttributesProps(editorElement.props, false);

  containerProps.className = [DEFAULT_CLASSNAME, containerProps.className].join(' ');

  return (
    <div {...containerProps}>
      {editorElement}
    </div>
  )
}
