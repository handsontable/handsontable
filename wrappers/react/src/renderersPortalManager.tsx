import React from 'react';

/**
 * Component class used to manage the renderer component portals.
 */
export class RenderersPortalManager extends React.Component<{}, {portals?: React.ReactPortal[]}> {
  state = {
    portals: []
  };

  render(): React.ReactNode {
    return (
      <React.Fragment>
        {this.state.portals}
      </React.Fragment>
    )
  }
}
