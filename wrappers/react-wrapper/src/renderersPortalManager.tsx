import React from 'react';

export type RenderersPortalManagerRef = React.Dispatch<React.ReactPortal[]>;

/**
 * Component used to manage the renderer component portals.
 */
export const RenderersPortalManager = React.forwardRef<RenderersPortalManagerRef, {}>((_, ref) => {
  const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);
  React.useImperativeHandle(ref, () => setPortals);

  return (
      <React.Fragment>
        {portals}
      </React.Fragment>
  );
});
