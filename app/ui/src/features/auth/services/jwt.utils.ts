// Pure JWT utility — no class, no singleton, no side effects.
// Extracted from TrailBaseService to respect the HTTP-adapter boundary.
import type { TrailBaseUser } from './trailbase.service';

/**
 * Decode a TrailBase JWT auth token and return the embedded user info.
 * Returns null on any parse failure (malformed token, missing fields, etc.).
 *
 * @param authToken - Raw JWT string (header.payload.signature)
 */
export function parseUserFromToken(authToken: string): TrailBaseUser | null {
  try {
    // JWT structure: header.payload.signature (3 base64url-encoded parts)
    const parts = authToken.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload segment (base64url → JSON)
    const payload = JSON.parse(atob(parts[1]));

    const id = payload.sub || payload.user_id || payload.id;
    if (!id) {
      return null;
    }

    return {
      id,
      email: payload.email,
      verified: payload.verified,
    };
  } catch {
    return null;
  }
}
