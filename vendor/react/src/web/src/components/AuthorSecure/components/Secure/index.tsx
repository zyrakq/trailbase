import { useAuthor } from "@/components/AuthorSecure";
import { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyPlaceholder } from "./EmptyPlaceholder";

export interface SecureProps {
  children: JSX.Element;
}

export const Secure: FC<SecureProps> = ({ children }) => {
  const navigate = useNavigate();

  const { isLoading, isError } = useAuthor();

  useEffect(() => {
    if (isError) navigate("/404");
  }, [isError, navigate]);

  return <EmptyPlaceholder condition={!isLoading}>{children}</EmptyPlaceholder>;
};
