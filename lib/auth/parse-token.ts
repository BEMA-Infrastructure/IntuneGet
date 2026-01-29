/**
 * Authentication Token Parser
 * Shared utility for parsing and validating JWT tokens from Azure AD
 */

/**
 * Result of parsing an authentication token
 */
export interface ParsedAuthToken {
  userId: string;
  tenantId: string;
  email?: string;
  name?: string;
}

/**
 * JWT payload structure from Azure AD
 */
interface AzureAdTokenPayload {
  oid?: string;      // Object ID (user ID)
  sub?: string;      // Subject (fallback for user ID)
  tid?: string;      // Tenant ID
  email?: string;    // Email address
  preferred_username?: string;  // Preferred username/email
  name?: string;     // Display name
  iss?: string;      // Issuer
  aud?: string;      // Audience
  exp?: number;      // Expiration time
  iat?: number;      // Issued at
  nbf?: number;      // Not before
}

/**
 * Parse an Azure AD access token from the Authorization header.
 * Extracts user and tenant information from the JWT payload.
 *
 * @param authHeader - The Authorization header value (expected format: "Bearer <token>")
 * @returns Parsed token information or null if invalid/missing
 */
export function parseAuthToken(authHeader: string | null): ParsedAuthToken | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const accessToken = authHeader.slice(7);

    // Split token into parts
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.warn('[parseAuthToken] Invalid JWT structure: expected 3 parts');
      return null;
    }

    // Decode the payload (middle part)
    const payloadBase64 = parts[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload: AzureAdTokenPayload = JSON.parse(payloadJson);

    // Extract user ID (prefer oid, fall back to sub)
    const userId = payload.oid || payload.sub;
    if (!userId) {
      console.warn('[parseAuthToken] Missing user identifier (oid/sub) in token');
      return null;
    }

    // Extract tenant ID
    const tenantId = payload.tid;
    if (!tenantId) {
      console.warn('[parseAuthToken] Missing tenant identifier (tid) in token');
      return null;
    }

    // Basic expiration check
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.warn('[parseAuthToken] Token has expired');
        return null;
      }
    }

    return {
      userId,
      tenantId,
      email: payload.email || payload.preferred_username,
      name: payload.name,
    };
  } catch (error) {
    console.error('[parseAuthToken] Failed to parse token:', error);
    return null;
  }
}

/**
 * Validate that the parsed token contains required fields
 */
export function validateAuthToken(token: ParsedAuthToken | null): token is ParsedAuthToken {
  return token !== null &&
    typeof token.userId === 'string' &&
    token.userId.length > 0 &&
    typeof token.tenantId === 'string' &&
    token.tenantId.length > 0;
}

/**
 * Helper to get auth info from a request, with validation
 * Returns the auth info or null if invalid/missing
 */
export function getAuthFromRequest(request: { headers: { get(name: string): string | null } }): ParsedAuthToken | null {
  const authHeader = request.headers.get('Authorization');
  const token = parseAuthToken(authHeader);
  return validateAuthToken(token) ? token : null;
}
