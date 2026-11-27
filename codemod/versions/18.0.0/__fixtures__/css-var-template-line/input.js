import styled from 'styled-components';

export const GridShell = styled.div`
  height: 100%;

  .ht-theme-desk {
    --ht-wrapper-border-radius: ${({ dense }) => (dense ? 2 : 6)}px;
    --ht-wrapper-border-width: 0;
  }

  &:focus-within {
    outline: 0;
  }
`;
