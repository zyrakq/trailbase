import styled from 'styled-components';

interface ContainerProps {
  fluid?: boolean;
  justify?:
    | 'center'
    | 'flex-start'
    | 'flex-end'
    | 'space-around'
    | 'space-between'
    | 'space-evenly';
}

export const Container = styled.div<ContainerProps>`
  display: flex;
  justify-content: ${(props) => (props.fluid ? props.justify : 'center')};
  ${(props) =>
    props.fluid
      ? `
      min-width: 1340px;
      ` : `
      width: 1340px;
      margin: 0 auto;`
  }
  height: 100%;
`;
