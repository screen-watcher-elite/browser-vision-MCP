/**
 * Data Exfiltration & Query Parameter Firewall
 * Detects outbound URLs attempting to leak sensitive tokens via query strings or webhooks.
 */

export interface ExfiltrationCheckResult {
  isSafe: boolean;
  reason?: string;
  flaggedParam?: string;
}

export class ExfiltrationGuard {
  private static SENSITIVE_QUERY_PATTERNS = [
    /sk-ant-[a-zA-Z0-9_\-]{20,}/i,
    /sk-[a-zA-Z0-9]{32,}/i,
    /ghp_[a-zA-Z0-9]{36}/,
    /AIza[0-9A-Za-z\-_]{35}/,
    /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/, // JWT
  ];

  /**
   * Inspects URL query parameters for exfiltration payloads.
   */
  public static checkUrl(targetUrl: string): ExfiltrationCheckResult {
    try {
      if (!targetUrl.includes('?')) {
        return { isSafe: true };
      }

      const parsed = new URL(targetUrl);
      for (const [key, value] of parsed.searchParams.entries()) {
        // Check known secret regexes
        for (const regex of ExfiltrationGuard.SENSITIVE_QUERY_PATTERNS) {
          if (regex.test(value)) {
            return {
              isSafe: false,
              flaggedParam: key,
              reason: `[DATA EXFILTRATION BLOCKED] Outbound URL parameter "${key}" contains an API key or bearer token signature.`,
            };
          }
        }

        // Check suspiciously long base64 chunks in query params (>=80 chars)
        if (value.length >= 80 && /^[A-Za-z0-9+/=_-]+$/.test(value)) {
          return {
            isSafe: false,
            flaggedParam: key,
            reason: `[DATA EXFILTRATION BLOCKED] Parameter "${key}" contains high-entropy base64 data payload. Potential exfiltration vector.`,
          };
        }
      }

      return { isSafe: true };
    } catch {
      return { isSafe: true }; // Let SSRF guard handle malformed URLs
    }
  }
}
