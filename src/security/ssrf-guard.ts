/**
 * SSRF & Private Network Perimeter Guard
 * Defends against Server-Side Request Forgery, Cloud Metadata theft, and local router probing.
 */

export interface SsrfCheckResult {
  allowed: boolean;
  reason?: string;
  isPrivateIp?: boolean;
}

export class SsrfGuard {
  private static CLOUD_METADATA_HOSTS = new Set([
    '169.254.169.254',
    'metadata.google.internal',
    'metadata',
    '100.100.100.200', // Alibaba Cloud
  ]);

  private static PRIVATE_IPV4_PATTERNS = [
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // Loopback 127.0.0.0/8
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // Private 10.0.0.0/8
    /^192\.168\.\d{1,3}\.\d{1,3}$/, // Private 192.168.0.0/16
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // Private 172.16.0.0/12
    /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local 169.254.0.0/16
    /^0\.0\.0\.0$/,
  ];

  /**
   * Validates target URL against SSRF and private network attacks.
   */
  public static check(targetUrl: string, options: { allowLocalhost?: boolean } = {}): SsrfCheckResult {
    // Allow local file:/// for testing local HTML
    if (targetUrl.startsWith('file:///')) {
      return { allowed: true };
    }

    try {
      const parsed = new URL(targetUrl);
      const protocol = parsed.protocol.toLowerCase();

      // Only allow standard web protocols
      if (protocol !== 'http:' && protocol !== 'https:') {
        return {
          allowed: false,
          reason: `[SSRF BLOCKED] Disallowed URL protocol: "${protocol}". Only http:// and https:// are permitted.`,
        };
      }

      const hostname = parsed.hostname.toLowerCase();

      // Check Cloud Metadata (AWS/GCP/Azure)
      if (SsrfGuard.CLOUD_METADATA_HOSTS.has(hostname)) {
        return {
          allowed: false,
          reason: `[SSRF BLOCKED] Access to cloud instance metadata service ("${hostname}") is strictly prohibited.`,
        };
      }

      // Check Loopback / Localhost
      const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
      if (isLoopback) {
        if (options.allowLocalhost) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: `[SSRF BLOCKED] Access to loopback interface ("${hostname}") blocked. Pass allowLocalhost: true if debugging a local web app.`,
        };
      }

      // Check Private Subnets
      for (const pattern of SsrfGuard.PRIVATE_IPV4_PATTERNS) {
        if (pattern.test(hostname)) {
          if (options.allowLocalhost && (hostname.startsWith('127.') || hostname.startsWith('192.168.'))) {
            return { allowed: true };
          }
          return {
            allowed: false,
            isPrivateIp: true,
            reason: `[SSRF BLOCKED] Access to private network address ("${hostname}") blocked to prevent internal network scanning.`,
          };
        }
      }

      return { allowed: true };
    } catch {
      return {
        allowed: false,
        reason: `[SSRF BLOCKED] Malformed or unparseable URL: "${targetUrl}"`,
      };
    }
  }
}
