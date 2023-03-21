import React from 'react';

/**
 * Component class used to manage the editor component portals.
 */
export class EditorsPortalManager extends React.Component<{}, { portals?: React.ReactElement[] }> {
  state = {
    portals: []
  };

  render() {
    return (
      <React.Fragment>
        {this.state.portals}
      </React.Fragment>
    )
  }
}
