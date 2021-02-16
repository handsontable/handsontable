import { useActiveVersion } from '@theme/hooks/useDocs';

export const Version = () => (
  useActiveVersion().name
);
