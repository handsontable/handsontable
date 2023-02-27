import React from 'react';
import { EditorContainer } from './EditorContainer';

/**
 * Component class used to manage the editor component portals.
 */
export class EditorsPortalManager extends React.Component<{}, {portals?: React.ReactElement[]}> {
  state = {
    portals: []
  };

  render(): React.ReactNode {
    return (
      <React.Fragment>
        {this.state.portals}
        {/* {this.state.portals.map((editorElement, index) => {
          return <EditorContainer editorElement={editorElement} key={index} />
        })} */}
      </React.Fragment>
    )
  }
}
