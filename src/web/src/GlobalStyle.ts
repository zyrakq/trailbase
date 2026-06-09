import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  html, body {
    height: 100%;
  }
  body {
    padding: 0;
    margin: 0;
    background: ${({ theme }) => theme.palette.background.default};
    color: ${({ theme }) => theme.palette.text.secondary};
    font-family: ${({ theme }) => theme.font.fontFamily};

    #root {
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
      height: 100%;
    }
  }

  .mention {
    font-weight: 600;
    color: #4872F2;
  }

`;
