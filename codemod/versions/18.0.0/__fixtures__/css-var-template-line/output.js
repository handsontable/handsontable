import styled from 'styled-components';

// TODO(handsontable-codemod 18.0.0/css-wrapper-border-width): Draw the outer border with a box-shadow on the root wrapper, because 18.0 removed this variable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
export const GridShell = styled.div`
  height: 100%;

  .ht-theme-desk {
    --ht-border-radius: ${({ dense }) => (dense ? 2 : 6)}px;
    --ht-wrapper-border-width: 0;
  }

  &:focus-within {
    outline: 0;
  }
`;
