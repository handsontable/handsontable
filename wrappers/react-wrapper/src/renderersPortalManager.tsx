import React, {
  Dispatch,
  ReactPortal,
  forwardRef,
  Fragment,
  useImperativeHandle,
  useState,
} from 'react';

export type RenderersPortalManagerRef = Dispatch<ReactPortal[]>;

/**
 * Component used to manage the renderer component portals.
 */
export const RenderersPortalManager = forwardRef<RenderersPortalManagerRef, {}>((_, ref) => {
  const [portals, setPortals] = useState<ReactPortal[]>([]);
  useImperativeHandle(ref, () => setPortals);

  return (
      <Fragment>
        {portals}
      </Fragment>
  );
});
