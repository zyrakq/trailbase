import { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { useProfile } from "@/services/profile";
import { useOidc } from "@axa-fr/react-oidc";

export interface ProfileSecureProps {
  children: JSX.Element;
}

export const ProfileSecure: FC<ProfileSecureProps> = ({ children }) => {
  const navigate = useNavigate();

  const { isAuthenticated } = useOidc();

  const { isLoading, isSuccess } = useProfile();

  useEffect(() => {
    if (!isAuthenticated && !isLoading && !isSuccess) navigate("/403");
  }, [isAuthenticated, isLoading, isSuccess, navigate]);

  return <EmptyPlaceholder condition={!isLoading}>{children}</EmptyPlaceholder>;
};
