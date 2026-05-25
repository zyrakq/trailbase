/**
 * OIDC provider configuration for TrailBase OAuth integration.
 *
 * Each entry generates a sign-in button in the auth modal.
 * All providers share the same SPA callback route (/auth/callback), which is
 * handled by the oauth-callback component. TrailBase manages the full OIDC
 * exchange at /api/auth/v1/oauth/<provider>/callback before redirecting there.
 *
 * The redirect URI registered in the OIDC provider (e.g. Kanidm) must be:
 *   http://<site_url_origin>/auth/callback
 */
export interface OIDCProvider {
  /** TrailBase provider key — matches oauth_providers[].key in config.textproto */
  key: string;
  /** Human-readable label shown on the sign-in button */
  label: string;
}

/**
 * Add or remove entries here to control provider buttons and SPA routes.
 * Order determines the display order in the auth modal.
 */
export const OIDC_PROVIDERS: OIDCProvider[] = [
  { key: 'oidc0', label: 'Kanidm' },
];
