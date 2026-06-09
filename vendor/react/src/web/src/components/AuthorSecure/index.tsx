
import { FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Secure } from "./components/Secure";

export { useAuthor } from './provider';
export { useSubscribedAuthor } from './provider';

export type { AuthorManager } from './provider';
export type { SubscribedAuthorManager } from './provider';

export interface AuthorSecureProps {
  children: JSX.Element;
}

export const AuthorSecure: FC<AuthorSecureProps> = ({ children }) => {

  const navigate = useNavigate();
  
  const { username } = useParams();

  useEffect(() => {
    if (!username) navigate('/404');
  }, [username, navigate]);

  return (
    <>
      {username && (
          <Secure>
            {children}
          </Secure>
      )}
    </>
  );
};