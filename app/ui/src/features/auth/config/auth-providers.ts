/**
 * OIDC provider configuration for TrailBase OAuth integration.
 *
 * Each entry generates:
 * - A sign-in button in the auth modal
 * - A dedicated SPA callback route: /auth/{key}/callback
 *
 * The callback URL must be registered as an allowed redirect URI in the OIDC
 * provider (e.g. Kanidm application config). It must share the same origin as
 * site_url in app/traildepot/config.textproto so TrailBase accepts it.
 *
 * Example Kanidm redirect URI to register:
 *   http://<site_url_origin>/auth/oidc0/callback
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
