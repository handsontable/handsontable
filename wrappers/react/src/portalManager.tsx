import React from 'react';

/**
 * Component class used to manage the renderer component portals.
 */
export class PortalManager extends React.Component<{}, {portals?: React.ReactPortal[]}> {
  constructor(props) {
    super(props);

    this.state = {
      portals: []
    };
  }

  render(): React.ReactNode {
    return (
      <React.Fragment>
        {this.state.portals}
      </React.Fragment>
    )
  }
}
