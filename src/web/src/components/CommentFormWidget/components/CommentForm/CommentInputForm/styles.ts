import styled from 'styled-components';
import { IconButton } from '@/ui';

export const InputContainer = styled.div`
position: relative;
`;

export const IconSendButton = styled(IconButton)`
position: absolute;
top: 50%;
right: 10px;
transform: translateY(-50%);
`;
