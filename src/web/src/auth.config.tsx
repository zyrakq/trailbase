import { OidcConfiguration } from "@axa-fr/react-oidc";

export const getOidcConfig = () => {
  return {
    client_id: import.meta.env.VITE_APP_KEYCLOAK_CLIENT_ID,
    redirect_uri: `${window.location.origin}/#`,
    scope: "openid profile",
    authority: import.meta.env.VITE_APP_KEYCLOAK_URL,
    service_worker_relative_url: "/OidcServiceWorker.js",
    service_worker_only: false,
  } as OidcConfiguration;
};
